import { createFileRoute } from "@tanstack/react-router";
import { ClimateBackground } from "@/components/ClimateBackground";
import { useClimateGuard } from "@/context/ClimateGuardContext";
import { sendAssistantQuery } from "@/services/api";
import {
  Bot,
  User,
  Send,
  Sparkles,
  Compass,
  Thermometer,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export const Route = createFileRoute("/assistant")({
  component: AssistantPage,
});

interface ChatMsg {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export function AssistantPage() {
  const {
    cityName,
    latitude,
    longitude,
    weather,
    riskLevel,
    heatRisk,
    rainRisk,
    operatorName,
    operatorId,
  } = useClimateGuard();

  const [messages, setMessages] = useState<ChatMsg[]>(() => [
    {
      id: "intro-1",
      sender: "assistant",
      text: `ClimateGuard AI Intelligence online for ${cityName}. Live sensors indicate ${weather ? `${weather.temperature}°C with ${weather.humidity}% humidity` : "nominal conditions"} (Risk: ${riskLevel}). How can I assist with your regional safety or weather foresight?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const suggestedPrompts = [
    "What's the weather here?",
    "Is my area at risk?",
    "Will it rain today?",
    "How should I prepare for extreme heat?",
    "What does my current risk mean?",
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMsg = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const answer = await sendAssistantQuery(textToSend, {
        userId: operatorId || undefined,
        name: operatorName,
        city: cityName,
        lat: latitude || undefined,
        lon: longitude || undefined,
        temp: weather?.temperature,
        humidity: weather?.humidity,
        rain: weather?.rainfall,
        risk: riskLevel,
        heatRisk,
        rainRisk,
      });

      const aiMsg: ChatMsg = {
        id: `ai-${Date.now()}`,
        sender: "assistant",
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: ChatMsg = {
        id: `err-${Date.now()}`,
        sender: "assistant",
        text: `Telemetry uplink interrupted. Local observation for ${cityName}: ${weather ? `${weather.temperature}°C, ${riskLevel} risk.` : "Perimeter status stable."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative isolate overflow-x-hidden pt-18 pb-20 px-4 sm:px-8 max-w-5xl mx-auto flex flex-col">
      <ClimateBackground />

      {/* Breadcrumb Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.08] text-[11px] font-mono mb-6">
        <div className="flex items-center gap-3">
          <span className="text-white/40">NEURAL FORESIGHT COGNITION</span>
          <span className="text-white/20">/</span>
          <span className="text-cyan-400 font-semibold">{cityName}</span>
          <span className="text-white/20">/</span>
          <span className="text-white/60">CLIMATE INTELLIGENCE CONSOLE</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-300 font-semibold">KNOWLEDGE MODEL ACTIVE</span>
        </div>
      </div>

      {/* Environmental Context Banner */}
      <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white/70">
            <Compass size={14} className="text-cyan-400" />
            <span>Sector: <strong className="text-white">{cityName}</strong></span>
          </div>

          <div className="flex items-center gap-2 text-white/70">
            <Thermometer size={14} className="text-amber-400" />
            <span>Temp: <strong className="text-white">{weather?.temperature || 24}°C</strong></span>
          </div>

          <div className="flex items-center gap-2 text-white/70">
            <ShieldAlert size={14} className="text-emerald-400" />
            <span>Risk Tier: <strong className="text-emerald-400">{riskLevel}</strong></span>
          </div>
        </div>

        <div className="text-[10px] text-white/40 uppercase tracking-widest hidden sm:block">
          RAG + Live Meteo Ingestion
        </div>
      </div>

      {/* Main Chat Box Container */}
      <div className="flex-1 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl flex flex-col overflow-hidden min-h-[520px] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {/* Terminal Header */}
        <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-white/80">
            <Terminal size={14} className="text-cyan-400" />
            <span>climate-intelligence://session/v0.1</span>
          </div>
          <span className="text-[10px] font-mono text-white/40">256-BIT ISOLATED CHANNEL</span>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {messages.map((m) => {
            const isAi = m.sender === "assistant";
            return (
              <div
                key={m.id}
                className={`flex gap-3.5 max-w-3xl ${
                  isAi ? "self-start" : "ml-auto flex-row-reverse"
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    isAi
                      ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-300"
                      : "bg-white/10 border-white/20 text-white"
                  }`}
                >
                  {isAi ? <Bot size={17} /> : <User size={17} />}
                </div>

                {/* Message Body */}
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border ${
                    isAi
                      ? "bg-white/[0.04] border-white/10 text-white/90"
                      : "bg-white/15 border-white/20 text-white font-medium"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1.5 text-[10px] font-mono text-white/40">
                    <span className="font-semibold">{isAi ? "CLIMATEGUARD INTELLIGENCE" : "OPERATOR"}</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{m.text}</div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center gap-3 text-cyan-400/90 text-xs font-mono p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 max-w-md">
              <Loader2 size={16} className="animate-spin text-cyan-400" />
              <span>CONSULTING CLIMATE INTELLIGENCE &amp; SENSORS...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div className="px-5 py-2.5 border-t border-white/5 bg-white/[0.01] flex flex-wrap gap-2">
          {suggestedPrompts.map((p) => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="px-3 py-1 rounded-full text-[11px] font-mono border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 border-t border-white/10 bg-black/60 flex items-center gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about temperature, heatwave, or safety in ${cityName}...`}
            disabled={loading}
            className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-white/40 outline-none focus:border-cyan-400/50 transition-all font-sans"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-5 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:hover:bg-cyan-400 text-black font-semibold text-xs tracking-wider uppercase transition-all flex items-center gap-2 active:scale-95 shadow-md shadow-cyan-400/20"
          >
            <span>Send</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
