import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useRouterState, Link, createRootRouteWithContext, useRouter, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, notFound, createRouter } from "@tanstack/react-router";
import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { Bell, X, Menu, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Toaster as Toaster$1 } from "sonner";
const appCss = "/assets/styles-C6hkWnvA.css";
function reportLovableError(error, context = {}) {
  var _a, _b, _c;
  if (typeof window === "undefined") return;
  (_b = (_a = window.__lovableEvents) == null ? void 0 : _a.captureException) == null ? void 0 : _b.call(
    _a,
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error"
    }
  );
  const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : void 0;
  (_c = window.__lovableReportRuntimeError) == null ? void 0 : _c.call(window, {
    message,
    ...stack !== void 0 && { stack },
    filename: window.location.pathname
  });
}
const TWINS = {
  melting: {
    id: "melting",
    name: "Melting Twin",
    icon: "flame",
    blurb: "Induction furnace state, lining health and LSTM-AE anomaly scoring.",
    metricLabel: "Melt temperature",
    fields: [
      { key: "melt_temp", label: "Melt Temp", unit: "°C" },
      { key: "power_kw", label: "Power", unit: "kW" },
      { key: "vibration_g", label: "Vibration", unit: "g" },
      { key: "lining_health", label: "Lining Health", unit: "" },
      { key: "anomaly_score", label: "Anomaly Score", unit: "" },
      { key: "operating_state", label: "State", unit: "" }
    ],
    series: [
      { key: "temp", field: "melt_temp", label: "Melt temperature", unit: "°C", color: "var(--color-chart-1)", fallback: 1380 },
      { key: "power", field: "power_kw", label: "Power draw", unit: "kW", color: "var(--color-chart-2)", fallback: 800 },
      { key: "vibration", field: "vibration_g", label: "Vibration", unit: "g", color: "var(--color-chart-3)", fallback: 0.03 }
    ]
  },
  molding: {
    id: "molding",
    name: "Molding Twin",
    icon: "layers",
    blurb: "Green sand chemistry — moisture, permeability and compactability.",
    metricLabel: "Sand moisture",
    fields: [
      { key: "sand_moisture", label: "Sand Moisture", unit: "%" },
      { key: "permeability", label: "Permeability", unit: "norm" },
      { key: "green_strength", label: "Green Strength", unit: "kPa" },
      { key: "compactability", label: "Compactability", unit: "%" }
    ],
    series: [
      { key: "temp", field: "sand_moisture", label: "Sand moisture", unit: "%", color: "var(--color-chart-1)", fallback: 4.2 },
      { key: "power", field: "permeability", label: "Permeability", unit: "norm", color: "var(--color-chart-2)", fallback: 0.88 },
      { key: "vibration", field: "green_strength", label: "Green strength", unit: "kPa", color: "var(--color-chart-3)", fallback: 96 }
    ]
  },
  pouring: {
    id: "pouring",
    name: "Pouring Twin",
    icon: "droplets",
    blurb: "Ladle transfer, pour kinetics and upstream risk inherited from melt.",
    metricLabel: "Upstream risk",
    fields: [
      { key: "pour_temp", label: "Pour Temp", unit: "°C" },
      { key: "pour_speed", label: "Pour Speed", unit: "m/s" },
      { key: "ladle_fill_pct", label: "Ladle Fill", unit: "%" },
      { key: "pre_pour_risk", label: "Defect Risk", unit: "%" }
    ],
    series: [
      { key: "temp", field: "pour_temp", label: "Pour temperature", unit: "°C", color: "var(--color-chart-1)", fallback: 1445 },
      { key: "power", field: "ladle_fill_pct", label: "Ladle fill", unit: "%", color: "var(--color-chart-2)", fallback: 85 },
      { key: "vibration", field: "pour_speed", label: "Pour speed", unit: "m/s", color: "var(--color-chart-3)", fallback: 0.6 }
    ]
  },
  quality: {
    id: "quality",
    name: "Quality Twin",
    icon: "scan",
    blurb: "ResNet-50 visual inspection and defect classification.",
    comingSoon: true,
    metricLabel: "Defect probability",
    fields: [
      { key: "defect_risk", label: "Defect Risk", unit: "%" },
      { key: "quality_score", label: "Quality Score", unit: "%" },
      { key: "inspection_result", label: "Result", unit: "" }
    ],
    series: [
      { key: "temp", field: "defect_risk", label: "Defect risk", unit: "%", color: "var(--color-chart-1)", percent: true, fallback: 0.02 },
      { key: "power", field: "quality_score", label: "Quality score", unit: "%", color: "var(--color-chart-2)", percent: true, fallback: 0.98 },
      { key: "vibration", field: "severity", label: "Severity", unit: "", color: "var(--color-chart-3)", fallback: 0 }
    ]
  }
};
const TWIN_ORDER = ["melting", "molding", "pouring", "quality"];
const severityLabel = {
  critical: "Critical",
  warning: "Warning",
  normal: "Normal"
};
const __vite_import_meta_env__ = {};
function formatLiveValue(key, value) {
  if (value === null || value === void 0 || value === "") return "--";
  if (typeof value === "number") {
    if (key === "pre_pour_risk" || key === "defect_probability" || key === "risk_score") return (value * 100).toFixed(2);
    return value.toFixed(2);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
const API_URL = (__vite_import_meta_env__["VITE_API_URL"] ?? "https://nexus-foundry-5zga.onrender.com").replace(/\/$/, "");
const WS_URL = API_URL.replace(/^http/, "ws");
async function getJson(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${API_URL}${cleanPath}`);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}
const POINT_KEYS = ["temp", "power", "vibration"];
function toPoint(twin, state) {
  const meta = TWINS[twin];
  const point = { t: timestampLabel(state) };
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
function timestampLabel(state) {
  const source = state.updated_at ? new Date(state.updated_at) : /* @__PURE__ */ new Date();
  if (Number.isNaN(source.getTime())) return "--:--";
  return source.toLocaleTimeString("en-GB", { hour12: false }).slice(3);
}
function useLiveTwin(twin) {
  const [state, setState] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const backoffDelayRef = useRef(1e3);
  useEffect(() => {
    let active = true;
    Promise.all([
      getJson(`/api/v1/digital-twins/${twin}/state`),
      getJson(`/api/v1/sensors/series/${twin}?points=40`).catch(() => ({ series: [] }))
    ]).then(([initial, response]) => {
      if (!active) return;
      setState(initial);
      const initialHistory = response.series.map((point) => toPoint(twin, point));
      setHistory(initialHistory.length > 0 ? initialHistory : [toPoint(twin, initial)]);
    }).catch((cause) => active && setError(cause.message));
    const connectWs = () => {
      if (!active) return;
      const socket = new WebSocket(`${WS_URL}/ws`);
      socketRef.current = socket;
      socket.onopen = () => {
        if (!active) return;
        backoffDelayRef.current = 1e3;
        setError(null);
        socket.send("subscribe");
      };
      socket.onmessage = (message) => {
        if (!active) return;
        try {
          const payload = JSON.parse(message.data);
          if (payload.type === "digital_twin_update" && payload.twin === twin && payload.state) {
            setState(payload.state);
            setHistory((previous) => [...previous.slice(-39), toPoint(twin, payload.state)]);
          }
        } catch {
        }
      };
      socket.onclose = () => {
        if (!active) return;
        const nextDelay = Math.min(backoffDelayRef.current * 1.5, 1e4);
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
function useLiveDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    getJson("/api/dashboard/summary").then((summary) => active && setData(summary)).catch((cause) => active && setError(cause.message));
    const socket = new WebSocket(`${WS_URL}/ws`);
    socket.onopen = () => socket.send("subscribe");
    socket.onmessage = (message) => {
      if (!active) return;
      try {
        const payload = JSON.parse(message.data);
        if (payload.type === "digital_twin_update" && payload.twin && payload.state) {
          setData((previous) => previous ? { twins: { ...previous.twins, [payload.twin]: payload.state } } : previous);
        }
      } catch {
      }
    };
    return () => {
      active = false;
      socket.close();
    };
  }, []);
  return { data, error };
}
function useLiveCollection(path, interval = 2e3) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    const load = () => getJson(path).then((value) => active && setData(value)).catch((cause) => active && setError(cause.message));
    load();
    const timer = window.setInterval(load, interval);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [path, interval]);
  return { data, error };
}
async function postJson(path, body) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${API_URL}${cleanPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const twinLinks = [
  { to: "/twins/$twin", params: { twin: "melting" }, label: "Melting Twin" },
  { to: "/twins/$twin", params: { twin: "molding" }, label: "Molding Twin" },
  { to: "/twins/$twin", params: { twin: "pouring" }, label: "Pouring Twin" },
  { to: "/twins/$twin", params: { twin: "quality" }, label: "Quality Twin" }
];
const agentLinks = [
  { to: "/agent", label: "Agent Hub" },
  { to: "/agent/rag", label: "RAG Assistant" },
  { to: "/agent/pinn", label: "PINN Simulation" }
];
function Dropdown({
  label,
  items
}) {
  const [open, setOpen] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "relative", onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false), children: [
    /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-1 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground", children: [
      label,
      /* @__PURE__ */ jsx(ChevronDown, { className: cn("size-3.5 transition-transform", open && "rotate-180") })
    ] }),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 pt-3 transition-all duration-200",
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
        ),
        children: /* @__PURE__ */ jsx("div", { className: "surface-panel overflow-hidden p-1.5", children: items.map((item) => /* @__PURE__ */ jsx(
          Link,
          {
            to: item.to,
            params: item.params,
            className: "block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            children: item.label
          },
          item.label
        )) })
      }
    )
  ] });
}
function Navbar() {
  const { data: alerts } = useLiveCollection("/api/v1/alerts/active");
  const unread = (alerts == null ? void 0 : alerts.length) ?? 0;
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setMobile(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return /* @__PURE__ */ jsxs(
    "header",
    {
      className: cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-border bg-background/85 backdrop-blur-xl" : "border-b border-transparent"
      ),
      children: [
        /* @__PURE__ */ jsxs("nav", { className: "mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 lg:px-8", children: [
          /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx("img", { src: "/logo.png", alt: "Logo", className: "size-8 object-contain rounded-sm" }),
            /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold tracking-tight bg-gradient-to-r from-[#ffd700] to-[#ff5500] bg-clip-text text-transparent", children: "NEXUS-Foundry" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "hidden items-center gap-7 lg:flex", children: [
            /* @__PURE__ */ jsx(Dropdown, { label: "Twins", items: twinLinks }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                to: "/live-workflow",
                className: "text-sm font-medium text-amber-400 transition-colors hover:text-amber-300 flex items-center gap-1",
                activeProps: { className: "text-amber-300 font-bold" },
                children: [
                  /* @__PURE__ */ jsx("span", { className: "size-2 rounded-full bg-amber-400 animate-pulse" }),
                  "Live Workflow"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              Link,
              {
                to: "/dashboard",
                className: "text-sm text-muted-foreground transition-colors hover:text-foreground",
                activeProps: { className: "text-foreground" },
                children: "Dashboard"
              }
            ),
            /* @__PURE__ */ jsx(
              Link,
              {
                to: "/analytics",
                className: "text-sm text-muted-foreground transition-colors hover:text-foreground",
                activeProps: { className: "text-foreground" },
                children: "Final Analytics"
              }
            ),
            /* @__PURE__ */ jsx(Dropdown, { label: "Agent", items: agentLinks })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs(
              Link,
              {
                to: "/notifications",
                className: "relative flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground",
                "aria-label": "Notifications",
                children: [
                  /* @__PURE__ */ jsx(Bell, { className: "size-4" }),
                  unread > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground", children: unread })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Link,
              {
                to: "/profile",
                className: "hidden items-center gap-2 rounded-md border border-border py-1.5 pl-1.5 pr-3 transition-colors hover:border-primary/40 sm:flex",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "flex size-6 items-center justify-center rounded bg-primary text-[11px] font-bold text-primary-foreground", children: "AM" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Profile" })
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "flex size-9 items-center justify-center rounded-md border border-border lg:hidden",
                onClick: () => setMobile((v) => !v),
                "aria-label": "Menu",
                children: mobile ? /* @__PURE__ */ jsx(X, { className: "size-4" }) : /* @__PURE__ */ jsx(Menu, { className: "size-4" })
              }
            )
          ] })
        ] }),
        mobile && /* @__PURE__ */ jsxs("div", { className: "border-t border-border bg-background px-5 py-4 lg:hidden", children: [
          /* @__PURE__ */ jsx("p", { className: "eyebrow mb-2", children: "Twins" }),
          /* @__PURE__ */ jsx("div", { className: "mb-4 grid gap-1", children: twinLinks.map((t) => /* @__PURE__ */ jsx(Link, { to: t.to, params: t.params, className: "py-1.5 text-sm text-muted-foreground", children: t.label }, t.label)) }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-1", children: [
            /* @__PURE__ */ jsx(Link, { to: "/live-workflow", className: "py-1.5 text-sm font-semibold text-amber-400", children: "⚡ Live Workflow" }),
            /* @__PURE__ */ jsx(Link, { to: "/dashboard", className: "py-1.5 text-sm", children: "Dashboard" }),
            /* @__PURE__ */ jsx(Link, { to: "/analytics", className: "py-1.5 text-sm", children: "Final Analytics" }),
            /* @__PURE__ */ jsx(Link, { to: "/agent", className: "py-1.5 text-sm", children: "Agent" }),
            /* @__PURE__ */ jsx(Link, { to: "/profile", className: "py-1.5 text-sm", children: "Profile" })
          ] })
        ] })
      ]
    }
  );
}
function Footer() {
  return /* @__PURE__ */ jsx("footer", { className: "bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] text-white", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-5 py-14 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "flex flex-col", children: /* @__PURE__ */ jsxs("span", { className: "font-serif text-3xl font-medium tracking-tight bg-gradient-to-b from-[#8a3800] to-[#ff6a00] bg-clip-text text-transparent", children: [
          "NEXUS-",
          /* @__PURE__ */ jsx("br", {}),
          "Foundry"
        ] }) }),
        /* @__PURE__ */ jsx("p", { className: "mt-6 max-w-xs text-sm text-[#AAAAAA] leading-relaxed", children: "A cross-stage cognitive digital twin platform for predictive casting intelligence. Predict, Prevent, Preserve — making foundry data speak." })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "eyebrow mb-6 text-[#888888]", children: "TWINS" }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-4 text-sm text-white", children: ["Melting", "Molding", "Pouring", "Quality"].map((t) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/twins/$twin", params: { twin: t.toLowerCase() }, className: "transition-colors hover:text-[#ff5500]", children: t }) }, t)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "eyebrow mb-6 text-[#888888]", children: "PLATFORM" }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-4 text-sm text-white", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/dashboard", className: "transition-colors hover:text-[#ff5500]", children: "Dashboard" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/analytics", className: "transition-colors hover:text-[#ff5500]", children: "Final Analytics" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/notifications", className: "transition-colors hover:text-[#ff5500]", children: "Notifications" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/profile", className: "transition-colors hover:text-[#ff5500]", children: "Profile" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "eyebrow mb-6 text-[#888888]", children: "INTELLIGENCE" }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-4 text-sm text-white", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/agent", className: "transition-colors hover:text-[#ff5500]", children: "Agent Hub" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/agent/rag", className: "transition-colors hover:text-[#ff5500]", children: "RAG Assistant" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/agent/pinn", className: "transition-colors hover:text-[#ff5500]", children: "PINN Simulation" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/live-workflow", className: "transition-colors hover:text-[#ff5500]", children: "Live Workflow" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-16 flex flex-col justify-between gap-3 border-t border-[#333333] pt-6 text-sm text-[#888888] sm:flex-row", children: [
      /* @__PURE__ */ jsx("p", { children: "© 2026 NEXUS-Foundry. On-premise by design." }),
      /* @__PURE__ */ jsx("p", { children: "Melting → Molding → Pouring → Quality" })
    ] })
  ] }) });
}
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$a = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "NEXUS-Foundry" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", className: "dark", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$a.useRouteContext();
  const pathname = useRouterState({
    select: (state) => state.location.pathname
  });
  const isRagPage = pathname.startsWith("/agent/rag");
  useEffect(() => {
    fetch(`${API_URL}/api/v1/simulation/start?dataset_name=furnace_sensor.csv&speed=1.0`, {
      method: "POST"
    }).catch(() => {
    });
  }, []);
  return /* @__PURE__ */ jsxs(QueryClientProvider, { client: queryClient, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
      /* @__PURE__ */ jsx(AnomalyRouteController, {}),
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1 pt-16", children: /* @__PURE__ */ jsx(Outlet, {}) }),
      !isRagPage && /* @__PURE__ */ jsx(Footer, {})
    ] }),
    /* @__PURE__ */ jsx(Toaster, {})
  ] });
}
function AnomalyRouteController() {
  return null;
}
const $$splitComponentImporter$9 = () => import("./index-Cn86cIPU.js");
const Route$9 = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "NEXUS-Foundry — Predictive Digital Twin Platform for Casting"
    }, {
      name: "description",
      content: "NEXUS-Foundry connects melting, molding, pouring and quality into one cognitive digital twin that predicts failures 8–24h ahead and defects 15h before they happen."
    }, {
      property: "og:title",
      content: "NEXUS-Foundry — Predictive Casting Intelligence"
    }, {
      property: "og:description",
      content: "Cross-stage digital twins, physics-validated what-if simulation and a cognitive RAG assistant for foundry operations."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./analytics-jjd-EQ76.js");
const Route$8 = createFileRoute("/analytics")({
  head: () => ({
    meta: [{
      title: "Final Analytics & SHAP Explainability — NEXUS-Foundry"
    }, {
      name: "description",
      content: "Consolidated alert management, SHAP feature attribution and pre-pour versus post-inspection defect comparison."
    }, {
      property: "og:title",
      content: "Final Analytics — NEXUS-Foundry"
    }, {
      property: "og:description",
      content: "Why the model predicted a defect, and what to do about it."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./dashboard-B83NnWWp.js");
const Route$7 = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{
      title: "Live Dashboard — NEXUS-Foundry"
    }, {
      name: "description",
      content: "Real-time overview of all four foundry twins, batch timeline, degradation forecasts and active alerts."
    }, {
      property: "og:title",
      content: "Live Dashboard — NEXUS-Foundry"
    }, {
      property: "og:description",
      content: "All four twins, batch timeline and active alerts in one live view."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./live-workflow-BSTmmqiG.js");
const Route$6 = createFileRoute("/live-workflow")({
  head: () => ({
    meta: [{
      title: "Live Cross-Stage Workflow — NEXUS-Foundry"
    }, {
      name: "description",
      content: "Real CSV and model payloads for each cross-twin anomaly workflow step."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./notifications-Btbj5WjV.js");
const Route$5 = createFileRoute("/notifications")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./profile-C78Zbl5b.js");
const Route$4 = createFileRoute("/profile")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./agent.index-D8QpY8E_.js");
const Route$3 = createFileRoute("/agent/")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./agent.pinn-6pMx-Dx9.js");
const Route$2 = createFileRoute("/agent/pinn")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./agent.rag-CQh_YYwS.js");
const Route$1 = createFileRoute("/agent/rag")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./twins._twin-BEXcJ3HM.js");
function isTwin(v) {
  return TWIN_ORDER.includes(v);
}
const Route = createFileRoute("/twins/$twin")({
  loader: ({
    params
  }) => {
    if (!isTwin(params.twin)) throw notFound();
    return {
      twin: params.twin
    };
  },
  head: ({
    loaderData
  }) => {
    if (!loaderData) {
      return {
        meta: [{
          title: "Twin not found — NEXUS-Foundry"
        }, {
          name: "robots",
          content: "noindex"
        }]
      };
    }
    const t = TWINS[loaderData.twin];
    return {
      meta: [{
        title: `${t.name} — Live State | NEXUS-Foundry`
      }, {
        name: "description",
        content: t.blurb
      }, {
        property: "og:title",
        content: `${t.name} — NEXUS-Foundry`
      }, {
        property: "og:description",
        content: t.blurb
      }]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const IndexRoute = Route$9.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$a
});
const AnalyticsRoute = Route$8.update({
  id: "/analytics",
  path: "/analytics",
  getParentRoute: () => Route$a
});
const DashboardRoute = Route$7.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => Route$a
});
const LiveWorkflowRoute = Route$6.update({
  id: "/live-workflow",
  path: "/live-workflow",
  getParentRoute: () => Route$a
});
const NotificationsRoute = Route$5.update({
  id: "/notifications",
  path: "/notifications",
  getParentRoute: () => Route$a
});
const ProfileRoute = Route$4.update({
  id: "/profile",
  path: "/profile",
  getParentRoute: () => Route$a
});
const AgentIndexRoute = Route$3.update({
  id: "/agent/",
  path: "/agent/",
  getParentRoute: () => Route$a
});
const AgentPinnRoute = Route$2.update({
  id: "/agent/pinn",
  path: "/agent/pinn",
  getParentRoute: () => Route$a
});
const AgentRagRoute = Route$1.update({
  id: "/agent/rag",
  path: "/agent/rag",
  getParentRoute: () => Route$a
});
const TwinsTwinRoute = Route.update({
  id: "/twins/$twin",
  path: "/twins/$twin",
  getParentRoute: () => Route$a
});
const rootRouteChildren = {
  IndexRoute,
  AnalyticsRoute,
  DashboardRoute,
  LiveWorkflowRoute,
  NotificationsRoute,
  ProfileRoute,
  AgentPinnRoute,
  AgentRagRoute,
  TwinsTwinRoute,
  AgentIndexRoute
};
const routeTree = Route$a._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route as R,
  TWIN_ORDER as T,
  TWINS as a,
  useLiveDashboard as b,
  cn as c,
  useLiveTwin as d,
  formatLiveValue as f,
  postJson as p,
  router as r,
  severityLabel as s,
  useLiveCollection as u
};
