import { Router }  from "express"
import prisma from "../lib/prisma"

const router = Router()

// POST /api/ingest/run/start
router.post("/run/start", async (req, res) => {
  const userId = req.userId

  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const { runId, agentName } = req.body

  if (!runId || !agentName) {
    return res.status(400).json({ error: "RunId and agentName are required" })
  }

  const run = await prisma.run.create({ 
    data: {
      id: runId,
      userId,
      agentName,
      status: "running"
    }
  })

  return res.json(run)
})

// POST /api/ingest/step
router.post("/step", async (req, res) => {
  const userId = req.userId

  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const { runId, type, input, output, model, tool, tokens, latencyMs, message, stack } = req.body

  if (!runId || !type) {
    return res.status(400).json({ error: "RunId and type are required" })
  }

  // make sure the run belongs to this user
  const run = await prisma.run.findFirst({
    where: { id: runId, userId }
  })

  if (!run) return res.status(404).json({ error: "Run not found" })

  const step = await prisma.step.create({
    data: {
      runId,
      type: type.toUpperCase(),
      input    : input    ?? {},
      output   : output   ?? null,
      model    : model    ?? null,
      tool     : tool     ?? null,
      tokens   : tokens   ?? null,
      latencyMs: latencyMs ?? null,
      message  : message  ?? null,
      stack    : stack    ?? null
    }
  })

  return res.json(step)
})

// POST /api/ingest/run/end
router.post("/run/end", async (req, res) => {
  const userId = req.userId

  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const { runId, status, totalMs } = req.body

  if (!runId || !status) {
    return res.status(400).json({ error: "RunId and status are required" })
  }

  const run = await prisma.run.findFirst({
    where: { id: runId, userId }
  })

  if (!run) return res.status(404).json({ error: "Run not found" })

  const updated = await prisma.run.update({
    where: { id: runId },
    data : {
      status,
      totalMs: totalMs ?? null
    }
  })

  return res.json(updated)
})

export default router