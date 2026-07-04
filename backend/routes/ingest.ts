import { Router } from "express"
import prisma from "../lib/prisma"
import type { $Enums } from "../prisma/generated/prisma/client"
import { getIO } from "../socket"

const router = Router()

const VALID_STATUSES = ["completed", "failed"]

// POST /api/ingest/run/start
router.post("/run/start", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const { runId, agentName } = req.body

  if (!runId || !agentName) {
    return res.status(400).json({ error: "RunId and agentName are required" })
  }

  try {
    const run = await prisma.run.create({
      data: { id: runId, userId, agentName, status: "running" }
    })

    try {
      getIO().to(`user_${userId}`).emit("run_started", { run });
    } catch (_) {}

    return res.json(run)
  } catch (err: any) {
    console.error("ingest/run/start DB error:", err)
    return res.status(500).json({ error: "Failed to create run" })
  }
})

// POST /api/ingest/run/restart
// Re-runs the most recent run for a given agentName instead of creating a new one.
// Deletes old steps, resets status to "running", and returns the existing run.
router.post("/run/restart", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const { agentName } = req.body

  if (!agentName) {
    return res.status(400).json({ error: "agentName is required" })
  }

  try {
    // Find the most recent run for this agent
    const existingRun = await prisma.run.findFirst({
      where: { userId, agentName },
      orderBy: { createdAt: "desc" }
    })

    if (!existingRun) {
      return res.status(404).json({ error: `No previous run found for agent "${agentName}"` })
    }

    // Delete all old steps from this run
    await prisma.step.deleteMany({ where: { runId: existingRun.id } })

    // Reset the run back to "running"
    const updated = await prisma.run.update({
      where: { id: existingRun.id },
      data: { status: "running", totalMs: null }
    })

    try {
      getIO().to(`user_${userId}`).emit("run_restarted", { run: updated });
    } catch (_) {}

    return res.json(updated)
  } catch (err: any) {
    console.error("ingest/run/restart DB error:", err)
    return res.status(500).json({ error: "Failed to restart run" })
  }
})

// POST /api/ingest/step
router.post("/step", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const {
    runId, type, input, output, model, tool, tokens, latencyMs, message, stack, state,
    thought, plan, query, results, source, key, store, value, fromAgent, toAgent, context, check, passed, reason
  } = req.body

  if (!runId || !type) {
    return res.status(400).json({ error: "RunId and type are required" })
  }

  // Normalize step input & output based on type
  let finalInput = input
  let finalOutput = output

  const upperType = (type as string).toUpperCase()
  if (upperType === 'PLANNING') {
    finalInput  = finalInput  ?? { thought }
    finalOutput = finalOutput ?? { plan }
  } else if (upperType === 'RETRIEVAL') {
    finalInput  = finalInput  ?? { query, source }
    finalOutput = finalOutput ?? { results }
  } else if (upperType === 'MEMORY_READ' || upperType === 'MEMORY_WRITE') {
    finalInput  = finalInput  ?? { key, store }
    finalOutput = finalOutput ?? { value }
  } else if (upperType === 'AGENT_HANDOFF') {
    // Fix: use dedicated payload fields, not the raw input/output vars
    finalInput  = finalInput  ?? { fromAgent, toAgent, context }
    finalOutput = finalOutput ?? {}
  } else if (upperType === 'GUARDRAIL') {
    finalInput  = finalInput  ?? { check }
    finalOutput = finalOutput ?? { passed, reason }
  }

  try {
    // Verify the run belongs to this user
    const run = await prisma.run.findFirst({ where: { id: runId, userId } })
    if (!run) return res.status(404).json({ error: "Run not found" })

    const step = await prisma.step.create({
      data: {
        runId,
        type: upperType as $Enums.StepType,
        input    : finalInput    ?? {},
        output   : finalOutput   ?? {},
        model    : model    ?? null,
        tool     : tool     ?? null,
        tokens   : tokens   ?? null,
        latencyMs: latencyMs ?? null,
        message  : message  ?? null,
        stack    : stack    ?? null,
        state    : state    ?? null
      }
    })

    try {
      getIO().to(`user_${userId}`).emit("step_added", { step });
    } catch (_) {}

    return res.json(step)
  } catch (err: any) {
    console.error("ingest/step DB error:", err)
    return res.status(500).json({ error: "Failed to create step" })
  }
})

// POST /api/ingest/run/end
router.post("/run/end", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const { runId, status, totalMs } = req.body

  if (!runId || !status) {
    return res.status(400).json({ error: "RunId and status are required" })
  }

  // Fix #3: Validate status before hitting Prisma
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status "${status}". Must be one of: ${VALID_STATUSES.join(", ")}` })
  }

  try {
    const run = await prisma.run.findFirst({ where: { id: runId, userId } })
    if (!run) return res.status(404).json({ error: "Run not found" })

    const updated = await prisma.run.update({
      where: { id: runId },
      data : { status, totalMs: totalMs ?? null }
    })

    try {
      getIO().to(`user_${userId}`).emit("run_ended", { run: updated });
    } catch (_) {}

    return res.json(updated)
  } catch (err: any) {
    console.error("ingest/run/end DB error:", err)
    return res.status(500).json({ error: "Failed to update run" })
  }
})

export default router