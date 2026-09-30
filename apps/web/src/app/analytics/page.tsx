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
  Code2,
  Trophy,
  Target,
  Lightbulb,
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
        <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center border border-white/10 shadow-xl">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
        </div>
        <p className="text-xs font-medium">Aggregating telemetry analytics...</p>
      </div>
    );
  }

  if (!summary) {
    return <div className="glass-panel p-12 rounded-3xl border border-white/[0.08] text-center text-zinc-400">No analytics data available.</div>;
  }

  return (
    <div className="space-y-7">
      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/[0.08] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Insights & Diagnostics
              </span>
              <span className="text-xs text-zinc-400">
                Classroom Growth Telemetry
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-7 h-7 text-blue-400" />
              Classroom Analytics & Insights
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Aggregated rating distributions, problem solving velocity, and historical student growth metrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="" className="bg-zinc-900">All Classrooms</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id} className="bg-zinc-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-1 hover:border-white/15 transition-all">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Average Rating</span>
          <div className="text-3xl font-bold text-blue-400 font-mono tracking-tight">{summary.averageRating}</div>
          <span className="text-[11px] text-zinc-500 font-mono block">Median: {summary.medianRating}</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-1 hover:border-white/15 transition-all">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Total Solved</span>
          <div className="text-3xl font-bold text-purple-400 font-mono tracking-tight">{summary.totalSolvedProblems}</div>
          <span className="text-[11px] text-zinc-500 font-mono block">~{summary.averageSolvedProblems} per student</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-1 hover:border-white/15 transition-all">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Rating Range</span>
          <div className="text-3xl font-bold text-emerald-400 font-mono tracking-tight">{summary.highestRating}</div>
          <span className="text-[11px] text-zinc-500 font-mono block">Lowest: {summary.lowestRating}</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-1 hover:border-white/15 transition-all">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Contests Participated</span>
          <div className="text-3xl font-bold text-amber-400 font-mono tracking-tight">{summary.totalContestsParticipated}</div>
          <span className="text-[11px] text-zinc-500 block">Across {summary.totalStudents} students</span>
        </div>
      </div>

      {/* Chart: Rating Distribution & Most Improved */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Class Rating Tiers Breakdown</h2>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.ratingDistribution}>
                <XAxis dataKey="range" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 18, 28, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
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
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Top Rating Climbers</h2>
          </div>

          <div className="space-y-3 pt-2">
            {summary.mostImprovedStudents.length > 0 ? (
              summary.mostImprovedStudents.map((s, idx) => (
                <div
                  key={s.studentId}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-white/[0.05] text-[11px] font-bold text-zinc-400 flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-zinc-100">{s.name}</p>
                      <p className="text-[11px] text-zinc-400 font-mono">@{s.handle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-mono">
                      +{s.ratingChange}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-1">Rating: {s.currentRating}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-8 text-center">
                No recent rating swings recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights: Weaknesses & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topics to Learn */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Topics to Review</h2>
          </div>
          <p className="text-xs text-zinc-400">Algorithm tags where the class has the lowest success rate.</p>

          <div className="space-y-3 pt-2">
            {(summary as any).weakTopics && (summary as any).weakTopics.length > 0 ? (
              (summary as any).weakTopics.map((topic: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-white/[0.05] text-[11px] font-bold text-zinc-400 flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider">{topic.topic}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-red-500/10 text-red-400 border border-red-500/25 font-mono">
                      {topic.successRate}%
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-1">{topic.totalAttempts} attempts</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-8 text-center">Not enough data yet.</p>
            )}
          </div>
        </div>

        {/* Recommended Questions */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Recommended Practice</h2>
          </div>
          <p className="text-xs text-zinc-400">Most frequently failed problems by the class recently.</p>

          <div className="space-y-3 pt-2">
            {(summary as any).recommendedProblems && (summary as any).recommendedProblems.length > 0 ? (
              (summary as any).recommendedProblems.map((prob: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition">
                  <div className="flex flex-col min-w-0 flex-1 mr-4">
                    <a href={prob.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-400 hover:underline truncate">
                      {prob.name}
                    </a>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-zinc-400 font-mono">Rating: {prob.rating || '?'}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/25 font-mono">
                      {prob.fails} fails
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-1">{prob.solves} solves</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-8 text-center">Class is doing perfectly!</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Submissions Feed */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white tracking-tight">Recent Student Activity Stream</h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-black/20">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] border-b border-white/[0.06] text-[11px] text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Problem</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4 text-right">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {summary.recentActivity.map((sub) => {
                const verdict = getVerdictBadge(sub.verdict);
                return (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-zinc-200 text-xs">{sub.studentName || sub.studentHandle}</span>
                      <span className="text-[11px] text-zinc-400 font-mono block">@{sub.studentHandle}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <a
                        href={
                          sub.contestId
                            ? `https://codeforces.com/contest/${sub.contestId}/problem/${sub.problemIndex}`
                            : `https://codeforces.com/problemset/problem/${sub.contestId}/${sub.problemIndex}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-200 hover:text-blue-400 transition inline-flex items-center gap-1.5 text-xs font-medium"
                      >
                        {sub.problemIndex}. {sub.problemName}
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
                    <td className="py-3.5 px-4 text-right text-xs text-zinc-500">
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
