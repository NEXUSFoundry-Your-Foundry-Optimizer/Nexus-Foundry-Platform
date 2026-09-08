import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LiveSensorChart } from "@/components/charts/LiveSensorChart";
import { TwinVisual } from "@/components/three/TwinVisual";
import type { SceneVariant } from "@/components/three/scene";
import { Reveal } from "@/components/site/Reveal";
import { StatusPill } from "@/components/site/StatusPill";
import { ALERTS, TWINS, TWIN_ORDER, TWIN_STATE, type TwinId } from "@/lib/nexus-data";
import { useNexus } from "@/store/nexus";
import { cn } from "@/lib/utils";

const variants: Record<TwinId, SceneVariant> = {
  melting: "furnace",
  molding: "mold",
  pouring: "ladle",
  quality: "inspection",
};

function isTwin(v: string): v is TwinId {
  return (TWIN_ORDER as string[]).includes(v);
}

export const Route = createFileRoute("/twins/$twin")({
  loader: ({ params }) => {
    if (!isTwin(params.twin)) throw notFound();
    return { twin: params.twin as TwinId };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Twin not found — NEXUS-Foundry" }, { name: "robots", content: "noindex" }] };
    }
    const t = TWINS[loaderData.twin];
    return {
      meta: [
        { title: `${t.name} — Live State | NEXUS-Foundry` },
        { name: "description", content: t.blurb },
        { property: "og:title", content: `${t.name} — NEXUS-Foundry` },
        { property: "og:description", content: t.blurb },
      ],
    };
  },
  component: TwinPage,
});

function TwinPage() {
  const { twin } = Route.useLoaderData();
  const meta = TWINS[twin];
  const state = TWIN_STATE[twin];
  const focused = useNexus((s) => s.focusedAlert);
  const alerts = ALERTS.filter((a) => a.twin === twin);
  const idx = TWIN_ORDER.indexOf(twin);
  const prev = TWIN_ORDER[(idx + 3) % 4]!;
  const next = TWIN_ORDER[(idx + 1) % 4]!;

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Digital twin · Stage 0{idx + 1}</p>
            <h1 className="mt-3 text-4xl font-medium tracking-tight lg:text-5xl">{meta.name}</h1>
            <p className="mt-3 max-w-xl text-muted-foreground">{meta.blurb}</p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <StatusPill status={state.status} />
            {meta.comingSoon && (
              <span className="rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs text-warning">
                Backend integration in progress
              </span>
            )}
            <p className="font-mono text-xs text-muted-foreground">Batch {state.batch} · live via /ws every 2s</p>
          </div>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <TwinVisual variant={variants[twin]} className="h-[360px] w-full" label={`Rendering ${meta.name}`} />
        </Reveal>
        <Reveal delay={0.08}>
          <div className="surface-panel h-full p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Live Simulation Graph</h2>
              <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary pulse-dot" /> streaming
              </span>
            </div>
            <div className="mt-3">
              <LiveSensorChart twin={twin} />
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.1} className="mt-5">
        <div className="surface-panel p-5">
          <h2 className="text-sm font-medium">Data Info</h2>
          <div className="mt-4 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
            {state.values.map((v) => (
              <div key={v.label} className="bg-surface px-4 py-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{v.label}</p>
                <p className="mt-1.5 font-mono text-xl">
                  {v.value}
                  <span className="ml-0.5 text-sm text-muted-foreground">{v.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.12} className="mt-5">
        <div className="surface-panel p-5">
          <h2 className="text-sm font-medium">Alert Logs</h2>
          <div className="mt-4 space-y-2">
            {alerts.length === 0 && <p className="text-sm text-muted-foreground">No alerts recorded for this twin today.</p>}
            {alerts.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background/40 px-4 py-3 transition-colors",
                  focused === a.id && "border-primary/60 bg-primary/5",
                )}
              >
                <StatusPill status={a.severity} />
                <span className="font-mono text-xs text-muted-foreground">{a.time}</span>
                <span className="text-sm">{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
        <Link
          to="/twins/$twin"
          params={{ twin: prev }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" /> {TWINS[prev].name}
        </Link>
        <Link
          to="/twins/$twin"
          params={{ twin: next }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          {TWINS[next].name} <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
