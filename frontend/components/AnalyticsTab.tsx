"use client";

import { useState, useEffect } from "react";
import {
  BarChart3, Hash, Clock, AlertTriangle, Loader2, Cpu, Calendar,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

interface AnalyticsData {
  runsTimeline: { date: string; total: number; completed: number; failed: number }[];
  tokensTimeline: { date: string; tokens: number }[];
  latencyBuckets: { range: string; count: number }[];
  modelUsage: { model: string; count: number; tokens: number }[];
  stepTypes: { type: string; count: number }[];
  summary: { totalRuns: number; totalTokens: number; avgLatencyMs: number; failureRate: number };
}

const CHART_COLORS = ["#a1a1aa", "#71717a", "#52525b", "#3f3f46", "#27272a"];
const PIE_COLORS = ["#a1a1aa", "#71717a", "#52525b"];

function SummaryCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 flex items-start gap-3 transition-colors">
      <div className="p-2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-0.5">{label}</p>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 transition-colors">{value}</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 transition-colors">
      <h3 className="text-xs font-medium text-zinc-900 dark:text-zinc-300 mb-4 transition-colors">{title}</h3>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#000] border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 shadow-xl transition-colors">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-medium text-zinc-900 dark:text-zinc-200" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsTab({ agentName }: { agentName: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(14);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ days: String(days), agentName });
    fetch(`${BACKEND}/runs/analytics?${params}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => d.error ? (setError(d.error), setData(null)) : setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [days, agentName]);

  if (loading) return <div className="flex items-center justify-center py-16 text-zinc-500 gap-3"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs">Loading analytics…</span></div>;
  if (error || !data) return <div className="flex items-center justify-center py-16 text-red-400 text-xs gap-2"><AlertTriangle className="w-4 h-4" />{error || "Failed to load."}</div>;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
        <div className="flex items-center gap-1">
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${days === d ? "bg-zinc-900 dark:bg-zinc-800 border-zinc-900 dark:border-zinc-700 text-white dark:text-zinc-100" : "bg-transparent border-zinc-200 dark:border-zinc-800/50 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                }`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={<BarChart3 className="w-4 h-4" />} label="Runs" value={String(data.summary.totalRuns)} sub={`Last ${days} days`} />
        <SummaryCard icon={<Hash className="w-4 h-4" />} label="Tokens" value={data.summary.totalTokens.toLocaleString()} sub="Total consumed" />
        <SummaryCard icon={<Clock className="w-4 h-4" />} label="Avg Latency" value={data.summary.avgLatencyMs ? `${(data.summary.avgLatencyMs / 1000).toFixed(2)}s` : "—"} sub="Per run" />
        <SummaryCard icon={<AlertTriangle className={`w-4 h-4 ${data.summary.failureRate > 10 ? "text-red-400" : "text-zinc-400"}`} />} label="Failure Rate" value={`${data.summary.failureRate}%`} sub={data.summary.failureRate > 10 ? "⚠ Above threshold" : "Healthy"} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Runs Over Time">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.runsTimeline}>
              <defs>
                <linearGradient id="agCompGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4d4d8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d4d4d8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="agFailGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#a1a1aa" }} />
              <Area type="monotone" dataKey="completed" stroke="#d4d4d8" fillOpacity={1} fill="url(#agCompGrad)" name="Completed" />
              <Area type="monotone" dataKey="failed" stroke="#f87171" fillOpacity={1} fill="url(#agFailGrad)" name="Failed" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Token Usage">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.tokensTimeline}>
              <defs>
                <linearGradient id="agTokGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4d4d8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d4d4d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="tokens" stroke="#d4d4d8" fillOpacity={1} fill="url(#agTokGrad)" name="Tokens" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Latency Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.latencyBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="range" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Runs" radius={[4, 4, 0, 0]}>
                {data.latencyBuckets.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Step Types">
          <div className="flex items-center justify-center h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.stepTypes.filter(s => s.count > 0)} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} innerRadius={50} strokeWidth={0}>
                  {data.stepTypes.filter(s => s.count > 0).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, color: "#a1a1aa" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Model Table */}
      {data.modelUsage.length > 0 && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 overflow-hidden transition-colors">
          <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800/50 flex items-center gap-2 transition-colors">
            <Cpu className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-300 transition-colors">Model Usage</span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/30 transition-colors">
                <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Model</th>
                <th className="text-right px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Calls</th>
                <th className="text-right px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Total Tokens</th>
                <th className="text-right px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Avg/Call</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/30 transition-colors">
              {data.modelUsage.map(m => (
                <tr key={m.model} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-2 text-zinc-900 dark:text-zinc-200 font-medium transition-colors">{m.model}</td>
                  <td className="px-4 py-2 text-right text-zinc-600 dark:text-zinc-400 transition-colors">{m.count}</td>
                  <td className="px-4 py-2 text-right text-zinc-600 dark:text-zinc-400 transition-colors">{m.tokens.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right text-zinc-600 dark:text-zinc-400 font-mono transition-colors">{m.count > 0 ? Math.round(m.tokens / m.count).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
