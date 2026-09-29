'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Flame,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { fetchApi } from '@/lib/api';
import { getRankColor, getVerdictBadge } from '@/lib/cf-utils';
import type { ClassSummary, Classroom } from '@cf-hub/types';

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';

  const [summary, setSummary] = useState<ClassSummary | null>(null);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selectedClass, setSelectedClass] = useState(initialClassId);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const url = selectedClass ? `/api/classes/${selectedClass}/analytics` : '/api/analytics';
      const [sumData, classesData] = await Promise.all([
        fetchApi<ClassSummary>(url),
        fetchApi<Classroom[]>('/api/classes'),
      ]);
      setSummary(sumData);
      setClasses(classesData);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedClass]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-zinc-400">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm">Aggregating telemetry analytics...</p>
      </div>
    );
  }

  if (!summary) {
    return <div className="p-8 text-center text-zinc-400">No analytics data available.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            Classroom Analytics
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Aggregated rating distribution, student growth, and problem solving telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-card border border-border rounded-xl px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Classrooms</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border">
          <span className="text-xs text-zinc-400">Average Rating</span>
          <div className="text-3xl font-bold text-blue-400 mt-1">{summary.averageRating}</div>
          <span className="text-xs text-zinc-500 mt-1 block">Median: {summary.medianRating}</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border">
          <span className="text-xs text-zinc-400">Total Solved</span>
          <div className="text-3xl font-bold text-purple-400 mt-1">{summary.totalSolvedProblems}</div>
          <span className="text-xs text-zinc-500 mt-1 block">~{summary.averageSolvedProblems} per student</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border">
          <span className="text-xs text-zinc-400">Rating Bounds</span>
          <div className="text-3xl font-bold text-emerald-400 mt-1">{summary.highestRating}</div>
          <span className="text-xs text-zinc-500 mt-1 block">Lowest: {summary.lowestRating}</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border">
          <span className="text-xs text-zinc-400">Contest Participations</span>
          <div className="text-3xl font-bold text-amber-400 mt-1">{summary.totalContestsParticipated}</div>
          <span className="text-xs text-zinc-500 mt-1 block">Across {summary.totalStudents} students</span>
        </div>
      </div>

      {/* Chart: Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-400" />
            Class Rating Tiers Breakdown
          </h2>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.ratingDistribution}>
                <XAxis dataKey="range" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#52525b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {summary.ratingDistribution.map((_, index) => (
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

        {/* Most Improved Students */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            Most Improved Students
          </h2>

          <div className="space-y-3 pt-2">
            {summary.mostImprovedStudents.length > 0 ? (
              summary.mostImprovedStudents.map((s, idx) => (
                <div
                  key={s.studentId}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-border-subtle"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-zinc-500">#{idx + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{s.name}</p>
                      <p className="text-xs text-zinc-400">@{s.handle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                      +{s.ratingChange}
                    </span>
                    <span className="text-[11px] text-zinc-400 block mt-1">Rating: {s.currentRating}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-6 text-center">
                No recent rating changes recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Submissions Feed */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Recent Student Submissions Feed
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="pb-3">Student</th>
                <th className="pb-3">Problem</th>
                <th className="pb-3">Verdict</th>
                <th className="pb-3">Rating</th>
                <th className="pb-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {summary.recentActivity.map((sub) => {
                const verdict = getVerdictBadge(sub.verdict);
                return (
                  <tr key={sub.id} className="hover:bg-zinc-900/30 transition">
                    <td className="py-3">
                      <span className="font-medium text-zinc-200">{sub.studentName}</span>
                      <span className="text-xs text-zinc-400 block">@{sub.studentHandle}</span>
                    </td>
                    <td className="py-3">
                      <a
                        href={
                          sub.contestId
                            ? `https://codeforces.com/contest/${sub.contestId}/problem/${sub.problemIndex}`
                            : `https://codeforces.com/problemset/problem/${sub.contestId}/${sub.problemIndex}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-200 hover:text-blue-400 transition inline-flex items-center gap-1"
                      >
                        {sub.problemIndex}. {sub.problemName}
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
                    <td className="py-3 text-right text-xs text-zinc-500">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm">Loading analytics...</p>
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}
