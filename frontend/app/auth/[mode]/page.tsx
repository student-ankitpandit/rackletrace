'use client';

import { useState, useTransition, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mail, Lock, User, Loader2, ArrowRight, Eye, EyeOff} from 'lucide-react';

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

  // Sync state if URL changes (e.g. back button)
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
        const body =
          tab === 'login'
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
          const msg =
            data.errors?.[0]?.message ?? data.message ?? 'Something went wrong.';
          setError(msg);
          return;
        }

        setSuccess(
          tab === 'login' ? 'Logged in successfully!' : 'Account created! You can now log in.'
        );
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#030305] text-zinc-900 dark:text-white relative overflow-hidden font-sans selection:bg-violet-500/30 transition-colors duration-300">
      
      {/* Animated Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 dark:bg-violet-600/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-fuchsia-600/10 dark:bg-fuchsia-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-2000 pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-600/20 dark:bg-indigo-600/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-4000 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4 sm:px-0">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-white/60 mb-2">
            Rackle
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {tab === 'login' ? 'Sign in to continue your journey.' : 'Join us and start your journey.'}
          </p>
        </div>

        <div className="backdrop-blur-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-3xl p-8 shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
          {/* Tab Switcher */}
          <div className="flex bg-zinc-100 dark:bg-black/20 rounded-full p-1 mb-8 border border-black/5 dark:border-white/5">
            {(['login', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                id={`tab-${t}`}
                type="button"
                onClick={() => switchTab(t)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 cursor-pointer ${
                  tab === t
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 dark:shadow-violet-900/40'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {t === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form id="auth-form" onSubmit={handleSubmit} className="space-y-5">
            {tab === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 ml-1">
                  Name <span className="text-zinc-400 dark:text-zinc-600">(optional)</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500 group-focus-within:text-violet-500 dark:group-focus-within:text-violet-400 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    id="input-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 focus:bg-white dark:focus:bg-white/10 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 ml-1">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500 group-focus-within:text-violet-500 dark:group-focus-within:text-violet-400 transition-colors">
                  <Mail className="w-5 h-5" />
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
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 focus:bg-white dark:focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500 group-focus-within:text-violet-500 dark:group-focus-within:text-violet-400 transition-colors">
                  <Lock className="w-5 h-5" />
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
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 focus:bg-white dark:focus:bg-white/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none focus:text-violet-500 dark:focus:text-violet-400 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                id="auth-error"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div
                id="auth-success"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{success}</span>
              </div>
            )}

            <button
              id="auth-submit"
              type="submit"
              disabled={isPending}
              className="group relative w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] cursor-pointer flex items-center justify-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-xl" />
              <span className="relative z-10 flex items-center gap-2">
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {tab === 'login' ? 'Authenticating…' : 'Creating account…'}
                  </>
                ) : tab === 'login' ? (
                  <>
                    Log In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-8">
            {tab === 'login' ? (
              <>
                New to Rackle?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('signup')}
                  className="font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:underline underline-offset-4 cursor-pointer transition-all"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className="font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:underline underline-offset-4 cursor-pointer transition-all"
                >
                  Log in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
