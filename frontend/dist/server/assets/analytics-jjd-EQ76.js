import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { a as Reveal } from "./Reveal-DAfbosXq.js";
import { S as StatusPill } from "./StatusPill-CSDpauYH.js";
import { u as useLiveCollection, c as cn, a as TWINS } from "./router-C2feh6VC.js";
import { u as useNexus } from "./nexus-As1BvJl2.js";
import "motion/react";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "sonner";
import "zustand";
function SHAPChart() {
  const { data } = useLiveCollection("/api/analytics/shap", 1e4);
  const features = (data == null ? void 0 : data.features) ?? [];
  const max = Math.max(...features.map((f) => Math.abs(f.value)), 1);
  return /* @__PURE__ */ jsx("div", { className: "space-y-3", children: features.map((f) => {
    const pct = Math.abs(f.value) / max * 50;
    const positive = f.value >= 0;
    return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[minmax(0,1fr)_2fr_54px] items-center gap-3", children: [
      /* @__PURE__ */ jsx("span", { className: "truncate text-xs text-muted-foreground", children: f.name }),
      /* @__PURE__ */ jsxs("div", { className: "relative h-4 rounded bg-muted/60", children: [
        /* @__PURE__ */ jsx("span", { className: "absolute inset-y-0 left-1/2 w-px bg-border" }),
        /* @__PURE__ */ jsx(
          "span",
          {
            className: cn(
              "absolute inset-y-0 rounded transition-all duration-700",
              positive ? "left-1/2 bg-destructive/80" : "right-1/2 bg-primary/80"
            ),
            style: { width: `${pct}%` }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("span", { className: cn("text-right font-mono text-xs", positive ? "text-destructive" : "text-primary"), children: [
        positive ? "+" : "",
        (f.value * 100).toFixed(2),
        "%"
      ] })
    ] }, f.name);
  }) });
}
function Analytics() {
  const navigate = useNavigate();
  const focusAlert = useNexus((s) => s.focusAlert);
  const {
    data: remoteAlerts
  } = useLiveCollection("/api/v1/alerts");
  const {
    data: batches
  } = useLiveCollection("/api/batches");
  const {
    data: shap
  } = useLiveCollection("/api/analytics/shap", 1e4);
  const [persistentAlerts, setPersistentAlerts] = useState([]);
  useEffect(() => {
    if (remoteAlerts && remoteAlerts.length > 0) {
      setPersistentAlerts((prev) => {
        const map = /* @__PURE__ */ new Map();
        prev.forEach((alert) => {
          map.set(alert.id || `${alert.twin}-${alert.batch}-${alert.time}`, alert);
        });
        remoteAlerts.forEach((alert) => {
          const key = alert.id || `${alert.twin}-${alert.batch}-${alert.time}`;
          map.set(key, alert);
        });
        return Array.from(map.values());
      });
    }
  }, [remoteAlerts]);
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-5 py-12 lg:px-8", children: [
    /* @__PURE__ */ jsxs(Reveal, { children: [
      /* @__PURE__ */ jsx("p", { className: "eyebrow", children: "Consolidated analysis" }),
      /* @__PURE__ */ jsx("h1", { className: "mt-3 text-4xl font-medium tracking-tight lg:text-5xl", children: "Final Analytics" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-2xl text-muted-foreground", children: "Every alert, the exact features that drove each defect prediction, and how the pre-pour forecast compared to the inspected result." })
    ] }),
    /* @__PURE__ */ jsx(Reveal, { delay: 0.06, className: "mt-10", children: /* @__PURE__ */ jsxs("div", { className: "surface-panel overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "border-b border-border px-6 py-4", children: /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium", children: "Alert Summary" }) }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full min-w-[680px] text-sm", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground", children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 font-medium", children: "Twin" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 font-medium", children: "Batch" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 font-medium", children: "Severity" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 font-medium", children: "Time" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-right font-medium", children: "Action" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: persistentAlerts.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "px-6 py-8 text-center text-xs text-muted-foreground", children: "No alerts recorded yet. Trigger an anomaly or replay to view persistent alerts." }) }) : persistentAlerts.map((a) => {
          var _a;
          return /* @__PURE__ */ jsxs("tr", { className: "border-b border-border/60 last:border-0 hover:bg-secondary/40 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-medium", children: ((_a = TWINS[a.twin]) == null ? void 0 : _a.name) ?? a.twin }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-mono text-xs text-muted-foreground", children: a.batch }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx(StatusPill, { status: a.severity }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-mono text-xs text-muted-foreground", children: a.time }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxs("button", { onClick: () => {
              focusAlert(a.id);
              navigate({
                to: "/twins/$twin",
                params: {
                  twin: a.twin
                }
              });
            }, className: "inline-flex items-center gap-1.5 text-xs text-primary transition-opacity hover:opacity-70", children: [
              "View ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "size-3.5" })
            ] }) })
          ] }, a.id);
        }) })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx(Reveal, { delay: 0.08, className: "mt-6", children: /* @__PURE__ */ jsxs("div", { className: "surface-panel p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium", children: "SHAP Explainability" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "XGBoost · 65 features · batch CB-001" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Defect prediction" }),
          /* @__PURE__ */ jsxs("p", { className: "font-mono text-xl text-warning", children: [
            (shap == null ? void 0 : shap.prediction) ?? "Loading...",
            " ",
            shap && `(${(shap.probability * 100).toFixed(2)}%)`
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-lg border border-border bg-background/40 p-5", children: [
        /* @__PURE__ */ jsx("p", { className: "mb-4 text-xs uppercase tracking-wider text-muted-foreground", children: "Why?" }),
        /* @__PURE__ */ jsx(SHAPChart, {})
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-4 rounded-lg border border-primary/30 bg-primary/8 px-4 py-3 text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "font-medium text-primary", children: "Recommendation: " }),
        (shap == null ? void 0 : shap.recommendation) ?? "Waiting for live model output."
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Reveal, { delay: 0.1, className: "mt-6", children: /* @__PURE__ */ jsxs("div", { className: "surface-panel p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium", children: "Defect Prediction vs. Inspection" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Pre-pour XGBoost probability compared with post-inspection outcome" }),
      /* @__PURE__ */ jsx("div", { className: "mt-6 space-y-3", children: (batches ?? []).map((b) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[80px_1fr_92px_88px] items-center gap-4", children: [
        /* @__PURE__ */ jsx("span", { className: "font-mono text-sm", children: b.id }),
        /* @__PURE__ */ jsx("div", { className: "h-2.5 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsx("div", { className: cn("h-full rounded-full transition-all duration-1000", (b.predicted ?? 0) > 0.5 ? "bg-destructive" : (b.predicted ?? 0) > 0.2 ? "bg-warning" : "bg-success"), style: {
          width: `${(b.predicted ?? 0) * 100}%`
        } }) }),
        /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-muted-foreground", children: b.predicted == null ? "--" : `${(b.predicted * 100).toFixed(2)}% pred.` }),
        /* @__PURE__ */ jsx("span", { className: cn("rounded border px-2 py-1 text-center text-[11px]", b.actual === "Clean" ? "border-success/40 text-success" : "border-border text-muted-foreground"), children: b.actual })
      ] }, b.id)) })
    ] }) })
  ] });
}
export {
  Analytics as component
};
