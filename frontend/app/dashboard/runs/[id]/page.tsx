'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  Terminal,
  Database,
  BookOpen,
  PenLine,
  Users,
  ShieldCheck,
  Lightbulb,
  RefreshCw,
  Play,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { calculateStepCost, formatCost } from '@/utils/pricing';
import { connectSocket } from '@/utils/socket';
import { PlaygroundModal } from '@/components/PlaygroundModal';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

/** Renders a JSON value cleanly:
 *  - plain strings are shown as-is (so \n becomes a real newline, no wrapping quotes)
 *  - objects/arrays are pretty-printed JSON
 */
function formatJsonValue(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

type StepType =
  | 'LLM_CALL'
  | 'TOOL_CALL'
  | 'ERROR'
  | 'RETRIEVAL'
  | 'MEMORY_READ'
  | 'MEMORY_WRITE'
  | 'AGENT_HANDOFF'
  | 'GUARDRAIL'
  | 'PLANNING'
  | 'LOOP_DETECTED';

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
  state: unknown;
  createdAt: string;
}

interface Run {
  id: string;
  agentName: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'running' | 'completed' | 'failed';
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

function StepCard({ step, index, isExpanded, onToggle, isDimmed }: { step: Step; index: number; isExpanded: boolean; onToggle: () => void; isDimmed: boolean }) {
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);

