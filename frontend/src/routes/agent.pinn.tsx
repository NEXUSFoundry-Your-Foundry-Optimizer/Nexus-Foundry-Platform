import { createFileRoute } from "@tanstack/react-router";
import { Zap, Flame, Mountain, Droplets, CheckCircle2, Save, Play } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agent/pinn")({
  component: PINNPage,
});

function PINNPage() {
  const [running, setRunning] = useState<"melting" | "molding" | "pouring" | null>(null);
  const [results, setResults] = useState<boolean>(false);
  
  const [setpoint, setSetpoint] = useState("1400");
  const [moisture, setMoisture] = useState("3.5");
  const [speed, setSpeed] = useState("0.68");

  const runSimulation = (type: "melting" | "molding" | "pouring") => {
    setRunning(type);
    setResults(false);
    setTimeout(() => {
      setRunning(null);
      setResults(true);
    }, 2000);
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <div className="mb-8 flex items-center gap-3 border-b border-border pb-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
          <Zap className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">What-If Simulation</h1>
          <p className="text-muted-foreground">Physics-Informed Neural Network (PINN) Sandbox</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Controls */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-lg font-semibold">Simulation Controls</h2>
            
            {/* Melting Twin */}
            <div className="mb-4 rounded-lg border border-border/50 bg-background/50 p-4">
              <div className="mb-3 flex items-center gap-2 font-medium">
                <Flame className="size-4 text-orange-500" />
                Melting Twin
              </div>
              <div className="mb-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Current Temperature:</span>
                  <span className="font-mono text-foreground">1479°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Proposed Setpoint:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={setpoint}
                      onChange={(e) => setSetpoint(e.target.value)}
                      className="w-20 rounded border border-border bg-card px-2 py-1 font-mono text-foreground outline-none focus:border-primary"
                    />
                    <span>°C</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => runSimulation("melting")}
                disabled={running !== null}
                className="flex w-full items-center justify-center gap-2 rounded bg-secondary py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
              >
                {running === "melting" ? <RefreshCwIcon className="size-4 animate-spin" /> : <Play className="size-4" />}
                Run Simulation
              </button>
            </div>

            {/* Molding Twin */}
            <div className="mb-4 rounded-lg border border-border/50 bg-background/50 p-4">
              <div className="mb-3 flex items-center gap-2 font-medium">
                <Mountain className="size-4 text-stone-400" />
                Molding Twin
              </div>
              <div className="mb-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Current Moisture:</span>
                  <span className="font-mono text-foreground">4.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Proposed Moisture:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={moisture}
                      onChange={(e) => setMoisture(e.target.value)}
                      className="w-20 rounded border border-border bg-card px-2 py-1 font-mono text-foreground outline-none focus:border-primary"
                    />
                    <span>%</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => runSimulation("molding")}
                disabled={running !== null}
                className="flex w-full items-center justify-center gap-2 rounded bg-secondary py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
              >
                {running === "molding" ? <RefreshCwIcon className="size-4 animate-spin" /> : <Play className="size-4" />}
                Run Simulation
              </button>
            </div>

            {/* Pouring Twin */}
            <div className="rounded-lg border border-border/50 bg-background/50 p-4">
              <div className="mb-3 flex items-center gap-2 font-medium">
                <Droplets className="size-4 text-blue-400" />
                Pouring Twin
              </div>
              <div className="mb-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Current Speed:</span>
                  <span className="font-mono text-foreground">0.74 m/s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Proposed Speed:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={speed}
                      step="0.01"
                      onChange={(e) => setSpeed(e.target.value)}
                      className="w-20 rounded border border-border bg-card px-2 py-1 font-mono text-foreground outline-none focus:border-primary"
                    />
                    <span>m/s</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => runSimulation("pouring")}
                disabled={running !== null}
                className="flex w-full items-center justify-center gap-2 rounded bg-secondary py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
              >
                {running === "pouring" ? <RefreshCwIcon className="size-4 animate-spin" /> : <Play className="size-4" />}
                Run Simulation
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Results & 3D View */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          <div className={cn("rounded-xl border border-border bg-card p-6 transition-opacity", !results && "opacity-50")}>
            <h2 className="mb-4 text-lg font-semibold">Simulation Results</h2>
            {results ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-background p-4">
                    <div className="text-sm text-muted-foreground">New Pour Temperature</div>
                    <div className="mt-1 font-mono text-xl font-medium">1391°C</div>
                  </div>
                  <div className="rounded-lg bg-background p-4">
                    <div className="text-sm text-muted-foreground">New Defect Risk</div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-xl font-medium text-green-500">
                      34% <span className="text-sm text-muted-foreground">(↓ from 91%)</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
                  <CheckCircle2 className="size-5" />
                  <div>
                    <span className="font-semibold">Physics Valid: Yes</span>
                    <span className="ml-2 text-primary/80">(cooling rate 1.83°C/min respects heat equation constraints)</span>
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/50 p-4 text-sm">
                  <span className="font-semibold">Recommendation:</span> Reduce pour speed to 0.68 m/s to align with new setpoint.
                </div>

                <div className="flex gap-3 pt-2">
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                    <CheckCircle2 className="size-4" /> Apply Change
                  </button>
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
                    <Save className="size-4" /> Save Scenario
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex h-[280px] flex-col items-center justify-center text-muted-foreground">
                {running ? (
                  <>
                    <RefreshCwIcon className="mb-4 size-8 animate-spin text-primary" />
                    <p>Solving physics constraints...</p>
                  </>
                ) : (
                  <p>Run a simulation to see results.</p>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">3D Simulation View</h2>
            <div className="relative flex h-[300px] items-center justify-center overflow-hidden rounded-lg bg-[#0B0F17]">
              {/* Fake 3D View Placeholder */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
              
              <div className="relative z-10 space-y-4 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary shadow-[0_0_30px_-10px_rgba(245,165,36,0.5)]">
                  <Flame className="size-8" />
                </div>
                <div className="space-y-1 font-mono text-sm text-muted-foreground">
                  <p>● 1400°C setpoint applied</p>
                  <p>● Cooling from 1479°C to 1391°C</p>
                  <p>● 6.2 hours until pour</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RefreshCwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
