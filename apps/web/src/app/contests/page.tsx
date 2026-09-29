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
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatDuration } from '@/lib/cf-utils';
import type { ContestRecord } from '@cf-hub/types';

export default function ContestsPage() {
  const [upcoming, setUpcoming] = useState<ContestRecord[]>([]);
  const [allContests, setAllContests] = useState<ContestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'recent'>('upcoming');

  async function loadContests() {
    try {
      setLoading(true);
      const [upData, allData] = await Promise.all([
        fetchApi<ContestRecord[]>('/api/contests/upcoming'),
        fetchApi<ContestRecord[]>('/api/contests?limit=40'),
      ]);
      setUpcoming(upData);
      setAllContests(allData);
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
      await fetchApi('/api/sync/contests', { method: 'POST' });
      await loadContests();
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  const displayedContests = activeTab === 'upcoming' ? upcoming : allContests;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-blue-500" />
            Codeforces Contest Tracker
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track upcoming rounds, schedules, student registrations, and automated alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncContests}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Contests'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'upcoming'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'recent'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          Recent & Past Rounds
        </button>
      </div>

      {/* Contest Grid */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          Loading contest schedule...
        </div>
      ) : displayedContests.length === 0 ? (
        <div className="p-12 text-center text-zinc-400 bg-card rounded-2xl border border-border">
          No contests found. Click "Sync Contests" to fetch the latest schedule directly from Codeforces.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedContests.map((c) => {
            const startDate = new Date(c.startTime);
            const isUpcoming = c.phase === 'BEFORE';
            const isLive = c.phase === 'CODING';

            return (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-card border border-border hover:border-zinc-700 transition flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        isLive
                          ? 'bg-rose-950/60 text-rose-400 border-rose-800/50 animate-pulse'
                          : isUpcoming
                          ? 'bg-blue-950/60 text-blue-400 border-blue-800/50'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {isLive ? 'LIVE NOW' : isUpcoming ? 'UPCOMING' : 'FINISHED'}
                    </span>

                    <span className="text-xs text-zinc-500 font-mono">
                      #{c.codeforcesContestId}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white mt-2.5 leading-snug">
                    {c.name}
                  </h3>

                  <div className="space-y-1.5 mt-3 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{startDate.toLocaleString()} (Local Time)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Duration: {formatDuration(c.durationSeconds)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
                  <a
                    href={`https://codeforces.com/contestRegistration/${c.codeforcesContestId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition"
                  >
                    Open on Codeforces
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {isUpcoming && (
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1">
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
