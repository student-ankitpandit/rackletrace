import { Router } from "express"
import prisma from "../lib/prisma"

const router = Router()

// GET /runs/analytics - aggregated analytics data
router.get("/", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const { days = "14" } = req.query
  const since = new Date()
  since.setDate(since.getDate() - Number(days))

  try {
  // Fetch all runs with steps in the time window
  const runs = await prisma.run.findMany({
    where: { userId, createdAt: { gte: since } },
    include: {
      steps: { select: { type: true, tokens: true, model: true, latencyMs: true, createdAt: true } }
    },
    orderBy: { createdAt: "asc" }
  })

  // === 1. Runs per day ===
  const runsPerDay: Record<string, { total: number; completed: number; failed: number }> = {}
  for (const run of runs) {
    const day = run.createdAt.toISOString().slice(0, 10)
    if (!runsPerDay[day]) runsPerDay[day] = { total: 0, completed: 0, failed: 0 }
    runsPerDay[day].total++
    if (run.status === "completed") runsPerDay[day].completed++
    if (run.status === "failed") runsPerDay[day].failed++
  }

  // === 2. Tokens per day ===
  const tokensPerDay: Record<string, number> = {}
  for (const run of runs) {
    const day = run.createdAt.toISOString().slice(0, 10)
    const runTokens = run.steps.reduce((s, st) => s + (st.tokens ?? 0), 0)
    tokensPerDay[day] = (tokensPerDay[day] ?? 0) + runTokens
  }

  // === 3. Latency distribution (bucketed) ===
  const latencyBuckets: Record<string, number> = {
    "<1s": 0, "1-3s": 0, "3-5s": 0, "5-10s": 0, ">10s": 0
  }
  for (const run of runs) {
    if (!run.totalMs) continue
    const sec = run.totalMs / 1000
    if (sec < 1) latencyBuckets["<1s"] = (latencyBuckets["<1s"] ?? 0) + 1
    else if (sec < 3) latencyBuckets["1-3s"] = (latencyBuckets["1-3s"] ?? 0) + 1
    else if (sec < 5) latencyBuckets["3-5s"] = (latencyBuckets["3-5s"] ?? 0) + 1
    else if (sec < 10) latencyBuckets["5-10s"] = (latencyBuckets["5-10s"] ?? 0) + 1
    else latencyBuckets[">10s"] = (latencyBuckets[">10s"] ?? 0) + 1
  }

  // === 4. Model usage breakdown ===
  const modelUsage: Record<string, { count: number; tokens: number }> = {}
  for (const run of runs) {
    for (const step of run.steps) {
      if (step.model) {
        const current = modelUsage[step.model] || { count: 0, tokens: 0 }
        modelUsage[step.model] = {
          count: current.count + 1,
          tokens: current.tokens + (step.tokens ?? 0)
        }
      }
    }
  }

  // === 5. Step type breakdown — seeds ALL known step types ===
  const stepTypes: Record<string, number> = {
    LLM_CALL: 0, TOOL_CALL: 0, ERROR: 0,
    PLANNING: 0, RETRIEVAL: 0, MEMORY_READ: 0, MEMORY_WRITE: 0,
    AGENT_HANDOFF: 0, GUARDRAIL: 0, LOOP_DETECTED: 0
  }
  for (const run of runs) {
    for (const step of run.steps) {
      stepTypes[step.type] = (stepTypes[step.type] ?? 0) + 1
    }
  }

  // Fill in missing days with zeroes
  const allDays: string[] = []
  const cursor = new Date(since)
  const today = new Date()
  while (cursor <= today) {
    allDays.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }

  const runsTimeline = allDays.map(day => ({
    date: day,
    total: runsPerDay[day]?.total ?? 0,
    completed: runsPerDay[day]?.completed ?? 0,
    failed: runsPerDay[day]?.failed ?? 0
  }))

  const tokensTimeline = allDays.map(day => ({
    date: day,
    tokens: tokensPerDay[day] ?? 0
  }))

  return res.json({
    runsTimeline,
    tokensTimeline,
    latencyBuckets: Object.entries(latencyBuckets).map(([range, count]) => ({ range, count })),
    modelUsage: Object.entries(modelUsage).map(([model, data]) => ({ model, ...data })),
    stepTypes: Object.entries(stepTypes).map(([type, count]) => ({ type, count })),
    summary: {
      totalRuns: runs.length,
      totalTokens: runs.reduce((s, r) => s + r.steps.reduce((ss, st) => ss + (st.tokens ?? 0), 0), 0),
      avgLatencyMs: runs.filter(r => r.totalMs).length > 0
        ? Math.round(runs.filter(r => r.totalMs).reduce((s, r) => s + (r.totalMs ?? 0), 0) / runs.filter(r => r.totalMs).length)
        : 0,
      failureRate: runs.length > 0
        ? Math.round((runs.filter(r => r.status === "failed").length / runs.length) * 100)
        : 0
    }
  })

  } catch (err: any) {
    console.error("analytics DB error:", err)
    return res.status(500).json({ error: "Failed to fetch analytics" })
  }
})

export default router
