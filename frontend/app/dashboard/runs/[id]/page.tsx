'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Loader2, Clock,
  Activity, Play, Check, Sparkles, ClipboardList, BarChart3,
} from 'lucide-react';
import { connectSocket } from '@/utils/socket';
import WorkflowNode, { type Step } from '@/components/WorkflowNode';
import DetectionTab from '@/components/DetectionTab';
import EvalsTab from '@/components/EvalsTab';
import AnalyticsTab from '@/components/AnalyticsTab';
import ChatPanel from '@/components/ChatPanel';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

interface Run {
  id: string;
  agentName: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'running' | 'completed' | 'failed';
  totalMs: number | null;
  createdAt: string;
  updatedAt: string;
  steps: Step[];
}

type TabKey = 'workflow' | 'analytics' | 'detection' | 'evals';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'workflow', label: 'Workflow', icon: Activity },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'detection', label: 'Detection', icon: Sparkles },
  { key: 'evals', label: 'Evals', icon: ClipboardList },
];

export default function TraceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('workflow');

  useEffect(() => {
    fetch(`${BACKEND}/runs/${id}`, { credentials: 'include' })
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) { window.location.href = '/auth/login'; throw new Error('Unauthorized'); }
        return r.json();
      })
      .then((data: Run) => {
        setRun(data);
        const errorStep = data.steps.find(s => s.type === 'ERROR');
        if (errorStep) {
          setExpandedSteps(new Set([errorStep.id]));
          setTimeout(() => { document.getElementById(`step-${errorStep.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300);
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
    return () => { socket.off("run_ended", handleRunEnded); socket.off("step_added", handleStepAdded); };
  }, [id]);

  const toggleAll = () => {
    if (!run) return;
    if (allExpanded) { setExpandedSteps(new Set()); setAllExpanded(false); }
    else { setExpandedSteps(new Set(run.steps.map(s => s.id))); setAllExpanded(true); }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'FAILED': return <AlertTriangle className="w-3 h-3 text-white" />;
      case 'RUNNING': return <Loader2 className="w-3 h-3 animate-spin text-white" />;
      default: return <Check className="w-3 h-3 text-white" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'FAILED': return 'bg-red-500 border-red-400';
      case 'RUNNING': return 'bg-blue-500 border-blue-400';
      default: return 'bg-emerald-500 border-emerald-400';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-200 dark:bg-[#000] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-violet-500/30 transition-colors">
      <div className="fixed inset-0 bg-gradient-to-b from-zinc-100 to-zinc-200 dark:from-[#0a0a0a] dark:to-[#000] pointer-events-none transition-colors" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">

        {/* Title & Info Bar */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <h1 className="text-xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 transition-colors">
                  {run?.agentName ?? 'Trace Details'}
                </h1>
                {run && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono transition-colors">
                    {run.totalMs ? `${(run.totalMs / 1000).toFixed(2)}s` : '—'}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 font-mono transition-colors">
                {run ? new Date(run.createdAt).toLocaleString() : 'Loading...'}
              </p>
            </div>
          </div>

          {activeTab === 'workflow' && (
            <button
              onClick={toggleAll}
              className="px-3 py-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
            >
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg border transition-all ${activeTab === key
                  ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            <span className="text-sm">Loading trace...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-24 text-red-400 gap-3">
            <AlertTriangle className="w-6 h-6" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Tab Content */}
        {run && activeTab === 'workflow' && (
          <div className="max-w-3xl">
            {run.steps?.length === 0 ? (
              <div className="text-center py-16 text-zinc-600 text-sm">No steps recorded.</div>
            ) : (
              <div className="relative">
                <div className="absolute left-[15px] top-[24px] bottom-[24px] w-[1px] bg-zinc-200 dark:bg-zinc-800 transition-colors" />
                <div className="space-y-6">
                  {/* Pipeline Start */}
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-[30px] h-[30px] rounded-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 transition-colors">
                      <Play className="w-3 h-3 ml-0.5" />
                    </div>
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Workflow Started</span>
                  </div>

                  {/* Steps */}
                  <div className="space-y-4">
                    {run.steps?.map((step, i) => {
                      const hasError = run.steps.some(s => s.type === 'ERROR');
                      const isDimmed = hasError && step.type !== 'ERROR';
                      return (
                        <WorkflowNode
                          key={step.id}
                          step={step}
                          index={i}
                          total={run.steps.length}
                          isExpanded={expandedSteps.has(step.id)}
                          isDimmed={isDimmed}
                          onToggle={() => {
                            setExpandedSteps(prev => {
                              const next = new Set(prev);
                              if (next.has(step.id)) next.delete(step.id); else next.add(step.id);
                              return next;
                            });
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Pipeline End */}
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-[30px] h-[30px] rounded-full border flex items-center justify-center shadow-sm ${getStatusBg(run.status)}`}>
                      {getStatusIcon(run.status)}
                    </div>
                    <span className={`text-xs font-medium uppercase tracking-wide ${run.status?.toUpperCase() === 'FAILED' ? 'text-red-400' :
                        run.status?.toUpperCase() === 'RUNNING' ? 'text-blue-400' :
                          'text-emerald-400'
                      }`}>
                      {run.status?.toUpperCase() === 'FAILED' ? 'Workflow Failed' :
                        run.status?.toUpperCase() === 'RUNNING' ? 'In Progress' :
                          'Workflow Completed'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {run && activeTab === 'analytics' && (
          <AnalyticsTab agentName={run.agentName} />
        )}

        {run && activeTab === 'detection' && (
          <DetectionTab runId={run.id} />
        )}

        {run && activeTab === 'evals' && (
          <EvalsTab agentName={run.agentName} runId={run.id} />
        )}
      </div>

      {/* Floating Chat Button */}
      {run && <ChatPanel runId={run.id} agentName={run.agentName} />}
    </div>
  );
}
