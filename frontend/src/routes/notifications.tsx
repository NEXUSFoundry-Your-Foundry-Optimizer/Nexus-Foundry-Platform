import { createFileRoute, Link } from "@tanstack/react-router";
import { useNexus } from "@/store/nexus";
import { Bell, Check, CheckCircle2, AlertTriangle, AlertOctagon, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Severity } from "@/lib/nexus-data";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

const severityConfig: Record<Severity, { icon: React.FC<any>; color: string; bg: string; border: string }> = {
  critical: { icon: AlertOctagon, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  normal: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
};

function NotificationsPage() {
  const { alerts, readIds, markAllRead, markRead } = useNexus();

  const sortedAlerts = [...alerts].sort((a, b) => b.time.localeCompare(a.time));

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:px-8">
      <div className="mb-8 flex items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Bell className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">Alerts and system updates across all twins</p>
          </div>
        </div>
        
        {readIds.length < alerts.length && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Check className="size-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {sortedAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="mb-3 size-12 text-muted-foreground/30" />
            <h3 className="text-lg font-medium">All Caught Up</h3>
            <p className="text-sm text-muted-foreground">You have no new notifications.</p>
          </div>
        ) : (
          sortedAlerts.map((alert) => {
            const isRead = readIds.includes(alert.id);
            const conf = severityConfig[alert.severity];
            const Icon = conf.icon;

            return (
              <div
                key={alert.id}
                onClick={() => markRead(alert.id)}
                className={cn(
                  "group flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all hover:border-primary/40 hover:bg-card/80",
                  isRead ? "border-border bg-background/50 opacity-70" : cn("bg-card", conf.border)
                )}
              >
                <div className={cn("mt-1 flex size-10 shrink-0 items-center justify-center rounded-full", conf.bg, conf.color)}>
                  <Icon className="size-5" />
                </div>
                
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
                        {alert.twin} Twin
                      </span>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        Batch {alert.batch}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                  <p className={cn("text-sm", !isRead && "font-medium text-foreground")}>
                    {alert.message}
                  </p>
                </div>

                <Link
                  to="/twins/$twin"
                  params={{ twin: alert.twin }}
                  className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors group-hover:border-primary/50 group-hover:bg-primary/10 group-hover:text-primary"
                  title="View in Twin"
                >
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
