export type StepType = "llm_call" | "tool_call" | "error"

export interface LLMCallPayload {
  type     : "llm_call"
  input    : string
  output   : string
  model    : string
  tokens   : number
  latencyMs: number
}

export interface ToolCallPayload {
  type     : "tool_call"
  tool     : string
  input    : unknown
  output   : unknown
  latencyMs: number
}

export interface ErrorPayload {
  type     : "error"
  message  : string
  stack?   : string
}

export type StepPayload = LLMCallPayload | ToolCallPayload | ErrorPayload

export interface TracerOptions {
  secret   : string
  baseUrl? : string | undefined
}

export interface RunOptions {
  agentName: string
}

export interface RunEndOptions {
  status: "completed" | "failed"
}