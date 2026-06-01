import { Router } from "express"
import prisma from "../lib/prisma"

const router = Router()

// GET /runs/agents - list all unique agent names for filtering
router.get("/agents", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const agents = await prisma.run.findMany({
    where: { userId },
    select: { agentName: true },
    distinct: ['agentName']
  })

  return res.json(agents.map(a => a.agentName))
})

// GET /runs - list all runs for the authenticated user
router.get("/", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const { agentName, status, search } = req.query

  let searchRunIds: string[] | undefined;
  if (search) {
    const s = String(search);
    const rawIds = await prisma.$queryRaw<{id: string}[]>`
      SELECT DISTINCT r.id 
      FROM "Run" r 
      LEFT JOIN "Step" s ON s."runId" = r.id
      WHERE 
        r."userId" = ${userId} AND (
          r."agentName" ILIKE ${'%' + s + '%'} OR 
          r.id ILIKE ${'%' + s + '%'} OR
          s.message ILIKE ${'%' + s + '%'} OR
          s.output::text ILIKE ${'%' + s + '%'} OR
          s.input::text ILIKE ${'%' + s + '%'}
        )
    `;
    searchRunIds = rawIds.map(r => r.id);
  }

  const runs = await prisma.run.findMany({
    where: { 
      userId,
      ...(agentName ? { agentName: String(agentName) } : {}),
      ...(status ? { status: String(status) } : {}),
      ...(searchRunIds ? { id: { in: searchRunIds } } : {})
    },
    orderBy: { createdAt: "desc" },
    include: {
      steps: {
        select: { tokens: true, model: true }
      },
      _count: { select: { steps: true } }
    }
  })

  return res.json(runs)
})

// GET /runs/:id - get a single run with all its steps
router.get("/:id", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const run = await prisma.run.findFirst({
    where: { id: req.params.id, userId },
    include: {
      steps: {
        orderBy: { createdAt: "asc" }
      }
    }
  })

  if (!run) return res.status(404).json({ error: "Run not found" })

  return res.json(run)
})

export default router
