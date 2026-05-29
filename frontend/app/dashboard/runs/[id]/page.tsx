'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Brain,
  Wrench,
  Clock,
  ChevronDown,
  ChevronRight,
  Zap,
  Hash,
  Activity,
  Copy,
  Check,
} from 'lucide-react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

type StepType = 'LLM_CALL' | 'TOOL_CALL' | 'ERROR';

interface Step {
  id: string;
  type: StepType;
  input: unknown;
  output: unknown;
  model: string | null;
  tool: string | null;
  tokens: number | null;
  latencyMs: number | null;
  message: string | null;
  stack: string | null;
  createdAt: string;
}

interface Run {
  id: string;
  agentName: string;
  status: 'running' | 'completed' | 'failed';
  totalMs: number | null;
  createdAt: string;
  updatedAt: string;
  steps: Step[];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function StepCard({ step, index }: { step: Step; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const stepMeta: Record<StepType, { icon: React.ReactNode; color: string; label: string }> = {
    LLM_CALL: {
      icon: <Brain className="w-4 h-4" />,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
      label: 'LLM Call',
    },
    TOOL_CALL: {
      icon: <Wrench className="w-4 h-4" />,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      label: 'Tool Call',
    },
    ERROR: {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-red-400 bg-red-500/10 border-red-500/20',
      label: 'Error',
    },
  };

  const meta = stepMeta[step.type] ?? stepMeta.LLM_CALL;
  const inputStr = JSON.stringify(step.input, null, 2);
  const outputStr = JSON.stringify(step.output, null, 2);

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${step.type === 'ERROR' ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 bg-white/[0.03]'}`}>
      {/* Step Header - always visible, clickable */}
      <button
        id={`step-${step.id}`}
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left"
      >
        {/* Step number */}
        <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 flex items-center justify-center shrink-0 font-mono">
          {index + 1}
        </span>

        {/* Type badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${meta.color}`}>
          {meta.icon}
          {meta.label}
        </span>

        {/* Name (model or tool) */}
        <span className="text-sm text-zinc-300 font-mono truncate flex-1">
          {step.model ?? step.tool ?? step.message ?? '—'}
        </span>

        {/* Metrics */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-500 shrink-0">
          {step.tokens != null && (
            <span className="flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {step.tokens.toLocaleString()} tokens
            </span>
          )}
          {step.latencyMs != null && (
            <span className={`flex items-center gap-1 ${step.latencyMs > 5000 ? 'text-amber-400' : ''}`}>
              <Clock className="w-3 h-3" />
              {step.latencyMs >= 1000 ? `${(step.latencyMs / 1000).toFixed(2)}s` : `${step.latencyMs}ms`}
            </span>
          )}
        </div>

        {/* Expand chevron */}
        <div className="text-zinc-600 shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable detail */}
      {expanded && (
        <div className="border-t border-white/10 divide-y divide-white/5">
          {/* Mobile metrics */}
          <div className="flex sm:hidden gap-4 px-5 py-3 text-xs text-zinc-500">
            {step.tokens != null && (
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3" /> {step.tokens.toLocaleString()} tokens
              </span>
            )}
            {step.latencyMs != null && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {step.latencyMs >= 1000 ? `${(step.latencyMs / 1000).toFixed(2)}s` : `${step.latencyMs}ms`}
              </span>
            )}
          </div>

          {/* Error detail */}
          {step.type === 'ERROR' && step.message && (
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider">Error Message</p>
              <p className="text-sm text-red-300 font-mono">{step.message}</p>
              {step.stack && (
                <details className="mt-3">
                  <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">
                    View stack trace
                  </summary>
                  <pre className="mt-2 text-xs text-zinc-400 font-mono bg-black/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
                    {step.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Input */}
          {step.input != null && (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Input / Prompt</p>
                <CopyButton text={inputStr} />
              </div>
              <pre className="text-xs text-zinc-300 font-mono bg-black/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                {inputStr}
              </pre>
            </div>
          )}

          {/* Output */}
          {step.output != null && (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Output / Response</p>
                <CopyButton text={outputStr} />
              </div>
              <pre className="text-xs text-zinc-300 font-mono bg-black/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                {outputStr}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Run['status'] }) {
  const map: Record<Run['status'], { cls: string; icon: React.ReactNode; label: string }> = {
    completed: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Completed' },
    failed: { cls: 'bg-red-500/10 text-red-400 border-red-500/20', icon: <AlertTriangle className="w-3.5 h-3.5" />, label: 'Failed' },
    running: { cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, label: 'Running' },
  };
  const s = map[status] ?? map.running;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

export default function TraceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BACKEND}/runs/${id}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data: Run) => setRun(data))
      .catch(() => setError('Could not load this run.'))
      .finally(() => setLoading(false));
  }, [id]);

  const totalTokens = run?.steps.reduce((s, st) => s + (st.tokens ?? 0), 0) ?? 0;
  const errorSteps  = run?.steps.filter((s) => s.type === 'ERROR').length ?? 0;

  return (
    <div className="min-h-screen bg-[#030305] text-white font-sans">
      <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-violet-600/10 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        {/* Back */}
        <button
          id="back-to-dashboard"
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {loading && (
          <div className="flex items-center justify-center gap-3 py-20 text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            <span className="text-sm">Loading trace…</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-20 text-red-400 text-sm gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        {run && (
          <>
            {/* Run Header */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                      <Activity className="w-4 h-4 text-violet-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white">{run.agentName}</h1>
                    <StatusBadge status={run.status} />
                  </div>
                  <p className="text-xs text-zinc-500 font-mono ml-10">{run.id}</p>
                </div>
              </div>

              {/* Run metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {[
                  { icon: <Zap className="w-4 h-4" />, label: 'Steps', value: String(run.steps.length) },
                  { icon: <Clock className="w-4 h-4" />, label: 'Duration', value: run.totalMs ? `${(run.totalMs / 1000).toFixed(2)}s` : '—' },
                  { icon: <Hash className="w-4 h-4" />, label: 'Total Tokens', value: totalTokens > 0 ? totalTokens.toLocaleString() : '—' },
                  { icon: <AlertTriangle className="w-4 h-4" />, label: 'Errors', value: String(errorSteps) },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="bg-black/20 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                      {icon}
                      <span className="text-xs">{label}</span>
                    </div>
                    <p className="text-lg font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Waterfall Steps */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-violet-400" />
                <h2 className="text-sm font-semibold text-white">Trace Waterfall</h2>
                <span className="text-xs text-zinc-500">({run.steps.length} steps, chronological)</span>
              </div>

              {run.steps.length === 0 ? (
                <div className="text-center py-16 text-zinc-600 text-sm">No steps recorded for this run.</div>
              ) : (
                <div className="relative">
                  <div className="space-y-3">
                    {run.steps.map((step, i) => (
                      <StepCard key={step.id} step={step} index={i} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
