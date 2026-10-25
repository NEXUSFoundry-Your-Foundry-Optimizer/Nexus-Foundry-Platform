import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { History, Plus, PanelLeftClose, MessageSquare, Trash2, PanelLeftOpen, Database, Download, RefreshCw, Bot, Activity, Image, Brain, ChevronUp, ChevronDown, Paperclip, FileText, Check, Copy, VolumeX, Volume2, ThumbsUp, ThumbsDown, User, X, Flame, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { c as cn, p as postJson } from "./router-C2feh6VC.js";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "clsx";
import "tailwind-merge";
import "sonner";
const sampleThermalScanUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360"><defs><radialGradient id="hotspot" cx="45%" cy="40%" r="55%"><stop offset="0%" stop-color="%23FFFFFF"/><stop offset="20%" stop-color="%23FFF200"/><stop offset="45%" stop-color="%23FF5500"/><stop offset="70%" stop-color="%23990033"/><stop offset="100%" stop-color="%231A0022"/></radialGradient><linearGradient id="irGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23001133"/><stop offset="35%" stop-color="%23440066"/><stop offset="70%" stop-color="%23CC3300"/><stop offset="100%" stop-color="%23FFEE00"/></linearGradient></defs><rect width="600" height="360" fill="url(%23irGrad)"/><circle cx="280" cy="160" r="110" fill="url(%23hotspot)" opacity="0.95"/><path d="M 120 180 Q 280 120 460 210" stroke="%23FFFFFF" stroke-width="1.5" stroke-dasharray="4 4" fill="none" opacity="0.6"/><circle cx="280" cy="160" r="5" fill="%23FFFFFF"/><line x1="260" y1="160" x2="300" y2="160" stroke="%23FFFFFF" stroke-width="1.5"/><line x1="280" y1="140" x2="280" y2="180" stroke="%23FFFFFF" stroke-width="1.5"/><rect x="15" y="15" width="220" height="68" rx="8" fill="rgba(0,0,0,0.75)"/><text x="25" y="36" fill="%23FFFFFF" font-family="monospace" font-size="13" font-weight="bold">IR THERMAL TELEMETRY</text><text x="25" y="54" fill="%23FF7A00" font-family="monospace" font-size="12">Hotspot: 1,614.8°C</text><text x="25" y="70" fill="%23AAAAAA" font-family="monospace" font-size="10">Zone B Lining Degradation</text></svg>`;
const quickPromptSuggestions = [{
  label: "Analyze Furnace 3 Lining",
  query: "Why is the lining failing on Furnace 3?"
}, {
  label: "Ladle Pouring Temp Delta",
  query: "Did Ladle #4 experience a temperature drop during transfer?"
}, {
  label: "Molding Sand Moisture Spike",
  query: "What is causing the permeability drop on molding line 2?"
}, {
  label: "Check ASTM E1934 SOP",
  query: "What are the ASTM E1934 criteria for refractory thermal sweeps?"
}];
function RAGPage() {
  const [conversations, setConversations] = useState([{
    id: "live-session",
    title: "Live Foundry Session",
    updatedAt: "Now",
    context: {
      furnace: "Live furnace",
      batch: "Live batch",
      status: "normal"
    },
    messages: []
  }]);
  const [activeConvId, setActiveConvId] = useState("live-session");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState({
    "2": false
  });
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nexus_rag_conversations");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed);
          setActiveConvId(parsed[0].id);
        }
      }
    } catch {
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_rag_conversations", JSON.stringify(conversations));
    }
  }, [conversations]);
  const currentConversation = conversations.find((c) => c.id === activeConvId) || conversations[0];
  useEffect(() => {
    var _a;
    (_a = chatBottomRef.current) == null ? void 0 : _a.scrollIntoView({
      behavior: "smooth"
    });
  }, [currentConversation == null ? void 0 : currentConversation.messages, isTyping]);
  const handleStartNewConversation = () => {
    const newId = `conv-${Date.now()}`;
    const newConv = {
      id: newId,
      title: "New Plant Inquiry",
      updatedAt: "Just now",
      context: {
        furnace: "Furnace 3",
        batch: "CB-001",
        status: "normal"
      },
      messages: []
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newId);
    setInput("");
    setAttachedImage(null);
  };
  const handleDeleteConversation = (e, convId) => {
    e.stopPropagation();
    if (conversations.length <= 1) {
      handleStartNewConversation();
      return;
    }
    const updated = conversations.filter((c) => c.id !== convId);
    setConversations(updated);
    if (activeConvId === convId) {
      setActiveConvId(updated[0].id);
    }
  };
  const handleImageUpload = (e) => {
    var _a;
    const file = (_a = e.target.files) == null ? void 0 : _a[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      var _a2;
      if (typeof ((_a2 = event.target) == null ? void 0 : _a2.result) === "string") {
        setAttachedImage({
          url: event.target.result,
          name: file.name
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const handleAttachSampleThermalImage = () => {
    setAttachedImage({
      url: sampleThermalScanUrl,
      name: "Furnace_3_Thermal_IR_Sweep.svg"
    });
  };
  const handleCopyMessage = (msgId, content) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2e3);
  };
  const handleToggleSpeech = (msgId, text) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingMsgId(msgId);
  };
  const handleFeedback = (msgId, type) => {
    setConversations((prev) => prev.map((c) => {
      if (c.id === activeConvId) {
        return {
          ...c,
          messages: c.messages.map((m) => {
            if (m.id === msgId) {
              return {
                ...m,
                feedback: m.feedback === type ? null : type
              };
            }
            return m;
          })
        };
      }
      return c;
    }));
  };
  const handleContextChange = (field, val) => {
    setConversations((prev) => prev.map((c) => {
      if (c.id === activeConvId) {
        return {
          ...c,
          context: {
            ...c.context,
            [field]: val
          }
        };
      }
      return c;
    }));
  };
  const handleExportChat = () => {
    const reportText = `NEXUS COGNITIVE FOUNDRY INTELLIGENCE - AUDIT LOG
Session: ${currentConversation.title}
Context: ${currentConversation.context.furnace} | Batch: ${currentConversation.context.batch}
Export Date: ${(/* @__PURE__ */ new Date()).toISOString()}
======================================================

` + currentConversation.messages.map((m) => `[${m.timestamp || "TIME"}] ${m.role.toUpperCase()}:
${m.content}
${m.sources ? `
Sources Cited:
` + m.sources.map((s) => `- ${s.name} (${s.relevance}%)`).join("\n") : ""}
------------------------------------------------------`).join("\n\n");
    const blob = new Blob([reportText], {
      type: "text/plain;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentConversation.title.replace(/\s+/g, "_")}_transcript.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const handleSend = async (e, directPrompt) => {
    if (e) e.preventDefault();
    const queryToSend = directPrompt !== void 0 ? directPrompt : input;
    if (!queryToSend.trim() && !attachedImage) return;
    const userText = queryToSend.trim();
    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: userText || "Analyzed attached thermal inspection image for structural defects.",
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      ...attachedImage ? {
        imageUrl: attachedImage.url,
        imageName: attachedImage.name
      } : {}
    };
    setConversations((prev) => prev.map((c) => {
      if (c.id === activeConvId) {
        const isFirstMessage = c.messages.length === 0;
        return {
          ...c,
          title: isFirstMessage ? userText.slice(0, 36) || (attachedImage ? `Inspect ${attachedImage.name}` : "Process Query") : c.title,
          updatedAt: "Just now",
          messages: [...c.messages, userMsg]
        };
      }
      return c;
    }));
    setInput("");
    setAttachedImage(null);
    setIsTyping(true);
    try {
      const response = await postJson("/api/v1/chat", {
        message: userMsg.content,
        batch_id: (currentConversation == null ? void 0 : currentConversation.context.batch) ?? "latest"
      });
      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer,
        timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        }),
        ...response.sources ? {
          sources: response.sources
        } : {}
      };
      setConversations((prev) => prev.map((c) => c.id === activeConvId ? {
        ...c,
        messages: [...c.messages, botMsg]
      } : c));
    } catch (error) {
      setConversations((prev) => prev.map((c) => c.id === activeConvId ? {
        ...c,
        messages: [...c.messages, {
          id: String(Date.now() + 1),
          role: "assistant",
          content: error instanceof Error ? error.message : "RAG request failed",
          timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        }]
      } : c));
    } finally {
      setIsTyping(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "relative flex h-[calc(100vh-4rem)] flex-col bg-[#F4E9CD] text-[#111111] overflow-hidden", children: [
    /* @__PURE__ */ jsx("input", { type: "file", ref: fileInputRef, onChange: handleImageUpload, accept: "image/*", className: "hidden" }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 mx-auto flex w-full max-w-7xl flex-1 gap-5 p-4 md:p-6 lg:p-8 overflow-hidden", children: [
      /* @__PURE__ */ jsx(AnimatePresence, { children: isSidebarOpen && /* @__PURE__ */ jsxs(motion.aside, { initial: {
        opacity: 0,
        x: -30,
        width: 0
      }, animate: {
        opacity: 1,
        x: 0,
        width: 280
      }, exit: {
        opacity: 0,
        x: -30,
        width: 0
      }, transition: {
        duration: 0.25,
        ease: "easeOut"
      }, className: "flex shrink-0 flex-col overflow-hidden rounded-2xl border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] p-4 shadow-2xl backdrop-blur-md text-white", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between border-b border-[#442211]/80 pb-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-bold text-white", children: [
            /* @__PURE__ */ jsx(History, { className: "size-4 text-[#FF7A00]" }),
            "Chat History"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxs("button", { onClick: handleStartNewConversation, className: "flex items-center gap-1 rounded-lg border border-[#442211] bg-[#140a05] px-2.5 py-1 text-xs font-medium text-[#FFA033] transition-all hover:border-[#ff6a00]/50 hover:bg-[#201007] active:scale-95", title: "Start a new conversation", children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-3.5" }),
              "New"
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: () => setIsSidebarOpen(false), className: "flex size-7 items-center justify-center rounded-lg border border-[#442211] bg-[#140a05] text-[#FFA033] transition-colors hover:border-[#ff6a00]/50 hover:bg-[#201007]", title: "Collapse History", children: /* @__PURE__ */ jsx(PanelLeftClose, { className: "size-4" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 space-y-2 overflow-y-auto pr-1 text-xs scrollbar-thin", children: conversations.map((conv) => {
          const isActive = conv.id === activeConvId;
          return /* @__PURE__ */ jsxs("div", { onClick: () => setActiveConvId(conv.id), className: cn("group relative flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition-all", isActive ? "border-[#ff6a00]/60 bg-gradient-to-r from-[#8a3800]/40 to-[#ff6a00]/15 text-white shadow-md" : "border-[#442211]/60 bg-[#140a05]/60 text-[#AAAAAA] hover:border-[#ff6a00]/30 hover:bg-[#201007] hover:text-white"), children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2.5 overflow-hidden", children: [
              /* @__PURE__ */ jsx(MessageSquare, { className: cn("mt-0.5 size-3.5 shrink-0", isActive ? "text-[#FF7A00]" : "text-[#777777]") }),
              /* @__PURE__ */ jsxs("div", { className: "overflow-hidden", children: [
                /* @__PURE__ */ jsx("p", { className: "truncate font-medium leading-tight", children: conv.title }),
                /* @__PURE__ */ jsx("span", { className: "mt-1 block text-[10px] text-[#777777]", children: conv.updatedAt })
              ] })
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: (e) => handleDeleteConversation(e, conv.id), className: "opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100 p-1", title: "Delete conversation", children: /* @__PURE__ */ jsx(Trash2, { className: "size-3" }) })
          ] }, conv.id);
        }) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 border-t border-[#442211]/80 pt-3 text-[11px] text-[#888888] flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            conversations.length,
            " sessions stored"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-[#FFA033] font-mono text-[10px]", children: [
            /* @__PURE__ */ jsx("span", { className: "inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse" }),
            "Llama-3 Grounded"
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-1 flex-col overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] px-4 py-3 text-xs text-white shadow-lg", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
            !isSidebarOpen && /* @__PURE__ */ jsx("button", { onClick: () => setIsSidebarOpen(true), className: "flex size-7 items-center justify-center rounded-lg border border-[#442211] bg-[#140a05] text-[#FFA033] shadow-xs transition-colors hover:border-[#ff6a00]/50 hover:bg-[#201007]", title: "Open Chat History", children: /* @__PURE__ */ jsx(PanelLeftOpen, { className: "size-3.5" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 font-medium text-[#FF7A00]", children: [
              /* @__PURE__ */ jsx(Database, { className: "size-3.5" }),
              /* @__PURE__ */ jsx("span", { children: "Active Context:" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxs("select", { value: currentConversation.context.furnace, onChange: (e) => handleContextChange("furnace", e.target.value), className: "cursor-pointer rounded-md border border-[#442211] bg-[#140a05] px-2.5 py-1 text-[#F4E9CD] font-mono text-xs focus:border-[#FF7A00] focus:outline-none", title: "Switch Active Foundry Unit", children: [
                /* @__PURE__ */ jsx("option", { value: "Furnace 3", children: "Furnace 3" }),
                /* @__PURE__ */ jsx("option", { value: "Furnace 1", children: "Furnace 1" }),
                /* @__PURE__ */ jsx("option", { value: "Ladle Station 2", children: "Ladle Station 2" }),
                /* @__PURE__ */ jsx("option", { value: "Molding Line 2", children: "Molding Line 2" }),
                /* @__PURE__ */ jsx("option", { value: "Pouring Bay A", children: "Pouring Bay A" })
              ] }),
              /* @__PURE__ */ jsxs("select", { value: currentConversation.context.batch, onChange: (e) => handleContextChange("batch", e.target.value), className: "cursor-pointer rounded-md border border-[#442211] bg-[#140a05] px-2.5 py-1 text-[#F4E9CD] font-mono text-xs focus:border-[#FF7A00] focus:outline-none", title: "Switch Batch ID", children: [
                /* @__PURE__ */ jsx("option", { value: "CB-001", children: "Batch: CB-001" }),
                /* @__PURE__ */ jsx("option", { value: "CB-002", children: "Batch: CB-002" }),
                /* @__PURE__ */ jsx("option", { value: "CB-004", children: "Batch: CB-004" }),
                /* @__PURE__ */ jsx("option", { value: "ML-892", children: "Batch: ML-892" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 rounded-md border border-[#442211] bg-[#140a05] px-2.5 py-1 text-[#F4E9CD]", children: [
                "Status:",
                " ",
                /* @__PURE__ */ jsx("span", { className: cn("inline-block size-2 rounded-full", currentConversation.context.status === "alert" ? "bg-red-500 animate-pulse" : currentConversation.context.status === "warning" ? "bg-amber-400" : "bg-emerald-400") })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("button", { onClick: handleExportChat, className: "flex items-center gap-1 rounded-lg border border-[#442211] bg-[#140a05] px-2.5 py-1.5 text-xs font-medium text-[#AAAAAA] transition-all hover:border-[#ff6a00]/50 hover:text-white active:scale-95", title: "Download transcript report", children: [
              /* @__PURE__ */ jsx(Download, { className: "size-3" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Export Log" })
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: handleStartNewConversation, className: "flex items-center gap-1.5 rounded-lg border border-[#442211] bg-[#140a05] px-3 py-1.5 text-xs font-semibold text-[#FFA033] transition-all hover:border-[#ff6a00]/50 hover:bg-[#201007] active:scale-95", children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: "size-3" }),
              /* @__PURE__ */ jsx("span", { children: "New Conversation" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-5 overflow-y-auto pr-2 pb-4 scrollbar-thin", children: [
          currentConversation.messages.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] text-white shadow-2xl", children: [
            /* @__PURE__ */ jsx("div", { className: "mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8a3800] to-[#ff6a00] text-white shadow-lg", children: /* @__PURE__ */ jsx(Bot, { className: "size-7" }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-white tracking-tight", children: "Foundry Intelligence Copilot" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-lg text-xs text-[#AAAAAA] leading-relaxed", children: "Direct cognitive grounding across plant engineering manuals, SOP incident records, and real-time InfluxDB sensor telemetry." }),
            /* @__PURE__ */ jsx("div", { className: "mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 max-w-xl w-full", children: quickPromptSuggestions.map((item, idx) => /* @__PURE__ */ jsxs("button", { onClick: () => handleSend(void 0, item.query), className: "flex items-center gap-2 rounded-xl border border-[#442211] bg-[#140a05]/90 p-3 text-left text-xs text-[#E4D5AD] transition-all hover:border-[#FF7A00]/50 hover:bg-[#201007] hover:text-white", children: [
              /* @__PURE__ */ jsx(Activity, { className: "size-3.5 text-[#FF7A00] shrink-0" }),
              /* @__PURE__ */ jsx("span", { className: "truncate font-medium", children: item.label })
            ] }, idx)) })
          ] }) : currentConversation.messages.map((msg) => /* @__PURE__ */ jsxs(motion.div, { initial: {
            opacity: 0,
            y: 10
          }, animate: {
            opacity: 1,
            y: 0
          }, className: cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start"), children: [
            msg.role === "assistant" && /* @__PURE__ */ jsx("div", { className: "flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8a3800] to-[#ff6a00] text-white shadow-md", children: /* @__PURE__ */ jsx(Bot, { className: "size-4" }) }),
            /* @__PURE__ */ jsxs("div", { className: cn("max-w-[84%] space-y-3 rounded-2xl p-5 shadow-2xl transition-all", msg.role === "user" ? "border border-[#ff7a00]/40 bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] text-white" : "border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] text-[#F4E9CD]"), children: [
              msg.imageUrl && /* @__PURE__ */ jsxs("div", { className: "mb-3 overflow-hidden rounded-xl border border-white/20 bg-black/60 p-1", children: [
                /* @__PURE__ */ jsx("img", { src: msg.imageUrl, alt: msg.imageName || "Attached Inspection", className: "max-h-64 w-full rounded-lg object-contain cursor-pointer hover:opacity-95 transition-opacity", onClick: () => {
                  if (msg.imageUrl) {
                    window.open(msg.imageUrl, "_blank");
                  }
                }, title: "Click to view full image" }),
                msg.imageName && /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center justify-between px-2 py-1 text-[11px] text-white/90", children: [
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 truncate", children: [
                    /* @__PURE__ */ jsx(Image, { className: "size-3 text-[#FFA033]" }),
                    msg.imageName
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-emerald-400 font-mono", children: "Verified Inspection" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-sm leading-relaxed whitespace-pre-line font-sans font-normal text-white", children: msg.content }),
              msg.retrievalSteps && msg.retrievalSteps.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-[#442211] bg-[#0c0603]/60 text-xs overflow-hidden", children: [
                /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setExpandedSteps((prev) => ({
                  ...prev,
                  [msg.id]: !prev[msg.id]
                })), className: "flex w-full items-center justify-between p-2.5 text-[#FFA033] hover:bg-[#1a0c06] transition-colors", children: [
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 font-medium", children: [
                    /* @__PURE__ */ jsx(Brain, { className: "size-3.5" }),
                    "Grounded Retrieval Pipeline (",
                    msg.retrievalSteps.length,
                    " stages)"
                  ] }),
                  expandedSteps[msg.id] ? /* @__PURE__ */ jsx(ChevronUp, { className: "size-3.5" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "size-3.5" })
                ] }),
                expandedSteps[msg.id] && /* @__PURE__ */ jsx("div", { className: "border-t border-[#442211] p-3 space-y-1.5 text-[11px] text-[#BBBBBB]", children: msg.retrievalSteps.map((step, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-emerald-400 font-mono", children: [
                    "0",
                    idx + 1,
                    "."
                  ] }),
                  /* @__PURE__ */ jsx("span", { children: step })
                ] }, idx)) })
              ] }),
              msg.sources && msg.sources.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-xl border border-[#442211] bg-[#0c0603]/85 p-3.5 text-xs", children: [
                /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 font-semibold text-[#FFA033]", children: [
                    /* @__PURE__ */ jsx(Paperclip, { className: "size-3 text-[#FF7A00]" }),
                    "Grounded Documentation Sources"
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-[#888888]", children: "Click source to inspect excerpt" })
                ] }),
                /* @__PURE__ */ jsx("ul", { className: "space-y-1.5", children: msg.sources.map((src, i) => /* @__PURE__ */ jsxs("li", { onClick: () => setSelectedSource(src), className: "group/src flex cursor-pointer items-center justify-between rounded-lg border border-transparent p-1.5 transition-all hover:border-[#ff6a00]/40 hover:bg-[#190d06]", children: [
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-[#E4D5AD] group-hover/src:text-white font-medium", children: [
                    /* @__PURE__ */ jsx(FileText, { className: "size-3 text-[#FF7A00]" }),
                    src.name
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "font-mono text-[#FFA033] text-[11px] group-hover/src:underline", children: [
                    src.relevance,
                    "% match"
                  ] })
                ] }, i)) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-t border-[#442211]/50 pt-2 text-[11px] text-[#888888]", children: [
                /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: msg.role === "assistant" && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("button", { onClick: () => handleCopyMessage(msg.id, msg.content), className: "flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-[#1a0c06] hover:text-white transition-colors", title: "Copy response", children: copiedMsgId === msg.id ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Check, { className: "size-3 text-emerald-400" }),
                    /* @__PURE__ */ jsx("span", { className: "text-emerald-400 text-[10px]", children: "Copied" })
                  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Copy, { className: "size-3" }),
                    /* @__PURE__ */ jsx("span", { className: "text-[10px]", children: "Copy" })
                  ] }) }),
                  /* @__PURE__ */ jsx("button", { onClick: () => handleToggleSpeech(msg.id, msg.content), className: "flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-[#1a0c06] hover:text-white transition-colors", title: speakingMsgId === msg.id ? "Stop voice" : "Read aloud", children: speakingMsgId === msg.id ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(VolumeX, { className: "size-3 text-amber-400 animate-pulse" }),
                    /* @__PURE__ */ jsx("span", { className: "text-amber-400 text-[10px]", children: "Stop" })
                  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Volume2, { className: "size-3" }),
                    /* @__PURE__ */ jsx("span", { className: "text-[10px]", children: "Speak" })
                  ] }) }),
                  /* @__PURE__ */ jsx("div", { className: "h-3 w-px bg-[#442211]" }),
                  /* @__PURE__ */ jsx("button", { onClick: () => handleFeedback(msg.id, "up"), className: cn("p-1 rounded hover:text-white transition-colors", msg.feedback === "up" ? "text-emerald-400 bg-emerald-950/40" : ""), title: "Helpful", children: /* @__PURE__ */ jsx(ThumbsUp, { className: "size-3" }) }),
                  /* @__PURE__ */ jsx("button", { onClick: () => handleFeedback(msg.id, "down"), className: cn("p-1 rounded hover:text-white transition-colors", msg.feedback === "down" ? "text-red-400 bg-red-950/40" : ""), title: "Needs correction", children: /* @__PURE__ */ jsx(ThumbsDown, { className: "size-3" }) })
                ] }) }),
                msg.timestamp && /* @__PURE__ */ jsx("div", { className: "text-[10px] text-[#888888] font-mono", children: msg.timestamp })
              ] })
            ] }),
            msg.role === "user" && /* @__PURE__ */ jsx("div", { className: "flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#442211] bg-[#140a05] text-[#FFA033] shadow-md", children: /* @__PURE__ */ jsx(User, { className: "size-4" }) })
          ] }, msg.id)),
          isTyping && /* @__PURE__ */ jsxs("div", { className: "flex gap-3 items-center", children: [
            /* @__PURE__ */ jsx("div", { className: "flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8a3800] to-[#ff6a00] text-white shadow-md", children: /* @__PURE__ */ jsx(Bot, { className: "size-4" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 rounded-2xl border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] px-4 py-3 shadow-xl", children: [
              /* @__PURE__ */ jsx("span", { className: "size-2 animate-bounce rounded-full bg-[#FF7A00]", style: {
                animationDelay: "0ms"
              } }),
              /* @__PURE__ */ jsx("span", { className: "size-2 animate-bounce rounded-full bg-[#FF7A00]", style: {
                animationDelay: "180ms"
              } }),
              /* @__PURE__ */ jsx("span", { className: "size-2 animate-bounce rounded-full bg-[#FF7A00]", style: {
                animationDelay: "360ms"
              } }),
              /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs text-[#AAAAAA]", children: "Retrieving plant SOPs & analyzing InfluxDB stream..." })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { ref: chatBottomRef })
        ] }),
        currentConversation.messages.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[11px] text-[#8a3800] font-bold shrink-0", children: "Quick Queries:" }),
          quickPromptSuggestions.slice(0, 3).map((item, idx) => /* @__PURE__ */ jsx("button", { onClick: () => handleSend(void 0, item.query), className: "shrink-0 rounded-full border border-[#442211] bg-[#140a05]/90 px-3 py-1 text-[11px] text-[#E4D5AD] hover:border-[#FF7A00]/50 hover:bg-[#201007] hover:text-white transition-all active:scale-95", children: item.label }, idx))
        ] }),
        attachedImage && /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center justify-between rounded-2xl border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] p-2.5 shadow-xl text-white", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "relative size-12 shrink-0 overflow-hidden rounded-lg border border-[#442211] bg-black", children: /* @__PURE__ */ jsx("img", { src: attachedImage.url, alt: "Preview", className: "h-full w-full object-cover" }) }),
            /* @__PURE__ */ jsxs("div", { className: "overflow-hidden", children: [
              /* @__PURE__ */ jsx("p", { className: "truncate text-xs font-semibold text-white", children: attachedImage.name }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#FFA033]", children: "Attached for vision inspection model" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setAttachedImage(null), className: "flex size-7 items-center justify-center rounded-full border border-[#442211] bg-[#140a05] text-[#AAAAAA] hover:text-white transition-colors", title: "Remove attachment", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
        ] }),
        /* @__PURE__ */ jsx("form", { onSubmit: (e) => handleSend(e), className: "rounded-full border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] p-2 shadow-2xl transition-all focus-within:border-[#ff6a00]/60 focus-within:ring-1 focus-within:ring-[#ff6a00]/40", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
            var _a;
            return (_a = fileInputRef.current) == null ? void 0 : _a.click();
          }, className: "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#442211] bg-[#140a05] text-[#FFA033] shadow-xs transition-all hover:border-[#ff6a00]/50 hover:bg-[#201007] hover:scale-105 active:scale-95", title: "Attach an image file (thermal scan, defect photo, SOP document)", children: /* @__PURE__ */ jsx(Plus, { className: "size-4" }) }),
          !attachedImage && /* @__PURE__ */ jsxs("button", { type: "button", onClick: handleAttachSampleThermalImage, className: "hidden sm:flex items-center gap-1 rounded-full border border-[#442211] bg-[#140a05] px-2.5 py-1 text-[10px] font-medium text-[#FFA033] hover:border-[#ff6a00]/40 hover:bg-[#201007] transition-all", title: "Test with preset IR thermal scan image", children: [
            /* @__PURE__ */ jsx(Flame, { className: "size-3 text-[#FF7A00]" }),
            /* @__PURE__ */ jsx("span", { children: "Sample IR" })
          ] }),
          /* @__PURE__ */ jsx("input", { type: "text", value: input, onChange: (e) => setInput(e.target.value), placeholder: "Ask a question about the process, manuals, or attached image...", className: "flex-1 bg-transparent px-2 text-sm text-white placeholder:text-[#888888] outline-none" }),
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: !input.trim() && !attachedImage, className: "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-[#8a3800] to-[#ff6a00] text-white shadow-md transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40", title: "Send Message", children: /* @__PURE__ */ jsx(Send, { className: "size-4" }) })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: selectedSource && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs", children: /* @__PURE__ */ jsxs(motion.div, { initial: {
      opacity: 0,
      scale: 0.95,
      y: 15
    }, animate: {
      opacity: 1,
      scale: 1,
      y: 0
    }, exit: {
      opacity: 0,
      scale: 0.95,
      y: 15
    }, className: "relative w-full max-w-lg rounded-2xl border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] p-6 text-white shadow-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-start justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#8a3800] to-[#ff6a00] text-white shadow-md", children: /* @__PURE__ */ jsx(FileText, { className: "size-5" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-white leading-tight", children: selectedSource.name }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-[#FFA033] font-mono mt-0.5", children: [
              selectedSource.docId || "DOC-REF-2026",
              " • ",
              selectedSource.category || "Documentation"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setSelectedSource(null), className: "rounded-lg p-1 text-neutral-400 hover:bg-[#140a05] hover:text-white transition-colors", children: /* @__PURE__ */ jsx(X, { className: "size-5" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-400", children: [
        /* @__PURE__ */ jsx(Check, { className: "size-3" }),
        /* @__PURE__ */ jsxs("span", { children: [
          "Vector Similarity: ",
          selectedSource.relevance,
          "% Match"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-5 rounded-xl border border-[#442211] bg-[#0c0603]/85 p-4 text-xs leading-relaxed text-[#E4D5AD] font-sans", children: [
        /* @__PURE__ */ jsxs("p", { className: "font-semibold text-white mb-1.5 flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(BookOpenIcon, { className: "size-3.5 text-[#FF7A00]" }),
          "Cited Text Excerpt:"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "italic", children: [
          '"',
          selectedSource.excerpt || "Standard operational guidelines require continuous verification of crucible lining wear and temperature gradients.",
          '"'
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-end gap-2", children: /* @__PURE__ */ jsx("button", { onClick: () => setSelectedSource(null), className: "rounded-xl border border-[#442211] bg-[#140a05] px-4 py-2 text-xs font-medium text-white hover:bg-[#201007] transition-colors", children: "Close" }) })
    ] }) }) })
  ] });
}
function BookOpenIcon(props) {
  return /* @__PURE__ */ jsxs("svg", { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsx("path", { d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" }),
    /* @__PURE__ */ jsx("path", { d: "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" })
  ] });
}
export {
  RAGPage as component
};
