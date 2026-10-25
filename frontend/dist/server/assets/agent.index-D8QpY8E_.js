import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { MessageSquare, ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
const cardVariantsLeft = {
  hidden: {
    opacity: 0,
    x: 60,
    rotate: -4,
    scale: 0.95
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
      delay: 0.1
    }
  }
};
const cardVariantsRight = {
  hidden: {
    opacity: 0,
    x: -60,
    rotate: 4,
    scale: 0.95
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
      delay: 0.2
    }
  }
};
function AgentHub() {
  const [customPrompt, setCustomPrompt] = useState("");
  const navigate = useNavigate();
  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    navigate({
      to: "/agent/rag"
    });
  };
  const handlePresetClick = (query, isPinn = false) => {
    if (isPinn) {
      navigate({
        to: "/agent/pinn"
      });
    } else {
      navigate({
        to: "/agent/rag"
      });
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-5xl px-5 py-12 lg:px-8", children: /* @__PURE__ */ jsxs(motion.div, { initial: {
    opacity: 0,
    y: 15
  }, animate: {
    opacity: 1,
    y: 0
  }, transition: {
    duration: 0.4,
    ease: "easeOut"
  }, children: [
    /* @__PURE__ */ jsx("div", { className: "mb-6 flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "inline-flex items-center rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-xs font-semibold text-foreground shadow-xs backdrop-blur-xs", children: "NEXUS Cognitive Foundry Intelligence" }) }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto mb-12 max-w-3xl text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "mb-4 font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground", children: "Hey! What would you like to do?" }),
      /* @__PURE__ */ jsx("p", { className: "text-base sm:text-lg text-muted-foreground leading-relaxed", children: "Select an AI assistant below to query plant manuals, inspect real-time sensor streams, or run predictive what-if physics simulations." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto mb-10 grid max-w-4xl gap-6 md:grid-cols-2", children: [
      /* @__PURE__ */ jsx(motion.div, { variants: cardVariantsLeft, initial: "hidden", animate: "visible", whileHover: {
        y: -6,
        scale: 1.015
      }, whileTap: {
        scale: 0.98
      }, className: "h-full", children: /* @__PURE__ */ jsxs("div", { className: "group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] p-8 shadow-xl transition-all duration-300 hover:border-[#ff6a00]/40 hover:shadow-[0_20px_40px_-15px_rgba(255,106,0,0.25)]", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("div", { className: "flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8a3800] to-[#ff6a00] text-white shadow-md", children: /* @__PURE__ */ jsx(MessageSquare, { className: "size-7" }) }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full border border-[#ff6a00]/30 bg-[#ff6a00]/10 px-3.5 py-1 text-xs font-semibold text-[#FFA033]", children: "RAG Assistant" })
          ] }),
          /* @__PURE__ */ jsx("h2", { className: "mb-2 text-2xl font-bold text-white", children: "1. Ask Anything" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-[#AAAAAA]", children: "Conversational search grounded in plant manuals, SOPs, historical maintenance logs, and live telemetry data." })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "my-6 border-t border-[#442211]" }),
          /* @__PURE__ */ jsxs(Link, { to: "/agent/rag", className: "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8a3800] to-[#ff6a00] py-3.5 px-6 text-sm font-semibold text-white transition-all shadow-md hover:brightness-110 active:scale-[0.99]", children: [
            "Launch Ask Anything",
            /* @__PURE__ */ jsx(ArrowRight, { className: "size-4 transition-transform group-hover:translate-x-1" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(motion.div, { variants: cardVariantsRight, initial: "hidden", animate: "visible", whileHover: {
        y: -6,
        scale: 1.015
      }, whileTap: {
        scale: 0.98
      }, className: "h-full", children: /* @__PURE__ */ jsxs("div", { className: "group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] p-8 shadow-xl transition-all duration-300 hover:border-[#ff6a00]/40 hover:shadow-[0_20px_40px_-15px_rgba(255,106,0,0.25)]", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("div", { className: "flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8a3800] to-[#ff6a00] text-white shadow-md", children: /* @__PURE__ */ jsx(Zap, { className: "size-7" }) }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full border border-[#ff6a00]/30 bg-[#ff6a00]/10 px-3.5 py-1 text-xs font-semibold text-[#FFA033]", children: "PINN Simulation" })
          ] }),
          /* @__PURE__ */ jsx("h2", { className: "mb-2 text-2xl font-bold text-white", children: "2. What-IF Simulation" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-[#AAAAAA]", children: "Physics-Informed Neural Network simulation for melt setpoints, green sand moisture, and pouring kinematics." })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "my-6 border-t border-[#442211]" }),
          /* @__PURE__ */ jsxs(Link, { to: "/agent/pinn", className: "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8a3800] to-[#ff6a00] py-3.5 px-6 text-sm font-semibold text-white transition-all shadow-md hover:brightness-110 active:scale-[0.99]", children: [
            "Launch What-IF Simulation",
            /* @__PURE__ */ jsx(ArrowRight, { className: "size-4 transition-transform group-hover:translate-x-1" })
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(motion.div, { initial: {
      opacity: 0,
      y: 20
    }, animate: {
      opacity: 1,
      y: 0
    }, transition: {
      duration: 0.5,
      delay: 0.3
    }, className: "mx-auto mt-12 max-w-3xl space-y-4", children: [
      /* @__PURE__ */ jsxs("form", { onSubmit: handlePromptSubmit, className: "relative flex items-center rounded-full border border-border bg-secondary/80 p-2 pl-6 shadow-xs transition-all focus-within:border-primary focus-within:bg-secondary focus-within:ring-1 focus-within:ring-primary", children: [
        /* @__PURE__ */ jsx("input", { type: "text", value: customPrompt, onChange: (e) => setCustomPrompt(e.target.value), placeholder: "Or type a custom question here to ask immediately...", className: "w-full bg-transparent pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" }),
        /* @__PURE__ */ jsx("button", { type: "submit", className: "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-[#FF7A00] active:scale-95", title: "Ask Question", children: /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-center gap-3 text-xs", children: [
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => handlePresetClick(), className: "flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-secondary/70 px-4 py-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground hover:shadow-xs active:scale-95", children: "Why is the furnace lining failing on Furnace 3?" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => handlePresetClick("Simulate a lower pour speed of 0.65 m/s", true), className: "flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-secondary/70 px-4 py-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground hover:shadow-xs active:scale-95", children: "Simulate a lower pour speed of 0.65 m/s" })
      ] })
    ] })
  ] }) });
}
export {
  AgentHub as component
};
