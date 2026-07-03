"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, X, Send, Loader2, Sparkles, User, Bot,
  Trash2, Minimize2, Maximize2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "Why did this run fail?",
  "Summarize the last 10 traces",
  "Find traces with high latency",
  "Compare model performance",
  "What are the common errors?",
  "Analyze token usage trends",
];

export default function ChatPanel({ runId, agentName }: { runId?: string; agentName?: string }) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !minimized) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, open, minimized]);

  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus();
  }, [open, minimized]);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: msg, runId, history }),
      });
      const data = await res.json();

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response || data.error || "Something went wrong.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: "assistant",
        content: "Failed to reach Rackle AI. Check your backend connection.", timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => { setMessages([]); };

  // Floating button when closed
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-xl shadow-black/10 dark:shadow-black/30 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
        title="Ask Rackle AI"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full animate-pulse" />
      </button>
    );
  }

  // Minimized bar
  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-full pl-4 pr-2 py-2 shadow-xl shadow-black/10 dark:shadow-black/30 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
        onClick={() => setMinimized(false)}>
        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs font-medium text-zinc-900 dark:text-zinc-300">Rackle AI</span>
        {messages.length > 0 && <span className="text-[10px] text-zinc-500">{messages.length} msgs</span>}
        <button onClick={(e) => { e.stopPropagation(); setOpen(false); setMinimized(false); }}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors ml-1 cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Full chat panel
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[600px] flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0a0a0a] shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden animate-in slide-in-from-bottom-4 duration-200 transition-colors">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#000] transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-200">Rackle AI</p>
            <p className="text-[10px] text-zinc-500">
              {agentName ? `Analyzing ${agentName}` : "Ask anything about your traces"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button onClick={clearChat} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-400 transition-colors cursor-pointer" title="Clear chat">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => setMinimized(true)} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-400 transition-colors cursor-pointer" title="Minimize">
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setOpen(false); setMinimized(false); }} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-400 transition-colors cursor-pointer" title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-300 mb-1 transition-colors">Ask Rackle AI</p>
              <p className="text-xs text-zinc-500 max-w-[260px]">
                I can analyze your traces, find errors, compare performance, and help debug your agents.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full mt-2">
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="text-left px-3 py-2 text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-lg transition-all leading-tight cursor-pointer">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-violet-400" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed transition-colors ${
              msg.role === "user"
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-br-md"
                : "bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/50 text-zinc-800 dark:text-zinc-300 rounded-bl-md"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-zinc dark:prose-invert prose-xs max-w-none [&_p]:mb-2 [&_p]:last:mb-0 [&_li]:mb-0.5 [&_ul]:mb-2 [&_code]:bg-zinc-200 dark:[&_code]:bg-zinc-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[10px] [&_pre]:bg-zinc-100 dark:[&_pre]:bg-zinc-950 [&_pre]:p-2 [&_pre]:rounded-lg [&_pre]:text-[10px] [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-200 [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-xs [&_h3]:font-medium [&_h3]:text-zinc-800 dark:[&_h3]:text-zinc-300 [&_strong]:text-zinc-900 dark:[&_strong]:text-zinc-200 [&_table]:text-[10px] [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                <User className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-violet-400" />
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 transition-colors">
              <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
              <span className="text-xs text-zinc-500">Analyzing traces…</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-zinc-200 dark:border-zinc-800/50 transition-colors">
        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-colors">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask about your traces..."
            disabled={loading}
            className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
        <p className="text-[9px] text-zinc-600 mt-1.5 text-center">Rackle AI analyzes your real trace data</p>
      </div>
    </div>
  );
}
