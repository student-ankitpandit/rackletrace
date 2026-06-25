import { Router } from "express"
import OpenAI from "openai"
import prisma from "../lib/prisma"

const router = Router()

const SYSTEM_PROMPT = `You are Rackle AI — an expert AI agent debugger and observability assistant.
You have access to the user's agent trace data including runs, steps, errors, latency, tokens, models, and more.
Your job is to help developers understand, debug, and optimize their AI agents.

When answering:
- Be concise and actionable
- Reference specific data from the traces (step types, latency values, error messages, models used)
- Use bullet points and code snippets where helpful
- If you find patterns (e.g., repeated errors, high latency steps), highlight them clearly
- If asked to compare or summarize, use tables or structured formats
- Always ground your answers in the actual trace data provided`

// POST /api/chat — ask questions about agent runs
router.post("/", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const { message, runId, history = [] } = req.body

  if (!message) return res.status(400).json({ error: "Message is required" })

  try {
    // Gather context based on what the user is asking about
    let contextBlocks: string[] = []

    // If a specific run is being viewed, include full details
    if (runId) {
      const run = await prisma.run.findFirst({
        where: { id: runId, userId },
        include: { steps: { orderBy: { createdAt: "asc" } } }
      })
      if (run) {
        contextBlocks.push(`
        ## Current Run: ${run.agentName}
          - **ID:** ${run.id}
          - **Status:** ${run.status}
          - **Duration:** ${run.totalMs ? `${(run.totalMs / 1000).toFixed(2)}s` : 'N/A'}
          - **Created:** ${run.createdAt}
          - **Steps (${run.steps.length}):**
          ${run.steps.map((s, i) => {
            const parts = [`  ${i + 1}. **${s.type}**`]
            if (s.model) parts.push(`model=${s.model}`)
            if (s.tokens) parts.push(`tokens=${s.tokens}`)
            if (s.latencyMs) parts.push(`latency=${s.latencyMs}ms`)
            if (s.input) parts.push(`input=${JSON.stringify(s.input).slice(0, 150)}`)
            if (s.output) parts.push(`output=${JSON.stringify(s.output).slice(0, 150)}`)
            if (s.error) parts.push(`error=${s.error}`)
            return parts.join(' | ')
          }).join('\n')}`)
                }
              }

    // Always include recent runs overview for broader context
    const recentRuns = await prisma.run.findMany({
      where: { userId },
      include: {
        steps: {
          select: { type: true, model: true, tokens: true, latencyMs: true, error: true, output: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    })

    if (recentRuns.length > 0) {
      const summary = recentRuns.map(r => {
        const totalTokens = r.steps.reduce((s, st) => s + (st.tokens ?? 0), 0)
        const errors = r.steps.filter(s => s.type === "ERROR")
        const models = [...new Set(r.steps.filter(s => s.model).map(s => s.model))]
        return `- **${r.agentName}** | ${r.status} | ${r.totalMs ? `${(r.totalMs / 1000).toFixed(2)}s` : '?'} | ${totalTokens} tokens | ${r.steps.length} steps | ${errors.length} errors | models: ${models.join(', ') || 'N/A'} | ${new Date(r.createdAt).toLocaleDateString()}`
      }).join('\n')

      // Compute aggregate stats
      const totalRuns = recentRuns.length
      const failedRuns = recentRuns.filter(r => r.status === "failed" || r.status === "FAILED").length
      const avgDuration = recentRuns.filter(r => r.totalMs).length > 0
        ? Math.round(recentRuns.filter(r => r.totalMs).reduce((s, r) => s + (r.totalMs ?? 0), 0) / recentRuns.filter(r => r.totalMs).length)
        : 0
      const totalTokens = recentRuns.reduce((s, r) => s + r.steps.reduce((ss, st) => ss + (st.tokens ?? 0), 0), 0)
      const allErrors = recentRuns.flatMap(r => r.steps.filter(s => s.type === "ERROR"))

      contextBlocks.push(`
        ## Recent Runs Overview (Last ${totalRuns})
          **Aggregate Stats:**
          - Total runs: ${totalRuns}
          - Failed: ${failedRuns} (${totalRuns > 0 ? Math.round((failedRuns / totalRuns) * 100) : 0}%)
          - Avg duration: ${avgDuration > 0 ? `${(avgDuration / 1000).toFixed(2)}s` : 'N/A'}
          - Total tokens: ${totalTokens.toLocaleString()}
          - Total errors: ${allErrors.length}

          **Runs:**
          ${summary}`)

      // Include common error patterns if any
      if (allErrors.length > 0) {
        const errorMessages = allErrors.map(e => {
          const parsed = typeof e.error === 'string' ? e.error : JSON.stringify(e.error)
          const outputParsed = typeof e.output === 'string' ? e.output : JSON.stringify(e.output)
          return parsed || outputParsed || 'Unknown error'
        }).filter(Boolean)

        contextBlocks.push(`## Error Patterns
          ${errorMessages.map(e => `- ${String(e).slice(0, 200)}`).join('\n')}`)
      }
    }

    const contextString = contextBlocks.join('\n\n---\n\n')

    // Build messages array
    const messages: any[] = [
      { role: "system", content: `${SYSTEM_PROMPT}\n\n--- TRACE DATA ---\n\n${contextString}` },
    ]

    // Add conversation history
    for (const h of history.slice(-10)) {
      messages.push({ role: h.role, content: h.content })
    }

    // Add current message
    messages.push({ role: "user", content: message })

    // Call LLM
    if (!process.env.OPENAI_API_KEY) {
      // Fallback mock for demo
      return res.json({
        response: `[Rackle AI — No OPENAI_API_KEY configured]\n\nBased on the trace data I can see:\n- ${recentRuns.length} recent runs across ${[...new Set(recentRuns.map(r => r.agentName))].length} agents\n- ${recentRuns.filter(r => r.status === 'failed' || r.status === 'FAILED').length} failed runs\n\nTo get AI-powered analysis, set your OPENAI_API_KEY in the backend .env file.`
      })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 1500,
    })

    return res.json({
      response: completion.choices[0]?.message?.content ?? "I couldn't generate a response. Please try again."
    })

  } catch (err: any) {
    console.error("POST /api/chat error:", err)
    return res.status(500).json({ error: "Failed to process chat request" })
  }
})

export default router
