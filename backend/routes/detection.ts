import { Router } from "express"
import prisma from "../lib/prisma"

const router = Router()

// Keyword-based sentiment scoring (no external API needed)
const POSITIVE_WORDS = [
  "great", "excellent", "perfect", "wonderful", "amazing", "good", "helpful",
  "thanks", "appreciate", "success", "resolved", "correct", "happy", "pleased",
  "well done", "fantastic", "awesome", "love", "brilliant", "outstanding",
  "satisfied", "efficient", "clear", "useful", "effective", "solved", "yes"
]

const NEGATIVE_WORDS = [
  "error", "fail", "wrong", "bad", "terrible", "awful", "broken", "issue",
  "problem", "bug", "crash", "slow", "frustrat", "annoy", "confus", "unclear",
  "useless", "hate", "worst", "disappoint", "invalid", "timeout", "reject",
  "denied", "unable", "cannot", "sorry", "unfortunately", "mistake", "no"
]

function analyzeSentiment(text: string): { sentiment: "positive" | "negative" | "neutral"; score: number; suggestion: string } {
  const lower = text.toLowerCase()
  
  let positiveScore = 0
  let negativeScore = 0
  
  for (const word of POSITIVE_WORDS) {
    const regex = new RegExp(`\\b${word}`, "gi")
    const matches = lower.match(regex)
    if (matches) positiveScore += matches.length
  }
  
  for (const word of NEGATIVE_WORDS) {
    const regex = new RegExp(`\\b${word}`, "gi")
    const matches = lower.match(regex)
    if (matches) negativeScore += matches.length
  }
  
  const total = positiveScore + negativeScore
  const score = total === 0 ? 0 : (positiveScore - negativeScore) / total
  
  let sentiment: "positive" | "negative" | "neutral"
  let suggestion: string

  if (score > 0.2) {
    sentiment = "positive"
    suggestion = "Response tone is constructive. Maintain this helpful approach."
  } else if (score < -0.2) {
    sentiment = "negative"
    suggestion = "Response contains negative indicators. Consider adding clearer error explanations, actionable next steps, or a more empathetic tone."
  } else {
    sentiment = "neutral"
    suggestion = "Response is factual/neutral. Consider adding more context or a friendlier closing to improve user experience."
  }
  
  return { sentiment, score: Math.round(score * 100) / 100, suggestion }
}

function extractText(value: any): string {
  if (typeof value === "string") return value
  if (value === null || value === undefined) return ""
  if (typeof value === "object") {
    // Try common LLM output shapes
    if (value.text) return String(value.text)
    if (value.content) return String(value.content)
    if (value.message) return String(value.message)
    if (value.response) return String(value.response)
    if (value.result) return String(value.result)
    return JSON.stringify(value)
  }
  return String(value)
}

// GET /api/detection - analyze sentiment of all LLM responses
router.get("/", async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: "Unauthorized" })

  const { days = "14", sentiment: sentimentFilter, runId } = req.query
  const since = new Date()
  since.setDate(since.getDate() - Number(days))

  try {
    const where: any = { userId }
    if (runId) {
      where.id = String(runId)
    } else {
      where.createdAt = { gte: since }
    }

    const runs = await prisma.run.findMany({
      where,
      include: {
        steps: {
          where: { type: "LLM_CALL" },
          select: { id: true, output: true, input: true, model: true, tokens: true, latencyMs: true, createdAt: true, runId: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Analyze each LLM step
    const detections: any[] = []
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 }
    const sentimentTimeline: Record<string, { positive: number; negative: number; neutral: number }> = {}

    for (const run of runs) {
      for (const step of run.steps) {
        const outputText = extractText(step.output)
        const inputText = extractText(step.input)
        if (!outputText && !inputText) continue

        const analysis = analyzeSentiment(outputText || inputText)

        // Apply filter
        if (sentimentFilter && sentimentFilter !== "all" && analysis.sentiment !== sentimentFilter) continue

        sentimentCounts[analysis.sentiment]++
        
        const day = step.createdAt.toISOString().slice(0, 10)
        if (!sentimentTimeline[day]) sentimentTimeline[day] = { positive: 0, negative: 0, neutral: 0 }
        sentimentTimeline[day][analysis.sentiment]++

        detections.push({
          id: step.id,
          runId: step.runId,
          agentName: run.agentName,
          model: step.model,
          tokens: step.tokens,
          latencyMs: step.latencyMs,
          input: inputText.slice(0, 200),
          output: outputText.slice(0, 400),
          sentiment: analysis.sentiment,
          score: analysis.score,
          suggestion: analysis.suggestion,
          createdAt: step.createdAt
        })
      }
    }

    // Fill in missing days
    const allDays: string[] = []
    const cursor = new Date(since)
    const today = new Date()
    while (cursor <= today) {
      allDays.push(cursor.toISOString().slice(0, 10))
      cursor.setDate(cursor.getDate() + 1)
    }

    const timeline = allDays.map(day => ({
      date: day,
      positive: sentimentTimeline[day]?.positive ?? 0,
      negative: sentimentTimeline[day]?.negative ?? 0,
      neutral: sentimentTimeline[day]?.neutral ?? 0
    }))

    // Generate global suggestions based on overall patterns
    const totalAnalyzed = sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral
    const suggestions: string[] = []

    if (totalAnalyzed > 0) {
      const negRate = sentimentCounts.negative / totalAnalyzed
      const posRate = sentimentCounts.positive / totalAnalyzed

      if (negRate > 0.3) {
        suggestions.push("⚠️ Over 30% of LLM responses have negative sentiment. Review your system prompts for clearer error handling instructions.")
      }
      if (negRate > 0.5) {
        suggestions.push("🔴 Critical: Majority of responses are negative. Consider adjusting temperature, adding guardrails, or refining the agent's persona.")
      }
      if (posRate > 0.7) {
        suggestions.push("✅ Excellent! Your agent maintains a consistently positive tone. Keep monitoring for edge cases.")
      }
      if (sentimentCounts.neutral > sentimentCounts.positive + sentimentCounts.negative) {
        suggestions.push("💡 Most responses are neutral/factual. Consider adding warmer language patterns if user engagement is a goal.")
      }
    }

    return res.json({
      detections,
      sentimentCounts,
      timeline,
      suggestions,
      totalAnalyzed
    })

  } catch (err: any) {
    console.error("detection DB error:", err)
    return res.status(500).json({ error: "Failed to analyze detections" })
  }
})

export default router
