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
} from "lucide-react";
import { calculateStepCost, formatCost } from "@/utils/pricing";
import { connectSocket, getSocket } from "@/utils/socket";

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
  const styles: Record<
    Run["status"],
    { cls: string; icon: React.ReactNode; label: string }
  > = {
    completed: {
      cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: "Completed",
    },
    failed: {
      cls: "bg-red-500/10 text-red-400 border-red-500/20",
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      label: "Failed",
    },
    running: {
      cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      label: "Running",
    },
  };
  const s = styles[status] ?? styles.running;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.cls}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-start gap-4 shadow-sm dark:shadow-none hover:-translate-y-0.5 transition-transform">
      <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
        {icon}
      </div>
      <div>
        <p className="text-xs text-zinc-500 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-zinc-900 dark:text-white">
          {value}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
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
      setRuns((prev) =>
        prev.map((r) =>
          r.id === run.id
            ? { ...r, status: run.status, totalMs: run.totalMs }
            : r,
        ),
      );
    };

    const handleStepAdded = ({ step }: { step: any }) => {
      setRuns((prev) =>
        prev.map((r) => {
          if (r.id === step.runId) {
            const steps = r.steps || [];
            return { ...r, steps: [...steps, step] };
          }
          return r;
        }),
      );
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

  const stats: Stats = {
    totalRuns: runs.length,
    avgLatencyMs: runs.length
      ? Math.round(
          runs
            .filter((r) => r.totalMs)
            .reduce((s, r) => s + (r.totalMs ?? 0), 0) /
            (runs.filter((r) => r.totalMs).length || 1),
        )
      : 0,
    failedRuns: runs.filter((r) => r.status === "failed").length,
    totalCost: runs.reduce((total, run) => {
      const runCost = (run.steps || []).reduce(
        (sum, step) => sum + calculateStepCost(step.model, step.tokens),
        0,
      );
      return total + runCost;
    }, 0),
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#030305] text-zinc-900 dark:text-white font-sans transition-colors duration-300">
      <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-violet-600/10 rounded-full filter blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[300px] bg-indigo-600/10 rounded-full filter blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <Activity className="w-5 h-5 text-violet-400" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Rackle Dashboard
              </h1>
            </div>
            <p className="text-sm text-zinc-500 ml-11">
              Real-time observability for your AI agents.
            </p>
            <div className="flex items-center gap-2 ml-11 mt-3">
              <Link
                href="/dashboard/analytics"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors shadow-sm dark:shadow-none"
              >
                <TrendingUp className="w-3.5 h-3.5" /> Analytics
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors shadow-sm dark:shadow-none"
              >
                <Key className="w-3.5 h-3.5" /> API Keys
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {agents.length > 0 && (
              <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg p-1 shadow-sm dark:shadow-none">
                <Filter className="w-4 h-4 text-zinc-400 ml-2 shrink-0" />
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="bg-transparent text-sm text-zinc-900 dark:text-zinc-300 outline-none pr-4 py-1.5 min-w-[120px]"
                >
                  <option value="" className="bg-white dark:bg-[#111]">
                    All Agents
                  </option>
                  {agents.map((a) => (
                    <option
                      key={a}
                      value={a}
                      className="bg-white dark:bg-[#111]"
                    >
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            )}


            <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg p-1 shadow-sm dark:shadow-none">
              <Activity className="w-4 h-4 text-zinc-400 ml-2 shrink-0" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-sm text-zinc-900 dark:text-zinc-300 outline-none pr-4 py-1.5 min-w-[120px]"
              >
                <option value="" className="bg-white dark:bg-[#111]">
                  All Statuses
                </option>
                <option value="completed" className="bg-white dark:bg-[#111]">
                  Completed
                </option>
                <option value="failed" className="bg-white dark:bg-[#111]">
                  Failed
                </option>
                <option value="running" className="bg-white dark:bg-[#111]">
                  Running
                </option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg p-1 px-3 shadow-sm dark:shadow-none min-w-[200px] ml-auto">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Search runs e.g. 'hallucination'..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-zinc-900 dark:text-zinc-300 outline-none w-full py-1.5"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="Total Runs"
            value={String(stats.totalRuns)}
            sub={selectedAgent || "All time"}
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Est. Cost"
            value={formatCost(stats.totalCost)}
            sub="Based on token usage"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Avg Latency"
            value={
              stats.avgLatencyMs
                ? `${(stats.avgLatencyMs / 1000).toFixed(2)}s`
                : "—"
            }
            sub="Per completed run"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Failed Runs"
            value={String(stats.failedRuns)}
            sub={`${stats.totalRuns ? Math.round((stats.failedRuns / stats.totalRuns) * 100) : 0}% failure rate`}
          />
        </div>

        <div className="bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
          <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Recent Runs
            </h2>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-3 py-20 text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
              <span className="text-sm">Loading runs…</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-20 text-red-500 text-sm gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          {!loading && !error && runs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
              <Cpu className="w-8 h-8" />
              <p className="text-sm">
                No runs yet. Instrument your agent with the Rackle SDK to start
                tracing.
              </p>
            </div>
          )}

          {!loading && runs.length > 0 && (
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {runs.map((run) => (
                <Link
                  key={run.id}
                  href={`/dashboard/runs/${run.id}`}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                        {run.agentName}
                      </span>
                      <StatusBadge status={run.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {(() => {
                          const count = run.steps
                            ? run.steps.length
                            : (run._count?.steps ?? 0);
                          return `${count} step${count !== 1 ? "s" : ""}`;
                        })()}
                      </span>
                      {run.totalMs && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {(run.totalMs / 1000).toFixed(2)}s
                        </span>
                      )}
                      <span>{new Date(run.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
