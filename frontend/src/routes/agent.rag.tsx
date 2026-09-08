import { createFileRoute } from "@tanstack/react-router";
import {
  Send,
  RefreshCw,
  Paperclip,
  Bot,
  User,
  Database,
  Plus,
  X,
  History,
  Image as ImageIcon,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  FileText,
  Download,
  Activity,
  ChevronDown,
  ChevronUp,
  Brain,
  Layers,
  Flame,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agent/rag")({
  component: RAGPage,
});

type Source = {
  name: string;
  relevance: number;
  docId?: string;
  category?: string;
  excerpt?: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  imageName?: string;
  sources?: Source[];
  retrievalSteps?: string[];
  timestamp?: string;
  feedback?: "up" | "down" | null;
};

type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  context: {
    furnace: string;
    batch: string;
    status: "normal" | "alert" | "warning";
  };
  messages: Message[];
};

// Realistic Thermal Scan Sample SVG Data URL
const sampleThermalScanUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360"><defs><radialGradient id="hotspot" cx="45%" cy="40%" r="55%"><stop offset="0%" stop-color="%23FFFFFF"/><stop offset="20%" stop-color="%23FFF200"/><stop offset="45%" stop-color="%23FF5500"/><stop offset="70%" stop-color="%23990033"/><stop offset="100%" stop-color="%231A0022"/></radialGradient><linearGradient id="irGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23001133"/><stop offset="35%" stop-color="%23440066"/><stop offset="70%" stop-color="%23CC3300"/><stop offset="100%" stop-color="%23FFEE00"/></linearGradient></defs><rect width="600" height="360" fill="url(%23irGrad)"/><circle cx="280" cy="160" r="110" fill="url(%23hotspot)" opacity="0.95"/><path d="M 120 180 Q 280 120 460 210" stroke="%23FFFFFF" stroke-width="1.5" stroke-dasharray="4 4" fill="none" opacity="0.6"/><circle cx="280" cy="160" r="5" fill="%23FFFFFF"/><line x1="260" y1="160" x2="300" y2="160" stroke="%23FFFFFF" stroke-width="1.5"/><line x1="280" y1="140" x2="280" y2="180" stroke="%23FFFFFF" stroke-width="1.5"/><rect x="15" y="15" width="220" height="68" rx="8" fill="rgba(0,0,0,0.75)"/><text x="25" y="36" fill="%23FFFFFF" font-family="monospace" font-size="13" font-weight="bold">IR THERMAL TELEMETRY</text><text x="25" y="54" fill="%23FF7A00" font-family="monospace" font-size="12">Hotspot: 1,614.8°C</text><text x="25" y="70" fill="%23AAAAAA" font-family="monospace" font-size="10">Zone B Lining Degradation</text></svg>`;

