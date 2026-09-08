import { createFileRoute } from "@tanstack/react-router";
import { User, Mail, Shield, Settings, LogOut, Factory, Clock } from "lucide-react";
import { useNexus } from "@/store/nexus";
import { useState } from "react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useNexus();
  const [role, setRole] = useState(user.role);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:px-8">
      <div className="mb-8 flex items-center gap-3 border-b border-border pb-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
          <User className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Profile</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column: Avatar & Basic Info */}
        <div className="col-span-1 flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center">
          <div className="mb-4 flex size-24 items-center justify-center rounded-full bg-primary/20 text-4xl font-bold text-primary">
            {user.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="mb-4 text-sm text-muted-foreground">{user.plant}</p>
          
          <div className="mb-6 flex items-center justify-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <Shield className="size-3.5" />
            {role}
          </div>

          <button className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-destructive">
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>

        {/* Right Column: Settings & Details */}
        <div className="col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Account Details</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email Address</p>
                    <p className="text-xs text-muted-foreground">arjun.mehta@nexus-foundry.com</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-3">
                  <Clock className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Current Shift</p>
                    <p className="text-xs text-muted-foreground">{user.shift}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-3">
                  <Factory className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Assigned Plant</p>
                    <p className="text-xs text-muted-foreground">{user.plant}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Access & Preferences</h3>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Simulate Role (Testing)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
                >
                  <option value="Operator">Operator</option>
                  <option value="Senior Melt Operator">Senior Melt Operator</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Admin">Admin</option>
                </select>
                <p className="text-xs text-muted-foreground">Change your role to preview how RBAC affects the dashboard views (Mock implementation).</p>
              </div>

              <div className="pt-2">
                <button className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80">
                  <Settings className="size-4" />
                  Manage Notification Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
