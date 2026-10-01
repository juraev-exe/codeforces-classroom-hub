'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-8 sm:p-10 border border-rose-500/20 shadow-2xl relative overflow-hidden text-center space-y-6">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-500/15">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold uppercase tracking-wider border border-rose-500/20">
            System Diagnostics
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Something Went Wrong
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            {error.message || 'An unexpected error occurred while rendering this view. Your data is safe.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-600/30 active:scale-[0.97]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] hover:bg-white/10 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold border border-white/10 transition active:scale-[0.97]"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