const initialConversations: Conversation[] = [
  {
    id: "conv-1",
    title: "Furnace 3 Lining Failure Analysis",
    updatedAt: "10m ago",
    context: {
      furnace: "Furnace 3",
      batch: "CB-001",
      status: "alert",
    },
    messages: [
      {
        id: "1",
        role: "user",
        content: "Why is the lining failing on Furnace 3?",
        timestamp: "14:45",
      },
      {
        id: "2",
        role: "assistant",
        content:
          "Based on the live twin state, Furnace 3 is experiencing an abnormal thermal gradient across partition Zone B.\n\nKey Findings:\n• Refractory Replacement Cycle: The last lining overhaul was logged 14 weeks ago, exceeding the manufacturer's recommended 12-week preventative threshold.\n• Telemetry Correlation: The vibration signature spike detected at 14:48:02 correlates directly with localized thermal erosion and micro-fractures in the silica backing.\n• Immediate Recommendation: Initiate thermal imaging validation and prepare ladling sequence for early pour down to prevent crucible shell exposure.",
        sources: [
          {
            name: "Furnace 3 Manual p.4-3",
            relevance: 94,
            docId: "DOC-MAN-2024-F3",
            category: "Plant Equipment Manual",
            excerpt:
              "Section 4.3 Refractory Lining Degradation: Operating beyond 12 weeks with high alumina refractory under continuous induction melt increases shell hot-spot probability by 62%. Thermocouple delta exceeding 45°C warrants immediate borescope inspection.",
          },
          {
            name: "Incident Report Sept 2025",
            relevance: 89,
            docId: "INC-2025-09-12",
            category: "Historical Incident Log",
            excerpt:
              "Case analysis of melt breach on Furnace 2: Early vibration anomalies preceded visual lining breakthrough by approximately 36 hours. Prompt replacement of the coil grout prevented induction loop damage.",
          },
          {
            name: "SOP v2.3 p.7",
            relevance: 83,
            docId: "SOP-REL-MELT-02",
            category: "Standard Operating Procedure",
            excerpt:
              "Standard Operating Procedure: Daily inspection protocol requires thermographic sweep across furnace jacket during tapping phase. Any thermal disparity >80°C between quadrants must be escalated to meltmaster.",
          },
        ],
        retrievalSteps: [
          "Hybrid Vector Search: Queried ChromaDB (foundry-manuals) with cosine threshold > 0.80",
          "Telemetry Retrieval: InfluxDB query on furnace_3_temp and vibration_rms over last 24h",
          "Rule Engine: Correlated ASTM E1934 thermographic standards with operational logs",
          "Synthesized via Llama-3-70B with verified citations",
        ],
        timestamp: "14:45",
      },
    ],
  },
  {
    id: "conv-2",
    title: "Pouring Temperature Drop & Ladle #4",
    updatedAt: "2h ago",
    context: {
      furnace: "Ladle Station 2",
      batch: "CB-004",
      status: "warning",
    },
    messages: [
      {
        id: "201",
        role: "user",
        content: "Did Ladle #4 experience a temperature drop during transfer?",
        timestamp: "12:15",
      },
      {
        id: "202",
        role: "assistant",
        content:
          "Yes, telemetry logs indicate a 14°C drop between 11:20 and 11:28 while holding at the pour station.\n\nRoot Cause Analysis:\n• Pre-heat temperature was logged at 1,380°C instead of the standard 1,420°C nominal setpoint.\n• Skimmer transit was delayed by 4 minutes due to crane positioning congestion.\n• Downstream Impact: Chilled iron boundary layer may increase cold-shut risk on Thin-Wall Casting section A.",
        sources: [
          {
            name: "Pouring Twin Telemetry Log",
            relevance: 96,
            docId: "LOG-POUR-2026-04",
            category: "Live Sensor Stream",
            excerpt:
              "Ladle #4 optical pyrometer reading at station 2: 1398°C at 11:20:14, falling to 1384°C at 11:28:40. Heat dissipation rate: 1.75°C/min.",
          },
          {
            name: "Ladle Pre-heat SOP 09",
            relevance: 91,
            docId: "SOP-LAD-09",
            category: "Standard Operating Procedure",
            excerpt:
              "Pre-heating gas burner must maintain minimum refractory core temperature of 1,420°C for no less than 45 minutes prior to liquid iron tapping.",
          },
        ],
        retrievalSteps: [
          "Queried Ladle Station 2 optical telemetry stream",
          "Cross-referenced crane dispatch timing logs",
          "Retrieved Ladle Pre-heat SOP 09 specifications",
        ],
        timestamp: "12:16",
      },
    ],
  },
  {
    id: "conv-3",
    title: "Green Sand Moisture Variance in Line 2",
    updatedAt: "Yesterday",
    context: {
      furnace: "Molding Line 2",
      batch: "ML-892",
      status: "normal",
    },
    messages: [
      {
        id: "301",
        role: "user",
        content: "What is causing the permeability drop on molding line 2?",
        timestamp: "Yesterday",
      },
      {
        id: "302",
        role: "assistant",
        content:
          "Green sand moisture spiked to 4.1% at 13:10, exceeding the 3.6% threshold.\n\nMechanistic Explanation:\n• High bentonite clay content combined with surplus moisture reduced permeability from 145 to 110 AFS units.\n• Elevated moisture under high compaction energy generates excessive steam during molten iron contact, elevating gas porosity defect probability to 18.4%.",
        sources: [
          {
            name: "Molding Twin Sensor Stream",
            relevance: 95,
            docId: "STREAM-MOLD-2",
            category: "Sensor Stream",
            excerpt:
              "Batch ML-892 sand compactibility: 48%, Moisture: 4.12%, Permeability: 110 AFS. Threshold breached at 13:10:44.",
          },
          {
            name: "Sand Lab Test QA-44",
            relevance: 88,
            docId: "LAB-QA-44",
            category: "Quality Assurance Report",
            excerpt:
              "Bentonite active clay ratio logged at 8.4%. Water injection pump solenoid #2 showed intermittent over-delivery during 13:00-13:30 window.",
          },
        ],
        retrievalSteps: [
          "Molding twin real-time sensor query",
          "Bentonite compactibility correlation matrix",
          "Synthesis with QA lab calibration logs",
        ],
        timestamp: "Yesterday",
      },
    ],
  },
];

