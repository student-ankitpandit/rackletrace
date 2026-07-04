# Rackle

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Bun](https://img.shields.io/badge/Bun-runtime-fbf0df)](https://bun.sh/)
[![npm](https://img.shields.io/badge/npm-%40rackle--labs%2Fsdk-cb3837)](https://www.npmjs.com/package/@rackle-labs/sdk)

<img src="./dashboard.png" alt="Rackle Dashboard" width="100%" />

**Rackle is an open-source observability and telemetry platform for AI agents.** It captures every prompt, tool call, retrieval, memory read/write, and error your agent produces, and turns it into a real-time, explorable trace — so debugging complex LLM systems feels like debugging normal software again.

🔗 Live app: [rackleai.vercel.app](https://rackleai.vercel.app)

## Table of Contents

- [Why Rackle](#why-rackle)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Data Model](#data-model)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Backend](#1-backend)
  - [2. Frontend](#2-frontend)
  - [3. SDK](#3-sdk)
- [SDK Usage](#sdk-usage)
  - [Step Types](#step-types)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## Why Rackle

Building complex LLM systems and AI agents is hard. Debugging them is harder — logs are scattered, prompts and tool calls blur together, and it's easy to lose track of *why* an agent went off the rails. Rackle gives every run a clean, dark-mode-native trace view (a "waterfall" of steps) plus an AI copilot you can ask questions like *"why did this run fail?"* directly against your own trace data.

## Core Features

- **🧠 AI Copilot & Trace Analysis** — A built-in chat interface (`/api/chat`) that summarizes runs, explains errors, and answers questions grounded in your actual trace history.
- **⚡ Real-Time Telemetry** — Powered by Socket.IO; the dashboard updates instantly as your SDK emits new execution steps, no polling required.
- **🩺 Error Explainer** — Feed a stack trace or error message to `/api/explain` and get an LLM-generated, actionable root-cause explanation.
- **🧪 Prompt Playground** — Test prompts and system prompts against an LLM directly from the dashboard (`/api/playground`), with token/latency feedback, independent of any live agent run.
- **🙂 Sentiment / Anomaly Detection** — A keyword-based sentiment scorer (`/api/detection`) flags positive/negative signals in step content without needing an external API call.
- **📋 Evals Workflow** — A lightweight eval/review board (`/api/evals`) with statuses (`DRAFT`, `COLLECTING`, `IN_REVIEW`, `OVERDUE`, `COMPLETED`, `ARCHIVED`, `SCHEDULED`), assignees, due dates, and scoring — for tracking human review of agent behavior over time.
- **📊 Rich Analytics Engine** — Runs-per-day, token usage, latency trends, and model breakdowns over a configurable time window, filterable by agent (`/runs/analytics`).
- **🔒 Secure Authentication** — JWT cookie-based auth, bcrypt-hashed passwords, and per-project API keys (masked in the UI, shown once on creation).
- **💻 Zero-Friction SDK** — Instrument any LLM call, tool call, or agent step with a couple of lines of TypeScript via `@rackle-labs/sdk`.
- **🛡️ Rate-Limited Ingestion** — The telemetry ingestion endpoints are protected by an IP-based rate limiter (300 requests/minute) to keep the pipeline healthy.

## Architecture

Rackle is a three-part monorepo:

```
┌──────────────┐        WebSocket / REST        ┌──────────────┐
│   Frontend   │ ◄─────────────────────────────► │   Backend    │
│  (Next.js)   │        JWT cookie auth          │ (Express/Bun)│
└──────────────┘                                 └──────┬───────┘
                                                          │ Prisma
                                                          ▼
                                                 ┌──────────────┐
                                                 │  PostgreSQL  │
                                                 └──────────────┘
                                                          ▲
                                                  REST (Bearer key)
                                                          │
                                                 ┌──────────────┐
                                                 │  Your Agent  │
                                                 │  + Rackle SDK│
                                                 └──────────────┘
```

- **Frontend** — Next.js 16 (App Router), React 19, Tailwind CSS v4, Recharts for analytics charts, `socket.io-client` for live updates, and `react-markdown` for rendering the AI copilot's responses.
- **Backend** — Express 5 running on the [Bun](https://bun.sh/) runtime, with `socket.io` for pushing live trace events to connected dashboards, `jsonwebtoken` + `cookie-parser` for auth, and `express-rate-limit` on the ingestion pipeline.
- **Database** — PostgreSQL, accessed through Prisma ORM (using the `@prisma/adapter-pg` driver adapter).
- **SDK** — A dependency-free, TypeScript-first npm package (`@rackle-labs/sdk`) that your agent code imports to emit trace events over plain `fetch`.

## Repository Structure

```text
Rackle/
├── backend/
│   ├── index.ts              # Express app entrypoint, route mounting, Socket.IO init
│   ├── auth-middleware.ts    # JWT cookie/Bearer verification middleware
│   ├── socket.ts             # Socket.IO server setup (per-user rooms)
│   ├── lib/                  # Prisma client singleton
│   ├── prisma/                # Prisma schema + migrations (PostgreSQL)
│   └── routes/
│       ├── auth.ts            # signup / login / logout / me
│       ├── ingest.ts          # run/start, run/restart, step, run/end — telemetry ingestion
│       ├── run.ts             # list/fetch runs, list agent names
│       ├── analytics.ts       # aggregated run/token/latency analytics
│       ├── api-keys.ts        # create/list/revoke project API keys
│       ├── explain.ts         # AI-powered error explanations
│       ├── playground.ts      # ad-hoc prompt testing against an LLM
│       ├── detection.ts       # keyword-based sentiment/anomaly detection
│       ├── evals.ts           # eval/review board CRUD
│       └── chat.ts            # AI copilot chat grounded in trace data
├── frontend/
│   └── app/
│       ├── auth/[mode]/       # Sign in / sign up
│       ├── dashboard/         # Main dashboard shell, analytics, evals, playground
│       │   ├── runs/          # Run list
│       │   ├── runs/[id]/     # Run detail — trace waterfall + AI copilot
│       │   └── settings/      # API keys, account settings
│       └── legal/             # Privacy, terms, cookies pages
├── sdk/
│   └── src/
│       ├── tracer.ts          # Tracer class — starts runs
│       ├── run.ts             # Run class — logs steps, ends runs
│       ├── types.ts           # StepType payload definitions (LLM call, tool call, etc.)
│       └── index.ts           # Public exports
├── dashboard.png
├── LICENSE
└── README.md
```

## Data Model

Defined in `backend/prisma/schema.prisma` (PostgreSQL):

- **User** — account with hashed password; owns `Run`s, `ApiKey`s, and `Eval`s.
- **ApiKey** — named, unique key per user, with `lastUsedAt` tracking.
- **Run** — a single agent execution (`agentName`, `status: running | completed | failed`, `totalMs`), containing many `Step`s. Re-running an agent with `rerun: true` resets the same record (clears steps, status → `running`) instead of creating a duplicate.
- **Step** — one event within a run, typed by `StepType`:
  `LLM_CALL`, `TOOL_CALL`, `ERROR`, `RETRIEVAL`, `MEMORY_READ`, `MEMORY_WRITE`, `AGENT_HANDOFF`, `GUARDRAIL`, `PLANNING`, `LOOP_DETECTED` — with fields for `input`/`output` (JSON), `model`, `tool`, `tokens`, `latencyMs`, `error`/`message`/`stack`, and free-form `state`.
- **Eval** — a review-board item (`title`, `description`, `status`, `assignee`, `dueDate`, `agentName`, `criteria`, `score`, `notes`) used to track human evaluation of agent behavior.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (backend & frontend runtime/package manager)
- [pnpm](https://pnpm.io/) (for building the SDK)
- A PostgreSQL database (local or hosted, e.g. Neon/Supabase)
- An OpenAI API key (optional — the copilot, explain, and playground routes fall back to simulated responses if `OPENAI_API_KEY` is not set)

### 1. Backend

```bash
cd backend
bun install
```

Create a `.env` file in `backend/`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB
JWT_SECRET=your_super_secret_jwt_key
PORT=8000
OPENAI_API_KEY=sk-...          # optional — enables real AI copilot/explain/playground responses
```

Apply migrations and start the server:

```bash
bunx prisma migrate dev
bun run dev     # watch mode
# or
bun start       # plain start
```

The API listens on `http://localhost:8000` by default.

### 2. Frontend

```bash
cd frontend
bun install
```

Create a `.env.local` file in `frontend/`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### 3. SDK

If you want to build/modify the SDK locally rather than installing it from npm:

```bash
cd sdk
pnpm install
pnpm run build
```

## SDK Usage

Install in your agent's project:

```bash
npm install @rackle-labs/sdk
```

Instrument a run:

```typescript
import { Tracer } from "@rackle-labs/sdk";

// Initialize the tracer with your dashboard API key
const tracer = new Tracer({
  secret: process.env.RACKLE_API_KEY!,
  // baseUrl: "http://localhost:8000" // point at a local/self-hosted backend
});

async function runAgent() {
  // 1. Start a new run
  const run = await tracer.startRun({ agentName: "SupportBot" });

  try {
    const startTime = Date.now();
    const response = "You can reset your password in the settings tab.";

    // 2. Log an execution step
    await run.log({
      type: "llm_call",
      input: "How do I reset my password?",
      output: response,
      model: "gpt-4o",
      tokens: 42,
      latencyMs: Date.now() - startTime,
    });

    // 3. Mark the run as completed
    await run.end({ status: "completed" });
  } catch (error: any) {
    await run.log({ type: "error", message: error.message, stack: error.stack });
    await run.end({ status: "failed" });
  }
}
```

### Re-running a Failed Agent

When a run fails and you fix your code, pass `rerun: true` to reuse the same run entry instead of creating a new duplicate:

```typescript
// After fixing your code, just add rerun: true
const run = await tracer.startRun({
  agentName: "email_sender",
  rerun: true,   // ← resets the last run for this agent instead of creating a new one
});
```

**What happens under the hood:**
- Finds the most recent run for `"email_sender"` in the database
- Deletes all its old steps
- Resets `status` → `"running"` and clears `totalMs`
- Returns a `Run` instance tied to the **same run ID**
- If no previous run exists, automatically falls back to creating a new one

This keeps your dashboard clean — **one entry per agent**, not a graveyard of failed duplicates.

### Step Types

The SDK is fully typed around ten step types, so `run.log(...)` gives you compile-time checking of the fields each step needs:

| Type | Purpose | Key fields |
|---|---|---|
| `llm_call` | A model completion | `input`, `output`, `model`, `tokens`, `latencyMs` |
| `tool_call` | An external tool/function invocation | `tool`, `input`, `output`, `latencyMs` |
| `error` | An unhandled error/exception | `message`, `stack?` |
| `retrieval` | RAG / vector DB lookup | `query`, `results`, `source?`, `latencyMs` |
| `memory_read` | Read from a memory store | `key`, `value`, `store?` |
| `memory_write` | Write to a memory store | `key`, `value`, `store?` |
| `agent_handoff` | One agent delegates to another | `fromAgent`, `toAgent`, `context` |
| `guardrail` | Safety/moderation check | `target`, `rule`, `input`, `passed`, `reason?`, `latencyMs` |
| `planning` | Reasoning/plan generation (CoT, ReAct, ToT) | `thought`, `plan?`, `tokens?` |
| `loop_detected` | Repeated tool/step loop detected | `tool?`, `repeatCount` |

Every payload also accepts an optional `state` field for arbitrary debug context.

## API Reference

All backend routes are mounted from `backend/index.ts`. Routes other than `/auth/*` require authentication (JWT cookie for the dashboard, or `Authorization: Bearer <API_KEY>` for SDK ingestion).

| Method | Route | Description |
|---|---|---|
| `POST` | `/auth/signup` | Create a new account |
| `POST` | `/auth/login` | Log in, sets JWT cookie |
| `POST` | `/auth/logout` | Clear the session cookie |
| `GET` | `/auth/me` | Get the current authenticated user |
| `GET`/`POST`/`DELETE` | `/auth/api-keys` | List, create, or revoke project API keys |
| `POST` | `/api/ingest/run/start` | Start a new agent run (rate-limited: 300 req/min) |
| `POST` | `/api/ingest/run/restart` | Reset the last run for an agent — clears old steps, status → `running` |
| `POST` | `/api/ingest/step` | Log a step within a run |
| `POST` | `/api/ingest/run/end` | Mark a run as completed/failed |
| `GET` | `/runs` | List runs (filterable by agent, status, search) |
| `GET` | `/runs/:id` | Fetch a single run with all steps |
| `GET` | `/runs/agents` | List distinct agent names |
| `GET` | `/runs/analytics` | Aggregated analytics: runs/day, tokens/day, latency, model breakdown |
| `POST` | `/api/explain` | AI-generated explanation for an error/stack trace |
| `POST` | `/api/playground` | Run an ad-hoc prompt against an LLM |
| `GET` | `/api/detection` | Keyword-based sentiment/anomaly scoring |
| `GET`/`POST`/`PATCH`/`DELETE` | `/api/evals` | Manage the eval/review board |
| `POST` | `/api/chat` | AI copilot chat, grounded in a run's trace data |

Real-time updates (e.g. `run_started`, `run_restarted`, new steps) are pushed over Socket.IO to a per-user room (`user_<id>`).

## Contributing

Contributions are welcome — bug fixes, documentation, and new features all help.

1. **Fork the repository** and create your branch from `main`.
2. **Install dependencies** with `bun install` (backend/frontend) and `pnpm install` (SDK).
3. **Make your changes**, keeping to the existing code style.
4. **Test locally** — run the backend, frontend, and (if relevant) rebuild the SDK to confirm everything works end-to-end.
5. **Open a Pull Request** describing your changes.

Looking for ideas? Check the [Issues](https://github.com/student-ankitpandit/Rackle/issues) tab, especially anything labeled "good first issue."

## License

MIT — see [LICENSE](./LICENSE).

---

<div align="center">
  <p>Built with ❤️ by ankit.</p>
</div>