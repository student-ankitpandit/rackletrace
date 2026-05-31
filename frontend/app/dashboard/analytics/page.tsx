'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Activity,
  ArrowLeft,
  Hash,
  Clock,
  AlertTriangle,
  Loader2,
  Cpu,
  TrendingUp,
  Settings,
  Calendar,
} from 'lucide-react';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { calculateStepCost, formatCost } from '@/utils/pricing';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

interface AnalyticsData {
  runsTimeline: { date: string; total: number; completed: number; failed: number }[];
  tokensTimeline: { date: string; tokens: number }[];
  latencyBuckets: { range: string; count: number }[];
  modelUsage: { model: string; count: number; tokens: number }[];
  stepTypes: { type: string; count: number }[];
  summary: {
    totalRuns: number;
    totalTokens: number;
    avgLatencyMs: number;
    failureRate: number;
  };
}

const CHART_COLORS = ['#8b5cf6', '#6366f1', '#a78bfa', '#c4b5fd', '#818cf8'];
const PIE_COLORS  = ['#8b5cf6', '#f59e0b', '#ef4444'];

function SummaryCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-start gap-4 shadow-sm dark:shadow-none hover:-translate-y-0.5 transition-transform">
      <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
        {icon}
      </div>
      <div>
        <p className="text-sm text-zinc-500 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-sm dark:shadow-none">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-6">{title}</h3>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
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
    fetch(`${BACKEND}/runs/analytics?days=${days}`, { credentials: 'include' })
      .then(async r => {
        if (r.status === 401 || r.status === 403) {
          window.location.href = '/auth/login';
          throw new Error('Unauthorized');
        }
        return r.json();
      })
      .then(d => {
        if (d.error) {
          setError(d.error);
          setData(null);
        } else {
          setData(d);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#030305] flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
          <span className="text-sm">Loading analytics…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#030305] flex items-center justify-center text-zinc-500 text-sm">
        {error || 'Failed to load analytics data.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#030305] text-zinc-900 dark:text-white font-sans transition-colors duration-300">
      <div className="fixed top-0 right-1/4 w-[600px] h-[400px] bg-indigo-600/10 rounded-full filter blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="fixed bottom-0 left-1/4 w-[500px] h-[300px] bg-violet-600/10 rounded-full filter blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard" className="p-2 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors shadow-sm dark:shadow-none">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Analytics
              </h1>
            </div>
            <p className="text-sm text-zinc-500 ml-14">Deep dive into your agent performance and costs.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg p-1 shadow-sm dark:shadow-none">
              <Calendar className="w-4 h-4 text-zinc-500 dark:text-zinc-400 ml-2 shrink-0" />
              <select 
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="bg-transparent text-sm text-zinc-900 dark:text-zinc-300 outline-none pr-4 py-1.5"
              >
                <option value={7} className="bg-white dark:bg-[#111]">Last 7 days</option>
                <option value={14} className="bg-white dark:bg-[#111]">Last 14 days</option>
                <option value={30} className="bg-white dark:bg-[#111]">Last 30 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="Total Runs"
            value={String(data.summary.totalRuns)}
            sub={`Last ${days} days`}
          />
          <SummaryCard
            icon={<Hash className="w-5 h-5" />}
            label="Total Tokens"
            value={data.summary.totalTokens.toLocaleString()}
            sub="Across all models"
          />
          <SummaryCard
            icon={<Clock className="w-5 h-5" />}
            label="Avg Latency"
            value={data.summary.avgLatencyMs ? `${(data.summary.avgLatencyMs / 1000).toFixed(2)}s` : '—'}
            sub="Per completed run"
          />
          <SummaryCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Failure Rate"
            value={`${data.summary.failureRate}%`}
            sub={`${data.summary.failureRate > 10 ? '⚠ Above threshold' : 'Healthy'}`}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Runs Over Time */}
          <ChartCard title="Runs Over Time">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.runsTimeline}>
                <defs>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="completed" stroke="#8b5cf6" fillOpacity={1} fill="url(#completedGrad)" name="Completed" />
                <Area type="monotone" dataKey="failed" stroke="#ef4444" fillOpacity={1} fill="url(#failedGrad)" name="Failed" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Token Usage Over Time */}
          <ChartCard title="Token Usage Over Time">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.tokensTimeline}>
                <defs>
                  <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="tokens" stroke="#6366f1" fillOpacity={1} fill="url(#tokenGrad)" name="Tokens" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Latency Distribution */}
          <ChartCard title="Latency Distribution">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.latencyBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Runs" radius={[6, 6, 0, 0]}>
                  {data.latencyBuckets.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Step Type Breakdown */}
          <ChartCard title="Step Type Breakdown">
            <div className="flex items-center justify-center h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.stepTypes}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    strokeWidth={0}
                    label={(props: any) => `${props.name} (${props.value})`}
                  >
                    {data.stepTypes.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Model Usage Table */}
        {data.modelUsage.length > 0 && (
          <div className="backdrop-blur-xl bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Model Usage Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/5">
                    <th className="text-left px-6 py-3 text-xs text-zinc-600 dark:text-zinc-500 font-medium">Model</th>
                    <th className="text-right px-6 py-3 text-xs text-zinc-600 dark:text-zinc-500 font-medium">Calls</th>
                    <th className="text-right px-6 py-3 text-xs text-zinc-600 dark:text-zinc-500 font-medium">Total Tokens</th>
                    <th className="text-right px-6 py-3 text-xs text-zinc-600 dark:text-zinc-500 font-medium">Avg Tokens/Call</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {data.modelUsage.map(m => (
                    <tr key={m.model} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-3 text-zinc-900 dark:text-white font-medium">{m.model}</td>
                      <td className="px-6 py-3 text-right text-zinc-600 dark:text-zinc-400">{m.count}</td>
                      <td className="px-6 py-3 text-right text-zinc-600 dark:text-zinc-400">{m.tokens.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-zinc-600 dark:text-zinc-400">{m.count > 0 ? Math.round(m.tokens / m.count).toLocaleString() : '—'}</td>
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
