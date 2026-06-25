import { Router } from "express"
import prisma from "../lib/prisma"

const router = Router()

const VALID_STATUSES = ["COLLECTING", "IN_REVIEW", "OVERDUE", "COMPLETED", "ARCHIVED", "SCHEDULED", "DRAFT"]

// GET /api/evals - list all evals for the user with optional filters
router.get("/", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const { status, assignedToMe, search } = req.query

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })

    const where: any = { userId }
    if (status && VALID_STATUSES.includes(String(status).toUpperCase())) {
      where.status = String(status).toUpperCase()
    }
    if (assignedToMe === "true" && user) {
      where.assignee = user.email
    }
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
        { agentName: { contains: String(search), mode: "insensitive" } }
      ]
    }

    const evals = await prisma.eval.findMany({
      where,
      orderBy: { updatedAt: "desc" }
    })

    // Compute counts by status
    const allEvals = await prisma.eval.findMany({
      where: { userId },
      select: { status: true, assignee: true }
    })

    const counts: Record<string, number> = {
      ALL: allEvals.length,
      COLLECTING: 0, 
      IN_REVIEW: 0, 
      OVERDUE: 0, 
      COMPLETED: 0,
      ARCHIVED: 0, 
      SCHEDULED: 0, 
      DRAFT: 0, 
      ASSIGNED_TO_ME: 0
    }
    for (const e of allEvals) {
      counts[e.status] = (counts[e.status] ?? 0) + 1
      if (user && e.assignee === user.email) counts.ASSIGNED_TO_ME = (counts.ASSIGNED_TO_ME ?? 0) + 1
    }

    return res.json({ evals, counts })
  } catch (err: any) {
    console.error("GET /evals DB error:", err)
    return res.status(500).json({ error: "Failed to fetch evals" })
  }
})

// POST /api/evals - create a new eval
router.post("/", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const { title, description, status, assignee, dueDate, agentName, criteria, notes } = req.body

  if (!title) {
    return res.status(400).json({ error: "Title is required" })
  }

  const evalStatus = status && VALID_STATUSES.includes(String(status).toUpperCase())
    ? String(status).toUpperCase()
    : "DRAFT"

  try {
    const created = await prisma.eval.create({
      data: {
        userId,
        title,
        description: description ?? null,
        status: evalStatus as any,
        assignee: assignee ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        agentName: agentName ?? null,
        criteria: criteria ?? null,
        notes: notes ?? null
      }
    })
    return res.json(created)
  } catch (err: any) {
    console.error("POST /evals DB error:", err)
    return res.status(500).json({ error: "Failed to create eval" })
  }
})

// PATCH /api/evals/:id - update an eval
router.patch("/:id", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const { title, description, status, assignee, dueDate, agentName, criteria, score, notes } = req.body

  try {
    const existing = await prisma.eval.findFirst({ where: { id: req.params.id, userId } })
    if (!existing) return res.status(404).json({ error: "Eval not found" })

    const data: any = {}
    if (title !== undefined) data.title = title
    if (description !== undefined) data.description = description
    if (status && VALID_STATUSES.includes(String(status).toUpperCase())) data.status = String(status).toUpperCase()
    if (assignee !== undefined) data.assignee = assignee
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null
    if (agentName !== undefined) data.agentName = agentName
    if (criteria !== undefined) data.criteria = criteria
    if (score !== undefined) data.score = score
    if (notes !== undefined) data.notes = notes

    const updated = await prisma.eval.update({
      where: { id: req.params.id },
      data
    })
    return res.json(updated)
  } catch (err: any) {
    console.error("PATCH /evals/:id DB error:", err)
    return res.status(500).json({ error: "Failed to update eval" })
  }
})

// DELETE /api/evals/:id - delete an eval
router.delete("/:id", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  try {
    const existing = await prisma.eval.findFirst({ where: { id: req.params.id, userId } })
    if (!existing) return res.status(404).json({ error: "Eval not found" })

    await prisma.eval.delete({ where: { id: req.params.id } })
    return res.json({ success: true })
  } catch (err: any) {
    console.error("DELETE /evals/:id DB error:", err)
    return res.status(500).json({ error: "Failed to delete eval" })
  }
})

export default router
