"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  Activity,
  ArrowLeft,
  Hash,
  Clock,
  AlertTriangle,
  Loader2,
  Cpu,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatCost } from "@/utils/pricing";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

interface AnalyticsData {
  runsTimeline: { date: string; total: number; completed: number; failed: number; }[];
  tokensTimeline: { date: string; tokens: number }[];
  latencyBuckets: { range: string; count: number }[];
  modelUsage: { model: string; count: number; tokens: number }[];
  stepTypes: { type: string; count: number }[];
  summary: { totalRuns: number; totalTokens: number; avgLatencyMs: number; failureRate: number; };
}

const CHART_COLORS = ["#a1a1aa", "#71717a", "#52525b", "#3f3f46", "#27272a"];
const PIE_COLORS = ["#a1a1aa", "#71717a", "#52525b"];

function SummaryCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded border border-zinc-800 bg-[#0a0a0a]">
      <h3 className="text-sm font-medium text-zinc-200 mb-6">{title}</h3>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#000] border border-zinc-800 rounded px-3 py-2 shadow-xl">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-medium" style={{ color: p.color || "#e4e4e7" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${BACKEND}/runs/analytics?days=${days}`, { credentials: "include" })
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          window.location.href = "/auth/login";
          throw new Error("Unauthorized");
        }
        return r.json();
      })
      .then((d) => {
        if (d.error) {
          setError(d.error);
          setData(null);
        } else {
          setData(d);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          <span className="text-sm">Loading analytics…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center text-red-400 text-sm gap-2">
        <AlertTriangle className="w-4 h-4" /> {error || "Failed to load analytics data."}
      </div>
    );
  }

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
              <span className="font-medium text-sm tracking-tight text-zinc-100">Rackle.</span>
            </Link>
            <div className="h-4 w-px bg-zinc-800 mx-2" />
            <div className="flex items-center gap-1">
              <Link href="/dashboard" className="px-3 py-1.5 text-xs font-medium rounded text-zinc-400 hover:text-zinc-200 transition-colors">Runs</Link>
              <Link href="/dashboard/analytics" className="px-3 py-1.5 text-xs font-medium rounded bg-zinc-800 text-zinc-200">Analytics</Link>
              <Link href="/dashboard/settings" className="px-3 py-1.5 text-xs font-medium rounded text-zinc-400 hover:text-zinc-200 transition-colors">API Keys</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 rounded hover:bg-zinc-800 transition-colors text-zinc-400">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200 border border-zinc-700">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-medium tracking-tight text-zinc-100">Analytics</h1>
              <p className="text-xs text-zinc-500 mt-1 font-mono">Deep dive into performance & costs</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded px-2 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-transparent text-xs text-zinc-200 outline-none py-1.5"
            >
              <option value={7} className="bg-zinc-900 text-zinc-200">Last 7 days</option>
              <option value={14} className="bg-zinc-900 text-zinc-200">Last 14 days</option>
              <option value={30} className="bg-zinc-900 text-zinc-200">Last 30 days</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            icon={<BarChart3 className="w-4 h-4" />}
            label="Total Runs"
            value={String(data.summary.totalRuns)}
            sub={`Last ${days} days`}
          />
          <SummaryCard
            icon={<Hash className="w-4 h-4" />}
            label="Total Tokens"
            value={data.summary.totalTokens.toLocaleString()}
            sub="Across all models"
          />
          <SummaryCard
            icon={<Clock className="w-4 h-4" />}
            label="Avg Latency"
            value={data.summary.avgLatencyMs ? `${(data.summary.avgLatencyMs / 1000).toFixed(2)}s` : "—"}
            sub="Per completed run"
          />
          <SummaryCard
            icon={<AlertTriangle className={`w-4 h-4 ${data.summary.failureRate > 10 ? 'text-red-400' : 'text-zinc-400'}`} />}
            label="Failure Rate"
            value={`${data.summary.failureRate}%`}
            sub={data.summary.failureRate > 10 ? "⚠ Above threshold" : "Healthy"}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard title="Runs Over Time">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.runsTimeline}>
                <defs>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4d4d8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d4d4d8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
                <Area type="monotone" dataKey="completed" stroke="#d4d4d8" fillOpacity={1} fill="url(#completedGrad)" name="Completed" />
                <Area type="monotone" dataKey="failed" stroke="#f87171" fillOpacity={1} fill="url(#failedGrad)" name="Failed" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Token Usage Over Time">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.tokensTimeline}>
                <defs>
                  <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4d4d8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d4d4d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="tokens" stroke="#d4d4d8" fillOpacity={1} fill="url(#tokenGrad)" name="Tokens" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Latency Distribution">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.latencyBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="range" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Runs" radius={[4, 4, 0, 0]}>
                  {data.latencyBuckets.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Step Type Breakdown">
            <div className="flex items-center justify-center h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.stepTypes.filter(s => s.count > 0)}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    strokeWidth={0}
                  >
                    {data.stepTypes.filter(s => s.count > 0).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Model Usage Table */}
        {data.modelUsage.length > 0 && (
          <div className="rounded border border-zinc-800 bg-[#0a0a0a] overflow-hidden shadow-xl">
            <div className="px-5 py-3 border-b border-zinc-800 bg-[#000] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-zinc-400" />
              <h3 className="text-sm font-medium text-zinc-200">Model Usage Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/30">
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Model</th>
                    <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Calls</th>
                    <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Total Tokens</th>
                    <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Avg Tokens/Call</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {data.modelUsage.map((m) => (
                    <tr key={m.model} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-5 py-3 text-zinc-200 font-medium">{m.model}</td>
                      <td className="px-5 py-3 text-right text-zinc-400">{m.count}</td>
                      <td className="px-5 py-3 text-right text-zinc-400">{m.tokens.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right text-zinc-400 font-mono">
                        {m.count > 0 ? Math.round(m.tokens / m.count).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
