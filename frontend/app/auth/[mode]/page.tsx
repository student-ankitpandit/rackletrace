'use client';

import { useState, useTransition, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mail, Lock, User, Loader2, ArrowRight, Eye, EyeOff, Activity, AlertTriangle, Check } from 'lucide-react';
import Link from 'next/link';

type Tab = 'login' | 'signup';

interface FormState {
  name: string;
  email: string;
  password: string;
}

interface ApiError {
  message?: string;
  errors?: { message: string }[];
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

export default function AuthPage() {
  const params = useParams();
  const router = useRouter();
  
  const currentMode = params.mode === 'signup' ? 'signup' : 'login';
  const [tab, setTab] = useState<Tab>(currentMode);

  useEffect(() => {
    setTab(currentMode);
  }, [currentMode]);

  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const endpoint = tab === 'login' ? '/auth/login' : '/auth/signup';
        const body = tab === 'login'
            ? { email: form.email, password: form.password }
            : { name: form.name, email: form.email, password: form.password };

        const res = await fetch(`${BACKEND}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        });

        const data = (await res.json()) as { success: boolean; message?: string } & ApiError;

        if (!res.ok || !data.success) {
          const msg = data.errors?.[0]?.message ?? data.message ?? 'Something went wrong.';
          setError(msg);
          return;
        }

        setSuccess(tab === 'login' ? 'Logged in successfully!' : 'Account created! You can now log in.');
        setForm({ name: '', email: '', password: '' });
        if (tab === 'signup') {
            switchTab('login');
        } else if (tab === 'login') {
            router.push('/dashboard');
        }
      } catch {
        setError('Could not reach the server.');
      }
    });
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
    setSuccess(null);
    setForm({ name: '', email: '', password: '' });
    router.push(`/auth/${t}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000] text-zinc-100 font-sans selection:bg-zinc-800">
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#000] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[400px] px-6 py-12">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded border border-zinc-700 bg-zinc-800 flex items-center justify-center">
              <Activity className="w-4 h-4 text-zinc-300" />
            </div>
          </Link>
          <h1 className="text-xl font-medium tracking-tight text-zinc-100">
            {tab === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            {tab === 'login' ? 'Enter your details to sign in.' : 'Start tracing your AI agents.'}
          </p>
        </div>

        <div className="rounded border border-zinc-800 bg-[#0a0a0a] p-6 shadow-xl">
          <form id="auth-form" onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  Name <span className="text-zinc-600 normal-case tracking-normal">(optional)</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 text-sm outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="input-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 text-sm outline-none focus:border-zinc-600 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-10 py-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 text-sm outline-none focus:border-zinc-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-600 hover:text-zinc-400 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div id="auth-error" className="flex items-center gap-2 px-3 py-2 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div id="auth-success" className="flex items-center gap-2 px-3 py-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              id="auth-submit"
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-2 rounded bg-zinc-100 hover:bg-white text-zinc-900 text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {tab === 'login' ? 'Authenticating…' : 'Creating account…'}</>
              ) : tab === 'login' ? (
                <>Log In <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-zinc-500">
            {tab === 'login' ? (
              <>
                New to Rackle?{' '}
                <button type="button" onClick={() => switchTab('signup')} className="text-zinc-300 hover:text-white transition-colors">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => switchTab('login')} className="text-zinc-300 hover:text-white transition-colors">
                  Log in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
