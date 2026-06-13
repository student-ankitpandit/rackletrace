'use client';

import { useState } from 'react';
import {
  Brain, Wrench, AlertTriangle, Loader2, Clock,
  Zap, Hash, DollarSign, Database, BookOpen, PenLine, Users, ShieldCheck,
  Lightbulb, RefreshCw, Copy, Check, ChevronDown, ChevronRight,
  MessageSquare, Settings, CheckCircle2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { calculateStepCost, formatCost } from '@/utils/pricing';
import { PlaygroundModal } from '@/components/PlaygroundModal';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

function formatJsonValue(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

export type StepType =
  | 'LLM_CALL' | 'TOOL_CALL' | 'ERROR' | 'RETRIEVAL'
  | 'MEMORY_READ' | 'MEMORY_WRITE' | 'AGENT_HANDOFF'
  | 'GUARDRAIL' | 'PLANNING' | 'LOOP_DETECTED';

export interface Step {
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

function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className={`p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all ${className}`}
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// Minimal, muted colors mimicking the clean reference design
const STEP_META: Record<StepType, { icon: React.ReactNode; color: string; label: string }> = {
  PLANNING:      { icon: <MessageSquare className="w-3.5 h-3.5" />,   color: 'text-zinc-400', label: 'Prompt' },
  LLM_CALL:      { icon: <Brain className="w-3.5 h-3.5" />,           color: 'text-zinc-400', label: 'Model' },
  TOOL_CALL:     { icon: <Settings className="w-3.5 h-3.5" />,        color: 'text-zinc-400', label: 'Tool' },
  ERROR:         { icon: <AlertTriangle className="w-3.5 h-3.5" />,   color: 'text-red-400',  label: 'Error' },
  RETRIEVAL:     { icon: <Database className="w-3.5 h-3.5" />,        color: 'text-zinc-400', label: 'Context' },
  MEMORY_READ:   { icon: <BookOpen className="w-3.5 h-3.5" />,        color: 'text-zinc-400', label: 'Read' },
  MEMORY_WRITE:  { icon: <PenLine className="w-3.5 h-3.5" />,         color: 'text-zinc-400', label: 'Write' },
  AGENT_HANDOFF: { icon: <Users className="w-3.5 h-3.5" />,           color: 'text-zinc-400', label: 'Agent' },
  GUARDRAIL:     { icon: <CheckCircle2 className="w-3.5 h-3.5" />,    color: 'text-zinc-400', label: 'Guardrail' },
  LOOP_DETECTED: { icon: <RefreshCw className="w-3.5 h-3.5" />,       color: 'text-orange-400', label: 'Loop' },
};

function ContentBlock({ title, content, isString = true }: { title: string, content: any, isString?: boolean }) {
  if (content == null) return null;
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{title}</span>
        <CopyButton text={isString ? content : formatJsonValue(content)} className="opacity-0 group-hover:opacity-100" />
      </div>
      {isString && typeof content === 'string' ? (
        <div className="text-sm text-zinc-300 leading-relaxed prose prose-invert prose-p:my-1 max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      ) : (
        <pre className="text-[11px] font-mono text-zinc-400 bg-zinc-900/50 p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
          {formatJsonValue(content)}
        </pre>
      )}
    </div>
  );
}

export default function WorkflowNode({
  step, index, total, isExpanded, onToggle, isDimmed,
}: {
  step: Step; index: number; total: number; isExpanded: boolean; onToggle: () => void; isDimmed: boolean;
}) {
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const meta = STEP_META[step.type] ?? STEP_META.LLM_CALL;
  const isError = step.type === 'ERROR';

  // Build compact summary for collapsed state
  const summaryText = step.type === 'PLANNING' 
    ? (step.input as any)?.thought?.slice(0, 100) 
    : step.type === 'ERROR' ? step.message 
    : step.type === 'TOOL_CALL' ? step.tool 
    : step.model;

  return (
    <>
      <div className={`relative group transition-opacity duration-200 ${isDimmed ? 'opacity-40 hover:opacity-100' : ''}`}>
        <div className="flex items-start gap-4">
          
          {/* Node Icon */}
          <div className="relative z-10 mt-1 shrink-0 bg-[#000] py-1">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border border-zinc-800 bg-zinc-900 shadow-sm ${meta.color}`}>
              {meta.icon}
              <span className="text-[10px] font-medium uppercase tracking-wider">{meta.label}</span>
            </div>
          </div>

          {/* Node Content */}
          <div className={`flex-1 min-w-0 pt-2 pb-4 ${isExpanded ? 'border-b border-zinc-800/50' : ''}`}>
            
            {/* Header: Always visible */}
            <div className="flex items-center justify-between group-hover:bg-zinc-900/30 -mx-2 px-2 py-1 rounded transition-colors cursor-pointer" onClick={onToggle}>
              <div className="flex items-center gap-3 min-w-0">
                {/* Main identifier/summary */}
                {summaryText && (
                  <span className={`text-sm truncate max-w-[400px] ${isError ? 'text-red-400' : 'text-zinc-200 font-medium'}`}>
                    {summaryText}
                  </span>
                )}
                
                {/* Meta tags (latency, cost) */}
                <div className="flex items-center gap-2">
                  {step.latencyMs != null && (
                    <span className="text-[10px] text-zinc-500 font-mono bg-zinc-800/50 px-1.5 py-0.5 rounded">
                      {step.latencyMs >= 1000 ? `${(step.latencyMs / 1000).toFixed(1)}s` : `${step.latencyMs}ms`}
                    </span>
                  )}
                  {step.tokens != null && step.model != null && calculateStepCost(step.model, step.tokens) > 0 && (
                    <span className="text-[10px] text-zinc-500 font-mono bg-zinc-800/50 px-1.5 py-0.5 rounded">
                      {formatCost(calculateStepCost(step.model, step.tokens))}
                    </span>
                  )}
                </div>
              </div>

              {/* Expand Toggle */}
              <div className="text-zinc-600 ml-4 shrink-0">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </div>

            {/* Collapsed Tool Preview */}
            {step.type === 'TOOL_CALL' && !isExpanded && (
               <div className="mt-2 text-[11px] font-mono text-zinc-500 space-y-1.5 px-3 py-2 border-l-2 border-zinc-800 ml-1 bg-zinc-900/20 rounded-r">
                 {step.input != null && (
                   <div className="flex items-start gap-2"><span className="text-zinc-600 shrink-0">Input:</span><span className="truncate text-zinc-400">{typeof step.input === 'string' ? step.input : JSON.stringify(step.input)}</span></div>
                 )}
                 {step.output != null && (
                   <div className="flex items-start gap-2"><span className="text-zinc-600 shrink-0">Output:</span><span className="truncate text-zinc-300">{typeof step.output === 'string' ? step.output : JSON.stringify(step.output)}</span></div>
                 )}
               </div>
            )}

            {/* Collapsed LLM Preview */}
            {step.type === 'LLM_CALL' && !isExpanded && (
               <div className="mt-2 text-[11px] font-sans text-zinc-500 space-y-1.5 px-3 py-2 border-l-2 border-zinc-800 ml-1 bg-zinc-900/20 rounded-r">
                 {step.input != null && (
                   <div className="flex items-start gap-2"><span className="text-zinc-600 font-mono shrink-0">Prompt:</span><span className="truncate text-zinc-400">{typeof step.input === 'string' ? step.input : JSON.stringify(step.input)}</span></div>
                 )}
                 {step.output != null && (
                   <div className="flex items-start gap-2"><span className="text-zinc-600 font-mono shrink-0">Output:</span><span className="truncate text-zinc-300 font-medium">{typeof step.output === 'string' ? step.output : JSON.stringify(step.output)}</span></div>
                 )}
               </div>
            )}

            {/* Expanded Content Area */}
            {isExpanded && (
              <div className="mt-4 pl-2 pr-4 space-y-6">
                
                {/* Tool specific layout */}
                {step.type === 'TOOL_CALL' ? (
                  <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30">
                    <div className="px-4 py-3 border-b border-zinc-800/50">
                      <span className="text-xs font-medium text-zinc-400">Input</span>
                      <pre className="mt-2 text-[11px] text-zinc-300 font-mono whitespace-pre-wrap">{formatJsonValue(step.input)}</pre>
                    </div>
                    <div className="px-4 py-3 bg-zinc-900/50">
                      <span className="text-xs font-medium text-zinc-400">Output</span>
                      <pre className="mt-2 text-[11px] text-zinc-300 font-mono whitespace-pre-wrap">{formatJsonValue(step.output)}</pre>
                    </div>
                  </div>
                ) : (
                  /* Generic layout for LLM, Planning, Error etc. */
                  <>
                    <ContentBlock 
                      title={step.type === 'PLANNING' ? 'Thought' : 'Input'} 
                      content={step.type === 'PLANNING' ? (step.input as any)?.thought : step.input}
                      isString={typeof step.input === 'string' || step.type === 'PLANNING'}
                    />
                    
                    <ContentBlock 
                      title={step.type === 'PLANNING' ? 'Plan' : 'Output'} 
                      content={step.type === 'PLANNING' ? (step.output as any)?.plan : step.output}
                      isString={typeof step.output === 'string'}
                    />

                    {step.state != null && (
                      <ContentBlock title="State Snapshot" content={step.state} isString={false} />
                    )}
                  </>
                )}

                {/* Replay action for LLMs */}
                {step.type === 'LLM_CALL' && (
                  <div className="pt-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setPlaygroundOpen(true); }}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
                    >
                      <Zap className="w-3 h-3" /> Replay in Playground
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
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
