import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  Activity,
  Box,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  Droplets,
  Flame,
  Layers,
  Send,
  ShieldAlert,
  Sliders,
  Terminal,
  Zap,
} from "lucide-react";

import { Reveal } from "@/components/site/Reveal";
import { cn } from "@/lib/utils";
import { useLiveCollection } from "@/lib/live-api";

export const Route = createFileRoute("/live-workflow")({
  head: () => ({
    meta: [
      { title: "Live Cross-Stage Workflow — NEXUS-Foundry" },
      { name: "description", content: "Real CSV and model payloads for each cross-twin anomaly workflow step." },
    ],
  }),
  component: LiveWorkflowPage,
});

type WorkflowStatus = "completed" | "skipped" | "failed" | "not-triggered" | "waiting";

interface WorkflowStepResult {
  id: number;
  name: string;
  status: WorkflowStatus;
  input: unknown;
  output: unknown;
}

interface Workflow {
  workflow_id: string;
  batch_id: string;
  event_time: string;
  status: string;
  steps: WorkflowStepResult[];
}

interface WorkflowResponse {
  workflow: Workflow | null;
}

interface StepDefinition {
  id: number;
  stage: string;
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  operation: string;
}

const pipeline: StepDefinition[] = [
  { id: 1, stage: "Melting Twin", title: "LSTM-AE detects anomaly", subtitle: "Reconstruction error is evaluated against the 0.78 threshold", icon: Activity, operation: "LSTM-AE receives the live 30×7 furnace CSV window." },
  { id: 2, stage: "Emergency run", title: "Melting Twin triggers TFT", subtitle: "Source history and the anomaly window are captured", icon: Zap, operation: "TFT request is built from the event-time furnace CSV context." },
  { id: 3, stage: "Forecast engine", title: "TFT returns forecast", subtitle: "Next two hours, 9 PM projection, failure time, and attention", icon: Clock, operation: "Trained PyTorch TFT inference." },
  { id: 4, stage: "Schedule check", title: "Melting Twin checks pour schedule", subtitle: "Queries the next twelve hours for the affected batch", icon: Clock, operation: "production_master.csv batch schedule lookup." },
  { id: 5, stage: "Event dispatch", title: "Melting Twin sends warning", subtitle: "The exact cross-twin warning envelope", icon: Send, operation: "Warning payload handed to the Pouring Twin." },
  { id: 6, stage: "Pouring Twin", title: "Pouring Twin receives warning", subtitle: "Acknowledgement and downstream activation", icon: Droplets, operation: "PouringTwin.receive_upstream_warning()." },
  { id: 7, stage: "Molding Twin", title: "Query molding data", subtitle: "Gets the source mold record for the warned batch", icon: Layers, operation: "molding_sensor.csv batch lookup." },
  { id: 8, stage: "CAD database", title: "Query shape embedding", subtitle: "Loads the matching part geometry and 50D embedding", icon: Box, operation: "geometry_metadata.csv part lookup." },
  { id: 9, stage: "Feature fusion", title: "Assemble 65 features", subtitle: "Combines furnace, molding, pouring, CAD, and environment inputs", icon: Database, operation: "XGBoost feature-schema assembly." },
  { id: 10, stage: "XGBoost + SHAP", title: "Calculate defect risk", subtitle: "Actual model probability and feature attribution", icon: Cpu, operation: "XGBoost predict_proba and TreeSHAP." },
  { id: 11, stage: "Alert broadcast", title: "Generate alert", subtitle: "Dashboard/mobile alert is raised only when actual risk is critical", icon: ShieldAlert, operation: "Alert store and live dashboard broadcast." },
];

const statusStyle: Record<WorkflowStatus, string> = {
  completed: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  skipped: "border-muted-foreground/30 bg-muted/50 text-muted-foreground",
  failed: "border-destructive/50 bg-destructive/15 text-destructive",
  "not-triggered": "border-warning/40 bg-warning/10 text-warning",
  waiting: "border-border bg-surface-2 text-muted-foreground",
};

function JsonPanel({ value, emptyLabel }: { value: unknown; emptyLabel: string }) {
  if (value === undefined || value === null || (typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0)) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border/50 bg-background/70 p-3 font-mono text-[11px] leading-relaxed text-foreground">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function statusLabel(status: WorkflowStatus) {
  return status === "not-triggered" ? "not triggered" : status;
}

