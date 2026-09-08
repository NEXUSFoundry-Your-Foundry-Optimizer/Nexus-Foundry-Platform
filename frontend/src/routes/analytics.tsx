import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { StatusPill } from "@/components/site/StatusPill";
import { SHAPChart } from "@/components/charts/SHAPChart";
import { ALERTS, BATCHES, SHAP, TWINS } from "@/lib/nexus-data";
import { useNexus } from "@/store/nexus";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Final Analytics & SHAP Explainability — NEXUS-Foundry" },
      {
        name: "description",
        content: "Consolidated alert management, SHAP feature attribution and pre-pour versus post-inspection defect comparison.",
      },
      { property: "og:title", content: "Final Analytics — NEXUS-Foundry" },
      { property: "og:description", content: "Why the model predicted a defect, and what to do about it." },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const navigate = useNavigate();
  const focusAlert = useNexus((s) => s.focusAlert);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <Reveal>
        <p className="eyebrow">Consolidated analysis</p>
        <h1 className="mt-3 text-4xl font-medium tracking-tight lg:text-5xl">Final Analytics</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every alert, the exact features that drove each defect prediction, and how the pre-pour forecast compared to
          the inspected result.
        </p>
      </Reveal>

      {/* Alert summary table */}
      <Reveal delay={0.06} className="mt-10">
        <div className="surface-panel overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium">Alert Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Twin</th>
                  <th className="px-6 py-3 font-medium">Batch</th>
                  <th className="px-6 py-3 font-medium">Severity</th>
                  <th className="px-6 py-3 font-medium">Time</th>
                  <th className="px-6 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {ALERTS.map((a) => (
                  <tr key={a.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                    <td className="px-6 py-4">{TWINS[a.twin].name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{a.batch}</td>
                    <td className="px-6 py-4">
                      <StatusPill status={a.severity} />
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{a.time}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          focusAlert(a.id);
                          navigate({ to: "/twins/$twin", params: { twin: a.twin } });
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-primary transition-opacity hover:opacity-70"
                      >
                        View <ArrowRight className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      {/* SHAP */}
      <Reveal delay={0.08} className="mt-6">
        <div className="surface-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium">SHAP Explainability</h2>
              <p className="mt-1 text-xs text-muted-foreground">XGBoost · 65 features · batch CB-001</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Defect prediction</p>
              <p className="font-mono text-xl text-warning">
                {SHAP.prediction} ({(SHAP.probability * 100).toFixed(0)}%)
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-lg border border-border bg-background/40 p-5">
            <p className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">Why?</p>
            <SHAPChart />
          </div>
          <p className="mt-4 rounded-lg border border-primary/30 bg-primary/8 px-4 py-3 text-sm">
            <span className="font-medium text-primary">Recommendation: </span>
            {SHAP.recommendation}
          </p>
        </div>
      </Reveal>

      {/* Defect prediction dashboard */}
      <Reveal delay={0.1} className="mt-6">
        <div className="surface-panel p-6">
          <h2 className="text-sm font-medium">Defect Prediction vs. Inspection</h2>
          <p className="mt-1 text-xs text-muted-foreground">Pre-pour XGBoost probability compared with post-inspection outcome</p>
          <div className="mt-6 space-y-3">
            {BATCHES.map((b) => (
              <div key={b.id} className="grid grid-cols-[80px_1fr_92px_88px] items-center gap-4">
                <span className="font-mono text-sm">{b.id}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      b.predicted > 0.5 ? "bg-destructive" : b.predicted > 0.2 ? "bg-warning" : "bg-success",
                    )}
                    style={{ width: `${b.predicted * 100}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-muted-foreground">{(b.predicted * 100).toFixed(0)}% pred.</span>
                <span
                  className={cn(
                    "rounded border px-2 py-1 text-center text-[11px]",
                    b.actual === "Clean" ? "border-success/40 text-success" : "border-border text-muted-foreground",
                  )}
                >
                  {b.actual}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
