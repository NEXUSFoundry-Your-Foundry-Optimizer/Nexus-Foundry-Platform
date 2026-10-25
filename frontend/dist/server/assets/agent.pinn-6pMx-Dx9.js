import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Zap, Flame, Play, Mountain, Droplets, CheckCircle2, Save } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { d as useLiveTwin, c as cn, p as postJson } from "./router-C2feh6VC.js";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "clsx";
import "tailwind-merge";
import "sonner";
function PINNPage() {
  var _a, _b;
  const [running, setRunning] = useState(null);
  const [results, setResults] = useState(null);
  const {
    state: melting
  } = useLiveTwin("melting");
  const {
    state: molding
  } = useLiveTwin("molding");
  const {
    state: pouring
  } = useLiveTwin("pouring");
  const [setpoint, setSetpoint] = useState("1400");
  const [moisture, setMoisture] = useState("3.5");
  const [speed, setSpeed] = useState("0.68");
  const runSimulation = async (type) => {
    setRunning(type);
    setResults(null);
    try {
      const parameters = type === "melting" ? {
        pour_temp: Number(setpoint)
      } : type === "molding" ? {
        sand_moisture: Number(moisture)
      } : {
        pour_speed: Number(speed)
      };
      const result = await postJson("/api/v1/simulation/what-if", {
        twin: type,
        parameters
      });
      setResults(result);
    } catch (error) {
      setResults({
        error: error instanceof Error ? error.message : "Simulation failed"
      });
    } finally {
      setRunning(null);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-5 py-8 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-8 flex items-center gap-3 border-b border-border pb-5", children: [
      /* @__PURE__ */ jsx("div", { className: "flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary", children: /* @__PURE__ */ jsx(Zap, { className: "size-5" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "What-If Simulation" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Physics-Informed Neural Network (PINN) Sandbox" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-12", children: [
      /* @__PURE__ */ jsx("div", { className: "space-y-6 lg:col-span-5", children: /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsx("h2", { className: "mb-4 text-lg font-semibold", children: "Simulation Controls" }),
        /* @__PURE__ */ jsxs("div", { className: "mb-4 rounded-lg border border-border/50 bg-background/50 p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center gap-2 font-medium", children: [
            /* @__PURE__ */ jsx(Flame, { className: "size-4 text-orange-500" }),
            "Melting Twin"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-3 space-y-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { children: "Current Temperature:" }),
              /* @__PURE__ */ jsx("span", { className: "font-mono text-foreground", children: melting ? `${Number(melting["melt_temp"] ?? 0).toFixed(2)}°C` : "--" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("span", { children: "Proposed Setpoint:" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("input", { type: "number", value: setpoint, onChange: (e) => setSetpoint(e.target.value), className: "w-20 rounded border border-border bg-card px-2 py-1 font-mono text-foreground outline-none focus:border-primary" }),
                /* @__PURE__ */ jsx("span", { children: "°C" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => runSimulation("melting"), disabled: running !== null, className: "flex w-full items-center justify-center gap-2 rounded bg-secondary py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50", children: [
            running === "melting" ? /* @__PURE__ */ jsx(RefreshCwIcon, { className: "size-4 animate-spin" }) : /* @__PURE__ */ jsx(Play, { className: "size-4" }),
            "Run Simulation"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-4 rounded-lg border border-border/50 bg-background/50 p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center gap-2 font-medium", children: [
            /* @__PURE__ */ jsx(Mountain, { className: "size-4 text-stone-400" }),
            "Molding Twin"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-3 space-y-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { children: "Current Moisture:" }),
              /* @__PURE__ */ jsx("span", { className: "font-mono text-foreground", children: molding ? `${Number(molding["sand_moisture"] ?? 0).toFixed(2)}%` : "--" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("span", { children: "Proposed Moisture:" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("input", { type: "number", value: moisture, onChange: (e) => setMoisture(e.target.value), className: "w-20 rounded border border-border bg-card px-2 py-1 font-mono text-foreground outline-none focus:border-primary" }),
                /* @__PURE__ */ jsx("span", { children: "%" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => runSimulation("molding"), disabled: running !== null, className: "flex w-full items-center justify-center gap-2 rounded bg-secondary py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50", children: [
            running === "molding" ? /* @__PURE__ */ jsx(RefreshCwIcon, { className: "size-4 animate-spin" }) : /* @__PURE__ */ jsx(Play, { className: "size-4" }),
            "Run Simulation"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border/50 bg-background/50 p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center gap-2 font-medium", children: [
            /* @__PURE__ */ jsx(Droplets, { className: "size-4 text-blue-400" }),
            "Pouring Twin"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-3 space-y-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { children: "Current Speed:" }),
              /* @__PURE__ */ jsx("span", { className: "font-mono text-foreground", children: pouring ? `${Number(pouring["pour_speed"] ?? 0).toFixed(2)} m/s` : "--" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("span", { children: "Proposed Speed:" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("input", { type: "number", value: speed, step: "0.01", onChange: (e) => setSpeed(e.target.value), className: "w-20 rounded border border-border bg-card px-2 py-1 font-mono text-foreground outline-none focus:border-primary" }),
                /* @__PURE__ */ jsx("span", { children: "m/s" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => runSimulation("pouring"), disabled: running !== null, className: "flex w-full items-center justify-center gap-2 rounded bg-secondary py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50", children: [
            running === "pouring" ? /* @__PURE__ */ jsx(RefreshCwIcon, { className: "size-4 animate-spin" }) : /* @__PURE__ */ jsx(Play, { className: "size-4" }),
            "Run Simulation"
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6 lg:col-span-7", children: [
        /* @__PURE__ */ jsxs("div", { className: cn("rounded-xl border border-border bg-card p-6 transition-opacity", !results && "opacity-50"), children: [
          /* @__PURE__ */ jsx("h2", { className: "mb-4 text-lg font-semibold", children: "Simulation Results" }),
          results ? /* @__PURE__ */ jsxs(motion.div, { initial: {
            opacity: 0
          }, animate: {
            opacity: 1
          }, className: "space-y-4", children: [
            results.error ? /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: results.error }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-background p-4", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "New Pour Temperature" }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-1 font-mono text-xl font-medium", children: [
                    ((_b = (_a = results.new_predicted_state) == null ? void 0 : _a.pour_temp) == null ? void 0 : _b.toFixed(2)) ?? "--",
                    "°C"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-background p-4", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "New Defect Risk" }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-2 font-mono text-xl font-medium text-green-500", children: [
                    ((results.risk ?? 0) * 100).toFixed(2),
                    "% ",
                    /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
                      "(from ",
                      ((results.previous_risk ?? 0) * 100).toFixed(2),
                      "%)"
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "size-5" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
                    "Physics Valid: ",
                    results.physics_valid ? "Yes" : "No"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "ml-2 text-primary/80", children: [
                    "(cooling rate ",
                    results.cooling_rate ?? "--",
                    "°C/sec)"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-secondary/50 p-4 text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Recommendation:" }),
                " ",
                results.recommendation
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
              /* @__PURE__ */ jsxs("button", { className: "flex flex-1 items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "size-4" }),
                " Apply Change"
              ] }),
              /* @__PURE__ */ jsxs("button", { className: "flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent", children: [
                /* @__PURE__ */ jsx(Save, { className: "size-4" }),
                " Save Scenario"
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsx("div", { className: "flex h-[280px] flex-col items-center justify-center text-muted-foreground", children: running ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(RefreshCwIcon, { className: "mb-4 size-8 animate-spin text-primary" }),
            /* @__PURE__ */ jsx("p", { children: "Solving physics constraints..." })
          ] }) : /* @__PURE__ */ jsx("p", { children: "Run a simulation to see results." }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 rounded-xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "mb-4 text-lg font-semibold", children: "3D Simulation View" }),
          /* @__PURE__ */ jsxs("div", { className: "relative flex h-[300px] items-center justify-center overflow-hidden rounded-lg bg-[#0B0F17]", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10 space-y-4 text-center", children: [
              /* @__PURE__ */ jsx("div", { className: "mx-auto flex size-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary shadow-[0_0_30px_-10px_rgba(245,165,36,0.5)]", children: /* @__PURE__ */ jsx(Flame, { className: "size-8" }) }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1 font-mono text-sm text-muted-foreground", children: [
                /* @__PURE__ */ jsx("p", { children: "● 1400°C setpoint applied" }),
                /* @__PURE__ */ jsx("p", { children: "● Cooling from 1479°C to 1391°C" }),
                /* @__PURE__ */ jsx("p", { children: "● 6.2 hours until pour" })
              ] })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function RefreshCwIcon(props) {
  return /* @__PURE__ */ jsxs("svg", { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsx("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }),
    /* @__PURE__ */ jsx("path", { d: "M3 3v5h5" })
  ] });
}
export {
  PINNPage as component
};
