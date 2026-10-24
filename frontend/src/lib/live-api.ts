import { useEffect, useRef, useState } from "react";
import { TWINS, type TwinId } from "./nexus-data";

export interface LiveState {
  batch_id: string;
  updated_at: string;
  [key: string]: string | number | boolean | Record<string, number>;
}

export interface LivePoint {
  /** Elapsed replay time, formatted mm:ss — the X axis unit of every live chart. */
  t: string;
  temp: number;
  power: number;
  vibration: number;
}

export function formatLiveValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "--";
  if (typeof value === "number") {
    if (key === "pre_pour_risk" || key === "defect_probability" || key === "risk_score") return (value * 100).toFixed(2);
    return value.toFixed(2);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export const API_URL = (import.meta.env["VITE_API_URL"] ?? "http://localhost:8000").replace(/\/$/, "");
const WS_URL = API_URL.replace(/^http/, "ws");

async function getJson<T>(path: string): Promise<T> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${API_URL}${cleanPath}`);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json() as Promise<T>;
}

/** Chart slot order maps onto each twin's `meta.series` definition. */
const POINT_KEYS = ["temp", "power", "vibration"] as const;

/**
 * Project one raw twin state onto the chart series of that twin.
 * Values are read in their native engineering units (no artificial rescaling)
 * using the `field` + `unit` metadata defined in nexus-data.
 */
function toPoint(twin: TwinId, state: LiveState): LivePoint {
  const meta = TWINS[twin];
  const point = { t: timestampLabel(state) } as LivePoint;
  meta.series.forEach((series, index) => {
    const slot = POINT_KEYS[index] ?? "temp";
    let value = Number(state[series.field] ?? series.fallback ?? 0);
    if (!Number.isFinite(value)) value = 0;
    if (series.percent) value *= 100;
    const decimals = series.unit === "°C" || series.unit === "kW" || series.unit === "kPa" ? 1 : series.unit === "norm" ? 2 : 3;
    point[slot] = Number(value.toFixed(decimals));
  });
  return point;
}

function timestampLabel(state: LiveState): string {
  const source = state.updated_at ? new Date(state.updated_at) : new Date();
  if (Number.isNaN(source.getTime())) return "--:--";
  return source.toLocaleTimeString("en-GB", { hour12: false }).slice(3);
}

export function useLiveTwin(twin: TwinId) {
  const [state, setState] = useState<LiveState | null>(null);
  const [history, setHistory] = useState<LivePoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backoffDelayRef = useRef<number>(1000);

  useEffect(() => {
    let active = true;

    // Fetch initial state & history series
    Promise.all([
      getJson<LiveState>(`/api/v1/digital-twins/${twin}/state`),
      getJson<{ series: LiveState[] }>(`/api/v1/sensors/series/${twin}?points=40`).catch(() => ({ series: [] })),
    ])
      .then(([initial, response]) => {
        if (!active) return;
        setState(initial);
        const initialHistory = response.series.map((point) => toPoint(twin, point));
        setHistory(initialHistory.length > 0 ? initialHistory : [toPoint(twin, initial)]);
      })
      .catch((cause: Error) => active && setError(cause.message));

    // Connect WebSocket with exponential backoff auto-reconnect
    const connectWs = () => {
      if (!active) return;
      const socket = new WebSocket(`${WS_URL}/ws`);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!active) return;
        backoffDelayRef.current = 1000;
        setError(null);
        socket.send("subscribe");
      };

      socket.onmessage = (message) => {
        if (!active) return;
        try {
          const payload = JSON.parse(message.data) as { type?: string; twin?: TwinId; state?: LiveState };
          if (payload.type === "digital_twin_update" && payload.twin === twin && payload.state) {
            setState(payload.state);
            setHistory((previous) => [...previous.slice(-39), toPoint(twin, payload.state!)]);
          }
        } catch {
          // Ignore invalid JSON frame
        }
      };

      socket.onclose = () => {
        if (!active) return;
        const nextDelay = Math.min(backoffDelayRef.current * 1.5, 10000);
        backoffDelayRef.current = nextDelay;
        reconnectTimeoutRef.current = setTimeout(connectWs, nextDelay);
      };

      socket.onerror = () => {
        if (active) setError("Live stream reconnecting...");
      };
    };

    connectWs();

    return () => {
      active = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [twin]);

  return { state, history, error };
}

export function useLiveDashboard() {
  const [data, setData] = useState<{ twins: Record<TwinId, LiveState> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ twins: Record<TwinId, LiveState> }>("/api/dashboard/summary")
      .then((summary) => active && setData(summary))
      .catch((cause: Error) => active && setError(cause.message));

    const socket = new WebSocket(`${WS_URL}/ws`);
    socket.onopen = () => socket.send("subscribe");
    socket.onmessage = (message) => {
      if (!active) return;
      try {
        const payload = JSON.parse(message.data) as { type?: string; twin?: TwinId; state?: LiveState };
        if (payload.type === "digital_twin_update" && payload.twin && payload.state) {
          setData((previous) => (previous ? { twins: { ...previous.twins, [payload.twin!]: payload.state! } } : previous));
        }
      } catch {
        // Ignore invalid frame
      }
    };

    return () => {
      active = false;
      socket.close();
    };
  }, []);

  return { data, error };
}

export interface LiveAlert {
  id: string;
  twin: TwinId;
  batch: string;
  severity: "critical" | "warning" | "normal";
  time: string;
  message: string;
}

export interface LiveBatch {
  id: string;
  start: string;
  status: "critical" | "warning" | "normal";
  predicted: number | null;
  actual: string;
  alloy: string;
}

export function useLiveCollection<T>(path: string, interval = 2000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      getJson<T>(path)
        .then((value) => active && setData(value))
        .catch((cause: Error) => active && setError(cause.message));

    load();
    const timer = window.setInterval(load, interval);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [path, interval]);

  return { data, error };
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${API_URL}${cleanPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json() as Promise<T>;
}
