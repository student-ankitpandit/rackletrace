export const PRICING_MAP: Record<string, number> = {
  // Estimated blended prices per 1 million tokens (Input + Output average)
  "gemini-1.5-flash": 0.15,
  "gemini-2.0-flash": 0.20,
  "gemini-2.5-flash-lite": 0.10,
  "gpt-4o": 5.00,
  "gpt-4o-mini": 0.30,
  "claude-3-5-sonnet": 3.00,
  "claude-3-haiku": 0.50
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