function LiveWorkflowPage() {
  const { data, error } = useLiveCollection<WorkflowResponse>("/api/v1/workflows/latest", 1000);
  const workflow = data?.workflow ?? null;
  const results = workflow?.steps ?? [];
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    if (!workflow?.workflow_id) {
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
  }, [workflow?.workflow_id]);

  const resultById = useMemo(() => new Map(results.map((step) => [step.id, step])), [results]);
  const isActive = Boolean(workflow && resultById.get(1)?.status === "completed");

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="eyebrow">Live backend execution trace</p>
            <h1 className="mt-3 text-4xl font-medium tracking-tight lg:text-5xl">Live Cross-Stage Workflow</h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              Every displayed value below is returned by the backend from the replay CSVs and model calls. A missing or skipped step is shown as such; this screen does not fill it with a demo value.
            </p>
          </div>
          <div className={cn("rounded-lg border px-3 py-2 font-mono text-xs uppercase", isActive ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-border bg-surface-2 text-muted-foreground")}>
            {isActive ? "anomaly cascade active" : "waiting for anomaly event"}
          </div>
        </div>
      </Reveal>

      {error && <p className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">Unable to load the live workflow: {error}</p>}

      {workflow && (
        <Reveal delay={0.03} className="mt-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-primary/30 bg-primary/5 p-4 font-mono text-xs">
            <span><strong className="text-muted-foreground">WORKFLOW</strong> {workflow.workflow_id}</span>
            <span><strong className="text-muted-foreground">BATCH</strong> {workflow.batch_id}</span>
            <span><strong className="text-muted-foreground">EVENT TIME</strong> {new Date(workflow.event_time).toLocaleString()}</span>
            <span><strong className="text-muted-foreground">RESULT</strong> {workflow.status}</span>
          </div>
        </Reveal>
      )}

      {!workflow && !error && (
        <Reveal delay={0.03} className="mt-6">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
            <Flame className="mt-0.5 size-5 text-primary" />
            <p>The furnace CSV replay is live. This trace will begin when the LSTM-AE returns a reconstruction error above 0.78.</p>
          </div>
        </Reveal>
      )}

      {workflow && (
      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <div className="sticky top-24 surface-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium">Execution pipeline</h2>
              <span className="font-mono text-xs text-muted-foreground">{activeStep}/11</span>
            </div>
            <div className="space-y-1.5">
              {pipeline.map((step) => {
                const status = resultById.get(step.id)?.status ?? "waiting";
                const Icon = step.icon;
                const selected = activeStep === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className={cn("flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs transition-colors", selected ? "border-primary bg-primary/15" : "border-transparent hover:border-border hover:bg-surface-2")}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      {status === "completed" ? <CheckCircle2 className="size-4 shrink-0 text-emerald-400" /> : <Icon className="size-4 shrink-0 text-muted-foreground" />}
                      <span className="truncate">{step.id}. {step.title}</span>
                    </span>
                    <ChevronRight className={cn("size-3.5 shrink-0 text-muted-foreground", selected && "rotate-90")} />
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="space-y-5 lg:col-span-8">
          {pipeline.map((step) => {
            const result = resultById.get(step.id);
            const status = result?.status ?? "waiting";
            const Icon = step.icon;
            const selected = activeStep === step.id;
            const passed = activeStep > step.id;
            const revealResult = activeStep >= step.id;
            return (
              <Reveal key={step.id} delay={step.id * 0.02}>
                <article className={cn("surface-panel border p-6 transition-all", selected ? "border-primary/80 ring-2 ring-primary/15" : passed ? "border-border bg-background/60" : "border-border/60 opacity-70")}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg border font-mono text-sm font-bold", selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface-2 text-muted-foreground")}>{step.id}</div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-primary">{step.stage}</span>
                          <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase", statusStyle[status])}>{statusLabel(status)}</span>
                        </div>
                        <h2 className="mt-2 text-base font-semibold">Step {step.id}: {step.title}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">{step.subtitle}</p>
                      </div>
                    </div>
                    <Icon className={cn("size-5 shrink-0 text-muted-foreground", selected && "text-primary")} />
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-border/50 bg-surface-2 px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    <Terminal className="size-3.5 shrink-0 text-primary" />
                    <span><strong className="text-foreground">OPERATION:</strong> {step.operation}</span>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-surface-2/60 p-3">
                      <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] font-bold text-primary"><Sliders className="size-3.5" /> STEP INPUT</div>
                      <JsonPanel value={revealResult ? result?.input : null} emptyLabel="Waiting for this backend request to execute…" />
                    </div>
                    <div className="rounded-lg border border-border/60 bg-surface-2/60 p-3">
                      <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-400"><CheckCircle2 className="size-3.5" /> STEP OUTPUT</div>
                      <JsonPanel value={revealResult ? result?.output : null} emptyLabel="Waiting for this backend result…" />
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </section>
      </div>
      )}
    </div>
  );
}
