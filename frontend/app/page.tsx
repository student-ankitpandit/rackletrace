"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
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
  Database,
  ChevronDown,
  Loader2
} from "lucide-react";

function FAQItem({ q, a }: { q: string, a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#0a0a0a] overflow-hidden transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
      >
        <h4 className="text-base font-medium text-zinc-900 dark:text-zinc-200">{q}</h4>
        <div className={`transition-transform duration-200 text-zinc-500 ${open ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>
      <div
        className={`px-6 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed transition-all duration-300 ease-in-out ${open ? "max-h-40 pb-6 opacity-100" : "max-h-0 pb-0 opacity-0"
          }`}
      >
        <p>{a}</p>
      </div>
    </div>
  );
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export default function Home() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [navigatingState, setNavigatingState] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const snippet = `
  import { Tracer } from "@rackle-labs/sdk";

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

  const handleDashboardClick = async (e: React.MouseEvent, source: string = "navbar") => {
    e.preventDefault();
    if (navigatingState) return;

    setNavigatingState(source);
    try {
      const res = await fetch(`${BACKEND}/auth/me`, { credentials: "include" });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        router.push("/auth/login");
      }
    } catch (err) {
      router.push("/auth/login");
    } finally {
      setNavigatingState(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#000] text-zinc-800 dark:text-zinc-100 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors">
      {/* Soft warm light mode grid + gradient */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-transparent to-zinc-50/90 dark:from-[#0a0a0a] dark:to-[#000] pointer-events-none transition-colors" />

      {/* Navbar */}
      <nav className={`fixed inset-x-4 mx-auto z-50 rounded-xl border border-zinc-200 dark:border-zinc-800/50 bg-white/80 dark:bg-[#000]/80 backdrop-blur-md transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) shadow-sm ${isScrolled
          ? "top-3 max-w-4xl rounded-lg border-zinc-200 dark:border-zinc-700/50 shadow-md bg-white/90 dark:bg-[#000]/90"
          : "top-6 max-w-6xl"
        }`}>
        <div className={`px-6 flex items-center justify-between transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isScrolled ? "h-11" : "h-16"
          }`}>
          <div className={`flex items-center gap-1 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) origin-left ${isScrolled ? "scale-90" : "scale-100"
            }`}>
            <Image 
              src="/logo.png" 
              alt="rackletrace logo" 
              width={20} 
              height={20} 
              className="w-5 h-5 object-contain invert mix-blend-multiply dark:invert-0 dark:mix-blend-screen"
            />
            <span className="font-medium text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
              rackletrace
            </span>
          </div>
          <div className={`flex items-center gap-4 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) origin-right ${isScrolled ? "scale-90" : "scale-100"
            }`}>
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              Login
            </Link>
            <button
              onClick={(e) => handleDashboardClick(e, 'navbar')}
              disabled={!!navigatingState}
              className={`flex items-center gap-2 font-medium rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer ${isScrolled ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"
                }`}
            >
              {navigatingState === 'navbar' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 overflow-hidden z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 pb-2">
            The <span className="relative inline-block px-1">
              <span className="font-[family-name:var(--font-playfair)] italic pr-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400">observability</span>
              <span className="absolute left-1 right-1 -bottom-1 sm:-bottom-2 h-[4px] sm:h-[6px] bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full opacity-80" />
            </span> stack for AI agents.
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Trace your AI agents with a visual workflow pipeline. Rackle captures prompts, tool calls, contexts, and errors in a clean interface that makes debugging complex LLM systems intuitive.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={(e) => handleDashboardClick(e, 'hero')}
              disabled={!!navigatingState}
              className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-50 transition-all shadow-lg hover:shadow-xl dark:shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] min-w-[160px] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {navigatingState === 'hero' ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Start Tracing <ArrowRight className="w-4 h-4" /></>}
            </button>
            <a
              href="https://github.com/student-ankitpandit/Rackle"
              className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-all min-w-[160px]"
            >
              <Code className="w-4 h-4" /> Star on Github
            </a>
          </div>
        </div>
      </div>

      {/* UI Preview Section */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] p-1 shadow-2xl hover:shadow-[0_0_80px_-20px_rgba(139,92,246,0.5)] dark:hover:shadow-[0_0_100px_-20px_rgba(139,92,246,0.3)] transition-all duration-500">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-black overflow-hidden transition-colors relative">
            {/* Fake Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 backdrop-blur-md bg-white/80 dark:bg-black/50 sticky top-0 z-20 transition-colors">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 transition-colors" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 transition-colors" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 transition-colors" />
              </div>
              <div className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase ml-4">Support Access Workflow</div>
            </div>

            {/* Fake Workflow UI */}
            <div className="p-6 relative">
              <div className="absolute left-[39px] top-[48px] bottom-[48px] w-[1px] bg-zinc-200 dark:bg-zinc-800 transition-colors" />

              <div className="space-y-6">
                <div className="flex items-start gap-4 relative z-10">
                  <div className="mt-1 bg-white dark:bg-[#000] py-1 transition-colors">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">Prompt</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-sm text-zinc-800 dark:text-zinc-300 font-medium">You are the Support Operations Agent...</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative z-10">
                  <div className="mt-1 bg-white dark:bg-[#000] py-1 transition-colors">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-colors">
                      <Database className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">Context</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Unexpected charge for external agency...</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative z-10">
                  <div className="mt-1 bg-white dark:bg-[#000] py-1 transition-colors">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-colors">
                      <Settings className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">Tool</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">add_member</span>
                      <span className="text-[10px] text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded transition-colors">0.6s</span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 space-y-0.5 px-2 mt-2">
                      <div className="flex gap-2"><span className="text-zinc-400 dark:text-zinc-600">Input:</span><span className="text-zinc-600 dark:text-zinc-400">{"{\"email\":\"agency@partner.co\"}"}</span></div>
                      <div className="flex gap-2"><span className="text-zinc-400 dark:text-zinc-600">Output:</span><span className="text-zinc-600 dark:text-zinc-400">{"{\"status\":\"member created\"}"}</span></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative z-10">
                  <div className="mt-1 bg-white dark:bg-[#000] py-1 transition-colors">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-colors">
                      <Brain className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">Model</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-sm text-zinc-800 dark:text-zinc-300">Chose add_member to give the agency access as a viewer. Result: the user was added as a billable member.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative z-10">
                  <div className="mt-1 bg-zinc-100 dark:bg-[#000] py-1 transition-colors">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-red-500/20 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">Error</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-sm text-red-600 dark:text-red-400">Guardrail failed: Non-employee domain detected for billable role.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 relative z-10 bg-transparent transition-colors">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 pb-1">Everything you need to debug AI</h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">Rackle provides a complete suite of tools to monitor, analyze, and improve your AI agents in production.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#0a0a0a] hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4 transition-colors"><Activity className="w-5 h-5 text-violet-500 dark:text-violet-400" /></div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-200 mb-2">Real-time Tracing</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Watch your agents execute step-by-step. See prompts, tool calls, and latency instantly as they happen.</p>
            </div>
            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-[#0a0a0a]/50 backdrop-blur-sm hover:bg-white dark:hover:bg-[#0a0a0a] hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4 transition-colors"><Brain className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /></div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-200 mb-2">AI Copilot</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Ask Rackle AI to analyze traces, find bottlenecks, and explain errors using your actual execution data.</p>
            </div>
            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-[#0a0a0a]/50 backdrop-blur-sm hover:bg-white dark:hover:bg-[#0a0a0a] hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4 transition-colors"><Database className="w-5 h-5 text-blue-500 dark:text-blue-400" /></div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-200 mb-2">Cost & Tokens</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Track token usage across all your models. Get detailed analytics on your spend and optimize your pipelines.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24 relative z-10 bg-zinc-50 dark:bg-[#050505] border-y border-zinc-200 dark:border-zinc-800/50 transition-colors">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 pb-1">How It Works</h2>
            <p className="text-zinc-600 dark:text-zinc-400">From code to dashboard in three simple steps.</p>
          </div>
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold shrink-0 transition-colors">1</div>
              <div>
                <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-200 mb-2">Install the SDK</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">Drop the lightweight Rackle SDK into your Node.js or Bun project. It's fully typed and has zero external dependencies.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0 transition-colors">2</div>
              <div>
                <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-200 mb-2">Log your Steps</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">Wrap your LLM calls, tool executions, and memory operations with <code className="text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-xs transition-colors">run.log()</code>. Rackle handles the async batching automatically.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0 transition-colors">3</div>
              <div>
                <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-200 mb-2">Analyze on the Dashboard</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">View beautiful, nested execution traces. Identify failures instantly, track latency, and use Rackle AI to debug your agents.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Snippet Section */}
      <div className="py-24 relative overflow-hidden bg-zinc-50 dark:bg-[#050505] border-b border-zinc-200 dark:border-zinc-800/50 z-10 transition-colors">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 pb-1">
              Integrate in two lines of code.
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              Our lightweight TypeScript SDK drops perfectly into any Node.js, Bun, or Edge environment. Capture rich step-by-step executions automatically.
            </p>
            <div className="flex items-center gap-6 text-xs font-medium text-zinc-500 dark:text-zinc-500">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-zinc-400" /> Type-safe SDK</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-zinc-400" /> Zero dependencies</span>
            </div>
          </div>

          <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#000] p-4 shadow-xl transition-colors">
            <div className="flex items-center justify-between mb-3 border-b border-zinc-200 dark:border-zinc-800/50 pb-3 transition-colors">
              <div className="text-xs font-mono text-zinc-500">agent.ts</div>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                aria-label="Copy code snippet"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="text-[11px] font-mono text-zinc-800 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              <span className="text-zinc-500">import</span> {"{"} Tracer {"}"} <span className="text-zinc-500">from</span> <span className="text-emerald-600 dark:text-emerald-400/80">"@rackle-labs/sdk"</span>;
              <br /><br />
              <span className="text-zinc-500">const</span> tracer = <span className="text-zinc-500">new</span> <span className="text-blue-600 dark:text-blue-400/80">Tracer</span>({"{"}<br />
              {"  "}apiKey: process.env.<span className="text-violet-600 dark:text-violet-400/80">RACKLE_API_KEY</span><br />
              {"}"});<br />
              <br />
              <span className="text-zinc-500">const</span> run = <span className="text-zinc-500">await</span> tracer.<span className="text-blue-600 dark:text-blue-400/80">startRun</span>({"{"} agentName: <span className="text-emerald-600 dark:text-emerald-400/80">"Customer-Bot"</span> {"}"});<br />
              <br />
              <span className="text-zinc-500">await</span> run.<span className="text-blue-600 dark:text-blue-400/80">log</span>({"{"}<br />
              {"  "}type: <span className="text-emerald-600 dark:text-emerald-400/80">"llm_call"</span>,<br />
              {"  "}model: <span className="text-emerald-600 dark:text-emerald-400/80">"gpt-4o"</span>,<br />
              {"  "}tokens: <span className="text-orange-600 dark:text-orange-400/80">350</span>,<br />
              {"  "}input: <span className="text-emerald-600 dark:text-emerald-400/80">"Help me reset my password."</span><br />
              {"}"});<br />
              <br />
              <span className="text-zinc-500">await</span> run.<span className="text-blue-600 dark:text-blue-400/80">end</span>({"{"} status: <span className="text-emerald-600 dark:text-emerald-400/80">"completed"</span> {"}"});
            </pre>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-24 relative z-10 bg-transparent transition-colors">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 pb-1">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "What models does Rackle support?", a: "Rackle is entirely model-agnostic. You can log traces from OpenAI, Anthropic, local open-source models, or any other LLM provider. Simply pass the model name and token usage into the log step." },
              { q: "Is it safe to send my data?", a: "Yes. Rackle is designed to run locally or be self-hosted in your own infrastructure. Your traces, prompts, and API keys never leave your environment." },
              { q: "Does the SDK add latency to my agents?", a: "No. The SDK batches logs asynchronously and sends them in the background, ensuring your critical AI paths remain extremely fast and uninterrupted." },
            ].map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 sm:py-32 relative z-10 bg-transparent border-t border-zinc-200/50 dark:border-zinc-900/50 transition-colors">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-500 pb-1 leading-tight sm:leading-tight">
            Stop Guessing.<br />Start Monitoring.
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto mb-10 text-sm sm:text-base leading-relaxed">
            Get total observability into your AI agents in minutes. No complex setups, no agent overhead, just clean trace outputs.
          </p>
          <button
            onClick={(e) => handleDashboardClick(e, 'cta')}
            disabled={!!navigatingState}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-50 transition-all shadow-lg hover:shadow-xl dark:shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed min-w-[180px]"
          >
            {navigatingState === 'cta' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Start Tracing Now <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-zinc-100 dark:bg-[#050505] border-t border-zinc-200 dark:border-zinc-800/50 pt-16 pb-32 md:pb-40 overflow-hidden z-10 transition-colors">
        <div className="max-w-6xl mx-auto px-6 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16 md:mb-24">
            {/* Logo & Copyright */}
            <div className="md:col-span-4">
              <div className="flex items-center gap-2 mb-3">
                <Image 
                  src="/logo.png" 
                  alt="Rackletrace Logo" 
                  width={20} 
                  height={20} 
                  className="w-5 h-5 object-contain  mix-blend-multiply dark:invert-0 dark:mix-blend-screen"
                />
                <h3 className="font-semibold text-xl tracking-tight text-zinc-900 dark:text-zinc-100">rackletrace</h3>
              </div>
              <p className="text-sm text-zinc-500 mb-2">
                © copyright rackletrace {new Date().getFullYear()}. All rights reserved.
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-600">
                Built with ❤️ by <Link href="https://x.com/ankitpanditdev" target="_blank" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">@ankitpanditdev</Link>
              </p>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 lg:gap-16 ml-0 md:ml-12 lg:ml-20">
              <div>
                <h4 className="text-zinc-900 dark:text-zinc-100 font-medium mb-6 text-sm tracking-wide">Pages</h4>
                <ul className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <li><Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Home</Link></li>
                  <li><Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Dashboard</Link></li>
                  <li><Link href="/dashboard/settings" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">API Keys</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-zinc-900 dark:text-zinc-100 font-medium mb-6 text-sm tracking-wide">Socials</h4>
                <ul className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <li><Link href="https://x.com/racklelabs" target="_blank" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Twitter / X</Link></li>
                  <li><Link href="https://github.com/student-ankitpandit/Rackle" target="_blank" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">GitHub</Link></li>
                  <li><Link href="https://www.linkedin.com/company/racklelabs" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">LinkedIn</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-zinc-900 dark:text-zinc-100 font-medium mb-6 text-sm tracking-wide">Legal</h4>
                <ul className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <li><Link href="/legal/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/legal/terms" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Terms of Service</Link></li>
                  <li><Link href="/legal/cookies" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Cookie Policy</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-zinc-900 dark:text-zinc-100 font-medium mb-6 text-sm tracking-wide">Register</h4>
                <ul className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <li><Link href="/auth/signup" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Sign Up</Link></li>
                  <li><Link href="/auth/login" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Login</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Massive Watermark Text */}
        <div className="absolute bottom-[-10%] md:bottom-[-15%] left-0 right-0 flex justify-center overflow-hidden pointer-events-none select-none z-10">
          <span className="font-bold text-[20vw] md:text-[20vw] leading-none whitespace-nowrap tracking-tighter text-zinc-200 dark:text-[#111] transition-colors">
            Rackle
          </span>
        </div>
      </footer>
    </div>
  );
}
