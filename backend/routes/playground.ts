import { Router } from "express";
import OpenAI from "openai";

const router = Router();

// POST /api/playground
router.post("/", async (req, res) => {
  const { prompt, model, systemPrompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }

  if (!process.env.OPENAI_API_KEY) {
    // Simulated response if no API key
    return res.json({
      output: `[Simulated - No OPENAI_API_KEY]\nModel: ${model ?? "gpt-4o-mini"}\n\nYour prompt was:\n"${prompt}"\n\nThis is where the real LLM response would appear. Add OPENAI_API_KEY to your backend .env to enable real responses.`,
      tokens: 42,
      latencyMs: 320,
    });
  }

  const startMs = Date.now();

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }

    messages.push({ role: "user", content: prompt });

    const response = await openai.chat.completions.create({
      model: model ?? "gpt-4o-mini",
      messages,
      temperature: 0.7,
    });

    const latencyMs = Date.now() - startMs;
    const choice = response.choices[0];

    return res.json({
      output: choice?.message?.content ?? "No response generated.",
      tokens: response.usage?.total_tokens ?? null,
      latencyMs,
      model: response.model,
      finishReason: choice?.finish_reason ?? null,
    });
  } catch (error: any) {
    console.error("Playground error:", error);
    return res.status(500).json({ error: error.message ?? "Failed to run playground." });
  }
});

export default router;
