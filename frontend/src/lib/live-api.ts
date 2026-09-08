import { useEffect, useRef, useState } from "react";
import type { TwinId } from "./nexus-data";

export interface LiveState {
  batch_id: string;
  updated_at: string;
  [key: string]: string | number | boolean | Record<string, number>;
}

export interface LivePoint {
  t: string;
  temp: number;
  power: number;
  vibration: number;
}

export function formatLiveValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "--";
  if (typeof value === "number") return value.toFixed(2);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

const API_URL = (import.meta.env["VITE_API_URL"] ?? "http://localhost:8000").replace(/\/$/, "");
const WS_URL = API_URL.replace(/^http/, "ws");

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json() as Promise<T>;
}

function toPoint(twin: TwinId, state: LiveState): LivePoint {
  const value = (key: string, fallback = 0) => Number(state[key] ?? fallback);
  const mapping: [number, number, number] = {
    melting: [value("melt_temp"), value("power_kw"), value("vibration_g") * 10000],
    molding: [value("sand_moisture") * 100, value("permeability"), value("green_strength") / 10],
    pouring: [value("pour_temp"), value("ladle_fill_pct"), value("pour_speed") * 100],
    quality: [value("defect_risk") * 100, value("quality_score") * 100, value("severity")],
  }[twin] as [number, number, number];
  return { t: new Date(state.updated_at).toLocaleTimeString("en-GB", { hour12: false }).slice(3), temp: Number(mapping[0].toFixed(2)), power: Number(mapping[1].toFixed(2)), vibration: Number(mapping[2].toFixed(2)) };
}

export function useLiveTwin(twin: TwinId) {
  const [state, setState] = useState<LiveState | null>(null);
  const [history, setHistory] = useState<LivePoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getJson<LiveState>(`/api/v1/digital-twins/${twin}/state`),
      getJson<{ series: LiveState[] }>(`/api/v1/sensors/series/${twin}?points=40`),
    ])
      .then(([initial, response]) => {
        if (!active) return;
        setState(initial);
        const initialHistory = response.series.map((point) => toPoint(twin, point));
        setHistory(initialHistory.length > 0 ? initialHistory : [toPoint(twin, initial)]);
      })
      .catch((cause: Error) => active && setError(cause.message));

    const socket = new WebSocket(`${WS_URL}/ws`);
    socketRef.current = socket;
    socket.onopen = () => socket.send("subscribe");
    socket.onmessage = (message) => {
      const payload = JSON.parse(message.data) as { type?: string; twin?: TwinId; state?: LiveState };
      if (active && payload.type === "digital_twin_update" && payload.twin === twin && payload.state) {
        setState(payload.state);
        setHistory((previous) => [...previous.slice(-39), toPoint(twin, payload.state!) ]);
      }
    };
    socket.onerror = () => active && setError("Live stream unavailable");
    return () => {
      active = false;
      socket.close();
      socketRef.current = null;
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
      const payload = JSON.parse(message.data) as { type?: string; twin?: TwinId; state?: LiveState };
      if (active && payload.type === "digital_twin_update" && payload.twin && payload.state) {
        setData((previous) => previous ? { twins: { ...previous.twins, [payload.twin!]: payload.state! } } : previous);
      }
    };
    return () => { active = false; socket.close(); };
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
    const load = () => getJson<T>(path).then((value) => active && setData(value)).catch((cause: Error) => active && setError(cause.message));
    load();
    const timer = window.setInterval(load, interval);
    return () => { active = false; window.clearInterval(timer); };
  }, [path, interval]);
  return { data, error };
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json() as Promise<T>;
}