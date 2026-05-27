export type StepType = "LLM_CALL" | "TOOL_CALL" | "WEB_SCRAP" | "DATA_TRANSFORM" | "CUSTOM" | "ERROR" | "STOP" | "NO_OPR" | "SUCCESS" | "WAITING" | "FINAL_RESPONSE";

export interface LLMCallPayload {
    name: string;
    description?: string;
    model: string;
    system_prompt: string;
    messages: {
        role: string;
        content: string;
    }[];
    tools?: any;
    retries?: number;
    metadata?: Record<string, any>;
    onError: StepType;
    onSuccess: StepType;
}

export interface ToolCallPayload {
    name: string;
    description: string;
    function: Function;
    arguments: Record<string, any>;
    retries: number;
    metadata: Record<string, any>;
    onError: StepType;
    onSuccess: StepType;
}
