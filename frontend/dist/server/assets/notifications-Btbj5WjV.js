import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { u as useLiveCollection, c as cn } from "./router-C2feh6VC.js";
import { Bell, Check, CheckCircle2, AlertTriangle, AlertOctagon, ArrowRight } from "lucide-react";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "sonner";
const severityConfig = {
  critical: {
    icon: AlertOctagon,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/20"
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20"
  },
  normal: {
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20"
  }
};
function NotificationsPage() {
  const {
    data: liveAlerts
  } = useLiveCollection("/api/v1/alerts/active");
  const [readIds, setReadIds] = useState([]);
  const alerts = liveAlerts ?? [];
  const markAllRead = () => setReadIds(alerts.map((alert) => alert.id));
  const markRead = (id) => setReadIds((current) => current.includes(id) ? current : [...current, id]);
  const sortedAlerts = [...alerts].sort((a, b) => b.time.localeCompare(a.time));
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-5 py-8 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-8 flex items-center justify-between border-b border-border pb-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary", children: /* @__PURE__ */ jsx(Bell, { className: "size-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Notifications" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Alerts and system updates across all twins" })
        ] })
      ] }),
      readIds.length < alerts.length && /* @__PURE__ */ jsxs("button", { onClick: markAllRead, className: "flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", children: [
        /* @__PURE__ */ jsx(Check, { className: "size-4" }),
        "Mark all as read"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-4", children: sortedAlerts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-center", children: [
      /* @__PURE__ */ jsx(CheckCircle2, { className: "mb-3 size-12 text-muted-foreground/30" }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium", children: "All Caught Up" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "You have no new notifications." })
    ] }) : sortedAlerts.map((alert) => {
      const isRead = readIds.includes(alert.id);
      const conf = severityConfig[alert.severity];
      const Icon = conf.icon;
      return /* @__PURE__ */ jsxs("div", { onClick: () => markRead(alert.id), className: cn("group flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all hover:border-primary/40 hover:bg-card/80", isRead ? "border-border bg-background/50 opacity-70" : cn("bg-card", conf.border)), children: [
        /* @__PURE__ */ jsx("div", { className: cn("mt-1 flex size-10 shrink-0 items-center justify-center rounded-full", conf.bg, conf.color), children: /* @__PURE__ */ jsx(Icon, { className: "size-5" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-1 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxs("span", { className: "font-semibold uppercase tracking-wider text-muted-foreground text-[10px]", children: [
                alert.twin,
                " Twin"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground", children: [
                "Batch ",
                alert.batch
              ] })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: alert.time })
          ] }),
          /* @__PURE__ */ jsx("p", { className: cn("text-sm", !isRead && "font-medium text-foreground"), children: alert.message })
        ] }),
        /* @__PURE__ */ jsx(Link, { to: "/twins/$twin", params: {
          twin: alert.twin
        }, className: "mt-2 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors group-hover:border-primary/50 group-hover:bg-primary/10 group-hover:text-primary", title: "View in Twin", children: /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" }) })
      ] }, alert.id);
    }) })
  ] });
}
export {
  NotificationsPage as component
};
