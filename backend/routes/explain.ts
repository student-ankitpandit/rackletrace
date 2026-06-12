import { Router } from "express";
import OpenAI from "openai";

const router = Router();

router.post("/", async (req, res) => {
  const { errorMessage, inputData, stack } = req.body;

  if (!errorMessage) {
    return res.status(400).json({ error: "errorMessage is required" });
  }

  // If there's no API key configured, return a mock response so the frontend still works for demo purposes
  if (!process.env.OPENAI_API_KEY) {
    return res.json({
      explanation: `[Simulated by Backend - No OPENAI_API_KEY found]\nThe agent encountered an error: ${errorMessage}. This usually happens when the model hallucinates a tool call or returns a badly formatted JSON. Ensure your system prompt enforces strict JSON output.`
    });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert AI agent debugger. Explain the provided error message that occurred during an AI agent execution step. Keep your explanation concise, actionable, and focused on how to fix the prompt or code."
        },
        {
          role: "user",
          content: `Error Message: ${errorMessage}\n\nInput Data (if any): ${JSON.stringify(inputData)}\n\nStack Trace (if any): ${stack || "None"}`
        }
      ],
      temperature: 0.3,
    });

    res.json({
      explanation: response.choices[0]?.message?.content ?? "The AI could not generate an explanation. Please try again."
    });
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: "Failed to generate explanation." });
  }
});

export default router;
