"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  Shield,
  AlertTriangle,
  Clock,
  Activity
} from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

interface ApiKeyInfo {
  id: string;
  name: string;
  key: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchKeys = () => {
    fetch(`${BACKEND}/auth/api-keys`, { credentials: "include" })
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          window.location.href = "/auth/login";
          throw new Error("Unauthorized");
        }
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setKeys(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${BACKEND}/auth/api-keys`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setJustCreatedKey(data.key);
        setNewKeyName("");
        setShowCreate(false);
        fetchKeys();
      }
    } catch (e) {
      console.error(e);
    }
    setCreating(false);
  };

  const deleteKey = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`${BACKEND}/auth/api-keys/${id}`, { method: "DELETE", credentials: "include" });
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (e) {
      console.error(e);
    }
    setDeletingId(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#000] text-zinc-100 font-sans selection:bg-zinc-800">
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#000] pointer-events-none" />

      {/* Top Navigation Bar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800/50 bg-[#000]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                className="w-5 h-5 text-white fill-current"
              >
                {/* Left 'r' stem and arch */}
                <path d="M25 75V43c0-8 6-11 13-11h12v9H38c-4 0-4 3-4 7v27H25z" />
                {/* Right 'd' stem and base */}
                <path d="M59 75V25l10-10v51h9v9H59z" />
                {/* Center diagonal/loop connection */}
                <path d="M34 75l25-25v9L46 75H34z" />
              </svg>
              <span className="font-medium text-sm tracking-tight text-zinc-100">Rackle</span>
            </Link>
            <div className="h-4 w-px bg-zinc-800 mx-2" />
            <div className="flex items-center gap-1">
              <Link href="/dashboard" className="px-3 py-1.5 text-xs font-medium rounded text-zinc-400 hover:text-zinc-200 transition-colors">Runs</Link>
              <Link href="/dashboard/settings" className="px-3 py-1.5 text-xs font-medium rounded bg-zinc-800 text-zinc-200">API Keys</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-12">
        <div className="mb-8 flex items-center gap-4 pb-6 border-b border-zinc-800">
          <Link href="/dashboard" className="p-2 rounded hover:bg-zinc-800 transition-colors text-zinc-400">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200 border border-zinc-700">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-zinc-100">API Keys</h1>
            <p className="text-xs text-zinc-500 mt-1 font-mono">Manage access for your SDK integration</p>
          </div>
        </div>

        {justCreatedKey && (
          <div className="mb-6 bg-zinc-900 border border-zinc-700 rounded p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-zinc-300 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 mb-1">API Key Created Successfully</p>
                <p className="text-xs text-zinc-500 mb-3">Copy this key now — you won't be able to see the full key again.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-[#000] border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 font-mono break-all select-all">
                    {justCreatedKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(justCreatedKey)}
                    className="p-2 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 transition-colors shrink-0 shadow-sm"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                  </button>
                </div>
              </div>
              <button onClick={() => setJustCreatedKey(null)} className="text-zinc-500 hover:text-zinc-300">×</button>
            </div>
          </div>
        )}

        <div className="rounded border border-zinc-800 bg-[#0a0a0a] shadow-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 bg-[#000] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-medium text-zinc-200">Your Keys</h2>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-200 text-zinc-900 rounded hover:bg-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create Key
            </button>
          </div>

          {showCreate && (
            <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createKey()}
                  placeholder="Key name (e.g. Production)"
                  className="flex-1 bg-[#000] border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors"
                  autoFocus
                />
                <button
                  onClick={createKey}
                  disabled={creating || !newKeyName.trim()}
                  className="px-3 py-1.5 text-xs font-medium bg-zinc-200 text-zinc-900 rounded hover:bg-white disabled:opacity-50 transition-colors"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Generate"}
                </button>
                <button
                  onClick={() => { setShowCreate(false); setNewKeyName(""); }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-16 text-zinc-500 gap-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Loading keys…</span>
            </div>
          )}

          {!loading && keys.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600 gap-3">
              <Key className="w-6 h-6" />
              <p className="text-xs">No API keys yet. Create one to get started.</p>
            </div>
          )}

          {!loading && keys.length > 0 && (
            <div className="divide-y divide-zinc-800/50">
              {keys.map((k) => (
                <div key={k.id} className="flex items-center justify-between px-5 py-4 hover:bg-zinc-900/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded bg-zinc-800 border border-zinc-700 shrink-0">
                      <Key className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{k.name}</p>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1">
                        <code className="font-mono bg-zinc-800/50 px-1 rounded">{k.key}</code>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Created {new Date(k.createdAt).toLocaleDateString()}
                        </span>
                        {k.lastUsedAt && (
                          <span className="text-zinc-400">Last used {new Date(k.lastUsedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteKey(k.id)}
                    disabled={deletingId === k.id}
                    className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Revoke key"
                  >
                    {deletingId === k.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-start gap-2 text-[11px] text-zinc-500 border border-zinc-800/50 rounded bg-zinc-900/30 p-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p>
            API keys grant full access to your account. Never share them publicly or commit them to version control. If a key is compromised, revoke it immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
