"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  Clock,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Zap,
  BarChart3,
  DollarSign,
  Filter,
  TrendingUp,
  Key,
  Search,
  LogOut,
  Layers,
  Check
} from "lucide-react";
import { calculateStepCost, formatCost } from "@/utils/pricing";
import { connectSocket } from "@/utils/socket";
import ChatPanel from "@/components/ChatPanel";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

interface Run {
  id: string;
  agentName: string;
  status: "running" | "completed" | "failed";
  totalMs: number | null;
  createdAt: string;
  steps?: { tokens: number | null; model: string | null }[];
  _count: { steps: number };
}

interface Stats {
  totalRuns: number;
  avgLatencyMs: number;
  failedRuns: number;
  totalCost: number;
}

function StatusBadge({ status }: { status: Run["status"] }) {
  const styles: Record<Run["status"], { cls: string; icon: React.ReactNode; label: string }> = {
    completed: { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Completed" },
    failed: { cls: "bg-red-500/10 text-red-400 border-red-500/20", icon: <AlertTriangle className="w-3.5 h-3.5" />, label: "Failed" },
    running: { cls: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, label: "Running" },
  };
  const s = styles[status] ?? styles.running;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border ${s.cls}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="p-4 rounded border border-zinc-800 bg-[#0a0a0a] flex items-start gap-3 transition-colors hover:border-zinc-700">
      <div className="p-1.5 rounded bg-zinc-800/50 text-zinc-400 border border-zinc-800">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1">{label}</p>
        <p className="text-xl font-medium text-zinc-100">{value}</p>
        <p className="text-[10px] text-zinc-500 mt-1">{sub}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<Run[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetch(`${BACKEND}/runs/agents`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAgents(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (selectedAgent) query.append("agentName", selectedAgent);
    if (selectedStatus) query.append("status", selectedStatus);
    if (debouncedSearch) query.append("search", debouncedSearch);
    const qs = query.toString();
    const url = `${BACKEND}/runs${qs ? `?${qs}` : ""}`;

    fetch(url, { credentials: "include" })
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          window.location.href = "/auth/login";
          throw new Error("Unauthorized");
        }
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setRuns(data);
        else setError("Failed to load runs.");
      })
      .catch(() => setError("Could not reach the server."))
      .finally(() => setLoading(false));

    const socket = connectSocket();

    const handleRunStarted = ({ run }: { run: Run }) => {
      if (selectedAgent && run.agentName !== selectedAgent) return;
      if (selectedStatus && run.status !== selectedStatus) return;
      setRuns((prev) => {
        if (prev.some((r) => r.id === run.id)) return prev;
        return [{ ...run, steps: [] }, ...prev];
      });
    };

    const handleRunEnded = ({ run }: { run: Run }) => {
      setRuns((prev) => prev.map((r) => r.id === run.id ? { ...r, status: run.status, totalMs: run.totalMs } : r));
    };

    const handleStepAdded = ({ step }: { step: any }) => {
      setRuns((prev) => prev.map((r) => {
        if (r.id === step.runId) {
          const steps = r.steps || [];
          return { ...r, steps: [...steps, step] };
        }
        return r;
      }));
    };

    socket.on("run_started", handleRunStarted);
    socket.on("run_ended", handleRunEnded);
    socket.on("step_added", handleStepAdded);

    return () => {
      socket.off("run_started", handleRunStarted);
      socket.off("run_ended", handleRunEnded);
      socket.off("step_added", handleStepAdded);
    };
  }, [selectedAgent, selectedStatus, debouncedSearch]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch(`${BACKEND}/auth/logout`, { method: "POST", credentials: "include" });
      if (res.ok) window.location.href = "/auth/login";
    } finally {
      setLoggingOut(false);
    }
  };

  const stats: Stats = {
    totalRuns: runs.length,
    avgLatencyMs: runs.length
      ? Math.round(runs.filter((r) => r.totalMs).reduce((s, r) => s + (r.totalMs ?? 0), 0) / (runs.filter((r) => r.totalMs).length || 1))
      : 0,
    failedRuns: runs.filter((r) => r.status === "failed").length,
    totalCost: runs.reduce((total, run) => {
      const runCost = (run.steps || []).reduce((sum, step) => sum + calculateStepCost(step.model, step.tokens), 0);
      return total + runCost;
    }, 0),
  };

  return (
    <div className="min-h-screen bg-[#000] text-zinc-100 font-sans selection:bg-zinc-800">
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#000] pointer-events-none" />

      {/* Top Navigation Bar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800/50 bg-[#000]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-7 h-7 rounded border border-zinc-700 bg-zinc-800 flex items-center justify-center">
                <Activity className="w-4 h-4 text-zinc-300" />
              </div>
              <span className="font-medium text-sm tracking-tight text-zinc-100">
                Rackle.
              </span>
            </Link>
            
            <div className="h-4 w-px bg-zinc-800 mx-2" />
            
            <div className="flex items-center gap-1">
              <Link href="/dashboard" className="px-3 py-1.5 text-xs font-medium rounded bg-zinc-800 text-zinc-200">
                Runs
              </Link>
              <Link href="/dashboard/settings" className="px-3 py-1.5 text-xs font-medium rounded text-zinc-400 hover:text-zinc-200 transition-colors">
                API Keys
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
              >
                {loggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                Logout
              </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-12">
        {/* Filters and Search Bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded px-2 shadow-sm">
              <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <input
                type="text"
                placeholder="Search runs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 outline-none w-48 py-1.5"
              />
            </div>
            
            {agents.length > 0 && (
               <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded px-2 shadow-sm">
                 <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                 <select
                   value={selectedAgent}
                   onChange={(e) => setSelectedAgent(e.target.value)}
                   className="bg-transparent text-xs text-zinc-200 outline-none py-1.5"
                 >
                   <option value="" className="bg-zinc-900 text-zinc-200">All Agents</option>
                   {agents.map((a) => <option key={a} value={a} className="bg-zinc-900 text-zinc-200">{a}</option>)}
                 </select>
               </div>
            )}

            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded px-2 shadow-sm">
               <Activity className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
               <select
                 value={selectedStatus}
                 onChange={(e) => setSelectedStatus(e.target.value)}
                 className="bg-transparent text-xs text-zinc-200 outline-none py-1.5"
               >
                 <option value="" className="bg-zinc-900 text-zinc-200">All Statuses</option>
                 <option value="completed" className="bg-zinc-900 text-zinc-200">Completed</option>
                 <option value="failed" className="bg-zinc-900 text-zinc-200">Failed</option>
                 <option value="running" className="bg-zinc-900 text-zinc-200">Running</option>
               </select>
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<BarChart3 className="w-4 h-4" />}
            label="Total Runs"
            value={String(stats.totalRuns)}
            sub={selectedAgent || "All time"}
          />
          <StatCard
            icon={<DollarSign className="w-4 h-4" />}
            label="Est. Cost"
            value={formatCost(stats.totalCost)}
            sub="Based on token usage"
          />
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="Avg Latency"
            value={stats.avgLatencyMs ? `${(stats.avgLatencyMs / 1000).toFixed(2)}s` : "—"}
            sub="Per completed run"
          />
          <StatCard
            icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
            label="Failed Runs"
            value={String(stats.failedRuns)}
            sub={`${stats.totalRuns ? Math.round((stats.failedRuns / stats.totalRuns) * 100) : 0}% failure rate`}
          />
        </div>

        {/* Runs List Container */}
        <div className="rounded border border-zinc-800 bg-[#0a0a0a] shadow-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 bg-[#000] flex items-center gap-2">
            <Activity className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-medium text-zinc-200">Execution Traces</h2>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-3 py-16 text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Loading traces…</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-16 text-red-400 text-xs gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          {!loading && !error && runs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
              <Cpu className="w-6 h-6 text-zinc-600" />
              <p className="text-xs">
                No runs yet. Instrument your agent with the Rackle SDK to start tracing.
              </p>
            </div>
          )}

          {!loading && runs.length > 0 && (
            <div className="divide-y divide-zinc-800/50">
              {runs.map((run) => (
                <Link
                  key={run.id}
                  href={`/dashboard/runs/${run.id}`}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-zinc-900/50 transition-colors group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-40 flex items-center gap-3">
                       <StatusBadge status={run.status} />
                       <span className="text-sm font-medium text-zinc-200 truncate">{run.agentName}</span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-[11px] text-zinc-500 font-mono">
                      <span className="flex items-center gap-1.5 w-20">
                        <Layers className="w-3.5 h-3.5 text-zinc-600" />
                        {run.steps ? run.steps.length : (run._count?.steps ?? 0)} steps
                      </span>
                      <span className="flex items-center gap-1.5 w-20">
                        <Clock className="w-3.5 h-3.5 text-zinc-600" />
                        {run.totalMs ? `${(run.totalMs / 1000).toFixed(2)}s` : '—'}
                      </span>
                      <span className="text-zinc-600">
                        {new Date(run.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Chat */}
      <ChatPanel />
    </div>
  );
}
