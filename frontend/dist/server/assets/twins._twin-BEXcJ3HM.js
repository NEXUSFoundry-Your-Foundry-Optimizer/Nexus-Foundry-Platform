import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area } from "recharts";
import { d as useLiveTwin, a as TWINS, c as cn, R as Route, u as useLiveCollection, f as formatLiveValue, T as TWIN_ORDER } from "./router-C2feh6VC.js";
import { useState, useEffect, Suspense, lazy } from "react";
import { a as Reveal } from "./Reveal-DAfbosXq.js";
import { S as StatusPill } from "./StatusPill-CSDpauYH.js";
import { u as useNexus } from "./nexus-As1BvJl2.js";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "sonner";
import "motion/react";
import "zustand";
const AXIS_LABEL_STYLE = {
  fontSize: 10,
  fill: "var(--color-muted-foreground)"
};
function axisUnitLabel(unit) {
  return { value: unit, angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "var(--color-muted-foreground)" } };
}
function seriesName(s) {
  return s.unit ? `${s.label} (${s.unit})` : s.label;
}
function LiveSensorChart({ twin }) {
  const meta = TWINS[twin];
  const { history, error } = useLiveTwin(twin);
  const axisIds = ["a", "b", "c"];
  return /* @__PURE__ */ jsxs("div", { className: "h-[300px] w-full", children: [
    error && /* @__PURE__ */ jsx("p", { className: "mb-2 text-xs text-warning", children: error }),
    history.length === 0 && !error && /* @__PURE__ */ jsx("p", { className: "mb-2 text-xs text-muted-foreground", children: "Waiting for live telemetry..." }),
    /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(AreaChart, { data: history, margin: { top: 10, right: 14, left: -6, bottom: 14 }, children: [
      /* @__PURE__ */ jsx("defs", { children: meta.series.map((s, i) => /* @__PURE__ */ jsxs("linearGradient", { id: `g-${twin}-${i}`, x1: "0", y1: "0", x2: "0", y2: "1", children: [
        /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: s.color, stopOpacity: 0.35 }),
        /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: s.color, stopOpacity: 0 })
      ] }, s.key)) }),
      /* @__PURE__ */ jsx(CartesianGrid, { stroke: "var(--color-border)", strokeDasharray: "3 3", vertical: false }),
      /* @__PURE__ */ jsx(
        XAxis,
        {
          dataKey: "t",
          label: { value: "Time (mm:ss)", position: "insideBottom", offset: -6, style: AXIS_LABEL_STYLE },
          tick: { fontSize: 10, fill: "var(--color-muted-foreground)" },
          tickLine: false,
          axisLine: false,
          minTickGap: 28
        }
      ),
      meta.series.map((s, i) => {
        const id = axisIds[i] ?? "c";
        return /* @__PURE__ */ jsx(
          YAxis,
          {
            yAxisId: id,
            domain: ["auto", "auto"],
            orientation: i === 1 ? "right" : "left",
            hide: i === 2,
            ...s.unit ? { label: axisUnitLabel(s.unit) } : {},
            tick: { fontSize: 10, fill: "var(--color-muted-foreground)" },
            tickLine: false,
            axisLine: false,
            width: i === 1 ? 42 : 46
          },
          id
        );
      }),
      /* @__PURE__ */ jsx(
        Tooltip,
        {
          contentStyle: {
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            fontSize: 12,
            color: "var(--color-foreground)"
          },
          labelFormatter: (label) => `t+${label}`,
          formatter: (value, name) => [`${value}`, name]
        }
      ),
      /* @__PURE__ */ jsx(Legend, { wrapperStyle: { fontSize: 11, color: "var(--color-muted-foreground)" }, formatter: (value) => /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: value }) }),
      meta.series.map((s, i) => /* @__PURE__ */ jsx(
        Area,
        {
          yAxisId: axisIds[i] ?? "c",
          type: "monotone",
          dataKey: s.key,
          name: seriesName(s),
          stroke: s.color,
          strokeWidth: 2,
          fill: `url(#g-${twin}-${i})`,
          isAnimationActive: false,
          dot: false
        },
        s.key
      ))
    ] }) })
  ] });
}
function ClientOnly({ children, fallback = null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return /* @__PURE__ */ jsx(Fragment, { children: fallback });
  return /* @__PURE__ */ jsx(Fragment, { children });
}
const Scene = lazy(() => import("./scene-BJRUZrKK.js"));
function Placeholder({ label }) {
  return /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "mx-auto size-10 animate-spin rounded-full border-2 border-border border-t-primary" }),
    /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-muted-foreground", children: label })
  ] }) });
}
function TwinVisual({
  variant,
  className,
  label = "Loading 3D twin model",
  live = null
}) {
  return /* @__PURE__ */ jsxs("div", { className: cn("relative overflow-hidden rounded-xl border border-border bg-surface", className), children: [
    /* @__PURE__ */ jsx(ClientOnly, { fallback: /* @__PURE__ */ jsx(Placeholder, { label }), children: /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx(Placeholder, { label }), children: /* @__PURE__ */ jsx(Scene, { variant, live }) }) }),
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute bottom-3 left-3 rounded-md border border-border bg-background/70 px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur", children: "Three.js · R3F" })
  ] });
}
const variants = {
  melting: "furnace",
  molding: "mold",
  pouring: "ladle",
  quality: "inspection"
};
function TwinPage() {
  const {
    twin
  } = Route.useLoaderData();
  const meta = TWINS[twin];
  const {
    state: liveState,
    error
  } = useLiveTwin(twin);
  const {
    data: liveAlerts
  } = useLiveCollection(`/api/v1/alerts?twin=${twin}`);
  const values = liveState ? meta.fields.map((field) => ({
    label: field.label,
    unit: field.unit,
    value: formatLiveValue(field.key, liveState[field.key])
  })) : meta.fields.map((field) => ({
    label: field.label,
    unit: field.unit,
    value: "--"
  }));
  const liveStatus = twin === "melting" ? Number((liveState == null ? void 0 : liveState["anomaly_score"]) ?? 0) > 0.78 ? "critical" : "normal" : twin === "pouring" ? Number((liveState == null ? void 0 : liveState["pre_pour_risk"]) ?? 0) > 0.7 ? "critical" : "normal" : twin === "quality" ? Number((liveState == null ? void 0 : liveState["defect_risk"]) ?? 0) > 0.5 ? "critical" : "warning" : Number((liveState == null ? void 0 : liveState["sand_moisture"]) ?? 0) > 5 ? "warning" : "normal";
  const focused = useNexus((s) => s.focusedAlert);
  const alerts = liveAlerts ?? [];
  const idx = TWIN_ORDER.indexOf(twin);
  const prev = TWIN_ORDER[(idx + 3) % 4];
  const next = TWIN_ORDER[(idx + 1) % 4];
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-5 py-12 lg:px-8", children: [
    /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { className: "eyebrow", children: [
          "Digital twin · Stage 0",
          idx + 1
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "mt-3 text-4xl font-medium tracking-tight lg:text-5xl", children: meta.name }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-xl text-muted-foreground", children: meta.blurb })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-start gap-3 sm:items-end", children: [
        /* @__PURE__ */ jsx(StatusPill, { status: liveState ? liveStatus : "warning" }),
        meta.comingSoon && /* @__PURE__ */ jsx("span", { className: "rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs text-warning", children: "Backend integration in progress" }),
        /* @__PURE__ */ jsxs("p", { className: "font-mono text-xs text-muted-foreground", children: [
          "Batch ",
          String((liveState == null ? void 0 : liveState.batch_id) ?? "Waiting for telemetry"),
          " · live via /ws every 2s"
        ] }),
        error && /* @__PURE__ */ jsx("p", { className: "text-xs text-warning", children: error })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-10 grid gap-5 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsx(TwinVisual, { variant: variants[twin], className: "h-[360px] w-full", label: `Rendering ${meta.name}`, live: liveState }) }),
      /* @__PURE__ */ jsx(Reveal, { delay: 0.08, children: /* @__PURE__ */ jsxs("div", { className: "surface-panel h-full p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium", children: "Live Simulation Graph" }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-[11px] text-muted-foreground", children: [
            /* @__PURE__ */ jsx("span", { className: "size-1.5 rounded-full bg-primary pulse-dot" }),
            " streaming"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsx(LiveSensorChart, { twin }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(Reveal, { delay: 0.1, className: "mt-5", children: /* @__PURE__ */ jsxs("div", { className: "surface-panel p-5", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium", children: "Data Info" }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-6", children: values.map((v) => /* @__PURE__ */ jsxs("div", { className: "bg-surface px-4 py-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] uppercase tracking-wider text-muted-foreground", children: v.label }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1.5 font-mono text-xl", children: [
          v.value,
          /* @__PURE__ */ jsx("span", { className: "ml-0.5 text-sm text-muted-foreground", children: v.unit })
        ] })
      ] }, v.label)) })
    ] }) }),
    /* @__PURE__ */ jsx(Reveal, { delay: 0.12, className: "mt-5", children: /* @__PURE__ */ jsxs("div", { className: "surface-panel p-5", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium", children: "Alert Logs · Recorded Events" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-2", children: [
        alerts.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No alerts recorded for this twin today." }),
        alerts.map((a) => /* @__PURE__ */ jsxs("div", { className: cn("flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background/40 px-4 py-3 transition-colors", focused === a.id && "border-primary/60 bg-primary/5"), children: [
          /* @__PURE__ */ jsx(StatusPill, { status: a.severity }),
          /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-muted-foreground", children: a.time }),
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: a.message })
        ] }, a.id))
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-10 flex items-center justify-between border-t border-border pt-6", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/twins/$twin", params: {
        twin: prev
      }, className: "inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "size-4" }),
        " ",
        TWINS[prev].name
      ] }),
      /* @__PURE__ */ jsxs(Link, { to: "/twins/$twin", params: {
        twin: next
      }, className: "inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary", children: [
        TWINS[next].name,
        " ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
      ] })
    ] })
  ] });
}
export {
  TwinPage as component
};
