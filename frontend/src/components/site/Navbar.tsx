import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNexus } from "@/store/nexus";
import { cn } from "@/lib/utils";

const twinLinks = [
  { to: "/twins/$twin", params: { twin: "melting" }, label: "Melting Twin" },
  { to: "/twins/$twin", params: { twin: "molding" }, label: "Molding Twin" },
  { to: "/twins/$twin", params: { twin: "pouring" }, label: "Pouring Twin" },
  { to: "/twins/$twin", params: { twin: "quality" }, label: "Quality Twin" },
] as const;

const agentLinks = [
  { to: "/agent", label: "Agent Hub" },
  { to: "/agent/rag", label: "RAG Assistant" },
  { to: "/agent/pinn", label: "PINN Simulation" },
] as const;

function Dropdown({
  label,
  items,
}: {
  label: string;
  items: readonly { to: string; label: string; params?: Record<string, string> }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="flex items-center gap-1 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        {label}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      <div
        className={cn(
          "absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 pt-3 transition-all duration-200",
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0",
        )}
      >
        <div className="surface-panel overflow-hidden p-1.5">
          {items.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              params={item.params as never}
              className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Navbar() {
  const { alerts, readIds } = useNexus();
  const unread = alerts.filter((a) => !readIds.includes(a.id)).length;
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setMobile(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-border bg-background/85 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo" className="size-8 object-contain rounded-sm" />
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[#ffd700] to-[#ff5500] bg-clip-text text-transparent">
            NEXUS-Foundry
          </span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          <Dropdown label="Twins" items={twinLinks} />
          <Link
            to="/dashboard"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Dashboard
          </Link>
          <Link
            to="/analytics"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Final Analytics
          </Link>
          <Dropdown label="Agent" items={agentLinks} />
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/notifications"
            className="relative flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                {unread}
              </span>
            )}
          </Link>
          <Link
            to="/profile"
            className="hidden items-center gap-2 rounded-md border border-border py-1.5 pl-1.5 pr-3 transition-colors hover:border-primary/40 sm:flex"
          >
            <span className="flex size-6 items-center justify-center rounded bg-primary text-[11px] font-bold text-primary-foreground">
              AM
            </span>
            <span className="text-sm">Profile</span>
          </Link>
          <button
            className="flex size-9 items-center justify-center rounded-md border border-border lg:hidden"
            onClick={() => setMobile((v) => !v)}
            aria-label="Menu"
          >
            {mobile ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      {mobile && (
        <div className="border-t border-border bg-background px-5 py-4 lg:hidden">
          <p className="eyebrow mb-2">Twins</p>
          <div className="mb-4 grid gap-1">
            {twinLinks.map((t) => (
              <Link key={t.label} to={t.to} params={t.params} className="py-1.5 text-sm text-muted-foreground">
                {t.label}
              </Link>
            ))}
          </div>
          <div className="grid gap-1">
            <Link to="/dashboard" className="py-1.5 text-sm">
              Dashboard
            </Link>
            <Link to="/analytics" className="py-1.5 text-sm">
              Final Analytics
            </Link>
            <Link to="/agent" className="py-1.5 text-sm">
              Agent
            </Link>
            <Link to="/profile" className="py-1.5 text-sm">
              Profile
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
