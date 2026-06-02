import { Run } from "./run.js"
import type { TracerOptions, RunOptions } from "./types.js"
import { randomUUID } from "node:crypto"

export class Tracer {
  private options: TracerOptions

  constructor(options: TracerOptions) {
    this.options = {
      ...options,
      baseUrl: options.baseUrl ?? "https://rackle-fx56.onrender.com" // Default to your future production URL
    }
  }

  async startRun(runOptions: RunOptions): Promise<Run> {
    const runId = randomUUID()

    try {
      const res = await fetch(`${this.options.baseUrl}/api/ingest/run/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.options.secret}`
        },
        body: JSON.stringify({
          runId,
          agentName: runOptions.agentName
        })
      })
      
      if (!res.ok) {
        console.warn(`Rackle SDK Warning: Ingest returned status ${res.status}`)
      }

    } catch (error) {
      console.error("Rackle SDK Error: Failed to ingest trace", error)
    }

    return new Run(runId, this.options, runOptions)
  }
}