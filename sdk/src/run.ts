import type {
  StepPayload,
  RunEndOptions,
  TracerOptions,
  RunOptions
} from "./types.js"

export class Run {
  private runId: string
  private options: TracerOptions
  private agentName: string
  private startedAt: number

  constructor(
    runId: string,
    options: TracerOptions,
    runOptions: RunOptions
  ) {
    this.runId = runId
    this.options = options
    this.agentName = runOptions.agentName
    this.startedAt = Date.now()
  }

  async log(payload: StepPayload): Promise<void> {
    const body: any = {
      runId: this.runId,
      ...payload
    }

    await this.send("/api/ingest/step", body)
  }

  /**
   * Convenience method: captures an error as a step and marks the run as failed.
   * Call this in your catch blocks instead of manually calling log() + end().
   * @param error - The caught Error object
   * @param state - Optional snapshot of local variables / agent memory at the time of failure
   */
  async catch(error: unknown, state?: unknown): Promise<void> {
    const err = error instanceof Error ? error : new Error(String(error))
    await this.log({
      type: "error",
      message: err.message,
      stack: err.stack,
      state,
    })
    await this.end({ status: "failed" })
  }

  async end(options: RunEndOptions): Promise<void> {
    await this.send("/api/ingest/run/end", {
      runId: this.runId,
      status: options.status,
      totalMs: Date.now() - this.startedAt
    })
  }

  private async send(path: string, body: object): Promise<void> {
    try {
      const res = await fetch(`${this.options.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.options.secret}`
        },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const msg = `Rackle SDK Warning: Ingest returned status ${res.status} for ${path}`
        if (this.options.onError) {
          this.options.onError(new Error(msg), path)
        } else {
          console.warn(msg)
        }
      }

    } catch (error) {
      const msg = `Rackle SDK Error: Failed to ingest trace at ${path}`
      if (this.options.onError) {
        this.options.onError(error, path)
      } else {
        console.error(msg, error)
      }
    }
  }
}