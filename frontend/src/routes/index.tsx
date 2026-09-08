import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Boxes,
  Brain,
  Cpu,
  Database,
  Droplets,
  Flame,
  Gauge,
  Layers,
  LineChart,
  Scan,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import { TwinVisual } from "@/components/three/TwinVisual";
import { Reveal, RevealWords } from "@/components/site/Reveal";
import { TWINS, TWIN_ORDER } from "@/lib/nexus-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEXUS-Foundry — Predictive Digital Twin Platform for Casting" },
      {
        name: "description",
        content:
          "NEXUS-Foundry connects melting, molding, pouring and quality into one cognitive digital twin that predicts failures 8–24h ahead and defects 15h before they happen.",
      },
      { property: "og:title", content: "NEXUS-Foundry — Predictive Casting Intelligence" },
      {
        property: "og:description",
        content: "Cross-stage digital twins, physics-validated what-if simulation and a cognitive RAG assistant for foundry operations.",
      },
    ],
  }),
  component: Landing,
});

const marquee = ["Melting", "Molding", "Pouring", "Quality", "Prediction", "Prevention", "Preservation"];

const twinIcon = { flame: Flame, layers: Layers, droplets: Droplets, scan: Scan } as const;

const stages = [
  { name: "Melting", icon: Flame, copy: "Charge, melt and hold. Lining health and anomaly signature tracked every 2 seconds." },
  { name: "Molding", icon: Layers, copy: "Green sand prepared and compacted. Moisture and permeability define porosity risk." },
  { name: "Pouring", icon: Droplets, copy: "Ladle transfer and pour. Inherits upstream risk from the melt within 2 seconds." },
  { name: "Quality", icon: Scan, copy: "Visual inspection classifies the casting and closes the learning loop." },
];

const novelty = [
  {
    icon: Waves,
    title: "Cross-Stage Correlation",
    copy: "Connecting furnace anomalies to casting defects 6+ hours before the pour ever happens.",
  },
  {
    icon: ShieldCheck,
    title: "Physics-Validated What-If",
    copy: "PINN simulation constrained by the heat equation, so every suggestion is physically possible.",
  },
  {
    icon: Brain,
    title: "Triple-Source RAG",
    copy: "Manuals, live twin state and model outputs combined into one cited, plain-language answer.",
  },
];

const future = [
  "Quality Twin full backend integration",
  "Native mobile app with sub-500ms push alerts",
  "Multi-foundry, multi-plant deployment",
  "Advanced casting image augmentation pipeline",
];

const tools = [
  { icon: Cpu, group: "Backend", items: ["FastAPI", "Python", "PyTorch", "TensorFlow"] },
  { icon: LineChart, group: "Frontend", items: ["React", "Three.js", "Tailwind CSS", "Recharts"] },
  { icon: Database, group: "Data", items: ["InfluxDB", "PostgreSQL", "ChromaDB", "Redis"] },
  { icon: Boxes, group: "Deployment", items: ["Docker", "Kubernetes", "Kafka", "MQTT"] },
];

const metrics = [
  { v: "8–24h", l: "Failure lead time" },
  { v: "15h+", l: "Defect foresight" },
  { v: "<2s", l: "Cross-stage warning" },
  { v: ">0.87", l: "Defect F1 score" },
];

