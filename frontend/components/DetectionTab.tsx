"use client";

import { useState, useEffect } from "react";
import {
  Loader2, AlertTriangle, Smile, Frown, Meh, Lightbulb,
  MessageSquare, ChevronDown, ChevronUp, Eye,
} from "lucide-react";
import Link from "next/link";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

interface Detection {
  id: string; runId: string; agentName: string; model: string | null;
  tokens: number | null; latencyMs: number | null; input: string; output: string;
  sentiment: "positive" | "negative" | "neutral"; score: number; suggestion: string; createdAt: string;
}

interface DetectionData {
  detections: Detection[];
  sentimentCounts: { positive: number; negative: number; neutral: number };
  suggestions: string[];
  totalAnalyzed: number;
}

const SENTIMENT_CFG = {
  positive: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", icon: Smile, label: "Positive" },
  negative: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", icon: Frown, label: "Negative" },
  neutral: { bg: "bg-zinc-500/10", border: "border-zinc-500/20", text: "text-zinc-400", icon: Meh, label: "Neutral" },
};

function SentimentBadge({ sentiment }: { sentiment: Detection["sentiment"] }) {
  const c = SENTIMENT_CFG[sentiment]; const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${c.bg} ${c.border} ${c.text} uppercase tracking-wider`}>
      <Icon className="w-3 h-3" />{c.label}
    </span>
  );
}

export default function DetectionTab({ runId }: { runId: string }) {
  const [data, setData] = useState<DetectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ runId });
    if (filter !== "all") params.append("sentiment", filter);
    fetch(`${BACKEND}/api/detection?${params}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => d.error ? (setError(d.error), setData(null)) : setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [runId, filter]);

  const toggle = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const filterBtns = [
    { key: "all", label: "All", icon: Eye },
    { key: "positive", label: "Positive", icon: Smile },
    { key: "negative", label: "Negative", icon: Frown },
    { key: "neutral", label: "Neutral", icon: Meh },
  ];

  if (loading) return <div className="flex items-center justify-center py-16 text-zinc-500 gap-3"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs">Analyzing sentiment…</span></div>;
  if (error || !data) return <div className="flex items-center justify-center py-16 text-red-400 text-xs gap-2"><AlertTriangle className="w-4 h-4" />{error || "Failed to load."}</div>;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {(["positive", "negative", "neutral"] as const).map(s => {
          const c = SENTIMENT_CFG[s]; const Icon = c.icon;
          const count = data.sentimentCounts[s];
          const pct = data.totalAnalyzed > 0 ? Math.round((count / data.totalAnalyzed) * 100) : 0;
          return (
            <div key={s} className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/50 flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${c.bg}`}><Icon className={`w-4 h-4 ${c.text}`} /></div>
              <div>
                <p className="text-lg font-semibold text-zinc-100">{count}</p>
                <p className="text-[10px] text-zinc-500">{c.label} · {pct}%</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestions */}
      {data.suggestions.length > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-amber-300">AI Suggestions</span>
          </div>
          {data.suggestions.map((s, i) => <p key={i} className="text-xs text-amber-200/80 leading-relaxed">{s}</p>)}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        {filterBtns.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${filter === key ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-transparent border-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              }`}>
            <Icon className="w-3.5 h-3.5" />{label}
            {key !== "all" && <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${filter === key ? "bg-zinc-700 text-zinc-300" : "bg-zinc-800/50 text-zinc-600"}`}>
              {data.sentimentCounts[key as keyof typeof data.sentimentCounts]}
            </span>}
          </button>
        ))}
      </div>

      {/* Results */}
      {data.detections.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-zinc-500 gap-3">
          <MessageSquare className="w-6 h-6 text-zinc-600" />
          <p className="text-xs">No LLM responses found for this filter.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 divide-y divide-zinc-800/50 overflow-hidden">
          {data.detections.map(d => (
            <div key={d.id}>
              <button onClick={() => toggle(d.id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/30 transition-colors text-left">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <SentimentBadge sentiment={d.sentiment} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      {d.model && <span className="text-[10px] text-zinc-600 font-mono">{d.model}</span>}
                      {d.tokens && <span className="text-[10px] text-zinc-600 font-mono">{d.tokens} tok</span>}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{d.output || d.input || "—"}</p>
                  </div>
                </div>
                {expanded.has(d.id) ? <ChevronUp className="w-4 h-4 text-zinc-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-600 shrink-0" />}
              </button>
              {expanded.has(d.id) && (
                <div className="px-4 pb-3 bg-zinc-900/30 border-t border-zinc-800/30 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {d.input && <div><p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1">Input</p><div className="text-xs text-zinc-400 bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50 font-mono leading-relaxed">{d.input}</div></div>}
                    {d.output && <div><p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1">Output</p><div className="text-xs text-zinc-400 bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50 font-mono leading-relaxed">{d.output}</div></div>}
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300/80 leading-relaxed">{d.suggestion}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
