import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { AssistantMessage } from '../types/climate';
import { audioService } from '../services/audioService';

const SUGGESTED_PROMPTS = [
  "What's the weather here?",
  "Is my area at risk?",
  "How should I prepare for extreme heat?",
  "Will it rain today?",
  "Explain my current risk.",
];

export const AIAssistantView: React.FC = () => {
  const { coordinates, conditions, operator, chat } = useClimate();
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'init-msg',
      sender: 'assistant',
      text: `ClimateGuard Intelligence Link active for ${coordinates.label || 'your area'}. Ask about live weather, risk, preparedness, or climate safety.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const text = (queryText || inputValue).trim();
    if (!text || isLoading) return;
    audioService.playTick();
    setError(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `usr-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chat(text);
      audioService.playChirp();
      setMessages((prev) => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          sender: 'assistant',
          text: response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setError('AI service unavailable. Check the ClimateGuard backend and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col gap-5 h-[calc(100vh-120px)] animate-fadeIn">
      <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-emerald-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI CLIMATE COPILOT & PREPAREDNESS ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">ClimateGuard Intelligence Assistant</h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
          <span className="text-slate-500">CONTEXT:</span>
          <span className="text-slate-200">{conditions.temperature}°C · {conditions.risk}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase whitespace-nowrap flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> QUICK QUERIES:
        </span>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button key={prompt} onClick={() => handleSend(prompt)} disabled={isLoading} className="px-3 py-1 rounded-lg text-xs font-mono bg-slate-900/80 hover:bg-slate-800 border border-slate-800/90 text-slate-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50">
            {prompt}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 bg-[#040814]/85 border border-slate-800/90 rounded-2xl p-4 sm:p-6 backdrop-blur-xl shadow-xl overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isMe = m.sender === 'user';
          return (
            <div key={m.id} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-mono border ${isMe ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                {isMe ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed ${isMe ? 'bg-sky-950/40 border border-sky-800/50 text-slate-100 rounded-tr-xs' : 'bg-slate-900/70 border border-slate-800/80 text-slate-200 rounded-tl-xs'}`}>
                <div className="flex items-center justify-between gap-4 mb-1 text-[10px] font-mono text-slate-400">
                  <span className="font-semibold uppercase tracking-wider text-slate-300">{isMe ? (operator.name || 'YOU') : 'CLIMATEGUARD ASSISTANT'}</span>
                  <span>{m.timestamp}</span>
                </div>
                <div className="font-sans whitespace-pre-line text-[13px] sm:text-sm">{m.text}</div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400"><Bot className="w-4 h-4" /></div>
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 text-xs font-mono text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>CONSULTING CLIMATE INTELLIGENCE...</span>
            </div>
          </div>
        )}
        {error && <div className="text-xs font-mono text-rose-400 border border-rose-500/20 bg-rose-500/5 rounded-xl px-4 py-3">{error}</div>}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2 bg-[#040814]/90 border border-slate-800/90 rounded-2xl p-2 backdrop-blur-xl shadow-xl focus-within:border-sky-500/80 transition-all">
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ask about local weather, climate risk, rain, or safety..." disabled={isLoading} className="flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-sans" />
        <button type="submit" disabled={isLoading || !inputValue.trim()} className="p-3 rounded-xl bg-[#e8e2d5] hover:bg-[#f2ece0] text-slate-950 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"><Send className="w-4 h-4" /></button>
      </form>
    </div>
  );
};
