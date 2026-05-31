import { Router } from "express"
import prisma from "../lib/prisma"
import { randomBytes } from "node:crypto"

const router = Router()

// GET /auth/api-keys - list all API keys for the user
router.get("/", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      key: true,
      lastUsedAt: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  })

  // Mask the key for display, only show first 8 and last 4 chars
  const masked = keys.map(k => ({
    ...k,
    key: k.key.slice(0, 8) + "••••••••" + k.key.slice(-4)
  }))

  return res.json(masked)
})

// POST /auth/api-keys - create a new API key
router.post("/", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const { name } = req.body
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "A key name is required" })
  }

  // Generate a secure random key with a recognizable prefix
  const rawKey = "rk_" + randomBytes(32).toString("hex")

  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      name: name.trim(),
      key: rawKey
    }
  })

  // Return the FULL key only once at creation time
  return res.status(201).json({
    id: apiKey.id,
    name: apiKey.name,
    key: rawKey,
    createdAt: apiKey.createdAt
  })
})

// DELETE /auth/api-keys/:id - revoke an API key
router.delete("/:id", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const existing = await prisma.apiKey.findFirst({
    where: { id: req.params.id, userId }
  })

  if (!existing) return res.status(404).json({ error: "API key not found" })

  await prisma.apiKey.delete({ where: { id: req.params.id } })

  return res.json({ message: "API key revoked" })
})

export default router
