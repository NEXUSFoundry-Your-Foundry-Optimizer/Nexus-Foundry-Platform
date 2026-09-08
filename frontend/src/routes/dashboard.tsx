import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, Droplets, Flame, Layers, Scan } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { StatusPill } from "@/components/site/StatusPill";
import { TFTChart } from "@/components/charts/TFTChart";
import { ALERTS, BATCHES, HEALTH_HISTORY, TWINS, TWIN_ORDER, TWIN_STATE, type Severity } from "@/lib/nexus-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Live Dashboard — NEXUS-Foundry" },
      {
        name: "description",
        content: "Real-time overview of all four foundry twins, batch timeline, degradation forecasts and active alerts.",
      },
      { property: "og:title", content: "Live Dashboard — NEXUS-Foundry" },
      { property: "og:description", content: "All four twins, batch timeline and active alerts in one live view." },
    ],
  }),
  component: Dashboard,
});

const icons = { flame: Flame, layers: Layers, droplets: Droplets, scan: Scan } as const;

const headline: Record<string, string> = {
  melting: "1479°C",
  molding: "4.2%",
  pouring: "91% risk",
  quality: "0.29",
};

const barColor: Record<Severity, string> = {
  critical: "bg-destructive",
  warning: "bg-warning",
  normal: "bg-success",
};

const chartTooltip = {
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  fontSize: 12,
};

function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <Reveal>
        <p className="eyebrow">Operations overview</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-medium tracking-tight lg:text-5xl">Live Dashboard</h1>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary pulse-dot" /> WebSocket /ws · 2s refresh
          </span>
        </div>
      </Reveal>

      {/* Summary cards */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TWIN_ORDER.map((id, i) => {
          const t = TWINS[id];
          const s = TWIN_STATE[id];
          const Icon = icons[t.icon as keyof typeof icons];
          return (
            <Reveal key={id} delay={i * 0.06}>
              <Link
                to="/twins/$twin"
                params={{ twin: id }}
                className="group block rounded-xl border border-border bg-surface p-5 transition-all hover:-translate-y-1 hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{t.name}</p>
                <p className="mt-1 font-mono text-2xl">{headline[id]}</p>
                <div className="mt-4">
                  <StatusPill status={s.status} />
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>

      {/* Batch timeline */}
      <Reveal delay={0.1} className="mt-6">
        <div className="surface-panel p-6">
          <h2 className="text-sm font-medium">Batch Timeline</h2>
          <p className="mt-1 text-xs text-muted-foreground">Today · colour-coded by predicted defect outcome</p>
          <div className="mt-6 flex gap-1.5 overflow-x-auto pb-2">
            {BATCHES.map((b) => (
              <div key={b.id} className="min-w-[150px] flex-1">
                <div className={cn("h-2 rounded-full", barColor[b.status])} />
                <p className="mt-3 font-mono text-sm">{b.id}</p>
                <p className="text-xs text-muted-foreground">
                  {b.start} · {b.alloy}
                </p>
                <p className="mt-1 text-xs">
                  <span className="text-muted-foreground">risk </span>
                  <span className={cn(b.predicted > 0.5 ? "text-destructive" : b.predicted > 0.2 ? "text-warning" : "text-success")}>
                    {(b.predicted * 100).toFixed(0)}%
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Historical charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="surface-panel p-6">
            <h2 className="text-sm font-medium">Furnace Health Degradation — TFT 48h Forecast</h2>
            <p className="mt-1 text-xs text-muted-foreground">P10 / P50 / P90 quantile bands</p>
            <div className="mt-4">
              <TFTChart />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="surface-panel p-6">
            <h2 className="text-sm font-medium">Daily Melt Temperature Trend</h2>
            <p className="mt-1 text-xs text-muted-foreground">30-day rolling average, °C</p>
            <div className="mt-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={HEALTH_HISTORY} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartTooltip} />
                  <Line type="monotone" dataKey="temp" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="surface-panel p-6">
            <h2 className="text-sm font-medium">Defect Rate Over Time</h2>
            <p className="mt-1 text-xs text-muted-foreground">Percent of castings rejected per day</p>
            <div className="mt-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HEALTH_HISTORY} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartTooltip} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />
                  <Bar dataKey="defectRate" fill="var(--color-chart-3)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="surface-panel p-6">
            <h2 className="text-sm font-medium">Active Alerts</h2>
            <p className="mt-1 text-xs text-muted-foreground">Live from /api/alerts/active</p>
            <div className="mt-4 space-y-2">
              {ALERTS.filter((a) => a.severity !== "normal").map((a) => (
                <Link
                  key={a.id}
                  to="/twins/$twin"
                  params={{ twin: a.twin }}
                  className="flex items-start gap-3 rounded-lg border border-border bg-background/40 px-4 py-3 transition-colors hover:border-primary/40"
                >
                  <StatusPill status={a.severity} />
                  <div className="min-w-0">
                    <p className="truncate text-sm">{a.message}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {TWINS[a.twin].name} · {a.batch} · {a.time}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
