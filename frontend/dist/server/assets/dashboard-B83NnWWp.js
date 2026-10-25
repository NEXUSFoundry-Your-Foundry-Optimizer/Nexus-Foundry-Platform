import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, Line, LineChart, BarChart, Bar } from "recharts";
import { AlertTriangle, ArrowRight, Scan, Droplets, Layers, Flame, ArrowUpRight } from "lucide-react";
import { a as Reveal } from "./Reveal-DAfbosXq.js";
import { S as StatusPill } from "./StatusPill-CSDpauYH.js";
import { u as useLiveCollection, b as useLiveDashboard, d as useLiveTwin, T as TWIN_ORDER, a as TWINS, c as cn } from "./router-C2feh6VC.js";
import "motion/react";
import "@tanstack/react-query";
import "react";
import "clsx";
import "tailwind-merge";
import "sonner";
function TFTChart() {
  const { data } = useLiveCollection("/api/v1/predictions/tft?horizon=48", 1e4);
  const band = ((data == null ? void 0 : data.forecasts) ?? []).map((point) => ({ ...point, h: new Date(point.timestamp).toLocaleTimeString("en-GB", { hour12: false }).slice(0, 5), range: [point.p10, point.p90] }));
  return /* @__PURE__ */ jsx("div", { className: "h-[300px] w-full", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(ComposedChart, { data: band, margin: { top: 8, right: 8, left: -18, bottom: 0 }, children: [
    /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "tft-band", x1: "0", y1: "0", x2: "0", y2: "1", children: [
      /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "var(--color-chart-1)", stopOpacity: 0.28 }),
      /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "var(--color-chart-1)", stopOpacity: 0.05 })
    ] }) }),
    /* @__PURE__ */ jsx(CartesianGrid, { stroke: "var(--color-border)", strokeDasharray: "3 3", vertical: false }),
    /* @__PURE__ */ jsx(XAxis, { dataKey: "h", tick: { fontSize: 10, fill: "var(--color-muted-foreground)" }, tickLine: false, axisLine: false, minTickGap: 20 }),
    /* @__PURE__ */ jsx(YAxis, { domain: [0, 1], tick: { fontSize: 10, fill: "var(--color-muted-foreground)" }, tickLine: false, axisLine: false }),
    /* @__PURE__ */ jsx(
      Tooltip,
      {
        contentStyle: {
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          fontSize: 12
        }
      }
    ),
    /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "range", name: "P10–P90", stroke: "none", fill: "url(#tft-band)", isAnimationActive: false }),
    /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "p50", name: "P50 lining health", stroke: "var(--color-chart-1)", strokeWidth: 2.5, dot: false, isAnimationActive: false }),
    /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "p10", name: "P10", stroke: "var(--color-chart-4)", strokeWidth: 1, strokeDasharray: "4 4", dot: false, isAnimationActive: false }),
    /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "p90", name: "P90", stroke: "var(--color-chart-2)", strokeWidth: 1, strokeDasharray: "4 4", dot: false, isAnimationActive: false })
  ] }) }) });
}
const icons = {
  flame: Flame,
  layers: Layers,
  droplets: Droplets,
  scan: Scan
};
function headline(id, state) {
  if (!state) return "Loading...";
  if (id === "melting") return `${Number(state["melt_temp"] ?? 0).toFixed(2)}°C`;
  if (id === "molding") return `${Number(state["sand_moisture"] ?? 0).toFixed(2)}%`;
  if (id === "pouring") return `${(Number(state["pre_pour_risk"] ?? state["upstream_risk"] ?? 0) * 100).toFixed(2)}% risk`;
  return `${Number(state["defect_risk"] ?? 0).toFixed(2)}`;
}
function statusFor(id, state) {
  if (!state) return "warning";
  if (id === "melting") return Number(state["anomaly_score"] ?? 0) > 0.78 ? "critical" : "normal";
  if (id === "pouring") return Number(state["pre_pour_risk"] ?? 0) > 0.5 ? "critical" : "normal";
  if (id === "quality") return Number(state["defect_risk"] ?? 0) > 0.5 ? "critical" : "warning";
  return Number(state["sand_moisture"] ?? 0) > 5 ? "warning" : "normal";
}
const barColor = {
  critical: "bg-destructive",
  warning: "bg-warning",
  normal: "bg-success"
};
const chartTooltip = {
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  fontSize: 12
};
function Dashboard() {
  var _a, _b, _c, _d;
  const {
    data: liveData,
    error: liveError
  } = useLiveDashboard();
  const {
    history
  } = useLiveTwin("melting");
  const {
    data: batches
  } = useLiveCollection("/api/batches");
  const {
    data: alerts
  } = useLiveCollection("/api/v1/alerts/active");
  useNavigate();
  const isAnomaly = Number(((_b = (_a = liveData == null ? void 0 : liveData.twins) == null ? void 0 : _a.melting) == null ? void 0 : _b["anomaly_score"]) ?? 0) > 0.78;
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-5 py-12 lg:px-8", children: [
    /* @__PURE__ */ jsxs(Reveal, { children: [
      /* @__PURE__ */ jsx("p", { className: "eyebrow", children: "Operations overview" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-end justify-between gap-4", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-4xl font-medium tracking-tight lg:text-5xl", children: "Live Dashboard" }),
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { className: "size-1.5 rounded-full bg-primary pulse-dot" }),
          " WebSocket /ws · 2s refresh"
        ] }),
        liveError && /* @__PURE__ */ jsx("p", { className: "w-full text-xs text-warning", children: liveError })
      ] })
    ] }),
    isAnomaly && /* @__PURE__ */ jsx(Reveal, { delay: 0.02, className: "mt-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4 rounded-xl border border-destructive/60 bg-destructive/15 p-4 text-destructive shadow-lg animate-pulse", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "size-6 shrink-0 text-destructive" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-bold text-sm sm:text-base", children: [
            "CRITICAL ANOMALY DETECTED IN MELTING TWIN (Score: ",
            Number(((_d = (_c = liveData == null ? void 0 : liveData.twins) == null ? void 0 : _c.melting) == null ? void 0 : _d["anomaly_score"]) ?? 0).toFixed(2),
            " > 0.78)"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-foreground/80 mt-0.5", children: "TFT Degradation Emergency Run triggered. Real-time telemetry, model attributions, and prescriptive actions updated live." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Link, { to: "/analytics", className: "inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3.5 py-2 text-xs font-medium text-secondary-foreground shadow hover:bg-secondary/80 transition-all", children: /* @__PURE__ */ jsx("span", { children: "Final Analytics" }) }),
        /* @__PURE__ */ jsxs(Link, { to: "/live-workflow", className: "inline-flex items-center gap-2 rounded-lg bg-destructive px-3.5 py-2 text-xs font-bold text-destructive-foreground shadow hover:bg-destructive/90 transition-all", children: [
          /* @__PURE__ */ jsx("span", { children: "View Live Workflow" }),
          /* @__PURE__ */ jsx(ArrowRight, { className: "size-3.5" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: TWIN_ORDER.map((id, i) => {
      const t = TWINS[id];
      const state = liveData == null ? void 0 : liveData.twins[id];
      const status = statusFor(id, state);
      const Icon = icons[t.icon];
      return /* @__PURE__ */ jsx(Reveal, { delay: i * 0.06, children: /* @__PURE__ */ jsxs(Link, { to: "/twins/$twin", params: {
        twin: id
      }, className: "group block rounded-xl border border-border bg-surface p-5 transition-all hover:-translate-y-1 hover:border-primary/40", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary", children: /* @__PURE__ */ jsx(Icon, { className: "size-4" }) }),
          /* @__PURE__ */ jsx(ArrowUpRight, { className: "size-4 text-muted-foreground transition-colors group-hover:text-primary" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-muted-foreground", children: t.name }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 font-mono text-2xl", children: headline(id, state) }),
        id === "melting" && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
          "Anomaly Score: ",
          /* @__PURE__ */ jsx("span", { className: "font-mono font-semibold text-foreground", children: Number((state == null ? void 0 : state["anomaly_score"]) ?? 0.1).toFixed(2) }),
          " / 0.78"
        ] }),
        id === "pouring" && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
          "Pour Temp: ",
          /* @__PURE__ */ jsxs("span", { className: "font-mono font-semibold text-foreground", children: [
            Number((state == null ? void 0 : state["pour_temp"]) ?? 1445).toFixed(0),
            "°C"
          ] })
        ] }),
        id === "molding" && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
          "Permeability: ",
          /* @__PURE__ */ jsxs("span", { className: "font-mono font-semibold text-foreground", children: [
            Number((state == null ? void 0 : state["permeability"]) ?? 0.88).toFixed(2),
            " norm"
          ] })
        ] }),
        id === "quality" && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
          "Visual Status: ",
          /* @__PURE__ */ jsx("span", { className: "font-mono font-semibold text-foreground", children: String((state == null ? void 0 : state["inspection_result"]) ?? "PASS") })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsx(StatusPill, { status }) })
      ] }) }, id);
    }) }),
    /* @__PURE__ */ jsx(Reveal, { delay: 0.1, className: "mt-6", children: /* @__PURE__ */ jsxs("div", { className: "surface-panel p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium", children: "Batch Timeline" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Today · colour-coded by predicted defect outcome" }),
      /* @__PURE__ */ jsx("div", { className: "mt-6 flex gap-1.5 overflow-x-auto pb-2", children: (batches ?? []).map((b) => /* @__PURE__ */ jsxs("div", { className: "min-w-[150px] flex-1", children: [
        /* @__PURE__ */ jsx("div", { className: cn("h-2 rounded-full", barColor[b.status]) }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 font-mono text-sm", children: b.id }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          b.start,
          " · ",
          b.alloy
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "risk " }),
          /* @__PURE__ */ jsx("span", { className: cn((b.predicted ?? 0) > 0.5 ? "text-destructive" : (b.predicted ?? 0) > 0.2 ? "text-warning" : "text-success"), children: b.predicted == null ? "--" : `${(b.predicted * 100).toFixed(2)}%` })
        ] })
      ] }, b.id)) })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "surface-panel p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium", children: "Furnace Health Degradation — TFT 48h Forecast" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "P10 / P50 / P90 quantile bands" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(TFTChart, {}) })
      ] }) }),
      /* @__PURE__ */ jsx(Reveal, { delay: 0.08, children: /* @__PURE__ */ jsxs("div", { className: "surface-panel p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium", children: "Daily Melt Temperature Trend" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "30-day rolling average, °C" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 h-[300px]", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: history, margin: {
          top: 8,
          right: 8,
          left: -18,
          bottom: 0
        }, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { stroke: "var(--color-border)", strokeDasharray: "3 3", vertical: false }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "t", tick: {
            fontSize: 10,
            fill: "var(--color-muted-foreground)"
          }, tickLine: false, axisLine: false, minTickGap: 24 }),
          /* @__PURE__ */ jsx(YAxis, { domain: ["auto", "auto"], label: {
            value: "°C",
            angle: -90,
            position: "insideLeft",
            style: {
              fontSize: 10,
              fill: "var(--color-muted-foreground)"
            }
          }, tick: {
            fontSize: 10,
            fill: "var(--color-muted-foreground)"
          }, tickLine: false, axisLine: false }),
          /* @__PURE__ */ jsx(Tooltip, { contentStyle: chartTooltip }),
          /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "temp", name: "Melt temperature (°C)", stroke: "var(--color-chart-1)", strokeWidth: 2, dot: false })
        ] }) }) })
      ] }) }),
      /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "surface-panel p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium", children: "Furnace Vibration Trace" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Shell vibration channel from the melting twin, g (RMS)" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 h-[260px]", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: history, margin: {
          top: 8,
          right: 8,
          left: -18,
          bottom: 0
        }, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { stroke: "var(--color-border)", strokeDasharray: "3 3", vertical: false }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "t", tick: {
            fontSize: 10,
            fill: "var(--color-muted-foreground)"
          }, tickLine: false, axisLine: false, minTickGap: 24 }),
          /* @__PURE__ */ jsx(YAxis, { tick: {
            fontSize: 10,
            fill: "var(--color-muted-foreground)"
          }, tickLine: false, axisLine: false, label: {
            value: "g",
            angle: -90,
            position: "insideLeft",
            style: {
              fontSize: 10,
              fill: "var(--color-muted-foreground)"
            }
          } }),
          /* @__PURE__ */ jsx(Tooltip, { contentStyle: chartTooltip, cursor: {
            fill: "var(--color-muted)",
            opacity: 0.3
          } }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "vibration", name: "Vibration (g)", fill: "var(--color-chart-3)", radius: [3, 3, 0, 0] })
        ] }) }) })
      ] }) }),
      /* @__PURE__ */ jsx(Reveal, { delay: 0.08, children: /* @__PURE__ */ jsxs("div", { className: "surface-panel p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium", children: "Active Alerts" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Live from /api/alerts/active" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-2", children: (alerts ?? []).filter((a) => a.severity !== "normal").map((a) => /* @__PURE__ */ jsxs(Link, { to: "/twins/$twin", params: {
          twin: a.twin
        }, className: "flex items-start gap-3 rounded-lg border border-border bg-background/40 px-4 py-3 transition-colors hover:border-primary/40", children: [
          /* @__PURE__ */ jsx(StatusPill, { status: a.severity }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "truncate text-sm", children: a.message }),
            /* @__PURE__ */ jsxs("p", { className: "mt-0.5 font-mono text-[11px] text-muted-foreground", children: [
              TWINS[a.twin].name,
              " · ",
              a.batch,
              " · ",
              a.time
            ] })
          ] })
        ] }, a.id)) })
      ] }) })
    ] })
  ] });
}
export {
  Dashboard as component
};
