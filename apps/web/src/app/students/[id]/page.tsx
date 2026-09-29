'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<StudentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await fetchApi(`/api/students/${id}/sync`, { method: 'POST' });
      await loadStudent();
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-zinc-400">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm">Fetching student telemetry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-xl border border-rose-900/50 bg-rose-950/20 text-center max-w-md mx-auto my-12">
        <p className="text-rose-300 text-sm mb-4">{error || 'Student not found.'}</p>
        <Link
          href="/students"
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium"
        >
          &larr; Back to Students
        </Link>
      </div>
    );
  }

  const { student, stats, ratingHistory, recentSubmissions, tagDistribution, difficultyDistribution } = data;

  const chartData = ratingHistory.map((r) => ({
    contest: r.contestName.length > 25 ? r.contestName.substring(0, 22) + '...' : r.contestName,
    rating: r.newRating,
    change: r.newRating - r.oldRating,
  }));

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Students
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={stats?.avatar || 'https://userpic.codeforces.org/no-avatar.jpg'}
            alt={student.codeforcesHandle}
            className="w-20 h-20 rounded-full border-2 border-border object-cover bg-zinc-900 shadow-md"
          />
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight">{student.name}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getRankBadgeClass(stats?.rank)}`}>
                {(stats?.rank || 'unrated').toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1.5 flex-wrap text-sm">
              <a
                href={`https://codeforces.com/profile/${student.codeforcesHandle}`}
                target="_blank"
                rel="noreferrer"
                className={`font-semibold hover:underline flex items-center gap-1 ${getRankColor(stats?.rank)}`}
              >
                @{student.codeforcesHandle}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-zinc-600">&bull;</span>
              <span className="text-zinc-400">Class: {student.className || 'General'}</span>
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
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          <div className="px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-border-subtle text-center">
            <span className="text-xs text-zinc-400">Rating</span>
            <div className={`text-xl font-bold ${getRankColor(stats?.rank)}`}>
              {stats?.rating || '—'}
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-border-subtle text-center">
            <span className="text-xs text-zinc-400">Max Rating</span>
            <div className={`text-xl font-bold ${getRankColor(stats?.maxRank)}`}>
              {stats?.maxRating || '—'}
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-border-subtle text-center">
            <span className="text-xs text-zinc-400">Solved</span>
            <div className="text-xl font-bold text-white">{stats?.solvedCount || 0}</div>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-border-subtle text-center">
            <span className="text-xs text-zinc-400">Contests</span>
            <div className="text-xl font-bold text-white">{stats?.contestCount || 0}</div>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync CF Profile'}
          </button>
        </div>
      </div>

      {/* Rating History Chart */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Rating History
          </h2>
          <span className="text-xs text-zinc-400">{ratingHistory.length} Rated Contests</span>
        </div>

        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="contest" stroke="#52525b" fontSize={11} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={11} domain={['dataMin - 100', 'dataMax + 100']} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ fill: '#3b82f6', r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">
              No rating history recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Tag Distribution & Problem Difficulty Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Difficulty Distribution */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" />
            Problem Difficulty Distribution
          </h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyDistribution}>
                <XAxis dataKey="range" stroke="#71717a" fontSize={10} />
                <YAxis stroke="#52525b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Problem Tags Breakdown */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-400" />
            Top Solved Tags
          </h2>
          <div className="flex flex-wrap gap-2 pt-2">
            {tagDistribution.map((t) => (
              <span
                key={t.tag}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-border text-xs text-zinc-300 flex items-center gap-2"
              >
                <span>{t.tag}</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-blue-400 font-semibold">
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
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Code2 className="w-4 h-4 text-blue-500" />
          Recent Submissions
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="pb-3">Problem</th>
                <th className="pb-3">Verdict</th>
                <th className="pb-3">Rating</th>
                <th className="pb-3">Language</th>
                <th className="pb-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {recentSubmissions.slice(0, 20).map((sub) => {
                const verdict = getVerdictBadge(sub.verdict);
                return (
                  <tr key={sub.id} className="hover:bg-zinc-900/30 transition">
                    <td className="py-3">
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

                    <td className="py-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${verdict.className}`}>
                        {verdict.label}
                      </span>
                    </td>

                    <td className="py-3 text-zinc-300">
                      {sub.problemRating ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-border">
                          {sub.problemRating}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3 text-xs text-zinc-400">{sub.language}</td>

                    <td className="py-3 text-right text-xs text-zinc-500">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
              {recentSubmissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-zinc-500">
                    No submissions synchronized yet. Click "Sync CF Profile" to pull recent activity.
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