function WaveField() {
  return (
    <svg className="absolute inset-0 h-[120%] w-full opacity-15 mix-blend-screen" preserveAspectRatio="none" viewBox="0 0 1200 600" aria-hidden>
      <defs>
        <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF7A00" stopOpacity="0" />
          <stop offset="15%" stopColor="#FF7A00" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#FF7A00" stopOpacity="0.8" />
          <stop offset="85%" stopColor="#FF7A00" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FF7A00" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      <motion.g
        animate={{ x: [0, -1200] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        {Array.from({ length: 30 }).map((_, i) => {
          const yOffset = 250 + i * 12;
          const amplitude = 50 + i * 3;

          return (
            <path
              key={i}
              d={`M 0 ${yOffset} Q 300 ${yOffset - amplitude} 600 ${yOffset} T 1200 ${yOffset} T 1800 ${yOffset} T 2400 ${yOffset}`}
              fill="none"
              stroke="url(#wave-grad)"
              strokeWidth={1 + i * 0.05}
            />
          );
        })}
      </motion.g>
    </svg>
  );
}

function Landing() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0C0603]">
        {/* Studio Lighting Effects */}
        <div className="pointer-events-none absolute inset-0">
          {/* Bottom center glow */}
          <div className="absolute -bottom-48 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-[100%] bg-[#FF6A00]/25 blur-[120px]" />
          {/* Top left glow */}
          <div className="absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-[#FF8A00]/15 blur-[130px]" />
          {/* Top right glow */}
          <div className="absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full bg-[#FF8A00]/15 blur-[130px]" />
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <WaveField />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-20 lg:px-8 lg:pb-32 lg:pt-32">
          <motion.p
            className="eyebrow text-[#FFA033]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Cognitive digital twin platform
          </motion.p>

          <h1 className="mt-6 max-w-5xl text-[clamp(2.6rem,7vw,5.4rem)] font-medium leading-[1.05] tracking-tight text-white">
            <RevealWords text="AI-powered digital twins for" />{" "}
            <span className="text-[#FF7A00]">
              <RevealWords text="foundry operations" />
            </span>
          </h1>

          <div className="mt-14 grid items-end gap-10 lg:grid-cols-[1fr_1.05fr]">
            <Reveal delay={0.15}>
              <p className="max-w-md text-lg text-[#BBBBBB] leading-relaxed">
                Predict, Prevent, Preserve — making foundry data speak. NEXUS-Foundry links melting, molding, pouring
                and quality into one live, event-driven brain.
              </p>
              <div className="mt-8 h-px w-full max-w-md bg-[#442211]" />
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#FFFFFF] to-[#E7DBB8] py-3.5 pl-6 pr-4 text-sm font-semibold text-black shadow-[0_0_20px_rgba(250,246,238,0.15)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(250,246,238,0.3)]"
                >
                  Open Live Dashboard
                  <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/agent/rag"
                  className="inline-flex items-center gap-3 rounded-full border border-[#FAF6EE]/40 bg-[#110804] py-3.5 pl-5 pr-6 text-sm font-medium text-white transition-colors hover:border-[#FAF6EE] hover:bg-[#1a0c06]"
                >
                  <Sparkles className="size-4 text-[#FF7A00]" /> Ask the assistant
                </Link>
              </div>
            </Reveal>

          </div>

          <Reveal delay={0.3} className="mt-16">
            <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((m) => (
                <div key={m.l} className="bg-surface px-6 py-6">
                  <p className="font-mono text-2xl text-primary">{m.v}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{m.l}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="overflow-hidden border-y border-[#e4d5ad] bg-[#FAF6EE] py-6">
        <div className="flex w-max marquee-track">
          {[0, 1].map((rep) => (
            <div key={rep} className="flex items-center">
              {marquee.map((m) => (
                <span key={`${rep}-${m}`} className="flex items-center gap-8 px-8 text-2xl font-medium text-black">
                  {m}
                  <span className="size-1.5 rotate-45 bg-black" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT DIGITAL TWINS */}
      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <Reveal>
          <p className="eyebrow">About digital twins</p>
          <h2 className="mt-5 max-w-4xl text-[clamp(1.9rem,4vw,3.2rem)] font-medium leading-[1.06]">
            A digital twin is a living virtual replica of your physical asset. It updates in real time, remembers
            history, and <span className="text-primary">predicts future behaviour.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {TWIN_ORDER.map((id, i) => {
            const t = TWINS[id];
            const Icon = twinIcon[t.icon as keyof typeof twinIcon];
            return (
              <Reveal key={id} delay={i * 0.08} className={cn("relative h-full", i % 2 !== 0 ? "lg:translate-y-12" : "")}>
                <Link
                  to="/twins/$twin"
                  params={{ twin: id }}
                  className="group relative flex h-[380px] flex-col justify-between rounded-2xl p-[2px] transition-all hover:-translate-y-2"
                >
                  <div className="absolute inset-0 rounded-2xl border border-border transition-colors duration-300 group-hover:border-transparent group-hover:bg-gradient-to-br group-hover:from-[#8a3800] group-hover:to-[#ff6a00]" />
                  <div className="relative z-10 flex h-full flex-col justify-between rounded-[14px] bg-gradient-to-br from-[#f8efe0] to-[#e4d5ad] p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="size-6" />
                        </span>
                        {t.comingSoon && (
                          <span className="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-warning">
                            Coming soon
                          </span>
                        )}
                      </div>
                      <h3 className="mt-8 text-2xl font-medium">{t.name}</h3>
                      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{t.blurb}</p>
                    </div>
                    <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      Open twin <ArrowUpRight className="size-4" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* FOUNDRY PROCESS */}
      <section className="border-y border-[#333333] bg-[#111111] text-[#F4E9CD] overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <Reveal>
            <p className="eyebrow text-[#AAAAAA]">The foundry process</p>
            <h2 className="mt-5 max-w-2xl text-[clamp(1.8rem,3.4vw,2.8rem)] font-medium leading-tight text-white">
              Four stages, one continuous signal path
            </h2>
          </Reveal>

          <div className="relative mt-16">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-[#333333] lg:block overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                whileInView={{ x: "100%" }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="h-full w-1/2 bg-gradient-to-r from-transparent via-[#ff6a00] to-transparent"
              />
            </div>
            <div className="grid gap-8 lg:grid-cols-4">
              {stages.map((s, i) => (
                <Reveal key={s.name} delay={i * 0.2} className="relative">
                  <div className="flex items-center gap-3">
                    <motion.span 
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.2 + 0.3, type: "spring" }}
                      className="relative z-10 flex size-12 items-center justify-center rounded-full border border-[#ff6a00]/40 bg-[#111111] text-[#ff6a00]"
                    >
                      <s.icon className="size-5" />
                    </motion.span>
                    <span className="font-mono text-xs text-[#888888]">0{i + 1}</span>
                    {i < 3 && <span className="ml-auto hidden h-px flex-1 bg-[#ff6a00]/40 flow-line lg:block" />}
                  </div>
                  <h3 className="mt-6 text-lg font-medium text-white">{s.name}</h3>
                  <p className="mt-2 max-w-xs text-sm text-[#AAAAAA]">{s.copy}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NOVELTY */}
      <section className="relative py-24 lg:py-32">
        {/* Center Text (Sticky on Desktop) */}
        <div className="lg:sticky lg:top-[30%] z-0 mx-auto max-w-lg text-center px-5 mb-16 lg:mb-0">
          <Reveal>
            <p className="eyebrow mx-auto text-[#8a3800]">Project novelty</p>
            <h2 className="mt-5 text-[clamp(2rem,3.5vw,3rem)] font-medium leading-[1.1]">
              What makes it different from a plain monitoring dashboard
            </h2>
            <p className="mx-auto mt-6 text-[15px] leading-relaxed text-muted-foreground">
              Most systems tell you what already broke. NEXUS-Foundry connects the stages so a furnace signature at
              09:40 becomes a pour decision at 14:48.
            </p>
          </Reveal>
        </div>

        {/* Floating Cards */}
        <div className="relative z-10 mx-auto max-w-7xl px-5 pb-16 lg:pb-48 lg:pt-[30vh]">
          <div className="flex flex-col gap-12 lg:gap-64">
            {novelty.map((n, i) => (
              <Reveal key={n.title} delay={0.1} className={cn("w-full lg:max-w-[340px]", i % 2 === 0 ? "lg:mr-auto" : "lg:ml-auto")}>
                <div className="group flex flex-col justify-between min-h-[420px] rounded-none border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] p-10 text-[#F4E9CD] shadow-2xl transition-all duration-700 hover:-translate-y-4 hover:shadow-[0_20px_40px_-15px_rgba(255,106,0,0.2)]">
                  <span className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#8a3800] to-[#ff6a00] text-white">
                    <n.icon className="size-6" />
                  </span>
                  <div className="mt-8">
                    <h3 className="text-2xl font-medium text-white">{n.title}</h3>
                    <p className="mt-4 text-[15px] leading-relaxed text-[#AAAAAA]">{n.copy}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FUTURE ENHANCEMENTS */}
      <section className="border-t border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <Reveal className="max-w-3xl">
            <p className="eyebrow">Future enhancements</p>
            <h2 className="mt-5 text-[clamp(1.7rem,3vw,2.4rem)] font-medium leading-tight">Where the platform goes next</h2>
            <ul className="mt-8 divide-y divide-border border-y border-border">
              {future.map((f, i) => (
                <li key={f} className="flex items-center gap-4 py-4">
                  <span className="font-mono text-xs text-primary">0{i + 1}</span>
                  <span className="text-sm text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* TOOLS USED */}
      <section className="relative overflow-hidden border-t border-border bg-[#F4E9CD] py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#8a3800]/30 bg-[#8a3800]/10 px-4 py-1.5 text-sm font-medium text-[#8a3800] shadow-sm">
              <span className="size-1.5 rotate-45 bg-[#8a3800]" /> Integration
            </span>
            <h2 className="mx-auto mt-6 max-w-3xl text-[clamp(2.5rem,5vw,4.5rem)] font-medium leading-[1.05] tracking-tight text-[#111111]">
              Works with the tools you already use.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-[#555555] leading-relaxed">
              Connect your databases, message brokers, and infrastructure — so everything stays in sync, without extra effort.
            </p>
          </Reveal>

          {/* Orbital Animation Container */}
          <div className="relative mx-auto mt-20 flex h-[400px] w-full max-w-[800px] items-center justify-center lg:h-[600px]">
            {/* Outer dotted ring */}
            <div className="absolute size-[300px] rounded-full border border-dashed border-black/40 lg:size-[600px]" />
            {/* Inner dotted ring */}
            <div className="absolute size-[200px] rounded-full border border-dashed border-black/40 lg:size-[400px]" />
            
            {/* Outer Orbiting Container */}
            <div className="absolute size-[300px] animate-[spin_40s_linear_infinite] lg:size-[600px]">
              {/* Icon 1: Influx (Top) */}
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                <div className="flex size-16 items-center justify-center rounded-2xl border border-[#eeeeee] bg-white shadow-xl animate-[spin_40s_linear_infinite_reverse] lg:size-24 lg:rounded-3xl">
                  <img src="/influx.png" alt="Influx" className="size-10 object-contain lg:size-14" />
                </div>
              </div>
              
              {/* Icon 2: Postgres (Bottom Right) */}
              <div className="absolute left-[85.3%] top-[85.3%] -translate-x-1/2 -translate-y-1/2">
                <div className="flex size-16 items-center justify-center rounded-2xl border border-[#eeeeee] bg-white shadow-xl animate-[spin_40s_linear_infinite_reverse] lg:size-24 lg:rounded-3xl">
                  <img src="/postgres.png" alt="Postgres" className="size-10 object-contain lg:size-14" />
                </div>
              </div>

              {/* Icon 3: Purple Tool (Bottom Left) */}
              <div className="absolute left-[14.7%] top-[85.3%] -translate-x-1/2 -translate-y-1/2">
                <div className="flex size-16 items-center justify-center rounded-2xl border border-[#eeeeee] bg-white shadow-xl animate-[spin_40s_linear_infinite_reverse] lg:size-24 lg:rounded-3xl">
                  <img src="/purple.png" alt="Tool" className="size-10 object-contain lg:size-14" />
                </div>
              </div>
            </div>

            {/* Inner Orbiting Container */}
            <div className="absolute size-[200px] animate-[spin_30s_linear_infinite_reverse] lg:size-[400px]">
              {/* Icon 1: Right Top (72 deg) */}
              <div className="absolute left-[97.5%] top-[34.5%] -translate-x-1/2 -translate-y-1/2">
                <div className="flex size-12 items-center justify-center rounded-xl border border-[#eeeeee] bg-white shadow-lg animate-[spin_30s_linear_infinite] lg:size-16 lg:rounded-2xl">
                  <img src="/inner1.png" alt="Tool 1" className="size-8 object-contain lg:size-10" />
                </div>
              </div>
              
              {/* Icon 2: Right Bottom (144 deg) */}
              <div className="absolute left-[79.4%] top-[90.4%] -translate-x-1/2 -translate-y-1/2">
                <div className="flex size-12 items-center justify-center rounded-xl border border-[#eeeeee] bg-white shadow-lg animate-[spin_30s_linear_infinite] lg:size-16 lg:rounded-2xl">
                  <img src="/inner2.png" alt="Tool 2" className="size-8 object-contain lg:size-10" />
                </div>
              </div>

              {/* Icon 3: Left Bottom (216 deg) */}
              <div className="absolute left-[20.6%] top-[90.4%] -translate-x-1/2 -translate-y-1/2">
                <div className="flex size-12 items-center justify-center rounded-xl border border-[#eeeeee] bg-white shadow-lg animate-[spin_30s_linear_infinite] lg:size-16 lg:rounded-2xl">
                  <img src="/inner3.png" alt="Tool 3" className="size-8 object-contain lg:size-10" />
                </div>
              </div>

              {/* Icon 4: Left Top (288 deg) */}
              <div className="absolute left-[2.5%] top-[34.5%] -translate-x-1/2 -translate-y-1/2">
                <div className="flex size-12 items-center justify-center rounded-xl border border-[#eeeeee] bg-white shadow-lg animate-[spin_30s_linear_infinite] lg:size-16 lg:rounded-2xl">
                  <img src="/inner4.png" alt="Tool 4" className="size-8 object-contain lg:size-10" />
                </div>
              </div>

              {/* Icon 5: Top Center (0 deg) */}
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                <div className="flex size-12 items-center justify-center rounded-xl border border-[#eeeeee] bg-white shadow-lg animate-[spin_30s_linear_infinite] lg:size-16 lg:rounded-2xl">
                  <img src="/inner5.png" alt="Grafana" className="size-8 object-contain lg:size-10" />
                </div>
              </div>
            </div>

            {/* Center Logo */}
            <div className="absolute z-10 flex size-20 items-center justify-center rounded-2xl border border-[#eeeeee] bg-white shadow-2xl lg:size-32 lg:rounded-[2rem]">
              <img src="/logo.png" alt="Nexus Foundry" className="size-12 object-contain lg:size-20" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] px-8 py-16 text-center shadow-2xl lg:px-16">
            <div className="pointer-events-none absolute inset-0 grid-lines opacity-10" />
            <div className="relative">
              <Gauge className="mx-auto size-8 text-[#ff6a00]" />
              <h2 className="mx-auto mt-6 max-w-3xl text-[clamp(1.9rem,4vw,3rem)] font-medium leading-tight text-white">
                Stop managing scrap. Start preventing it.
              </h2>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-md bg-[#FF6A00] px-6 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,106,0,0.4)]"
                >
                  Live Dashboard <ArrowUpRight className="size-4" />
                </Link>
                <Link
                  to="/agent/pinn"
                  className="inline-flex items-center gap-2 rounded-md border border-[#442211] bg-[#110804] px-6 py-3 text-sm text-white transition-colors hover:border-[#FF6A00]/50 hover:bg-[#1a0c06]"
                >
                  Run a what-if simulation
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
