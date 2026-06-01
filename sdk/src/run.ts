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
    await this.send("/api/ingest/step", {
      runId: this.runId,
      ...payload
    })
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
        console.warn(`Rackle SDK Warning: Ingest returned status ${res.status}`)
      }

    } catch (error) {
      console.error("Rackle SDK Error: Failed to ingest trace", error)
    }
  }
}