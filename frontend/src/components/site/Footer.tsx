import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] text-white">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex flex-col">
              <span className="font-serif text-3xl font-medium tracking-tight bg-gradient-to-b from-[#8a3800] to-[#ff6a00] bg-clip-text text-transparent">
                NEXUS-<br />
                Foundry
              </span>
            </div>
            <p className="mt-6 max-w-xs text-sm text-[#AAAAAA] leading-relaxed">
              A cross-stage cognitive digital twin platform for predictive casting intelligence. Predict, Prevent, Preserve — making foundry data speak.
            </p>
          </div>

          <div>
            <p className="eyebrow mb-6 text-[#888888]">TWINS</p>
            <ul className="space-y-4 text-sm text-white">
              {(["Melting", "Molding", "Pouring", "Quality"] as const).map((t) => (
                <li key={t}>
                  <Link to="/twins/$twin" params={{ twin: t.toLowerCase() }} className="transition-colors hover:text-[#ff5500]">
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-6 text-[#888888]">PLATFORM</p>
            <ul className="space-y-4 text-sm text-white">
              <li>
                <Link to="/dashboard" className="transition-colors hover:text-[#ff5500]">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="transition-colors hover:text-[#ff5500]">
                  Final Analytics
                </Link>
              </li>
              <li>
                <Link to="/notifications" className="transition-colors hover:text-[#ff5500]">
                  Notifications
                </Link>
              </li>
              <li>
                <Link to="/profile" className="transition-colors hover:text-[#ff5500]">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-6 text-[#888888]">INTELLIGENCE</p>
            <ul className="space-y-4 text-sm text-white">
              <li>
                <Link to="/agent/hub" className="transition-colors hover:text-[#ff5500]">
                  Agent Hub
                </Link>
              </li>
              <li>
                <Link to="/agent/rag" className="transition-colors hover:text-[#ff5500]">
                  RAG Assistant
                </Link>
              </li>
              <li>
                <Link to="/agent/pinn" className="transition-colors hover:text-[#ff5500]">
                  PINN Simulation
                </Link>
              </li>
              <li>
                <Link to="/stack" className="transition-colors hover:text-[#ff5500]">
                  Tech Stack
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col justify-between gap-3 border-t border-[#333333] pt-6 text-sm text-[#888888] sm:flex-row">
          <p>© 2026 NEXUS-Foundry. On-premise by design.</p>
          <p>Melting → Molding → Pouring → Quality</p>
        </div>
      </div>
    </footer>
  );
}
