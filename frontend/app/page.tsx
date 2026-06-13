"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Activity,
  Code,
  Copy,
  Check,
  Brain,
  MessageSquare,
  Settings,
  AlertTriangle,
  Database
} from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export default function Home() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const snippet = `import { Tracer } from "@rackle-labs/sdk";

const tracer = new Tracer({
  apiKey: process.env.RACKLE_API_KEY,
});

const run = await tracer.startRun({ agentName: "Customer-Bot" });

await run.log({
  type: "llm_call",
  model: "gpt-4o",
  tokens: 350,
  input: "Help me reset my password.",
});

await run.end({ status: "completed" });
`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

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
    <div className="min-h-screen bg-[#000] text-zinc-100 font-sans selection:bg-zinc-800">
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#000] pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800/50 bg-[#000]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded border border-zinc-700 bg-zinc-800 flex items-center justify-center">
              <Activity className="w-4 h-4 text-zinc-300" />
            </div>
            <span className="font-medium text-sm tracking-tight text-zinc-100">
              Rackle.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleDashboardClick}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 overflow-hidden z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mb-6 text-zinc-100">
            Simple enough for domain experts.<br/>
            Detailed enough for developers.
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Trace your AI agents with a visual workflow pipeline. Rackle captures prompts, tool calls, contexts, and errors in a clean interface that makes debugging complex LLM systems intuitive.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleDashboardClick}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded bg-zinc-100 text-zinc-900 hover:bg-white transition-colors min-w-[160px]"
            >
              Start Tracing <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="https://github.com/student-ankitpandit/Rackle"
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors min-w-[160px]"
            >
              <Code className="w-4 h-4" /> View on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* UI Preview Section */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded border border-zinc-800 bg-[#0a0a0a] p-1 shadow-2xl">
          <div className="rounded border border-zinc-800/50 bg-[#000] overflow-hidden">
            {/* Fake Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              </div>
              <div className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase ml-4">Support Access Workflow</div>
            </div>
            
            {/* Fake Workflow UI */}
            <div className="p-6 relative">
              <div className="absolute left-[39px] top-[48px] bottom-[48px] w-[1px] bg-zinc-800" />
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 relative z-10">
                  <div className="mt-1 bg-[#000] py-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">Prompt</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-sm text-zinc-300 font-medium">You are the Support Operations Agent...</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative z-10">
                  <div className="mt-1 bg-[#000] py-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
                      <Database className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">Context</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-sm text-zinc-400">Unexpected charge for external agency...</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative z-10">
                  <div className="mt-1 bg-[#000] py-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
                      <Settings className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">Tool</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-zinc-200">add_member</span>
                      <span className="text-[10px] text-zinc-500 font-mono bg-zinc-800/50 px-1.5 py-0.5 rounded">0.6s</span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 space-y-0.5 px-2 mt-2">
                      <div className="flex gap-2"><span className="text-zinc-600">Input:</span><span className="text-zinc-400">{"{\"email\":\"agency@partner.co\"}"}</span></div>
                      <div className="flex gap-2"><span className="text-zinc-600">Output:</span><span className="text-zinc-400">{"{\"status\":\"member created\"}"}</span></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative z-10">
                  <div className="mt-1 bg-[#000] py-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
                      <Brain className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">Model</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-sm text-zinc-300">Chose add_member to give the agency access as a viewer. Result: the user was added as a billable member.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative z-10">
                  <div className="mt-1 bg-[#000] py-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">Error</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-sm text-red-400">Guardrail failed: Non-employee domain detected for billable role.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Snippet Section */}
      <div className="py-24 relative overflow-hidden bg-[#050505] border-y border-zinc-800/50 z-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-medium mb-4 text-zinc-100">
              Integrate in two lines of code.
            </h2>
            <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
              Our lightweight TypeScript SDK drops perfectly into any Node.js, Bun, or Edge environment. Capture rich step-by-step executions automatically.
            </p>
            <div className="flex items-center gap-6 text-xs font-medium text-zinc-500">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-zinc-400" /> Type-safe SDK</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-zinc-400" /> Zero dependencies</span>
            </div>
          </div>

          <div className="rounded border border-zinc-800 bg-[#000] p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-zinc-800/50 pb-3">
              <div className="text-xs font-mono text-zinc-500">agent.ts</div>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
                aria-label="Copy code snippet"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              <span className="text-zinc-500">import</span> {"{"} Tracer {"}"} <span className="text-zinc-500">from</span> <span className="text-emerald-400/80">"@rackle-labs/sdk"</span>;
              <br/><br/>
              <span className="text-zinc-500">const</span> tracer = <span className="text-zinc-500">new</span> <span className="text-blue-400/80">Tracer</span>({"{"}<br/>
              {"  "}apiKey: process.env.<span className="text-violet-400/80">RACKLE_API_KEY</span><br/>
              {"}"});<br/>
              <br/>
              <span className="text-zinc-500">const</span> run = <span className="text-zinc-500">await</span> tracer.<span className="text-blue-400/80">startRun</span>({"{"} agentName: <span className="text-emerald-400/80">"Customer-Bot"</span> {"}"});<br/>
              <br/>
              <span className="text-zinc-500">await</span> run.<span className="text-blue-400/80">log</span>({"{"}<br/>
              {"  "}type: <span className="text-emerald-400/80">"llm_call"</span>,<br/>
              {"  "}model: <span className="text-emerald-400/80">"gpt-4o"</span>,<br/>
              {"  "}tokens: <span className="text-orange-400/80">350</span>,<br/>
              {"  "}input: <span className="text-emerald-400/80">"Help me reset my password."</span><br/>
              {"}"});<br/>
              <br/>
              <span className="text-zinc-500">await</span> run.<span className="text-blue-400/80">end</span>({"{"} status: <span className="text-emerald-400/80">"completed"</span> {"}"});
            </pre>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 bg-[#000] text-center flex flex-col items-center justify-center gap-1 z-10 relative">
        <p className="text-[11px] text-zinc-600 font-sans">
          © {new Date().getFullYear()} Rackle. All rights reserved.
        </p>
        <p className="text-[11px] text-zinc-600 font-sans mt-2">
          Built by{" "}
          <Link
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
            href="https://x.com/ankitpanditdev"
            target="_blank"
            rel="noopener noreferrer"
          >
            @ankitpanditdev
          </Link>
        </p>
      </footer>
    </div>
  );
}
