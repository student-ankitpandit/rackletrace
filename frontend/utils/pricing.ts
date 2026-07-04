export const PRICING_MAP: Record<string, number> = {
  // ── Estimated blended cost per 1 million tokens (input + output average) ──
  // Prices are approximate; update as providers change their rates.

  // ── Google Gemini ──────────────────────────────────────────────────────────
  "gemini-2.5-pro"          : 7.00,
  "gemini-2.5-flash-lite"   : 0.10,
  "gemini-2.5-flash"        : 0.30,
  "gemini-2.0-flash-lite"   : 0.075,
  "gemini-2.0-flash"        : 0.20,
  "gemini-1.5-flash-8b"     : 0.075,
  "gemini-1.5-flash"        : 0.15,
  "gemini-1.5-pro"          : 3.50,
  "gemini-1.0-pro"          : 0.50,
  "gemini-pro"              : 0.50,

  // ── OpenAI ─────────────────────────────────────────────────────────────────
  "o3-mini"                 : 3.50,
  "o3"                      : 25.00,
  "o1-preview"              : 15.00,
  "o1-mini"                 : 3.00,
  "o1"                      : 15.00,
  "gpt-4o-mini"             : 0.30,
  "gpt-4o"                  : 5.00,
  "gpt-4-turbo"             : 10.00,
  "gpt-4"                   : 15.00,
  "gpt-3.5-turbo"           : 0.50,

  // ── Anthropic Claude ───────────────────────────────────────────────────────
  "claude-opus-4"           : 22.50,
  "claude-sonnet-4"         : 6.00,
  "claude-3-7-sonnet"       : 6.00,
  "claude-3-5-sonnet"       : 3.00,
  "claude-3-5-haiku"        : 0.80,
  "claude-3-opus"           : 15.00,
  "claude-3-sonnet"         : 3.00,
  "claude-3-haiku"          : 0.50,

  // ── Meta Llama ─────────────────────────────────────────────────────────────
  "llama-3.3-70b"           : 0.70,
  "llama-3.2-90b"           : 1.20,
  "llama-3.2-11b"           : 0.20,
  "llama-3.2-3b"            : 0.06,
  "llama-3.2-1b"            : 0.04,
  "llama-3.1-405b"          : 3.00,
  "llama-3.1-70b"           : 0.70,
  "llama-3.1-8b"            : 0.10,
  "llama-3-70b"             : 0.70,
  "llama-3-8b"              : 0.10,

  // ── Mistral ────────────────────────────────────────────────────────────────
  "mistral-large"           : 3.00,
  "mistral-small"           : 0.30,
  "mistral-nemo"            : 0.15,
  "mistral-7b"              : 0.10,
  "ministral-8b"            : 0.10,
  "ministral-3b"            : 0.04,
  "mixtral-8x22b"           : 2.00,
  "mixtral-8x7b"            : 0.50,
  "codestral"               : 0.30,

  // ── Cohere ─────────────────────────────────────────────────────────────────
  "command-r-plus"          : 2.50,
  "command-r"               : 0.30,
  "command"                 : 1.00,

  // ── DeepSeek ───────────────────────────────────────────────────────────────
  "deepseek-r1"             : 1.50,
  "deepseek-v3"             : 0.50,
  "deepseek-coder"          : 0.50,
  "deepseek-chat"           : 0.50,

  // ── xAI Grok ───────────────────────────────────────────────────────────────
  "grok-3-mini"             : 1.50,
  "grok-3"                  : 10.00,
  "grok-2"                  : 5.00,
  "grok-beta"               : 5.00,

  // ── Amazon Titan / Nova ────────────────────────────────────────────────────
  "nova-pro"                : 1.50,
  "nova-lite"               : 0.24,
  "nova-micro"              : 0.09,
  "titan-text-premier"      : 0.80,
  "titan-text-lite"         : 0.15,
}



export function calculateStepCost(model: string | null, tokens: number | null): number {
  if (!model || !tokens) return 0;
  
  // Find a loose match if exact string isn't found
  const matchedKey = Object.keys(PRICING_MAP).sort((a, b) => b.length - a.length).find(key => model.toLowerCase().includes(key));
  const costPerMillion = matchedKey ? PRICING_MAP[matchedKey] : 0;
  
  return (tokens / 1_000_000) * costPerMillion;
}

export function formatCost(cost: number): string {
  if (cost === 0) return "$0.00";
  if (cost < 0.0001) return `<$0.0001`;
  return `$${cost.toFixed(4)}`;
}
