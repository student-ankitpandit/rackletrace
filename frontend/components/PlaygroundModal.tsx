'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X, Zap, Brain, Loader2, Copy, Check, ChevronDown,
  Hash, Clock, AlertTriangle, Play,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

const MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', note: 'Fast & cheap' },
  { value: 'gpt-4o', label: 'GPT-4o', note: 'Most capable' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', note: 'Legacy fast' },
];

interface PlaygroundResult {
  output: string;
  tokens: number | null;
  latencyMs: number;
  model?: string;
  finishReason?: string | null;
}

interface PlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt: string;
  initialModel: string | null;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function PlaygroundModal({ isOpen, onClose, initialPrompt, initialModel }: PlaygroundModalProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [model, setModel] = useState(initialModel ?? 'gpt-4o-mini');
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Sync initial values when opened
  useEffect(() => {
    if (isOpen) {
      setPrompt(initialPrompt);
      setModel(initialModel ?? 'gpt-4o-mini');
      setResult(null);
      setError(null);
      setTimeout(() => promptRef.current?.focus(), 100);
    }
  }, [isOpen, initialPrompt, initialModel]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleRun = async () => {
    if (!prompt.trim() || isRunning) return;
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${BACKEND}/api/playground`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt, model, systemPrompt: systemPrompt || undefined }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? `HTTP ${res.status}`);
      }

      const data: PlaygroundResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal panel */}
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Prompt Playground</h2>
              <p className="text-[10px] text-zinc-500">Replay & iterate on this LLM step</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Model selector */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-zinc-400 shrink-0">Model</label>
            <div className="relative">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="appearance-none bg-zinc-900 border border-white/10 text-zinc-200 text-xs rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                {MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label} — {m.note}
                  </option>
                ))}
                {model && !MODELS.some(m => m.value === model) && (
                  <option key={model} value={model}>
                    {model} (Custom)
                  </option>
                )}
              </select>
              <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* System prompt toggle */}
          <div>
            <button
              onClick={() => setShowSystemPrompt((v) => !v)}
              className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors flex items-center gap-1.5 mb-2"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSystemPrompt ? 'rotate-0' : '-rotate-90'}`} />
              System Prompt (optional)
            </button>
            {showSystemPrompt && (
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful assistant..."
                rows={3}
                className="w-full bg-zinc-900 border border-white/10 text-zinc-200 text-xs font-mono rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-emerald-500/40 placeholder:text-zinc-600 transition-colors"
              />
            )}
          </div>

          {/* Prompt editor */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
              User Prompt
            </label>
            <textarea
              ref={promptRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
              className="w-full bg-zinc-900 border border-white/10 text-zinc-200 text-xs font-mono rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-emerald-500/40 placeholder:text-zinc-600 transition-colors leading-relaxed"
              placeholder="Enter your prompt here..."
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleRun();
              }}
            />
            <p className="text-[10px] text-zinc-600 mt-1">Press Ctrl+Enter or ⌘+Enter to run</p>
          </div>

          {/* Error state */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-red-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
              {/* Result header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-emerald-500/10">
                <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <Brain className="w-3 h-3" /> {result.model ?? model}
                  </span>
                  {result.tokens && (
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" /> {result.tokens.toLocaleString()} tokens
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {result.latencyMs >= 1000
                      ? `${(result.latencyMs / 1000).toFixed(2)}s`
                      : `${result.latencyMs}ms`}
                  </span>
                  {result.finishReason && (
                    <span className="capitalize">{result.finishReason}</span>
                  )}
                </div>
                <CopyBtn text={result.output} />
              </div>
              {/* Result body */}
              <div className="px-4 py-4 prose prose-sm prose-invert max-w-none text-xs text-zinc-200 [&_*]:font-mono [&_p]:leading-relaxed [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
                <ReactMarkdown>{result.output}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Footer with run button */}
        <div className="shrink-0 px-6 py-4 border-t border-white/10 flex items-center justify-between gap-4 bg-zinc-950">
          <p className="text-[10px] text-zinc-600">
            Results are <strong className="text-zinc-500">not</strong> saved as a new run step
          </p>
          <button
            onClick={handleRun}
            disabled={isRunning || !prompt.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black disabled:text-zinc-500 text-xs font-semibold transition-all shadow-lg shadow-emerald-500/20"
          >
            {isRunning ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running…</>
            ) : (
              <><Play className="w-3.5 h-3.5" /> Run Prompt</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
