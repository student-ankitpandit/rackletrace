# Rackle

Open-source telemetry platform for AI agents. Rackle tracks runs, steps, token usage, latency, and errors in real time with a live dashboard and a lightweight SDK.

## What is in this repo

- backend/: Bun + Express API, Prisma + Postgres, Socket.IO for realtime updates
- frontend/: Next.js dashboard (App Router) with Tailwind
- sdk/: TypeScript SDK for instrumenting agents

## Features

- Auth with JWT cookies and API keys
- Run + step ingestion API for agents
- Real-time dashboard updates via WebSockets
- Analytics endpoints for usage, latency, and model breakdowns
- TypeScript SDK with optional `baseUrl` override

## Quick start (local)

### 1) Backend (API + WebSockets)

Prereqs: Bun, Postgres

```bash
cd backend
bun install
```

Create a .env in backend/:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB
JWT_SECRET=your_jwt_secret
# Optional
PORT=8000
```

Start the backend:

```bash
bun start
```

Optional: apply migrations (if needed)

```bash
bunx prisma migrate dev
```

### 2) Frontend (dashboard)

```bash
cd frontend
bun install
```

Create a .env.local in frontend/:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Start the app:

```bash
bun dev
```

Open http://localhost:3000

### 3) SDK (optional, for publishing or local testing)

```bash
cd sdk
pnpm install
pnpm run build
```

## SDK usage

```typescript
import { Tracer } from "@rackle-labs/sdk";

const tracer = new Tracer({
  secret: process.env.RACKLE_SECRET,
  // baseUrl: "http://localhost:8000" // Optional override for local/self-hosted
});

const run = await tracer.startRun({ agentName: "SupportBot" });

await run.log({
  type: "llm_call",
  input: "How do I reset my password?",
  output: "Open settings and click reset password.",
  model: "gpt-4o",
  tokens: 42,
  latencyMs: 1200,
});

await run.end({ status: "completed" });
```

## Environment variables

Backend:

- DATABASE_URL: Postgres connection string
- JWT_SECRET: JWT signing secret
- PORT: API port (default 8000)

Frontend:

- NEXT_PUBLIC_BACKEND_URL: Base URL for the backend Server

SDK:

- RACKLE_SECRET: API key (use an API key created in the dashboard)
- baseUrl: Optional runtime override when self-hosting

## Key endpoints

- POST /auth/signup, /auth/login, /auth/logout
- GET /auth/me
- POST /api/ingest/run/start
- POST /api/ingest/step
- POST /api/ingest/run/end
- GET /runs
- GET /runs/:id
- GET /runs/agents
- GET /runs/analytics
- GET/POST/DELETE /auth/api-keys

## Project structure

```
backend/
  routes/
  prisma/
  lib/
frontend/
  app/
  components/
  utils/
sdk/
  src/
```
