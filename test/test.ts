import { Tracer } from "@ankit/rackle-sdk"

async function main() {
  const tracer = new Tracer({
    secret : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBubDljczQwMDAwMjhnMDhxNzFwYmx2IiwiaWF0IjoxNzgwMDU5MTAxfQ.cdJFXka_S1y0Rkm1BrBl9UAYBI2V7t3HjJn37dz4DOk",
    baseUrl: "http://localhost:8000"
  })

  const run = await tracer.startRun({ agentName: "test-agent" })
  console.log("Run started")

  await run.log({
    type     : "llm_call",
    input    : "Summarise this text",
    output   : "The text is about what recently...",
    model    : "gemini-2.0-flash",
    tokens   : 342,
    latencyMs: 540
  })
  console.log("LLM call logged")

  await run.log({
    type     : "tool_call",
    tool     : "send_email",
    input    : { to: "user@gmail.com", body: "Hello" },
    output   : { success: true },
    latencyMs: 120
  })
  console.log("Tool call logged")

  await run.log({
    type   : "error",
    message: "Something went wrong",
    stack  : "Error: Something went wrong\n  at main (test.ts:30)"
  })
  console.log("Error logged")

  await run.end({ status: "completed" })
  console.log("Run completed")
}

main().catch(console.error)