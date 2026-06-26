<div align="left">
  <img src="./rackle-dashboard.png" alt="Rackle Logo" width="100%" height="100%" />
  <h1>Rackle</h1>
  <p><strong>Open-source observability and telemetry platform for AI Agents.</strong></p>
  <p>
    Simple enough for domain experts. Detailed enough for developers.<br/>
    Trace your AI agents with a visual workflow pipeline.
  </p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
  [![Bun](https://img.shields.io/badge/Bun-1.1-fbf0df)](https://bun.sh/)
</div>

<br/>

<div align="left">
  <!-- Place a high-quality screenshot of your landing page or dashboard here -->
  <img src="./demo.webp" alt="Rackle Dashboard Preview" width="100%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);" />
</div>

## 🌟 Why Rackle?

Building complex LLM systems and AI agents is hard. Debugging them is harder. Rackle captures prompts, tool calls, contexts, and errors in a clean, dark-mode native interface that makes debugging complex AI interactions intuitive and fast.

## ✨ Core Features

- **🧠 AI Copilot & Trace Analysis**: Don't just look at logs—talk to them. Rackle features a built-in AI chat interface that can summarize runs, explain errors, and calculate token metrics directly from your trace history.
- **⚡ Real-Time Telemetry**: Watch your agent execute in real-time. Powered by WebSockets, the dashboard updates instantly as your SDK emits new execution steps.
- **🎨 Premium Developer UI**: A beautifully crafted, fully responsive, dark-mode locked interface built with Tailwind CSS and Lucide icons.
- **📊 Rich Analytics Engine**: Track token consumption, latency trends, and model breakdowns over time to optimize your AI spending.
- **🔒 Secure Authentication**: Built-in JWT cookie authentication, robust user signup validation, and manageable project-level API keys.
- **💻 Zero-Friction SDK**: Instrument any LLM call or agent run with just two lines of TypeScript code.

---

## 🏗 Architecture & Tech Stack

Rackle is built for performance and developer experience using modern tooling:

- **Frontend:** Next.js (App Router), Tailwind CSS, Framer Motion, Lucide React
- **Backend:** Node.js / Express runtime on **Bun**, Socket.IO
- **Database:** PostgreSQL with Prisma ORM
- **SDK:** TypeScript-first, lightweight NPM package

---

## 🚀 Quick Start (Local Development)

### 1. Database & Backend Setup

Ensure you have [Bun](https://bun.sh/) and PostgreSQL installed.

```bash
cd backend
bun install
```

Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB
JWT_SECRET=your_super_secret_jwt_key
PORT=8000
```

Apply database migrations and start the server:
```bash
bunx prisma migrate dev
bun start
```

### 2. Frontend Dashboard

```bash
cd frontend
bun install
```

Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Start the web application:
```bash
bun dev
```
Navigate to **[http://localhost:3000](http://localhost:3000)** to view the dashboard!

---

## 📦 SDK Integration

Instrumenting your AI agent takes seconds.

```bash
cd sdk
pnpm install
pnpm run build
```

### Usage Example

```typescript
import { Tracer } from "@rackle-labs/sdk";

// Initialize the tracer with your dashboard API Key
const tracer = new Tracer({
  secret: process.env.RACKLE_API_KEY,
  // baseUrl: "http://localhost:8000" // Use for local development
});

async function runAgent() {
  // 1. Start a new run
  const run = await tracer.startRun({ agentName: "SupportBot" });

  // 2. Log an execution step
  await run.log({
    type: "llm_call",
    input: "How do I reset my password?",
    output: "Open settings and click reset password.",
    model: "gpt-4o",
    tokens: 42,
    latencyMs: 1200,
  });

  // 3. Mark run as completed
  await run.end({ status: "completed" });
}
```

---

## 🛣️ API Reference

- **Auth:** `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`
- **Ingestion:** `POST /api/ingest/run/start`, `POST /api/ingest/step`, `POST /api/ingest/run/end`
- **Analytics:** `GET /runs/analytics`, `GET /runs/agents`
- **Copilot:** `POST /api/chat`

---

## 📁 Repository Structure

```text
rackle/
├── backend/          # Express API, Prisma Schema, WebSocket Server
├── frontend/         # Next.js App Router Dashboard & Landing Page
├── sdk/              # @rackle-labs/sdk NPM package
└── README.md
```

---

## 🤝 Contributing

We love contributions from the community! Whether it's fixing a bug, writing documentation, or proposing a new feature, here's how you can help:

1. **Fork the repository** and create your branch from `main`.
2. **Install dependencies** using `bun install` (for backend/frontend) and `pnpm install` (for SDK).
3. **Make your changes**, ensuring that your code adheres to the existing style and format.
4. **Test your changes** locally to ensure both the frontend and backend are working seamlessly.
5. **Open a Pull Request** describing your changes in detail!

If you're looking for ideas, check out the [Issues](https://github.com/student-ankitpandit/Rackle/issues) tab for any 'good first issue' labels.

---

<div align="center">
  <p>Built with ❤️ by ankit.</p>
</div>
