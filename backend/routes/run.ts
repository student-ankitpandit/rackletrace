import { Router } from "express"
import prisma from "../lib/prisma"

const router = Router()

// GET /runs - list all runs for the authenticated user
router.get("/", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const runs = await prisma.run.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
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
