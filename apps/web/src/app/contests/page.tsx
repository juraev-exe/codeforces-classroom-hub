'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  ExternalLink,
  RefreshCw,
  Bell,
  CheckCircle2,
  AlertCircle,
  Radio,
  Timer,
  Trophy,
  Hourglass,
  Zap,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatDuration } from '@/lib/cf-utils';
import type { ContestRecord } from '@cf-hub/types';

function formatSafeDate(dateStr?: string | number | null) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function ContestsPage() {
  const [upcoming, setUpcoming] = useState<ContestRecord[]>([]);
  const [pastContests, setPastContests] = useState<ContestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'recent'>('upcoming');
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  async function loadContests() {
    try {
      setLoading(true);
      const [upData, pastData] = await Promise.all([
        fetchApi<ContestRecord[]>('/api/contests/upcoming').catch(() => []),
        fetchApi<ContestRecord[]>('/api/contests?phase=past&limit=40').catch(() => []),
      ]);
      setUpcoming(Array.isArray(upData) ? upData : []);
      setPastContests(Array.isArray(pastData) ? pastData : []);
    } catch (err: any) {
      console.error('Error loading contests:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContests();
  }, []);

  async function handleSyncContests() {
    try {
      setSyncing(true);
      setSyncMsg(null);
      const res = await fetchApi<{ count: number }>('/api/sync/contests', { method: 'POST' });
      await loadContests();
      setSyncMsg(`Successfully refreshed ${res.count} contests from Codeforces.`);
      setTimeout(() => setSyncMsg(null), 4000);
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  const displayedContests = activeTab === 'upcoming' ? upcoming : pastContests;

  return (
    <div className="space-y-7">
      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/[0.08] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Official Schedule
              </span>
              <span className="text-xs text-zinc-400">
                Codeforces Calendar Telemetry
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Calendar className="w-7 h-7 text-blue-400" />
              Contest Calendar & Tracker
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Track upcoming Div. 1, Div. 2, Div. 3, Educational and Global rounds with automated alerts for students.
            </p>
          </div>

          <button
            onClick={handleSyncContests}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 active:scale-[0.97] w-fit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Contests'}
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5 shadow-lg shadow-emerald-950/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{syncMsg}</span>
        </div>
      )}

      {/* Apple-style Segmented Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="glass-panel p-1 rounded-2xl border border-white/[0.08] flex items-center gap-1">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Upcoming Rounds ({upcoming.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'recent'
                ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Past & Completed Rounds ({pastContests.length})</span>
          </button>
        </div>
      </div>

      {/* Contest Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
          <p className="text-xs font-medium">Fetching official contest schedule...</p>
        </div>
      ) : displayedContests.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl border border-white/[0.08] text-center text-zinc-400 space-y-2">
          <Calendar className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-sm font-medium text-zinc-300">No contests found for this view.</p>
          <p className="text-xs text-zinc-500">Click "Sync Contests" above to refresh from Codeforces API.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedContests.map((c) => {
            const startDate = new Date(c.startTime);
            const isUpcoming = c.phase === 'BEFORE';
            const isLive = c.phase === 'CODING';

            return (
              <div
                key={c.id}
                className="glass-card p-6 rounded-3xl border border-white/[0.08] flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        isLive
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse flex items-center gap-1.5'
                          : isUpcoming
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30 flex items-center gap-1'
                          : 'bg-white/[0.04] text-zinc-400 border-white/[0.06] flex items-center gap-1'
                      }`}
                    >
                      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>}
                      {isUpcoming && <Zap className="w-3 h-3 text-blue-400" />}
                      {!isLive && !isUpcoming && <CheckCircle2 className="w-3 h-3 text-zinc-500" />}
                      <span>{isLive ? 'LIVE NOW' : isUpcoming ? 'UPCOMING' : 'FINISHED'}</span>
                    </span>

                    <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-zinc-500" />
                      Round #{c.codeforcesContestId || c.id}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-3 leading-snug">
                    {c.name}
                  </h3>

                  <div className="space-y-2 mt-4 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span>{formatSafeDate(c.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hourglass className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Duration: {formatDuration(c.durationSeconds)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                  <a
                    href={
                      isUpcoming
                        ? `https://codeforces.com/contestRegistration/${c.codeforcesContestId || c.id}`
                        : `https://codeforces.com/contest/${c.codeforcesContestId || c.id}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition"
                  >
                    <span>{isUpcoming ? 'Register on Codeforces' : 'View Problems & Standings'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {isUpcoming && (
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-medium">
                      <Bell className="w-3 h-3 text-amber-400" /> Telegram alert enabled
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
