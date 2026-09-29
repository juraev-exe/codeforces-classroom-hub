'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('teacher@classroom.cf');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetchApi<{ token: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.token) {
        localStorage.setItem('cf_hub_token', res.token);
        localStorage.setItem('cf_hub_user', JSON.stringify(res.user));
        document.cookie = `cf_hub_token=${res.token}; path=/; max-age=604800; SameSite=Lax`;
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Teacher Authentication</h1>
          <p className="text-sm text-zinc-400">
            Sign in to access your classroom dashboard and manage students.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Teacher Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@classroom.cf"
                className="w-full bg-zinc-900 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/25 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Log In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-border-subtle text-xs text-zinc-400 space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Default Demo Credentials
          </div>
          <p>Email: <code className="text-zinc-200">teacher@classroom.cf</code></p>
          <p>Password: <code className="text-zinc-200">admin123</code></p>
        </div>
      </div>
    </div>
  );
}
