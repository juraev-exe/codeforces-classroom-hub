'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Trophy,
  Code2,
  Calendar,
  ExternalLink,
  Award,
  TrendingUp,
  AlertCircle,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { fetchApi } from '@/lib/api';
import { getRankColor, getRankBadgeClass, getVerdictBadge } from '@/lib/cf-utils';
import type { StudentDetailResponse } from '@cf-hub/types';

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40' width='40' height='40'><rect width='40' height='40' rx='12' fill='%231e293b'/><circle cx='20' cy='15' r='6' fill='%2364748b'/><path d='M10 32c0-5 4.5-8 10-8s10 3 10 8' fill='%2364748b'/></svg>";

export default function StudentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<StudentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  async function loadStudent() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchApi<StudentDetailResponse>(`/api/students/${id}`);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load student details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadStudent();
  }, [id]);

  async function handleSync() {
    try {
      setSyncing(true);
      setSyncMsg(null);
      await fetchApi(`/api/students/${id}/sync`, { method: 'POST' });
      await loadStudent();
      setSyncMsg('Codeforces profile and submissions synchronized.');
      setTimeout(() => setSyncMsg(null), 4000);
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-zinc-400">
        <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center border border-white/10 shadow-xl">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
        </div>
        <p className="text-xs font-medium">Fetching student telemetry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel p-8 rounded-3xl border border-rose-500/20 text-center max-w-md mx-auto my-16 shadow-2xl">
        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400 mb-3">
          <AlertCircle className="w-5 h-5" />
        </div>
        <p className="text-rose-300 text-sm mb-4">{error || 'Student not found.'}</p>
        <Link
          href="/students"
          className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition"
        >
          &larr; Back to Students Roster
        </Link>
      </div>
    );
  }

  const { student, stats, ratingHistory, recentSubmissions, tagDistribution, difficultyDistribution } = data;

  const chartData = ratingHistory.map((r) => ({
    contest: r.contestName.length > 22 ? r.contestName.substring(0, 20) + '...' : r.contestName,
    rating: r.newRating,
    change: r.newRating - r.oldRating,
  }));

  return (
    <div className="space-y-7">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white glass-pill px-3 py-1.5 rounded-xl transition active:scale-[0.97]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Students
        </Link>

        {syncMsg && (
          <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{syncMsg}</span>
          </div>
        )}
      </div>

      {/* Header Profile Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5">
          <img
            src={stats?.avatar ? (stats?.avatar.startsWith('//') ? `https:${stats?.avatar}` : stats?.avatar) : DEFAULT_AVATAR}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).onerror = null;
              (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
            }}
            alt={student.codeforcesHandle}
            className="w-20 h-20 rounded-2xl border border-white/15 object-cover bg-black/50 shadow-xl"
          />
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{student.name}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getRankBadgeClass(stats?.rank)}`}>
                {(stats?.rank || 'unrated').toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2.5 mt-2 flex-wrap text-xs">
              <a
                href={`https://codeforces.com/profile/${student.codeforcesHandle}`}
                target="_blank"
                rel="noreferrer"
                className={`font-semibold hover:underline flex items-center gap-1 font-mono ${getRankColor(stats?.rank)}`}
              >
                @{student.codeforcesHandle}
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-zinc-600">&bull;</span>
              <span className="text-zinc-400">Class: {student.className || 'General'}</span>
              {student.age && (
                <>
                  <span className="text-zinc-600">&bull;</span>
                  <span className="text-zinc-400">Age: {student.age}</span>
                </>
              )}
              {student.group && (
                <>
                  <span className="text-zinc-600">&bull;</span>
                  <span className="text-zinc-400">Group: {student.group}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Rating and Solved Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="glass-pill px-4 py-2.5 rounded-2xl text-center min-w-[80px]">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block">Rating</span>
            <div className={`text-xl font-bold font-mono ${getRankColor(stats?.rank)}`}>
              {stats?.rating || '—'}
            </div>
          </div>

          <div className="glass-pill px-4 py-2.5 rounded-2xl text-center min-w-[80px]">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block">Max</span>
            <div className={`text-xl font-bold font-mono ${getRankColor(stats?.maxRank)}`}>
              {stats?.maxRating || '—'}
            </div>
          </div>

          <div className="glass-pill px-4 py-2.5 rounded-2xl text-center min-w-[80px]">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block">Solved</span>
            <div className="text-xl font-bold text-white font-mono">{stats?.solvedCount || 0}</div>
          </div>

          <div className="glass-pill px-4 py-2.5 rounded-2xl text-center min-w-[80px]">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block">Contests</span>
            <div className="text-xl font-bold text-white font-mono">{stats?.contestCount || 0}</div>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-semibold transition shadow-lg shadow-blue-600/25 disabled:opacity-50 active:scale-[0.97]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync CF Profile'}
          </button>
        </div>
      </div>

      {/* Rating History Chart */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Rating Trajectory</h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">{ratingHistory.length} Rated Contests</span>
        </div>

        <div className="h-64 w-full pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="contest" stroke="#52525b" fontSize={11} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={11} domain={['dataMin - 80', 'dataMax + 80']} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 18, 28, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  }}
                  labelStyle={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}
                  itemStyle={{ color: '#60a5fa', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 7, stroke: '#93c5fd', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">
              No rating history recorded yet for this handle.
            </div>
          )}
        </div>
      </div>

      {/* Tag Distribution & Problem Difficulty Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Difficulty Distribution */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Problem Difficulty Distribution</h2>
          </div>
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyDistribution}>
                <XAxis dataKey="range" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 18, 28, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Problem Tags Breakdown */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Top Solved Topics</h2>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {tagDistribution.map((t) => (
              <span
                key={t.tag}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-300 flex items-center gap-2 transition hover:bg-white/[0.08]"
              >
                <span>{t.tag}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-semibold font-mono">
                  {t.count}
                </span>
              </span>
            ))}
            {tagDistribution.length === 0 && (
              <p className="text-xs text-zinc-500">No tag data available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white tracking-tight">Recent Submissions Telemetry</h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-black/20">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] border-b border-white/[0.06] text-[11px] text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Problem</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4 text-right">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {recentSubmissions.slice(0, 25).map((sub) => {
                const verdict = getVerdictBadge(sub.verdict);
                return (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <a
                        href={
                          sub.contestId
                            ? `https://codeforces.com/contest/${sub.contestId}/problem/${sub.problemIndex}`
                            : `https://codeforces.com/problemset/problem/${sub.contestId}/${sub.problemIndex}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-zinc-200 hover:text-blue-400 transition flex items-center gap-1.5"
                      >
                        <span>
                          {sub.problemIndex}. {sub.problemName}
                        </span>
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${verdict.className}`}>
                        {verdict.label}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-300">
                      {sub.problemRating ? (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 font-mono text-zinc-200">
                          ★ {sub.problemRating}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-zinc-400 font-mono">{sub.language}</td>

                    <td className="py-3.5 px-4 text-right text-xs text-zinc-500">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
              {recentSubmissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-zinc-500">
                    No submissions synchronized yet. Click "Sync CF Profile" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
