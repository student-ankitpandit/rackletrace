import { Tracer } from "@ankit/rackle-sdk"
import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

async function main() {
  const tracer = new Tracer({
    secret : process.env.RACKLE_SECRET ?? "your-secret", 
    baseUrl: "http://localhost:8000"
  })

  const run = await tracer.startRun({ agentName: "Gemini-Assistant" })
  console.log("🚀 Rackle trace started for real agent...")

  const prompt = "Explain what AI observability platform is in exactly one simple sentence."

  try {
    console.log("🧠 Sending request to Gemini...")
    const startTime = Date.now()

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    })

    const latencyMs = Date.now() - startTime

    await run.log({
      type     : "llm_call",
      input    : prompt,
      output   : response.text ?? "",
      model    : "gemini-2.0-flash",
      tokens   : response.usageMetadata?.totalTokenCount ?? 0,
      latencyMs: latencyMs
    })

    console.log("✅ Agent replied:", response.text)

    await run.end({ status: "completed" })

  } catch (error: any) {
    await run.log({
      type   : "error",
      message: error.message || "Failed to call Gemini API",
      stack  : error.stack
    })
    
    await run.end({ status: "failed" })
    console.error("❌ Agent error:", error.message)
    console.log("(Make sure to run with: GEMINI_API_KEY=your_key bun run real-agent.ts)")
  }
}

main().catch(console.error)
