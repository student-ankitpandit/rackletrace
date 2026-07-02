"use client";

import { useState, useEffect } from "react";
import {
  Loader2, AlertTriangle, Plus, X, Search, ClipboardList, Clock,
  CheckCircle2, Archive, CalendarClock, FileEdit, User, Eye,
  Inbox, Trash2, Edit3, Save, AlertCircle, Activity,
} from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

interface EvalItem {
  id: string; title: string; description: string | null; status: string;
  assignee: string | null; dueDate: string | null; agentName: string | null;
  score: number | null; notes: string | null; createdAt: string; updatedAt: string;
}

const STATUS_CFG: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  COLLECTING: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Inbox, label: "Collecting" },
  IN_REVIEW: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Eye, label: "In Review" },
  OVERDUE: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: AlertCircle, label: "Overdue" },
  COMPLETED: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2, label: "Completed" },
  ARCHIVED: { color: "text-zinc-500", bg: "bg-zinc-500/10", border: "border-zinc-500/20", icon: Archive, label: "Archived" },
  SCHEDULED: { color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", icon: CalendarClock, label: "Scheduled" },
  DRAFT: { color: "text-zinc-400", bg: "bg-zinc-800/50", border: "border-zinc-700/50", icon: FileEdit, label: "Draft" },
};

const TABS = ["ALL", "COLLECTING", "IN_REVIEW", "OVERDUE", "COMPLETED", "ARCHIVED", "SCHEDULED", "DRAFT", "ASSIGNED_TO_ME"];
const TAB_LABELS: Record<string, string> = {
  ALL: "All", COLLECTING: "Collecting", IN_REVIEW: "In Review", OVERDUE: "Overdue",
  COMPLETED: "Completed", ARCHIVED: "Archived", SCHEDULED: "Scheduled", DRAFT: "Draft", ASSIGNED_TO_ME: "Mine",
};
const TAB_ICONS: Record<string, any> = {
  ALL: ClipboardList, COLLECTING: Inbox, IN_REVIEW: Eye, OVERDUE: AlertCircle,
  COMPLETED: CheckCircle2, ARCHIVED: Archive, SCHEDULED: CalendarClock, DRAFT: FileEdit, ASSIGNED_TO_ME: User,
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] || STATUS_CFG.DRAFT; const Icon = c.icon;
  return <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.bg} ${c.border} ${c.color} uppercase tracking-wider`}><Icon className="w-3 h-3" />{c.label}</span>;
}

export default function EvalsTab({ agentName, runId }: { agentName: string; runId: string }) {
  const [evals, setEvals] = useState<EvalItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create form
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cStatus, setCStatus] = useState("DRAFT");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchEvals = () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (tab !== "ALL" && tab !== "ASSIGNED_TO_ME") p.append("status", tab);
    if (tab === "ASSIGNED_TO_ME") p.append("assignedToMe", "true");
    fetch(`${BACKEND}/api/evals?${p}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.error) { setError(d.error); } else { setEvals(d.evals); setCounts(d.counts); } })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvals(); }, [tab]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND}/api/evals`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ title: title.trim(), description: desc.trim() || null, status: cStatus, assignee: assignee.trim() || null, dueDate: dueDate || null, agentName, notes: notes.trim() || null }),
      });
      if (res.ok) { setShowCreate(false); setTitle(""); setDesc(""); setCStatus("DRAFT"); setAssignee(""); setDueDate(""); setNotes(""); fetchEvals(); }
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (id: string, s: string) => {
    await fetch(`${BACKEND}/api/evals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ status: s }) });
    setEditingId(null); fetchEvals();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await fetch(`${BACKEND}/api/evals/${id}`, { method: "DELETE", credentials: "include" });
    setDeletingId(null); fetchEvals();
  };

  const isOverdue = (ev: EvalItem) => ev.dueDate && new Date(ev.dueDate) < new Date() && !["COMPLETED", "ARCHIVED"].includes(ev.status);

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(t => {
          const Icon = TAB_ICONS[t]; const cnt = counts[t] ?? 0;
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border whitespace-nowrap transition-all ${tab === t ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-transparent border-zinc-800/50 text-zinc-500 hover:text-zinc-300"
                }`}>
              <Icon className="w-3 h-3" />{TAB_LABELS[t]}
              <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${tab === t ? "bg-zinc-700 text-zinc-300" : "bg-zinc-800/50 text-zinc-600"}`}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* Create Button / Form */}
      {!showCreate ? (
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-100 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors">
          <Plus className="w-3.5 h-3.5" />New Eval for {agentName}
        </button>
      ) : (
        <form onSubmit={handleCreate} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300">New Evaluation</span>
            <button type="button" onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-3.5 h-3.5" /></button>
          </div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Eval title *" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none" />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description..." rows={2} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none resize-none" />
          <div className="grid grid-cols-3 gap-3">
            <select value={cStatus} onChange={e => setCStatus(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-zinc-200 outline-none">
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k} className="bg-zinc-900">{v.label}</option>)}
            </select>
            <input type="email" value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="Assignee email" className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none" />
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-zinc-200 outline-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving || !title.trim()} className="px-3 py-1.5 text-xs font-medium text-zinc-100 bg-zinc-700 hover:bg-zinc-600 rounded-lg disabled:opacity-50 flex items-center gap-1">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}Create
            </button>
          </div>
        </form>
      )}

      {/* Evals List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-500 gap-3"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs">Loading evals…</span></div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 text-red-400 text-xs gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>
      ) : evals.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-zinc-500 gap-3">
          <ClipboardList className="w-6 h-6 text-zinc-600" />
          <p className="text-xs">No evaluations yet for this agent.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 divide-y divide-zinc-800/50 overflow-hidden">
          {evals.map(ev => (
            <div key={ev.id} className="group px-4 py-3 hover:bg-zinc-800/20 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={ev.status} />
                    {isOverdue(ev) && ev.status !== "OVERDUE" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-red-500/10 border border-red-500/20 text-red-400"><AlertCircle className="w-2.5 h-2.5" />Overdue</span>
                    )}
                    {ev.score !== null && (
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${ev.score >= 0.8 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : ev.score >= 0.5 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"}`}>
                        {(ev.score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-zinc-200">{ev.title}</p>
                  {ev.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{ev.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-600 font-mono">
                    {ev.assignee && <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" />{ev.assignee}</span>}
                    {ev.dueDate && <span className={`flex items-center gap-1 ${isOverdue(ev) ? "text-red-400" : ""}`}><Clock className="w-2.5 h-2.5" />Due {new Date(ev.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {editingId === ev.id ? (
                    <>
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 outline-none">
                        {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k} className="bg-zinc-900">{v.label}</option>)}
                      </select>
                      <button onClick={() => handleStatusChange(ev.id, editStatus)} className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"><Save className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-zinc-500 hover:text-zinc-300 rounded"><X className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(ev.id); setEditStatus(ev.status); }} className="p-1 text-zinc-600 hover:text-zinc-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(ev.id)} disabled={deletingId === ev.id} className="p-1 text-zinc-600 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50">
                        {deletingId === ev.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
