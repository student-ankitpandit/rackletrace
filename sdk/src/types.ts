export type StepType =
  | "llm_call"
  | "tool_call"
  | "error"
  | "retrieval"
  | "memory_read"
  | "memory_write"
  | "agent_handoff"
  | "guardrail"
  | "planning"
  | "loop_detected"

export interface LLMCallPayload {
  type     : "llm_call"
  input    : string
  output   : string
  model    : string
  tokens   : number
  latencyMs: number
  state?   : unknown
}

export interface ToolCallPayload {
  type     : "tool_call"
  tool     : string
  input    : Record<string, unknown>
  output   : Record<string, unknown> | string | null
  latencyMs: number
  tokens?  : number
  state?   : unknown
}

export interface ErrorPayload {
  type     : "error"
  message  : string
  stack?   : string | undefined
  state?   : unknown
}

/** RAG / vector DB lookup */
export interface RetrievalPayload {
  type     : "retrieval"
  query    : string
  results  : unknown          
  source?  : string | undefined
  latencyMs: number
  state?   : unknown
}

/** Agent reads from a memory store */
export interface MemoryReadPayload {
  type    : "memory_read"
  key     : string
  value   : unknown
  store?  : string | undefined
  state?  : unknown
}

/** Agent writes to a memory store */
export interface MemoryWritePayload {
  type    : "memory_write"
  key     : string
  value   : unknown
  store?  : string | undefined
  state?  : unknown
}

/** One agent delegates to another (multi-agent / crew) */
export interface AgentHandoffPayload {
  type       : "agent_handoff"
  fromAgent  : string
  toAgent    : string
  context    : Record<string, unknown>
  latencyMs? : number | undefined
  state?     : unknown
}

/** Safety / moderation / guardrail check */
export interface GuardrailPayload {
  type    : "guardrail"
  target  : "input" | "output"
  rule    : string
  input   : unknown
  passed  : boolean
  reason? : string | undefined
  latencyMs : number 
  state?  : unknown
}

/** Reasoning step / plan generation (CoT, ReAct, ToT) */
export interface PlanningPayload {
  type    : "planning"
  thought : string            
  plan?   : unknown
  tokens? : number
  state?  : unknown
}

export interface LoopDetectedPayload {
  type        : "loop_detected"
  tool?       : string | undefined 
  repeatCount : number        
  state?      : unknown
}

export type StepPayload =
  | LLMCallPayload
  | ToolCallPayload
  | ErrorPayload
  | RetrievalPayload
  | MemoryReadPayload
  | MemoryWritePayload
  | AgentHandoffPayload
  | GuardrailPayload
  | PlanningPayload
  | LoopDetectedPayload

export interface TracerOptions {
  secret   : string
  baseUrl? : string | undefined
  /** Called when a step fails to ingest (e.g. network error). Defaults to console.error. */
  onError? : (err: unknown, context: string) => void
}

export interface RunOptions {
  agentName: string
  /**
   * When true, re-runs the most recent run for this agent instead of creating
   * a new one. The backend will clear old steps and reset the status to "running".
   * Falls back to creating a new run if no previous run exists.
   * @default false
   */
  rerun?: boolean
}

export interface RunEndOptions {
  status: "completed" | "failed"
}

// Step — a StepPayload enriched with run-level metadata

export interface Step<T extends StepPayload = StepPayload> {
  runId      : string
  stepIndex  : number
  timestamp  : string
  payload    : T
}

// StepTypeMap — compile-time lookup from StepType literal → payload interface

export interface StepTypeMap {
  llm_call      : LLMCallPayload
  tool_call     : ToolCallPayload
  error         : ErrorPayload
  retrieval     : RetrievalPayload
  memory_read   : MemoryReadPayload
  memory_write  : MemoryWritePayload
  agent_handoff : AgentHandoffPayload
  guardrail     : GuardrailPayload
  planning      : PlanningPayload
  loop_detected : LoopDetectedPayload
}