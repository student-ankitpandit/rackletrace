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
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#000] text-zinc-800 dark:text-zinc-100 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-transparent to-zinc-50/90 dark:from-[#0a0a0a] dark:to-[#000] pointer-events-none transition-colors" />

      <div className="relative z-10 w-full max-w-[400px] px-6 py-12">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              className="w-8 h-8 text-zinc-900 dark:text-white fill-current transition-colors"
            >
              {/* Left 'r' stem and arch */}
              <path d="M25 75V43c0-8 6-11 13-11h12v9H38c-4 0-4 3-4 7v27H25z" />
              {/* Right 'd' stem and base */}
              <path d="M59 75V25l10-10v51h9v9H59z" />
              {/* Center diagonal/loop connection */}
              <path d="M34 75l25-25v9L46 75H34z" />
            </svg>
          </Link>
          <h1 className="text-xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 transition-colors">
            {tab === 'login' ? (form.email ? `Welcome back, ${form.email.split('@')[0]}` : 'Welcome back') : 'Create your account'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2 transition-colors">
            {tab === 'login' ? 'Enter your details to sign in.' : 'Start tracing your AI agents.'}
          </p>
        </div>

        <div className="relative rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] p-6 shadow-xl transition-colors">
          <form id="auth-form" onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-500 uppercase tracking-wider transition-colors">
                  Name <span className="text-zinc-400 dark:text-zinc-600 normal-case tracking-normal">(optional)</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-600 transition-colors">
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
                    className="w-full pl-9 pr-3 py-2 rounded bg-zinc-50/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-500 uppercase tracking-wider transition-colors">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-600 transition-colors">
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
                  className="w-full pl-9 pr-3 py-2 rounded bg-zinc-50/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-500 uppercase tracking-wider transition-colors">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-600 transition-colors">
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
                  className="w-full pl-9 pr-10 py-2 rounded bg-zinc-50/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div id="auth-error" className="flex items-center gap-2 px-3 py-2 rounded bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs transition-colors">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div id="auth-success" className="flex items-center gap-2 px-3 py-2 rounded bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs transition-colors">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              id="auth-submit"
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-2 rounded bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm"
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

          <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-500 transition-colors">
            {tab === 'login' ? (
              <>
                New to Rackle?{' '}
                <button type="button" onClick={() => switchTab('signup')} className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium cursor-pointer">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => switchTab('login')} className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium cursor-pointer">
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
