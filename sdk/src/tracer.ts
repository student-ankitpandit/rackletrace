import { Run } from "./run.js"
import type { TracerOptions, RunOptions } from "./types.js"
import { randomUUID } from "node:crypto"

export class Tracer {
  private options: TracerOptions

  constructor(options: TracerOptions) {
    this.options = {
      ...options,
      baseUrl: options.baseUrl ?? "http://localhost:8000" // Default to your future production URL like "https://rackle-fx56.onrender.com"
    }
  }

  async startRun(runOptions: RunOptions): Promise<Run> {
    // If rerun is true, try to restart the most recent run for this agent
    if (runOptions.rerun) {
      const restarted = await this.tryRestart(runOptions)
      if (restarted) return restarted
      // If no previous run exists, fall through to create a new one
    }

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

  /**
   * Attempts to restart the most recent run for the given agentName.
   * Returns a Run instance if successful, or null if no previous run exists.
   */
  private async tryRestart(runOptions: RunOptions): Promise<Run | null> {
    try {
      const res = await fetch(`${this.options.baseUrl}/api/ingest/run/restart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.options.secret}`
        },
        body: JSON.stringify({ agentName: runOptions.agentName })
      })

      if (res.status === 404) {
        // No previous run found — caller should create a new one
        return null
      }

      if (!res.ok) {
        console.warn(`Rackle SDK Warning: Restart returned status ${res.status}`)
        return null
      }

      const data = await res.json()
      return new Run(data.id, this.options, runOptions)

    } catch (error) {
      console.error("Rackle SDK Error: Failed to restart run", error)
      return null
    }
  }
}