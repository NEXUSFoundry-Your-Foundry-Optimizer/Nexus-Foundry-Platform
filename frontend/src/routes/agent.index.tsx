import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MessageSquare, Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export const Route = createFileRoute("/agent/")({
  component: AgentHub,
});

const cardVariantsLeft = {
  hidden: {
    opacity: 0,
    x: 60,
    rotate: -4,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    rotate: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 50,
      damping: 18,
      mass: 1.2,
      delay: 0.1,
    },
  },
};

const cardVariantsRight = {
  hidden: {
    opacity: 0,
    x: -60,
    rotate: 4,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    rotate: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 50,
      damping: 18,
      mass: 1.2,
      delay: 0.2,
    },
  },
};

function AgentHub() {
  const [customPrompt, setCustomPrompt] = useState("");
  const navigate = useNavigate();

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    navigate({ to: "/agent/rag" });
  };

  const handlePresetClick = (query: string, isPinn = false) => {
    if (isPinn) {
      navigate({ to: "/agent/pinn" });
    } else {
      navigate({ to: "/agent/rag" });
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Top Badge */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-xs font-semibold text-foreground shadow-xs backdrop-blur-xs">
            NEXUS Cognitive Foundry Intelligence
          </div>
        </div>

        {/* Main Title & Subtitle */}
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h1 className="mb-4 font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
            Hey! What would you like to do?
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Select an AI assistant below to query plant manuals, inspect real-time sensor streams, or run predictive what-if physics simulations.
          </p>
        </div>

        {/* Two Cards Grid */}
        <div className="mx-auto mb-10 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Card 1: Ask Anything */}
          <motion.div
            variants={cardVariantsLeft}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -6, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            className="h-full"
          >
            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] p-8 shadow-xl transition-all duration-300 hover:border-[#ff6a00]/40 hover:shadow-[0_20px_40px_-15px_rgba(255,106,0,0.25)]">
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8a3800] to-[#ff6a00] text-white shadow-md">
                    <MessageSquare className="size-7" />
                  </div>
                  <span className="rounded-full border border-[#ff6a00]/30 bg-[#ff6a00]/10 px-3.5 py-1 text-xs font-semibold text-[#FFA033]">
                    RAG Assistant
                  </span>
                </div>

                <h2 className="mb-2 text-2xl font-bold text-white">
                  1. Ask Anything
                </h2>
                <p className="text-sm leading-relaxed text-[#AAAAAA]">
                  Conversational search grounded in plant manuals, SOPs, historical maintenance logs, and live telemetry data.
                </p>
              </div>

              <div>
                <div className="my-6 border-t border-[#442211]" />
                <Link
                  to="/agent/rag"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8a3800] to-[#ff6a00] py-3.5 px-6 text-sm font-semibold text-white transition-all shadow-md hover:brightness-110 active:scale-[0.99]"
                >
                  Launch Ask Anything
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Card 2: What-IF Simulation */}
          <motion.div
            variants={cardVariantsRight}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -6, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            className="h-full"
          >
            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] p-8 shadow-xl transition-all duration-300 hover:border-[#ff6a00]/40 hover:shadow-[0_20px_40px_-15px_rgba(255,106,0,0.25)]">
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8a3800] to-[#ff6a00] text-white shadow-md">
                    <Zap className="size-7" />
                  </div>
                  <span className="rounded-full border border-[#ff6a00]/30 bg-[#ff6a00]/10 px-3.5 py-1 text-xs font-semibold text-[#FFA033]">
                    PINN Simulation
                  </span>
                </div>

                <h2 className="mb-2 text-2xl font-bold text-white">
                  2. What-IF Simulation
                </h2>
                <p className="text-sm leading-relaxed text-[#AAAAAA]">
                  Physics-Informed Neural Network simulation for melt setpoints, green sand moisture, and pouring kinematics.
                </p>
              </div>

              <div>
                <div className="my-6 border-t border-[#442211]" />
                <Link
                  to="/agent/pinn"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8a3800] to-[#ff6a00] py-3.5 px-6 text-sm font-semibold text-white transition-all shadow-md hover:brightness-110 active:scale-[0.99]"
                >
                  Launch What-IF Simulation
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Prompt Bar & Suggestion Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mx-auto mt-12 max-w-3xl space-y-4"
        >
          <form
            onSubmit={handlePromptSubmit}
            className="relative flex items-center rounded-full border border-border bg-secondary/80 p-2 pl-6 shadow-xs transition-all focus-within:border-primary focus-within:bg-secondary focus-within:ring-1 focus-within:ring-primary"
          >
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Or type a custom question here to ask immediately..."
              className="w-full bg-transparent pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="submit"
              className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-[#FF7A00] active:scale-95"
              title="Ask Question"
            >
              <ArrowRight className="size-4" />
            </button>
          </form>

          {/* Preset Query Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => handlePresetClick("Why is the furnace lining failing on Furnace 3?")}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-secondary/70 px-4 py-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground hover:shadow-xs active:scale-95"
            >
              Why is the furnace lining failing on Furnace 3?
            </button>
            <button
              type="button"
              onClick={() => handlePresetClick("Simulate a lower pour speed of 0.65 m/s", true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-secondary/70 px-4 py-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground hover:shadow-xs active:scale-95"
            >
              Simulate a lower pour speed of 0.65 m/s
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}



