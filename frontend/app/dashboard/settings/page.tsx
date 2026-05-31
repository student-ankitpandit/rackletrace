'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

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
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchKeys = () => {
    fetch(`${BACKEND}/auth/api-keys`, { credentials: 'include' })
      .then(async r => {
        if (r.status === 401 || r.status === 403) {
          window.location.href = '/auth/login';
          throw new Error('Unauthorized');
        }
        return r.json();
      })
      .then(data => { if (Array.isArray(data)) setKeys(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchKeys(); }, []);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${BACKEND}/auth/api-keys`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setJustCreatedKey(data.key);
        setNewKeyName('');
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
      await fetch(`${BACKEND}/auth/api-keys/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      setKeys(prev => prev.filter(k => k.id !== id));
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
    <div className="min-h-screen bg-zinc-50 dark:bg-[#030305] text-zinc-900 dark:text-white font-sans transition-colors duration-300">
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-violet-600/10 rounded-full filter blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[300px] bg-indigo-600/10 rounded-full filter blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard" className="p-2 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors shadow-sm dark:shadow-none">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
                <Key className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                API Keys
              </h1>
            </div>
            <p className="text-sm text-zinc-500 ml-[88px]">Manage API keys for your SDK integration.</p>
          </div>
        </div>

        {/* Just Created Key Banner */}
        {justCreatedKey && (
          <div className="mb-6 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-5 shadow-sm dark:shadow-none">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">API Key Created Successfully</p>
                <p className="text-xs text-emerald-600/80 dark:text-zinc-400 mb-3">Copy this key now — you won't be able to see the full key again.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-black/30 rounded-lg px-4 py-2.5 text-sm text-zinc-800 dark:text-white font-mono break-all select-all border border-black/5 dark:border-white/5">
                    {justCreatedKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(justCreatedKey)}
                    className="p-2.5 rounded-lg bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors shrink-0 shadow-sm dark:shadow-none"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />}
                  </button>
                </div>
              </div>
              <button onClick={() => setJustCreatedKey(null)} className="text-emerald-700 dark:text-zinc-600 hover:text-emerald-900 dark:hover:text-zinc-400 text-lg leading-none">×</button>
            </div>
          </div>
        )}

        {/* How to use hint */}
        <div className="mb-6 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-none">
          <p className="text-xs text-zinc-500 font-medium mb-2">Usage in your SDK</p>
          <code className="block bg-zinc-100 dark:bg-black/30 rounded-lg px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 font-mono border border-black/5 dark:border-white/5 overflow-x-auto">
            {`const tracer = new Tracer({ secret: "rk_your_api_key", baseUrl: "${BACKEND}" })`}
          </code>
        </div>

        {/* Keys List */}
        <div className="bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
          <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Your API Keys</h2>
              <span className="text-xs text-zinc-500">({keys.length})</span>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Key
            </button>
          </div>

          {/* Create Key Inline Form */}
          {showCreate && (
            <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createKey()}
                  placeholder="Key name (e.g. Production, Development)"
                  className="flex-1 bg-white dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-violet-500/40 transition-colors"
                  autoFocus
                />
                <button
                  onClick={createKey}
                  disabled={creating || !newKeyName.trim()}
                  className="px-4 py-2.5 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
                </button>
                <button
                  onClick={() => { setShowCreate(false); setNewKeyName(''); }}
                  className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-16 text-zinc-500 gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
              <span className="text-sm">Loading keys…</span>
            </div>
          )}

          {!loading && keys.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600 gap-3">
              <Key className="w-8 h-8" />
              <p className="text-sm">No API keys yet. Create one to get started.</p>
            </div>
          )}

          {!loading && keys.length > 0 && (
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {keys.map(k => (
                <div key={k.id} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group">
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-white/5 border border-black/5 dark:border-white/10 shrink-0">
                    <Key className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{k.name}</p>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 mt-0.5">
                      <code className="font-mono bg-zinc-100 dark:bg-transparent px-1 rounded">{k.key}</code>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Created {new Date(k.createdAt).toLocaleDateString()}
                      </span>
                      {k.lastUsedAt && (
                        <span className="text-emerald-600 dark:text-emerald-500/70">
                          Last used {new Date(k.lastUsedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteKey(k.id)}
                    disabled={deletingId === k.id}
                    className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                    title="Revoke key"
                  >
                    {deletingId === k.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="mt-6 flex items-start gap-3 text-xs text-zinc-600">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>API keys grant full access to your account. Never share them publicly or commit them to version control. If a key is compromised, revoke it immediately.</p>
        </div>
      </div>
    </div>
  );
}
