import { jsxs, jsx } from "react/jsx-runtime";
import { User, Shield, LogOut, Mail, Clock, Factory, Settings } from "lucide-react";
import { u as useNexus } from "./nexus-As1BvJl2.js";
import { useState } from "react";
import "zustand";
function ProfilePage() {
  const {
    user
  } = useNexus();
  const [role, setRole] = useState(user.role);
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-5 py-8 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-8 flex items-center gap-3 border-b border-border pb-5", children: [
      /* @__PURE__ */ jsx("div", { className: "flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary", children: /* @__PURE__ */ jsx(User, { className: "size-5" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "User Profile" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Manage your account and preferences" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-8 md:grid-cols-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "col-span-1 flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-4 flex size-24 items-center justify-center rounded-full bg-primary/20 text-4xl font-bold text-primary", children: user.name.split(" ").map((n) => n[0]).join("") }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold", children: user.name }),
        /* @__PURE__ */ jsx("p", { className: "mb-4 text-sm text-muted-foreground", children: user.plant }),
        /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center justify-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground", children: [
          /* @__PURE__ */ jsx(Shield, { className: "size-3.5" }),
          role
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-destructive", children: [
          /* @__PURE__ */ jsx(LogOut, { className: "size-4" }),
          "Sign Out"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "mb-4 text-lg font-semibold", children: "Account Details" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between border-b border-border/50 pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Mail, { className: "size-4 text-muted-foreground" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Email Address" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "arjun.mehta@nexus-foundry.com" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between border-b border-border/50 pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Clock, { className: "size-4 text-muted-foreground" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Current Shift" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: user.shift })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between border-b border-border/50 pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Factory, { className: "size-4 text-muted-foreground" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Assigned Plant" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: user.plant })
              ] })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "mb-4 text-lg font-semibold", children: "Access & Preferences" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Simulate Role (Testing)" }),
              /* @__PURE__ */ jsxs("select", { value: role, onChange: (e) => setRole(e.target.value), className: "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50", children: [
                /* @__PURE__ */ jsx("option", { value: "Operator", children: "Operator" }),
                /* @__PURE__ */ jsx("option", { value: "Senior Melt Operator", children: "Senior Melt Operator" }),
                /* @__PURE__ */ jsx("option", { value: "Supervisor", children: "Supervisor" }),
                /* @__PURE__ */ jsx("option", { value: "Admin", children: "Admin" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Change your role to preview how RBAC affects the dashboard views (Mock implementation)." })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pt-2", children: /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80", children: [
              /* @__PURE__ */ jsx(Settings, { className: "size-4" }),
              "Manage Notification Preferences"
            ] }) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  ProfilePage as component
};