const quickPromptSuggestions = [
  { label: "Analyze Furnace 3 Lining", query: "Why is the lining failing on Furnace 3?" },
  { label: "Ladle Pouring Temp Delta", query: "Did Ladle #4 experience a temperature drop during transfer?" },
  { label: "Molding Sand Moisture Spike", query: "What is causing the permeability drop on molding line 2?" },
  { label: "Check ASTM E1934 SOP", query: "What are the ASTM E1934 criteria for refractory thermal sweeps?" },
];

function RAGPage() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConvId, setActiveConvId] = useState<string>(initialConversations[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Staged image attachment
  const [attachedImage, setAttachedImage] = useState<{
    url: string;
    name: string;
  } | null>(null);

  // Document modal preview
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  // Expanded reasoning steps state per message id
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({ "2": false });

  // Copy feedback state
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Speech synthesis state
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage once on client mount
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
      // fallback
    }
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_rag_conversations", JSON.stringify(conversations));
    }
  }, [conversations]);

  const currentConversation =
    conversations.find((c) => c.id === activeConvId) || conversations[0];

  // Scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages, isTyping]);

  const handleStartNewConversation = () => {
    const newId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: "New Plant Inquiry",
      updatedAt: "Just now",
      context: {
        furnace: "Furnace 3",
        batch: "CB-001",
        status: "normal",
      },
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newId);
    setInput("");
    setAttachedImage(null);
  };

  const handleDeleteConversation = (e: React.MouseEvent, convId: string) => {
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setAttachedImage({
          url: event.target.result,
          name: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAttachSampleThermalImage = () => {
    setAttachedImage({
      url: sampleThermalScanUrl,
      name: "Furnace_3_Thermal_IR_Sweep.svg",
    });
  };

  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleToggleSpeech = (msgId: string, text: string) => {
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

  const handleFeedback = (msgId: string, type: "up" | "down") => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          return {
            ...c,
            messages: c.messages.map((m) => {
              if (m.id === msgId) {
                return {
                  ...m,
                  feedback: m.feedback === type ? null : type,
                };
              }
              return m;
            }),
          };
        }
        return c;
      })
    );
  };

  const handleContextChange = (field: "furnace" | "batch", val: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          return {
            ...c,
            context: {
              ...c.context,
              [field]: val,
            },
          };
        }
        return c;
      })
    );
  };

  const handleExportChat = () => {
    const reportText = `NEXUS COGNITIVE FOUNDRY INTELLIGENCE - AUDIT LOG\nSession: ${currentConversation.title}\nContext: ${currentConversation.context.furnace} | Batch: ${currentConversation.context.batch}\nExport Date: ${new Date().toISOString()}\n======================================================\n\n` +
      currentConversation.messages
        .map(
          (m) =>
            `[${m.timestamp || "TIME"}] ${m.role.toUpperCase()}:\n${m.content}\n${
              m.sources ? `\nSources Cited:\n` + m.sources.map((s) => `- ${s.name} (${s.relevance}%)`).join("\n") : ""
            }\n------------------------------------------------------`
        )
        .join("\n\n");

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentConversation.title.replace(/\s+/g, "_")}_transcript.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = (e?: React.FormEvent, directPrompt?: string) => {
    if (e) e.preventDefault();
    const queryToSend = directPrompt !== undefined ? directPrompt : input;
    if (!queryToSend.trim() && !attachedImage) return;

    const userText = queryToSend.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userText || "Analyzed attached thermal inspection image for structural defects.",
      imageUrl: attachedImage ? attachedImage.url : undefined,
      imageName: attachedImage ? attachedImage.name : undefined,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          const isFirstMessage = c.messages.length === 0;
          return {
            ...c,
            title: isFirstMessage
              ? userText.slice(0, 36) || (attachedImage ? `Inspect ${attachedImage.name}` : "Process Query")
              : c.title,
            updatedAt: "Just now",
            messages: [...c.messages, userMsg],
          };
        }
        return c;
      })
    );

    const hasImage = Boolean(attachedImage);
    setInput("");
    setAttachedImage(null);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: hasImage
          ? `Vision Inspection & Live Twin Telemetry Analysis:\n\n• Anomaly Detection: The attached thermographic image demonstrates localized heat concentration along Zone B partition (peak core: 1,614.8°C).\n• Thickness Degradation: Correlating with ultrasonic baseline records, refractory lining has diminished from 85mm to 38mm.\n• Safety Threshold: ASTM E1934 limit breached. Automated safety protocol recommends reducing induction power by 15% and scheduling crucible reline prior to melt batch ${currentConversation.context.batch}-02.`
          : `Grounded Diagnosis for ${currentConversation.context.furnace}:\n\n• Cross-referencing telemetry stream with historical incident logs confirms operating parameters are trending towards refractory lining degradation.\n• Coil grout vibration frequency indicates thermal micro-fissures.\n• Recommended Action: Execute borescope camera sweep during next slagging cycle.`,
        sources: [
          {
            name: "Live Telemetry InfluxDB",
            relevance: 98,
            docId: "STREAM-INFLUX-F3",
            category: "Real-time Telemetry Stream",
            excerpt:
              "Sensor Stream telemetry: Zone B thermocouple recorded 1,614.8°C at holding peak. Thermal variance threshold exceeded by 38°C.",
          },
          {
            name: "Refractory Maintenance SOP v3.2",
            relevance: 92,
            docId: "SOP-REL-F3",
            category: "Maintenance Standard",
            excerpt:
              "Crucible Shell Protection Protocol: Refractory thickness under 40mm necessitates scheduled furnace ramp-down to avoid steel coil penetration.",
          },
          {
            name: "Thermal Imaging Standards ASTM E1934",
            relevance: 87,
            docId: "ASTM-E1934-2023",
            category: "Industry Standard",
            excerpt:
              "Standard guide for examining electrical and mechanical equipment with infrared thermography in metallurgical melting vessels.",
          },
        ],
        retrievalSteps: [
          "Retrieved real-time InfluxDB telemetry and coil vibration logs",
          "Calculated thermal degradation delta against SOP v3.2 limits",
          "Verified containment standards against ASTM E1934 protocol",
          "Grounded synthesis generated via Llama-3-70B Foundry model",
        ],
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId ? { ...c, messages: [...c.messages, botMsg] } : c
        )
      );
    }, 1300);
  };

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col bg-[#F4E9CD] text-[#111111] overflow-hidden">
      {/* Hidden file input for image attachment */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 gap-5 p-4 md:p-6 lg:p-8 overflow-hidden">
        {/* TASK 1 & 2: CONVERSATION HISTORY SIDEBAR WITH SIDE-COLLAPSER BUTTON */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside
              initial={{ opacity: 0, x: -30, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 280 }}
              exit={{ opacity: 0, x: -30, width: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex shrink-0 flex-col overflow-hidden rounded-2xl border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] p-4 shadow-2xl backdrop-blur-md text-white"
            >
              {/* Sidebar Header with Side-Collapser Icon */}
              <div className="mb-4 flex items-center justify-between border-b border-[#442211]/80 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <History className="size-4 text-[#FF7A00]" />
                  Chat History
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleStartNewConversation}
                    className="flex items-center gap-1 rounded-lg border border-[#442211] bg-[#140a05] px-2.5 py-1 text-xs font-medium text-[#FFA033] transition-all hover:border-[#ff6a00]/50 hover:bg-[#201007] active:scale-95"
                    title="Start a new conversation"
                  >
                    <Plus className="size-3.5" />
                    New
                  </button>

                  {/* SIDE-COLLAPSER BUTTON ALONG WITH HISTORY */}
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex size-7 items-center justify-center rounded-lg border border-[#442211] bg-[#140a05] text-[#FFA033] transition-colors hover:border-[#ff6a00]/50 hover:bg-[#201007]"
                    title="Collapse History"
                  >
                    <PanelLeftClose className="size-4" />
                  </button>
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-1 text-xs scrollbar-thin">
                {conversations.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className={cn(
                        "group relative flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition-all",
                        isActive
                          ? "border-[#ff6a00]/60 bg-gradient-to-r from-[#8a3800]/40 to-[#ff6a00]/15 text-white shadow-md"
                          : "border-[#442211]/60 bg-[#140a05]/60 text-[#AAAAAA] hover:border-[#ff6a00]/30 hover:bg-[#201007] hover:text-white"
                      )}
                    >
                      <div className="flex items-start gap-2.5 overflow-hidden">
                        <MessageSquare
                          className={cn(
                            "mt-0.5 size-3.5 shrink-0",
                            isActive ? "text-[#FF7A00]" : "text-[#777777]"
                          )}
                        />
                        <div className="overflow-hidden">
                          <p className="truncate font-medium leading-tight">
                            {conv.title}
                          </p>
                          <span className="mt-1 block text-[10px] text-[#777777]">
                            {conv.updatedAt}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                        className="opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100 p-1"
                        title="Delete conversation"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Sidebar Footer info without star logos */}
              <div className="mt-3 border-t border-[#442211]/80 pt-3 text-[11px] text-[#888888] flex items-center justify-between">
                <span>{conversations.length} sessions stored</span>
                <span className="flex items-center gap-1 text-[#FFA033] font-mono text-[10px]">
                  <span className="inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Llama-3 Grounded
                </span>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* MAIN CHAT AREA */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* INTERACTIVE CONTEXT BAR & TOOLBAR */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] px-4 py-3 text-xs text-white shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              {/* Expand History Button when collapsed */}
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex size-7 items-center justify-center rounded-lg border border-[#442211] bg-[#140a05] text-[#FFA033] shadow-xs transition-colors hover:border-[#ff6a00]/50 hover:bg-[#201007]"
                  title="Open Chat History"
                >
                  <PanelLeftOpen className="size-3.5" />
                </button>
              )}

              <div className="flex items-center gap-1.5 font-medium text-[#FF7A00]">
                <Database className="size-3.5" />
                <span>Active Context:</span>
              </div>

              {/* Interactive Asset Selector */}
              <div className="flex items-center gap-1">
                <select
                  value={currentConversation.context.furnace}
                  onChange={(e) => handleContextChange("furnace", e.target.value)}
                  className="cursor-pointer rounded-md border border-[#442211] bg-[#140a05] px-2.5 py-1 text-[#F4E9CD] font-mono text-xs focus:border-[#FF7A00] focus:outline-none"
                  title="Switch Active Foundry Unit"
                >
                  <option value="Furnace 3">Furnace 3</option>
                  <option value="Furnace 1">Furnace 1</option>
                  <option value="Ladle Station 2">Ladle Station 2</option>
                  <option value="Molding Line 2">Molding Line 2</option>
                  <option value="Pouring Bay A">Pouring Bay A</option>
                </select>

                <select
                  value={currentConversation.context.batch}
                  onChange={(e) => handleContextChange("batch", e.target.value)}
                  className="cursor-pointer rounded-md border border-[#442211] bg-[#140a05] px-2.5 py-1 text-[#F4E9CD] font-mono text-xs focus:border-[#FF7A00] focus:outline-none"
                  title="Switch Batch ID"
                >
                  <option value="CB-001">Batch: CB-001</option>
                  <option value="CB-002">Batch: CB-002</option>
                  <option value="CB-004">Batch: CB-004</option>
                  <option value="ML-892">Batch: ML-892</option>
                </select>

                <span className="flex items-center gap-1.5 rounded-md border border-[#442211] bg-[#140a05] px-2.5 py-1 text-[#F4E9CD]">
                  Status:{" "}
                  <span
                    className={cn(
                      "inline-block size-2 rounded-full",
                      currentConversation.context.status === "alert"
                        ? "bg-red-500 animate-pulse"
                        : currentConversation.context.status === "warning"
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                    )}
                  />
                </span>
              </div>
            </div>

            {/* Right Action Tools: Export Report & New Conversation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportChat}
                className="flex items-center gap-1 rounded-lg border border-[#442211] bg-[#140a05] px-2.5 py-1.5 text-xs font-medium text-[#AAAAAA] transition-all hover:border-[#ff6a00]/50 hover:text-white active:scale-95"
                title="Download transcript report"
              >
                <Download className="size-3" />
                <span className="hidden sm:inline">Export Log</span>
              </button>

              <button
                onClick={handleStartNewConversation}
                className="flex items-center gap-1.5 rounded-lg border border-[#442211] bg-[#140a05] px-3 py-1.5 text-xs font-semibold text-[#FFA033] transition-all hover:border-[#ff6a00]/50 hover:bg-[#201007] active:scale-95"
              >
                <RefreshCw className="size-3" />
                <span>New Conversation</span>
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES SCROLL AREA */}
          <div className="flex-1 space-y-5 overflow-y-auto pr-2 pb-4 scrollbar-thin">
            {currentConversation.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] text-white shadow-2xl">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8a3800] to-[#ff6a00] text-white shadow-lg">
                  <Bot className="size-7" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Foundry Intelligence Copilot
                </h3>
                <p className="mt-2 max-w-lg text-xs text-[#AAAAAA] leading-relaxed">
                  Direct cognitive grounding across plant engineering manuals, SOP incident records, and real-time InfluxDB sensor telemetry.
                </p>

                {/* Quick Interactive Prompt Starters */}
                <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 max-w-xl w-full">
                  {quickPromptSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(undefined, item.query)}
                      className="flex items-center gap-2 rounded-xl border border-[#442211] bg-[#140a05]/90 p-3 text-left text-xs text-[#E4D5AD] transition-all hover:border-[#FF7A00]/50 hover:bg-[#201007] hover:text-white"
                    >
                      <Activity className="size-3.5 text-[#FF7A00] shrink-0" />
                      <span className="truncate font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              currentConversation.messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {/* Bot Avatar */}
                  {msg.role === "assistant" && (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8a3800] to-[#ff6a00] text-white shadow-md">
                      <Bot className="size-4" />
                    </div>
                  )}

                  {/* CHAT BOXES WITH CROSS-STAGE CORRELATION GRADIENT */}
                  <div
                    className={cn(
                      "max-w-[84%] space-y-3 rounded-2xl p-5 shadow-2xl transition-all",
                      msg.role === "user"
                        ? "border border-[#ff7a00]/40 bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] text-white"
                        : "border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] text-[#F4E9CD]"
                    )}
                  >
                    {/* Attached Image inside user message */}
                    {msg.imageUrl && (
                      <div className="mb-3 overflow-hidden rounded-xl border border-white/20 bg-black/60 p-1">
                        <img
                          src={msg.imageUrl}
                          alt={msg.imageName || "Attached Inspection"}
                          className="max-h-64 w-full rounded-lg object-contain cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => {
                            if (msg.imageUrl) {
                              window.open(msg.imageUrl, "_blank");
                            }
                          }}
                          title="Click to view full image"
                        />
                        {msg.imageName && (
                          <div className="mt-1 flex items-center justify-between px-2 py-1 text-[11px] text-white/90">
                            <span className="flex items-center gap-1.5 truncate">
                              <ImageIcon className="size-3 text-[#FFA033]" />
                              {msg.imageName}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono">
                              Verified Inspection
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-sm leading-relaxed whitespace-pre-line font-sans font-normal text-white">
                      {msg.content}
                    </div>

                    {/* Expandable Reasoning & Retrieval Steps */}
                    {msg.retrievalSteps && msg.retrievalSteps.length > 0 && (
                      <div className="rounded-xl border border-[#442211] bg-[#0c0603]/60 text-xs overflow-hidden">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSteps((prev) => ({
                              ...prev,
                              [msg.id]: !prev[msg.id],
                            }))
                          }
                          className="flex w-full items-center justify-between p-2.5 text-[#FFA033] hover:bg-[#1a0c06] transition-colors"
                        >
                          <span className="flex items-center gap-1.5 font-medium">
                            <Brain className="size-3.5" />
                            Grounded Retrieval Pipeline ({msg.retrievalSteps.length} stages)
                          </span>
                          {expandedSteps[msg.id] ? (
                            <ChevronUp className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                        </button>

                        {expandedSteps[msg.id] && (
                          <div className="border-t border-[#442211] p-3 space-y-1.5 text-[11px] text-[#BBBBBB]">
                            {msg.retrievalSteps.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-400 font-mono">0{idx + 1}.</span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sources Box for Assistant with Clickable Excerpt Preview */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 rounded-xl border border-[#442211] bg-[#0c0603]/85 p-3.5 text-xs">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-semibold text-[#FFA033]">
                            <Paperclip className="size-3 text-[#FF7A00]" />
                            Grounded Documentation Sources
                          </div>
                          <span className="text-[10px] text-[#888888]">
                            Click source to inspect excerpt
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {msg.sources.map((src, i) => (
                            <li
                              key={i}
                              onClick={() => setSelectedSource(src)}
                              className="group/src flex cursor-pointer items-center justify-between rounded-lg border border-transparent p-1.5 transition-all hover:border-[#ff6a00]/40 hover:bg-[#190d06]"
                            >
                              <span className="flex items-center gap-2 text-[#E4D5AD] group-hover/src:text-white font-medium">
                                <FileText className="size-3 text-[#FF7A00]" />
                                {src.name}
                              </span>
                              <span className="font-mono text-[#FFA033] text-[11px] group-hover/src:underline">
                                {src.relevance}% match
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Interactive Message Footer Actions (Copy, Speech, Feedback) */}
                    <div className="flex items-center justify-between border-t border-[#442211]/50 pt-2 text-[11px] text-[#888888]">
                      <div className="flex items-center gap-2">
                        {msg.role === "assistant" && (
                          <>
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-[#1a0c06] hover:text-white transition-colors"
                              title="Copy response"
                            >
                              {copiedMsgId === msg.id ? (
                                <>
                                  <Check className="size-3 text-emerald-400" />
                                  <span className="text-emerald-400 text-[10px]">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3" />
                                  <span className="text-[10px]">Copy</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleToggleSpeech(msg.id, msg.content)}
                              className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-[#1a0c06] hover:text-white transition-colors"
                              title={speakingMsgId === msg.id ? "Stop voice" : "Read aloud"}
                            >
                              {speakingMsgId === msg.id ? (
                                <>
                                  <VolumeX className="size-3 text-amber-400 animate-pulse" />
                                  <span className="text-amber-400 text-[10px]">Stop</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="size-3" />
                                  <span className="text-[10px]">Speak</span>
                                </>
                              )}
                            </button>

                            <div className="h-3 w-px bg-[#442211]" />

                            <button
                              onClick={() => handleFeedback(msg.id, "up")}
                              className={cn(
                                "p-1 rounded hover:text-white transition-colors",
                                msg.feedback === "up" ? "text-emerald-400 bg-emerald-950/40" : ""
                              )}
                              title="Helpful"
                            >
                              <ThumbsUp className="size-3" />
                            </button>

                            <button
                              onClick={() => handleFeedback(msg.id, "down")}
                              className={cn(
                                "p-1 rounded hover:text-white transition-colors",
                                msg.feedback === "down" ? "text-red-400 bg-red-950/40" : ""
                              )}
                              title="Needs correction"
                            >
                              <ThumbsDown className="size-3" />
                            </button>
                          </>
                        )}
                      </div>

                      {msg.timestamp && (
                        <div className="text-[10px] text-[#888888] font-mono">
                          {msg.timestamp}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {msg.role === "user" && (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#442211] bg-[#140a05] text-[#FFA033] shadow-md">
                      <User className="size-4" />
                    </div>
                  )}
                </motion.div>
              ))
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3 items-center">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8a3800] to-[#ff6a00] text-white shadow-md">
                  <Bot className="size-4" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] px-4 py-3 shadow-xl">
                  <span className="size-2 animate-bounce rounded-full bg-[#FF7A00]" style={{ animationDelay: "0ms" }} />
                  <span className="size-2 animate-bounce rounded-full bg-[#FF7A00]" style={{ animationDelay: "180ms" }} />
                  <span className="size-2 animate-bounce rounded-full bg-[#FF7A00]" style={{ animationDelay: "360ms" }} />
                  <span className="ml-2 text-xs text-[#AAAAAA]">Retrieving plant SOPs & analyzing InfluxDB stream...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* QUICK PROMPT CHIPS BAR (WHEN MESSAGES EXIST) */}
          {currentConversation.messages.length > 0 && (
            <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="text-[11px] text-[#8a3800] font-bold shrink-0">Quick Queries:</span>
              {quickPromptSuggestions.slice(0, 3).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(undefined, item.query)}
                  className="shrink-0 rounded-full border border-[#442211] bg-[#140a05]/90 px-3 py-1 text-[11px] text-[#E4D5AD] hover:border-[#FF7A00]/50 hover:bg-[#201007] hover:text-white transition-all active:scale-95"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* STAGED IMAGE ATTACHMENT PREVIEW */}
          {attachedImage && (
            <div className="mb-2 flex items-center justify-between rounded-2xl border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] p-2.5 shadow-xl text-white">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-[#442211] bg-black">
                  <img
                    src={attachedImage.url}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="overflow-hidden">
                  <p className="truncate text-xs font-semibold text-white">
                    {attachedImage.name}
                  </p>
                  <p className="text-[10px] text-[#FFA033]">
                    Attached for vision inspection model
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="flex size-7 items-center justify-center rounded-full border border-[#442211] bg-[#140a05] text-[#AAAAAA] hover:text-white transition-colors"
                title="Remove attachment"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* INPUT BAR WITH '+' BUTTON & QUICK SAMPLE ATTACHMENT */}
          <form
            onSubmit={(e) => handleSend(e)}
            className="rounded-full border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] p-2 shadow-2xl transition-all focus-within:border-[#ff6a00]/60 focus-within:ring-1 focus-within:ring-[#ff6a00]/40"
          >
            <div className="flex items-center gap-2">
              {/* '+' BUTTON AT THE LEFT END */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#442211] bg-[#140a05] text-[#FFA033] shadow-xs transition-all hover:border-[#ff6a00]/50 hover:bg-[#201007] hover:scale-105 active:scale-95"
                title="Attach an image file (thermal scan, defect photo, SOP document)"
              >
                <Plus className="size-4" />
              </button>

              {/* Sample Thermal IR Quick Attach Pill */}
              {!attachedImage && (
                <button
                  type="button"
                  onClick={handleAttachSampleThermalImage}
                  className="hidden sm:flex items-center gap-1 rounded-full border border-[#442211] bg-[#140a05] px-2.5 py-1 text-[10px] font-medium text-[#FFA033] hover:border-[#ff6a00]/40 hover:bg-[#201007] transition-all"
                  title="Test with preset IR thermal scan image"
                >
                  <Flame className="size-3 text-[#FF7A00]" />
                  <span>Sample IR</span>
                </button>
              )}

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about the process, manuals, or attached image..."
                className="flex-1 bg-transparent px-2 text-sm text-white placeholder:text-[#888888] outline-none"
              />

              <button
                type="submit"
                disabled={!input.trim() && !attachedImage}
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-[#8a3800] to-[#ff6a00] text-white shadow-md transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                title="Send Message"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* INTERACTIVE SOURCE CITATION MODAL PREVIEW */}
      <AnimatePresence>
        {selectedSource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-2xl border border-[#442211] bg-gradient-to-b from-[#3a1d0d] to-[#0a0a0a] p-6 text-white shadow-2xl"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#8a3800] to-[#ff6a00] text-white shadow-md">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      {selectedSource.name}
                    </h3>
                    <p className="text-xs text-[#FFA033] font-mono mt-0.5">
                      {selectedSource.docId || "DOC-REF-2026"} • {selectedSource.category || "Documentation"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSource(null)}
                  className="rounded-lg p-1 text-neutral-400 hover:bg-[#140a05] hover:text-white transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Confidence badge */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-400">
                <Check className="size-3" />
                <span>Vector Similarity: {selectedSource.relevance}% Match</span>
              </div>

              {/* Excerpt Box */}
              <div className="mb-5 rounded-xl border border-[#442211] bg-[#0c0603]/85 p-4 text-xs leading-relaxed text-[#E4D5AD] font-sans">
                <p className="font-semibold text-white mb-1.5 flex items-center gap-1.5">
                  <BookOpenIcon className="size-3.5 text-[#FF7A00]" />
                  Cited Text Excerpt:
                </p>
                <p className="italic">
                  "{selectedSource.excerpt || "Standard operational guidelines require continuous verification of crucible lining wear and temperature gradients."}"
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setSelectedSource(null)}
                  className="rounded-xl border border-[#442211] bg-[#140a05] px-4 py-2 text-xs font-medium text-white hover:bg-[#201007] transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BookOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
