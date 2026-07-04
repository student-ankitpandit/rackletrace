import { Run } from "./run.js"
import type { TracerOptions, RunOptions } from "./types.js"
import { randomUUID } from "node:crypto"

export class Tracer {
  private options: TracerOptions

  constructor(options: TracerOptions) {
    this.options = {
      ...options,
      baseUrl: options.baseUrl ?? "https://rackle-fx56.onrender.com"
    }
  }

  async startRun(runOptions: RunOptions): Promise<Run> {
    // rerun: always reset the last run regardless of its status
    if (runOptions.rerun) {
      const restarted = await this.tryRestart(runOptions)
      if (restarted) return restarted
      // No previous run found — fall through to create a new one
    }

    // rerunIfFailed: only reset the last run if it failed;
    // if it completed successfully, start a fresh new run instead
    if (runOptions.rerunIfFailed) {
      const restarted = await this.tryRestart(runOptions, true)
      if (restarted) return restarted
      // Either no previous run, or last run was successful — fall through to create a new one
    }

    const runId = randomUUID()

    try {
      const res = await fetch(`${this.options.baseUrl}/api/ingest/run/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.options.apiKey}`
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
   * @param onlyIfFailed - When true, only resets the run if its status is "failed".
   *                       If the run completed successfully, returns null so the
   *                       caller creates a fresh new run instead.
   * Returns a Run instance if reset was performed, or null otherwise.
   */
  private async tryRestart(runOptions: RunOptions, onlyIfFailed = false): Promise<Run | null> {
    try {
      const res = await fetch(`${this.options.baseUrl}/api/ingest/run/restart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.options.apiKey}`
        },
        body: JSON.stringify({ agentName: runOptions.agentName, onlyIfFailed })
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

      // Backend signals the last run was successful and should not be wiped
      if (data.skipped) return null

      return new Run(data.id, this.options, runOptions)

    } catch (error) {
      console.error("Rackle SDK Error: Failed to restart run", error)
      return null
    }
  }
}