  const handleExplain = async () => {
    setIsExplaining(true);
    try {
      const res = await fetch(`${BACKEND}/api/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          errorMessage: step.message,
          inputData: step.input,
          stack: step.stack
        })
      });
      if (!res.ok) throw new Error("Failed to fetch explanation");
      const data = await res.json();
      setExplanation(data.explanation);
    } catch (err) {
      setExplanation("Failed to generate AI explanation. Please check backend connection and API keys.");
    } finally {
      setIsExplaining(false);
    }
  };

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
    RETRIEVAL: {
      icon: <Database className="w-4 h-4" />,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      label: 'Retrieval',
    },
    MEMORY_READ: {
      icon: <BookOpen className="w-4 h-4" />,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      label: 'Memory Read',
    },
    MEMORY_WRITE: {
      icon: <PenLine className="w-4 h-4" />,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      label: 'Memory Write',
    },
    AGENT_HANDOFF: {
      icon: <Users className="w-4 h-4" />,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      label: 'Agent Handoff',
    },
    GUARDRAIL: {
      icon: <ShieldCheck className="w-4 h-4" />,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      label: 'Guardrail',
    },
    PLANNING: {
      icon: <Lightbulb className="w-4 h-4" />,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      label: 'Planning',
    },
    LOOP_DETECTED: {
      icon: <RefreshCw className="w-4 h-4" />,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      label: 'Loop Detected',
    },
  };

  const meta = stepMeta[step.type] ?? stepMeta.LLM_CALL;

  return (
    <>
      <div className={`rounded-xl border overflow-hidden transition-all duration-500 relative group ${step.type === 'ERROR'
        ? 'border-red-500/50 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)] scale-[1.01] z-10'
        : 'border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent hover:border-white/10 hover:from-white/[0.05]'
        } ${isDimmed ? 'opacity-40 grayscale-[0.5] hover:opacity-100 hover:grayscale-0' : ''}`}>
        
        {/* Subtle left border glow based on step type */}
        <div className={`absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity ${step.type === 'ERROR' ? 'bg-red-500' : 'bg-violet-500'}`} />

        {/* Step Header - always visible, clickable */}
        <button
          id={`step-${step.id}`}
          onClick={onToggle}
          className="w-full flex items-center gap-4 px-5 py-4 transition-colors text-left"
        >
          {/* Step number / timeline node */}
          <div className="relative shrink-0 flex items-center justify-center">
            {/* Ambient glow behind number on hover */}
            <div className="absolute inset-0 bg-violet-500/20 blur-md rounded-full scale-[1.8] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="w-7 h-7 rounded-full bg-[#0a0a0c] border border-white/10 text-[11px] text-zinc-400 flex items-center justify-center font-mono relative z-10 group-hover:border-violet-500/50 group-hover:text-violet-300 transition-colors shadow-inner">
              {index + 1}
            </span>
          </div>

          {/* Type badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${meta.color}`}>
            {meta.icon}
            {meta.label}
          </span>

          {/* Name (model or tool) */}
          <span className="text-sm text-zinc-300 font-mono truncate flex-1">
            {step.model ?? step.tool ?? step.message ?? (step.type === 'PLANNING' ? (step.input as any)?.thought : null) ?? '—'}
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
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </button>

        {/* Expandable detail */}
        {isExpanded && (
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
              <div className="px-5 py-4 bg-red-500/5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Error Message</p>
                  <button
                    onClick={handleExplain}
                    disabled={isExplaining || !!explanation}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isExplaining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                    {explanation ? "Explained by AI" : "Explain & Fix with AI"}
                  </button>
                </div>
                <p className="text-sm text-red-300 font-mono mb-4">{step.message}</p>

                {explanation && (
                  <div className="mb-4 p-3 rounded-lg border border-violet-500/20 bg-violet-500/10 text-xs text-violet-200">
                    <div className="flex items-center gap-1.5 font-semibold text-violet-300 mb-1">
                      <Zap className="w-3.5 h-3.5" /> AI Analysis
                    </div>
                    <div className="leading-relaxed prose prose-sm prose-invert prose-violet max-w-none [&_*]:text-xs [&_strong]:text-violet-200 [&_code]:bg-violet-500/20 [&_code]:text-violet-300 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
                      <ReactMarkdown>{explanation}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {step.stack && (
                  <details>
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
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    {step.type === 'PLANNING' ? 'Thought' : 'Input'}
                  </h3>
                  <div className="flex items-center gap-2">
                    {step.type === 'LLM_CALL' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setPlaygroundOpen(true); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-md"
                      >
                        <Zap className="w-3 h-3" /> Replay in Playground
                      </button>
                    )}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <CopyButton text={step.type === 'PLANNING' && (step.input as any)?.thought ? (step.input as any).thought : formatJsonValue(step.input)} />
                    </div>
                  </div>
                </div>
                <pre className="p-4 rounded-xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 text-xs text-zinc-800 dark:text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap shadow-sm dark:shadow-none max-h-64 overflow-y-auto">
                  {step.type === 'PLANNING' && (step.input as any)?.thought
                    ? (step.input as any).thought
                    : formatJsonValue(step.input)}
                </pre>
              </div>
              <div className="relative group">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    {step.type === 'PLANNING' ? 'Plan' : 'Output'}
                  </h3>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton text={step.type === 'PLANNING' && (step.output as any)?.plan ? (Array.isArray((step.output as any).plan) ? (step.output as any).plan.join('\n') : String((step.output as any).plan)) : formatJsonValue(step.output)} />
                  </div>
                </div>
                {typeof step.output === 'string' ? (
                  <div className="p-4 rounded-xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 shadow-sm dark:shadow-none max-h-96 overflow-y-auto prose prose-sm prose-zinc dark:prose-invert max-w-none text-xs text-zinc-800 dark:text-zinc-300 [&_*]:font-mono [&_p]:text-xs [&_li]:text-xs [&_strong]:font-bold [&_p]:leading-relaxed [&>p]:!mb-4 [&>ul]:!mb-4 [&>h1]:!mt-4 [&>h2]:!mt-4 [&>h3]:!mt-4 last:[&>p]:!mb-0">
                    <ReactMarkdown>{step.output}</ReactMarkdown>
                  </div>
                ) : (
                  <pre className="p-4 rounded-xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 text-xs text-zinc-800 dark:text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap shadow-sm dark:shadow-none max-h-64 overflow-y-auto">
                    {step.type === 'PLANNING' && (step.output as any)?.plan
                      ? (Array.isArray((step.output as any).plan)
                        ? (step.output as any).plan.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')
                        : String((step.output as any).plan))
                      : formatJsonValue(step.output)}
                  </pre>
                )}
              </div>
              {step.state != null && (
                <div className="relative group mt-6 border-t border-black/5 dark:border-white/5 pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">State Snapshot</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">Core Dump</span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <CopyButton text={formatJsonValue(step.state)} />
                    </div>
                  </div>
                  <pre className="p-4 rounded-xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 text-xs text-zinc-800 dark:text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap shadow-sm dark:shadow-none max-h-64 overflow-y-auto">
                    {formatJsonValue(step.state)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <PlaygroundModal
        isOpen={playgroundOpen}
        onClose={() => setPlaygroundOpen(false)}
        initialPrompt={typeof step.input === 'string' ? step.input : JSON.stringify(step.input, null, 2)}
        initialModel={step.model}
      />
    </>
  );
}


function StatusBadge({ status }: { status: Run['status'] }) {
  const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    completed: { cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20', icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Completed' },
    COMPLETED: { cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20', icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Completed' },
    failed: { cls: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20', icon: <AlertTriangle className="w-3.5 h-3.5" />, label: 'Failed' },
    FAILED: { cls: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20', icon: <AlertTriangle className="w-3.5 h-3.5" />, label: 'Failed' },
    running: { cls: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, label: 'Running' },
    RUNNING: { cls: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, label: 'Running' },
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
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`${BACKEND}/runs/${id}`, { credentials: 'include' })
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          window.location.href = '/auth/login';
          throw new Error('Unauthorized');
        }
        return r.json();
      })
      .then((data: Run) => {
        setRun(data);

        // Root Cause Auto-Focus logic
        const errorStep = data.steps.find(s => s.type === 'ERROR');
        if (errorStep) {
          setExpandedSteps(new Set([errorStep.id]));
          setTimeout(() => {
            document.getElementById(`step-${errorStep.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
        }
      })
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
  const totalCost = run?.steps.reduce((s, st) => s + calculateStepCost(st.model, st.tokens), 0) ?? 0;

  // Infinite Loop Detection: flag if any 3 consecutive tool calls are identical
  // Use sorted keys in JSON.stringify to prevent false negatives from key-order differences
  const stableStringify = (obj: any) => JSON.stringify(
    Object.keys(obj ?? {}).sort().reduce((acc: any, k) => { acc[k] = obj[k]; return acc; }, {})
  );
  let loopDetected = false;
  if (run) {
    const toolCalls = run.steps.filter(s => s.type === 'TOOL_CALL');
    for (let i = 0; i <= toolCalls.length - 3; i++) {
      const a = stableStringify({ tool: toolCalls[i].tool, input: toolCalls[i].input });
      const b = stableStringify({ tool: toolCalls[i + 1].tool, input: toolCalls[i + 1].input });
      const c = stableStringify({ tool: toolCalls[i + 2].tool, input: toolCalls[i + 2].input });
      if (a === b && b === c) { loopDetected = true; break; }
    }
  }

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

        {loopDetected && (
          <div className="mb-8 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-500 mb-1">Potential Infinite Loop Detected</h3>
              <p className="text-xs text-amber-400/80 leading-relaxed">
                We noticed this run repeated the exact same tool call multiple times in a row. This often indicates the agent got stuck. Consider updating your system prompt or tool descriptions to guide the model better.
              </p>
            </div>
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
                <div className="relative p-5">
                  {/* Vertical Timeline Line */}
                  <div className="absolute left-[47px] top-10 bottom-10 w-[2px] bg-gradient-to-b from-transparent via-violet-500/10 to-transparent pointer-events-none" />
                  
                  <div className="space-y-3 relative z-10">
                    {run.steps.map((step, i) => {
                      const hasError = run.steps.some(s => s.type === 'ERROR');
                      const isDimmed = hasError && step.type !== 'ERROR';
                      const isExpanded = expandedSteps.has(step.id);

                      return (
                        <StepCard
                          key={step.id}
                          step={step}
                          index={i}
                          isExpanded={isExpanded}
                          isDimmed={isDimmed}
                          onToggle={() => {
                            setExpandedSteps(prev => {
                              const next = new Set(prev);
                              if (next.has(step.id)) next.delete(step.id);
                              else next.add(step.id);
                              return next;
                            });
                          }}
                        />
                      );
                    })}
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
