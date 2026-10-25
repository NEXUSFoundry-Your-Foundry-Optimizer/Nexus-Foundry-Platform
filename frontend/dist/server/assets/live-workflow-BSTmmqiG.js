import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { Activity, Zap, Clock, Send, Droplets, Layers, Box, Database, Cpu, ShieldAlert, Flame, CheckCircle2, ChevronRight, Terminal, Sliders } from "lucide-react";
import { a as Reveal } from "./Reveal-DAfbosXq.js";
import { u as useLiveCollection, c as cn } from "./router-C2feh6VC.js";
import "motion/react";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "clsx";
import "tailwind-merge";
import "sonner";
const pipeline = [{
  id: 1,
  stage: "Melting Twin",
  title: "LSTM-AE detects anomaly",
  subtitle: "Reconstruction error is evaluated against the 0.78 threshold",
  icon: Activity,
  operation: "LSTM-AE receives the live 30×7 furnace CSV window."
}, {
  id: 2,
  stage: "Emergency run",
  title: "Melting Twin triggers TFT",
  subtitle: "Source history and the anomaly window are captured",
  icon: Zap,
  operation: "TFT request is built from the event-time furnace CSV context."
}, {
  id: 3,
  stage: "Forecast engine",
  title: "TFT returns forecast",
  subtitle: "Next two hours, 9 PM projection, failure time, and attention",
  icon: Clock,
  operation: "Trained PyTorch TFT inference."
}, {
  id: 4,
  stage: "Schedule check",
  title: "Melting Twin checks pour schedule",
  subtitle: "Queries the next twelve hours for the affected batch",
  icon: Clock,
  operation: "production_master.csv batch schedule lookup."
}, {
  id: 5,
  stage: "Event dispatch",
  title: "Melting Twin sends warning",
  subtitle: "The exact cross-twin warning envelope",
  icon: Send,
  operation: "Warning payload handed to the Pouring Twin."
}, {
  id: 6,
  stage: "Pouring Twin",
  title: "Pouring Twin receives warning",
  subtitle: "Acknowledgement and downstream activation",
  icon: Droplets,
  operation: "PouringTwin.receive_upstream_warning()."
}, {
  id: 7,
  stage: "Molding Twin",
  title: "Query molding data",
  subtitle: "Gets the source mold record for the warned batch",
  icon: Layers,
  operation: "molding_sensor.csv batch lookup."
}, {
  id: 8,
  stage: "CAD database",
  title: "Query shape embedding",
  subtitle: "Loads the matching part geometry and 50D embedding",
  icon: Box,
  operation: "geometry_metadata.csv part lookup."
}, {
  id: 9,
  stage: "Feature fusion",
  title: "Assemble 65 features",
  subtitle: "Combines furnace, molding, pouring, CAD, and environment inputs",
  icon: Database,
  operation: "XGBoost feature-schema assembly."
}, {
  id: 10,
  stage: "XGBoost + SHAP",
  title: "Calculate defect risk",
  subtitle: "Actual model probability and feature attribution",
  icon: Cpu,
  operation: "XGBoost predict_proba and TreeSHAP."
}, {
  id: 11,
  stage: "Alert broadcast",
  title: "Generate alert",
  subtitle: "Dashboard/mobile alert is raised only when actual risk is critical",
  icon: ShieldAlert,
  operation: "Alert store and live dashboard broadcast."
}];
const statusStyle = {
  completed: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  skipped: "border-muted-foreground/30 bg-muted/50 text-muted-foreground",
  failed: "border-destructive/50 bg-destructive/15 text-destructive",
  "not-triggered": "border-warning/40 bg-warning/10 text-warning",
  waiting: "border-border bg-surface-2 text-muted-foreground"
};
function JsonPanel({
  value,
  emptyLabel
}) {
  if (value === void 0 || value === null || typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) {
    return /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: emptyLabel });
  }
  return /* @__PURE__ */ jsx("pre", { className: "max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border/50 bg-background/70 p-3 font-mono text-[11px] leading-relaxed text-foreground", children: JSON.stringify(value, null, 2) });
}
function statusLabel(status) {
  return status === "not-triggered" ? "not triggered" : status;
}
function LiveWorkflowPage() {
  var _a;
  const {
    data,
    error
  } = useLiveCollection("/api/v1/workflows/latest", 1e3);
  const workflow = (data == null ? void 0 : data.workflow) ?? null;
  const results = (workflow == null ? void 0 : workflow.steps) ?? [];
  const [activeStep, setActiveStep] = useState(1);
  useEffect(() => {
    if (!(workflow == null ? void 0 : workflow.workflow_id)) {
      setActiveStep(1);
      return;
    }
    setActiveStep(1);
    const interval = window.setInterval(() => {
      setActiveStep((current) => {
        if (current >= pipeline.length) {
          window.clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, 550);
    return () => window.clearInterval(interval);
  }, [workflow == null ? void 0 : workflow.workflow_id]);
  const resultById = useMemo(() => new Map(results.map((step) => [step.id, step])), [results]);
  const isActive = Boolean(workflow && ((_a = resultById.get(1)) == null ? void 0 : _a.status) === "completed");
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-5 py-12 lg:px-8", children: [
    /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-5", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "eyebrow", children: "Live backend execution trace" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-3 text-4xl font-medium tracking-tight lg:text-5xl", children: "Live Cross-Stage Workflow" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-3xl text-muted-foreground", children: "Every displayed value below is returned by the backend from the replay CSVs and model calls. A missing or skipped step is shown as such; this screen does not fill it with a demo value." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: cn("rounded-lg border px-3 py-2 font-mono text-xs uppercase", isActive ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-border bg-surface-2 text-muted-foreground"), children: isActive ? "anomaly cascade active" : "waiting for anomaly event" })
    ] }) }),
    error && /* @__PURE__ */ jsxs("p", { className: "mt-5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive", children: [
      "Unable to load the live workflow: ",
      error
    ] }),
    workflow && /* @__PURE__ */ jsx(Reveal, { delay: 0.03, className: "mt-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-primary/30 bg-primary/5 p-4 font-mono text-xs", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("strong", { className: "text-muted-foreground", children: "WORKFLOW" }),
        " ",
        workflow.workflow_id
      ] }),
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("strong", { className: "text-muted-foreground", children: "BATCH" }),
        " ",
        workflow.batch_id
      ] }),
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("strong", { className: "text-muted-foreground", children: "EVENT TIME" }),
        " ",
        new Date(workflow.event_time).toLocaleString()
      ] }),
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("strong", { className: "text-muted-foreground", children: "RESULT" }),
        " ",
        workflow.status
      ] })
    ] }) }),
    !workflow && !error && /* @__PURE__ */ jsx(Reveal, { delay: 0.03, className: "mt-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Flame, { className: "mt-0.5 size-5 text-primary" }),
      /* @__PURE__ */ jsx("p", { children: "The furnace CSV replay is live. This trace will begin when the LSTM-AE returns a reconstruction error above 0.78." })
    ] }) }),
    workflow && /* @__PURE__ */ jsxs("div", { className: "mt-8 grid gap-6 lg:grid-cols-12", children: [
      /* @__PURE__ */ jsx("aside", { className: "lg:col-span-4", children: /* @__PURE__ */ jsxs("div", { className: "sticky top-24 surface-panel p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium", children: "Execution pipeline" }),
          /* @__PURE__ */ jsxs("span", { className: "font-mono text-xs text-muted-foreground", children: [
            activeStep,
            "/11"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: pipeline.map((step) => {
          var _a2;
          const status = ((_a2 = resultById.get(step.id)) == null ? void 0 : _a2.status) ?? "waiting";
          const Icon = step.icon;
          const selected = activeStep === step.id;
          return /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setActiveStep(step.id), className: cn("flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs transition-colors", selected ? "border-primary bg-primary/15" : "border-transparent hover:border-border hover:bg-surface-2"), children: [
            /* @__PURE__ */ jsxs("span", { className: "flex min-w-0 items-center gap-2.5", children: [
              status === "completed" ? /* @__PURE__ */ jsx(CheckCircle2, { className: "size-4 shrink-0 text-emerald-400" }) : /* @__PURE__ */ jsx(Icon, { className: "size-4 shrink-0 text-muted-foreground" }),
              /* @__PURE__ */ jsxs("span", { className: "truncate", children: [
                step.id,
                ". ",
                step.title
              ] })
            ] }),
            /* @__PURE__ */ jsx(ChevronRight, { className: cn("size-3.5 shrink-0 text-muted-foreground", selected && "rotate-90") })
          ] }, step.id);
        }) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "space-y-5 lg:col-span-8", children: pipeline.map((step) => {
        const result = resultById.get(step.id);
        const status = (result == null ? void 0 : result.status) ?? "waiting";
        const Icon = step.icon;
        const selected = activeStep === step.id;
        const passed = activeStep > step.id;
        const revealResult = activeStep >= step.id;
        return /* @__PURE__ */ jsx(Reveal, { delay: step.id * 0.02, children: /* @__PURE__ */ jsxs("article", { className: cn("surface-panel border p-6 transition-all", selected ? "border-primary/80 ring-2 ring-primary/15" : passed ? "border-border bg-background/60" : "border-border/60 opacity-70"), children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: cn("flex size-10 shrink-0 items-center justify-center rounded-lg border font-mono text-sm font-bold", selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface-2 text-muted-foreground"), children: step.id }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-primary", children: step.stage }),
                  /* @__PURE__ */ jsx("span", { className: cn("rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase", statusStyle[status]), children: statusLabel(status) })
                ] }),
                /* @__PURE__ */ jsxs("h2", { className: "mt-2 text-base font-semibold", children: [
                  "Step ",
                  step.id,
                  ": ",
                  step.title
                ] }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: step.subtitle })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Icon, { className: cn("size-5 shrink-0 text-muted-foreground", selected && "text-primary") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-2 rounded-lg border border-border/50 bg-surface-2 px-3 py-2.5 font-mono text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsx(Terminal, { className: "size-3.5 shrink-0 text-primary" }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: "OPERATION:" }),
              " ",
              step.operation
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 md:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border/60 bg-surface-2/60 p-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center gap-1.5 font-mono text-[11px] font-bold text-primary", children: [
                /* @__PURE__ */ jsx(Sliders, { className: "size-3.5" }),
                " STEP INPUT"
              ] }),
              /* @__PURE__ */ jsx(JsonPanel, { value: revealResult ? result == null ? void 0 : result.input : null, emptyLabel: "Waiting for this backend request to execute…" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border/60 bg-surface-2/60 p-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-400", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "size-3.5" }),
                " STEP OUTPUT"
              ] }),
              /* @__PURE__ */ jsx(JsonPanel, { value: revealResult ? result == null ? void 0 : result.output : null, emptyLabel: "Waiting for this backend result…" })
            ] })
          ] })
        ] }) }, step.id);
      }) })
    ] })
  ] });
}
export {
  LiveWorkflowPage as component
};
