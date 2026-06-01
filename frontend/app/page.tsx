"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Activity,
  Sparkles,
  Zap,
  Layers,
  BarChart3,
  Code,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export default function Home() {
  const router = useRouter();

  const handleDashboardClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND}/auth/me`, { credentials: "include" });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        router.push("/auth/login");
      }
    } catch (err) {
      router.push("/auth/login");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#030305] text-zinc-900 dark:text-zinc-50 font-sans selection:bg-violet-500/30 transition-colors duration-300">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-black/50 border-b border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Activity className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">
              Rackle.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={handleDashboardClick}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-105 transition-transform"
            >
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-48 sm:pb-32 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/20 dark:bg-violet-600/30 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-multiply dark:mix-blend-screen" />

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>The next generation of AI observability</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl mx-auto text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-white/60">
            Understand exactly what your AI agents are doing.
          </h1>

          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto">
            Rackle is an open-source telemetry platform built for multi-agent
            systems. Capture real-time token costs, debug LLM responses, and
            trace every single step in your workflow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleDashboardClick}
              className="flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-2xl bg-violet-600 hover:bg-violet-700 text-white shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:shadow-[0_0_60px_rgba(124,58,237,0.6)] transition-all hover:scale-105"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="https://github.com/student-ankitpandit/Rackle"
              className="flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-2xl bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors"
            >
              <Code className="w-5 h-5" /> View on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="py-24 bg-white dark:bg-black/20 border-y border-black/5 dark:border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-white">
              Everything you need to ship reliable AI.
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Stop flying blind. Rackle provides the visibility you need to
              build trust in your autonomous systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">
                Cost & Analytics
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                Automatically calculate exactly how much each LLM call costs
                based on token usage. View rich charts of your daily spend and
                latency distributions.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">
                Waterfall Traces
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                Break down complex agent runs into a visual waterfall. Inspect
                exactly what data went into the prompt and what the model
                outputted at every step.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">
                Real-time WebSockets
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                Watch your agents think in real-time. Rackle uses WebSockets to
                instantly stream agent activity to your dashboard without a
                single page refresh.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Code Snippet Section */}
      <div className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-zinc-900 dark:text-white">
              Integrate in two lines of code.
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
              Our lightweight TypeScript SDK drops perfectly into any Node.js,
              Bun, or Edge environment. Generate a secure API key and start
              tracing instantly.
            </p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative rounded-2xl bg-[#0d0d12] border border-white/10 p-6 shadow-2xl">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <pre className="text-sm font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                <span className="block">
                  <span className="text-violet-400">import</span> {"{"} Tracer{" "}
                  {"}"} <span className="text-violet-400">from</span>{" "}
                  <span className="text-emerald-400">"@rackle/rackle-sdk"</span>
                  ;
                </span>
                <span className="block">&nbsp;</span>
                <span className="block">
                  <span className="text-zinc-500">
                    // 1. Initialize the tracer
                  </span>
                </span>
                <span className="block">
                  <span className="text-violet-400">const</span> tracer ={" "}
                  <span className="text-violet-400">new</span>{" "}
                  <span className="text-yellow-200">Tracer</span>({"{"}
                </span>
                <span className="block">
                  {"  "}secret: process.env.
                  <span className="text-sky-300">RACKLE_SECRET</span>
                </span>
                <span className="block">{"}"});</span>
                <span className="block">&nbsp;</span>
                <span className="block">
                  <span className="text-zinc-500">
                    // 2. Wrap your agent execution
                  </span>
                </span>
                <span className="block">
                  <span className="text-violet-400">const</span> run ={" "}
                  <span className="text-violet-400">await</span> tracer.
                  <span className="text-blue-300">startRun</span>({"{"}{" "}
                  agentName:{" "}
                  <span className="text-emerald-400">"Customer-Bot"</span> {"}"}
                  );
                </span>
                <span className="block">&nbsp;</span>
                <span className="block">
                  <span className="text-violet-400">await</span> run.
                  <span className="text-blue-300">log</span>({"{"}
                </span>
                <span className="block">
                  {"  "}type:{" "}
                  <span className="text-emerald-400">"llm_call"</span>,
                </span>
                <span className="block">
                  {"  "}model:{" "}
                  <span className="text-emerald-400">"gpt-4o"</span>,
                </span>
                <span className="block">
                  {"  "}tokens: <span className="text-orange-300">350</span>,
                </span>
                <span className="block">
                  {"  "}input:{" "}
                  <span className="text-emerald-400">
                    "Help me reset my password."
                  </span>
                </span>
                <span className="block">{"}"});</span>
                <span className="block">&nbsp;</span>
                <span className="block">
                  <span className="text-violet-400">await</span> run.
                  <span className="text-blue-300">end</span>({"{"} status:{" "}
                  <span className="text-emerald-400">"completed"</span> {"}"});
                </span>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-black/5 dark:border-white/5 bg-white dark:bg-black/20 text-center">
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} Rackle.
        </p>
      </footer>
    </div>
  );
}
