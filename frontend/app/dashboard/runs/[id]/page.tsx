'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  DollarSign,
  Fingerprint,
  Layers,
  Box,
  ChevronUp,
  Terminal,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { calculateStepCost, formatCost } from '@/utils/pricing';
import { connectSocket } from '@/utils/socket';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

/** Renders a JSON value cleanly:
 *  - plain strings are shown as-is (so \n becomes a real newline, no wrapping quotes)
 *  - objects/arrays are pretty-printed JSON
 */
function formatJsonValue(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

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
          {step.tokens != null && step.model != null && calculateStepCost(step.model, step.tokens) > 0 && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {formatCost(calculateStepCost(step.model, step.tokens))}
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
          <div className="flex sm:hidden gap-4 px-5 py-3 text-xs text-zinc-500 flex-wrap">
            {step.tokens != null && (
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3" /> {step.tokens.toLocaleString()} tokens
              </span>
            )}
            {step.tokens != null && step.model != null && calculateStepCost(step.model, step.tokens) > 0 && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> {formatCost(calculateStepCost(step.model, step.tokens))}
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

          <div className="px-6 py-4 bg-zinc-100/50 dark:bg-black/20 border-t border-black/5 dark:border-white/5 space-y-6">
            <div className="relative group">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Input</h3>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton text={formatJsonValue(step.input)} />
                </div>
              </div>
              <pre className="p-4 rounded-xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 text-xs text-zinc-800 dark:text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap shadow-sm dark:shadow-none max-h-64 overflow-y-auto">
                {formatJsonValue(step.input)}
              </pre>
            </div>
            <div className="relative group">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Output</h3>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton text={formatJsonValue(step.output)} />
                </div>
              </div>
              {typeof step.output === 'string' ? (
                <div className="p-4 rounded-xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 shadow-sm dark:shadow-none max-h-96 overflow-y-auto prose prose-sm prose-zinc dark:prose-invert max-w-none text-xs text-zinc-800 dark:text-zinc-300 [&_*]:font-mono [&_p]:text-xs [&_li]:text-xs [&_strong]:font-bold [&_p]:leading-relaxed [&>p]:!mb-4 [&>ul]:!mb-4 [&>h1]:!mt-4 [&>h2]:!mt-4 [&>h3]:!mt-4 last:[&>p]:!mb-0">
                  <ReactMarkdown>{step.output}</ReactMarkdown>
                </div>
              ) : (
                <pre className="p-4 rounded-xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 text-xs text-zinc-800 dark:text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap shadow-sm dark:shadow-none max-h-64 overflow-y-auto">
                  {formatJsonValue(step.output)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Run['status'] }) {
  const map: Record<Run['status'], { cls: string; icon: React.ReactNode; label: string }> = {
    completed: { cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20', icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Completed' },
    failed: { cls: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20', icon: <AlertTriangle className="w-3.5 h-3.5" />, label: 'Failed' },
    running: { cls: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, label: 'Running' },
  };
  const s = map[status] ?? map.running;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center gap-3 shadow-sm dark:shadow-none">
      <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export default function TraceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BACKEND}/runs/${id}`, { credentials: 'include' })
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          window.location.href = '/auth/login';
          throw new Error('Unauthorized');
        }
        return r.json();
      })
      .then((data: Run) => setRun(data))
      .catch(() => setError('Could not load this run.'))
      .finally(() => setLoading(false));

    const socket = connectSocket();
    const handleRunEnded = ({ run: updatedRun }: { run: any }) => {
      if (updatedRun.id !== id) return;
      setRun(prev => prev ? { ...prev, status: updatedRun.status, totalMs: updatedRun.totalMs } : prev);
    };
    const handleStepAdded = ({ step }: { step: any }) => {
      if (step.runId !== id) return;
      setRun(prev => {
        if (!prev) return prev;
        if (prev.steps.some(s => s.id === step.id)) return prev;
        return { ...prev, steps: [...prev.steps, step] };
      });
    };
    socket.on("run_ended", handleRunEnded);
    socket.on("step_added", handleStepAdded);
    return () => {
      socket.off("run_ended", handleRunEnded);
      socket.off("step_added", handleStepAdded);
    };
  }, [id]);

  const totalTokens = run?.steps.reduce((s, st) => s + (st.tokens ?? 0), 0) ?? 0;
  const totalCost   = run?.steps.reduce((s, st) => s + calculateStepCost(st.model, st.tokens), 0) ?? 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#030305] text-zinc-900 dark:text-white font-sans transition-colors duration-300">
      <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-violet-600/10 rounded-full filter blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[300px] bg-indigo-600/10 rounded-full filter blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard" className="p-2 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors shadow-sm dark:shadow-none">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
                <Terminal className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white truncate">
                {run?.agentName ?? 'Trace Details'}
              </h1>
              {run && <StatusBadge status={run.status} />}
            </div>
            <div className="flex items-center gap-4 text-sm text-zinc-500 ml-[88px]">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {run ? new Date(run.createdAt).toLocaleString() : 'Loading...'}</span>
              <span className="flex items-center gap-1.5"><Fingerprint className="w-4 h-4" /> <span className="font-mono text-xs">{id}</span></span>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 text-zinc-500 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
            <span className="text-sm">Loading trace data…</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-20 text-red-500 text-sm gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        {run && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox icon={<Layers className="w-4 h-4" />} label="Steps" value={String(run.steps.length)} />
              <StatBox icon={<Zap className="w-4 h-4" />} label="Total Tokens" value={String(totalTokens)} />
              <StatBox icon={<DollarSign className="w-4 h-4" />} label="Est. Cost" value={formatCost(totalCost)} />
              <StatBox icon={<Clock className="w-4 h-4" />} label="Total Duration" value={run.totalMs ? `${(run.totalMs / 1000).toFixed(2)}s` : 'Running...'} />
            </div>

            <div className="bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
              <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center gap-2">
                <Box className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Trace Waterfall</h2>
                <span className="text-xs text-zinc-500">({run.steps.length} steps, chronological)</span>
              </div>

              {run.steps.length === 0 ? (
                <div className="text-center py-16 text-zinc-600 text-sm">No steps recorded for this run.</div>
              ) : (
                <div className="relative">
                  <div className="divide-y divide-black/5 dark:divide-white/5">
                    {run.steps.map((step, i) => (
                      <StepCard key={step.id} step={step} index={i} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
