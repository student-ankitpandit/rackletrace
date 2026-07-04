# @rackle-labs/sdk

Lightweight SDK for observing and tracing AI agents. Track LLM calls, tool usage, latency, tokens, and hallucinations in real-time.

## Installation

```bash
npm install @rackle-labs/sdk
```

## Quick Start

Initialize the `Tracer` with your project's secret key. In production, it will automatically route telemetry to the Rackle cloud.

```typescript
import { Tracer } from "@rackle-labs/sdk";

// Initialize the tracer
const tracer = new Tracer({
  secret: process.env.RACKLE_SECRET, // Your API key
});

async function runAgent() {
  // 1. Start a new run
  const run = await tracer.startRun({ 
    agentName: "SupportBot" 
  });

  try {
    const prompt = "How do I reset my password?";
    const startTime = Date.now();

    // ... Your LLM logic here ...
    const response = "You can reset your password in the settings tab.";
    const tokensUsed = 42;

    // 2. Log the LLM call step
    await run.log({
      type: "llm_call",
      input: prompt,
      output: response,
      model: "gemini-2.5-flash",
      tokens: tokensUsed,
      latencyMs: Date.now() - startTime,
    });

    // 3. Mark the run as completed
    await run.end({ status: "completed" });

  } catch (error) {
    // Log any unexpected errors
    await run.log({
      type: "error",
      message: error.message,
      stack: error.stack,
    });
    await run.end({ status: "failed" });
  }
}
```

## Advanced Usage

### Local Development / Self-Hosting
If you are running the Rackle dashboard locally or self-hosting the backend, you can override the default API URL by passing `baseUrl`:

```typescript
const tracer = new Tracer({
  secret: process.env.RACKLE_SECRET,
  baseUrl: "http://localhost:PORT_NUMBER" // Point to your local backend
});
```

### Logging Tool Calls
You can track when your agent invokes external tools (like search, weather API, or database queries):

```typescript
await run.log({
  type: "tool_call",
  tool: "web_search",
  input: { query: "Latest AI news" },
  output: { results: ["..."] },
  latencyMs: 850
});
```

### Re-running a Failed Agent
When your agent fails, you fix the code, and want to run it again — pass `rerun: true` to reuse the same run entry instead of creating a duplicate:

```typescript
const run = await tracer.startRun({
  agentName: "email_sender",
  rerun: true   // ← reuses the last run for "email_sender"
});
```

**What happens under the hood:**
- The SDK looks up the most recent run for `"email_sender"`
- Clears all the old steps from that run
- Resets the status back to `"running"`
- Returns the same `Run` instance (same run ID)
- If no previous run exists, it automatically creates a new one

This way your dashboard shows **one entry per agent**, not a pile of failed duplicates.

## License
MIT
