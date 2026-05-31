import { Tracer } from "@ankit/rackle-sdk"
import { GoogleGenAI } from "@google/genai"

// We initialize the Google Gen AI client. 
// It will look for GEMINI_API_KEY in your environment variables.
const ai = new GoogleGenAI({ apiKey: "your-api-key" })

async function main() {
  // 1. Initialize Rackle Tracer
  const tracer = new Tracer({
    secret : "your-secret", 
    baseUrl: "http://localhost:8000"
  })

  // 2. Start the Trace Run
  const run = await tracer.startRun({ agentName: "Gemini-Assistant" })
  console.log("🚀 Rackle trace started for real agent...")

  const prompt = "Explain what AI observability platform is in exactly one simple sentence."

  try {
    console.log("🧠 Sending request to Gemini...")
    const startTime = Date.now()

    // Make the REAL LLM call
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    })

    const latencyMs = Date.now() - startTime

    // 3. Log the successful step to Rackle Dashboard
    await run.log({
      type     : "llm_call",
      input    : prompt,
      output   : response.text ?? "",
      model    : "gemini-2.0-flash",
      tokens   : response.usageMetadata?.totalTokenCount ?? 0,
      latencyMs: latencyMs
    })

    console.log("✅ Agent replied:", response.text)

    // 4. Mark run as completed
    await run.end({ status: "completed" })

  } catch (error: any) {
    // If the API call fails (like missing GEMINI_API_KEY), log the error to the dashboard!
    await run.log({
      type   : "error",
      message: error.message || "Failed to call Gemini API",
      stack  : error.stack
    })
    
    // Mark run as failed
    await run.end({ status: "failed" })
    console.error("❌ Agent error:", error.message)
    console.log("(Make sure to run with: GEMINI_API_KEY=your_key bun run real-agent.ts)")
  }
}

main().catch(console.error)
