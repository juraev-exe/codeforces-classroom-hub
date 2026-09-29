'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Users,
  Code2,
  Calendar,
  Flame,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Clock,
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
import { getRankColor, getRankBadgeClass, getVerdictBadge, formatDuration } from '@/lib/cf-utils';
import type { TeacherDashboardResponse } from '@cf-hub/types';

export default function DashboardPage() {
  const [data, setData] = useState<TeacherDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchApi<TeacherDashboardResponse>('/api/me');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data. Ensure the backend API is running.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleSyncAll() {
    try {
      setSyncing(true);
      await fetchApi('/api/sync/students', { method: 'POST' });
      await fetchApi('/api/sync/contests', { method: 'POST' });
      await loadDashboard();
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
        <p className="text-sm">Connecting to Codeforces telemetry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-xl border border-rose-900/50 bg-rose-950/20 text-center max-w-xl mx-auto my-12">
        <h3 className="text-lg font-semibold text-rose-300 mb-2">Backend Disconnected</h3>
        <p className="text-sm text-zinc-400 mb-4">{error}</p>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { teacher, classSummary, leaderboard, upcomingContests } = data;

  // Chart data for teacher's rating history
  const chartData = teacher.ratingHistory.map((item) => ({
    name: item.contestName.length > 20 ? item.contestName.substring(0, 18) + '...' : item.contestName,
    rating: item.newRating,
    change: item.newRating - item.oldRating,
  }));

  // Top tags for teacher
  const topTags = Object.entries(teacher.tagStats || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const nextContest = upcomingContests[0];

  return (
    <div className="space-y-8">
      {/* Top Banner / Teacher Profile */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-2xl bg-card border border-border shadow-xl">
        <div className="flex items-center gap-5">
          <img
            src={teacher.avatar}
            alt={teacher.handle}
            className="w-16 h-16 rounded-full border-2 border-blue-500/40 object-cover shadow-inner bg-zinc-900"
          />
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight">{teacher.name}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getRankBadgeClass(teacher.rank)}`}>
                {teacher.rank.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-0.5">
              Teacher Handle:{' '}
              <a
                href={`https://codeforces.com/profile/${teacher.handle}`}
                target="_blank"
                rel="noreferrer"
                className={`font-semibold hover:underline ${getRankColor(teacher.rank)}`}
              >
                @{teacher.handle}
              </a>
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          <div className="px-4 py-2 rounded-xl bg-zinc-900/60 border border-border-subtle text-center">
            <span className="text-xs text-zinc-400">Current Rating</span>
            <div className={`text-xl font-bold ${getRankColor(teacher.rank)}`}>
              {teacher.rating || '—'}
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-zinc-900/60 border border-border-subtle text-center">
            <span className="text-xs text-zinc-400">Max Rating</span>
            <div className={`text-xl font-bold ${getRankColor(teacher.maxRank)}`}>
              {teacher.maxRating || '—'}
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-zinc-900/60 border border-border-subtle text-center">
            <span className="text-xs text-zinc-400">Problems Solved</span>
            <div className="text-xl font-bold text-white">{teacher.totalSolved}</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-zinc-900/60 border border-border-subtle text-center">
            <span className="text-xs text-zinc-400">Contests</span>
            <div className="text-xl font-bold text-white">{teacher.totalContests}</div>
          </div>

          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>

      {/* Next Upcoming Contest Banner */}
      {nextContest && (
        <div className="p-4 rounded-xl border border-blue-900/50 bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Next Upcoming Contest
              </span>
              <h4 className="text-base font-medium text-white">{nextContest.name}</h4>
              <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                {new Date(nextContest.startTime).toLocaleString()} &bull; Duration:{' '}
                {formatDuration(nextContest.durationSeconds)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/contests"
              className="px-3.5 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 text-xs font-medium transition"
            >
              Contest Tracker &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Class Metric Highlights */}
      <div>
        <h2 className="text-base font-semibold text-zinc-300 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          Classroom Performance Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-xs text-zinc-400">Total Enrolled</span>
            <div className="text-2xl font-bold text-white mt-1">
              {classSummary.totalStudents} <span className="text-xs font-normal text-zinc-400">students</span>
            </div>
            <span className="text-[11px] text-emerald-400 mt-1 block">
              {classSummary.activeStudents} active
            </span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-xs text-zinc-400">Class Avg Rating</span>
            <div className="text-2xl font-bold text-blue-400 mt-1">
              {classSummary.averageRating}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Median: {classSummary.medianRating}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-xs text-zinc-400">Total Solved (Class)</span>
            <div className="text-2xl font-bold text-purple-400 mt-1">
              {classSummary.totalSolvedProblems}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              ~{classSummary.averageSolvedProblems} per student
            </span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-xs text-zinc-400">Contest Participations</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              {classSummary.totalContestsParticipated}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              High: {classSummary.highestRating} | Low: {classSummary.lowestRating}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Rating History Chart & Class Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating History */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Teacher Rating Progression
            </h3>
            <span className="text-xs text-zinc-400">Last {chartData.length} Contests</span>
          </div>

          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} />
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
                No rating history available
              </div>
            )}
          </div>
        </div>

        {/* Class Rating Distribution Histogram */}
        <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Class Rating Tiers
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classSummary.ratingDistribution} layout="vertical">
                <XAxis type="number" stroke="#52525b" fontSize={11} />
                <YAxis dataKey="range" type="category" stroke="#71717a" fontSize={10} width={95} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {classSummary.ratingDistribution.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={['#71717a', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#f97316'][index % 6]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Class Leaderboard & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Leaderboard (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Class Leaderboard
            </h3>
            <Link
              href="/leaderboard"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Full Standings <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-zinc-400">
                  <th className="pb-3 font-medium">Rank</th>
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium">Rating</th>
                  <th className="pb-3 font-medium">Solved</th>
                  <th className="pb-3 font-medium">Contests</th>
                  <th className="pb-3 font-medium text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {leaderboard.slice(0, 6).map((item) => (
                  <tr key={item.studentId} className="hover:bg-zinc-900/40 transition">
                    <td className="py-3 text-xs font-semibold text-zinc-400">
                      {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/students/${item.studentId}`}
                        className="group flex items-center gap-2"
                      >
                        <span className="font-medium text-zinc-200 group-hover:text-blue-400 transition">
                          {item.name}
                        </span>
                        <span className={`text-xs ${getRankColor(item.rankTitle)}`}>
                          @{item.handle}
                        </span>
                      </Link>
                    </td>
                    <td className="py-3">
                      <span className={`font-semibold ${getRankColor(item.rankTitle)}`}>
                        {item.rating || '—'}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-300">{item.solvedCount}</td>
                    <td className="py-3 text-zinc-400">{item.contestCount}</td>
                    <td className="py-3 text-right">
                      {item.recentRatingChange !== 0 ? (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            item.recentRatingChange > 0
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                              : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                          }`}
                        >
                          {item.recentRatingChange > 0 ? `+${item.recentRatingChange}` : item.recentRatingChange}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Solved Topics & Most Improved */}
        <div className="space-y-6">
          {/* Top Tags */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              Teacher Solved Problem Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {topTags.map(([tag, count]) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md bg-zinc-900 border border-border text-xs text-zinc-300 flex items-center gap-1.5"
                >
                  <span>{tag}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-blue-400 font-medium">
                    {count}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Most Improved Students */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              Recent Surges
            </h3>
            <div className="space-y-2.5">
              {classSummary.mostImprovedStudents.length > 0 ? (
                classSummary.mostImprovedStudents.map((s) => (
                  <div
                    key={s.studentId}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-border-subtle"
                  >
                    <div>
                      <p className="text-xs font-medium text-zinc-200">{s.name}</p>
                      <p className="text-[11px] text-zinc-400">@{s.handle}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                      +{s.ratingChange}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500">No recent rating swings recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
