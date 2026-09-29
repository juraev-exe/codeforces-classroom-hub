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
  ExternalLink,
  Search,
  UserPlus,
  Filter,
  AlertCircle,
  Tag,
  BookOpen,
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
import type { TeacherDashboardResponse, Classroom } from '@cf-hub/types';

export default function DashboardPage() {
  const [data, setData] = useState<TeacherDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  // Filters for student solved questions
  const [problemSearch, setProblemSearch] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<'all' | 'solved'>('all');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');

  // Add student modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addHandle, setAddHandle] = useState('');
  const [addClassId, setAddClassId] = useState('');
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);
      const [res, classesRes] = await Promise.all([
        fetchApi<TeacherDashboardResponse>('/api/me'),
        fetchApi<Classroom[]>('/api/classes'),
      ]);
      setData(res);
      setClasses(classesRes);
      if (classesRes.length > 0 && !addClassId) {
        setAddClassId(classesRes[0].id);
      }
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
      setSyncMsg(null);
      const [sRes, cRes] = await Promise.all([
        fetchApi<{ syncedStudentsCount: number }>('/api/sync/students', { method: 'POST' }),
        fetchApi<{ count: number }>('/api/sync/contests', { method: 'POST' }),
      ]);
      setSyncMsg(`Synced ${sRes.syncedStudentsCount} students and ${cRes.count} contests via Codeforces API!`);
      await loadDashboard();
      setTimeout(() => setSyncMsg(null), 5000);
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim() || !addHandle.trim() || !addClassId) {
      setAddError('Please fill in name, handle, and classroom.');
      return;
    }

    try {
      setAddSubmitting(true);
      setAddError(null);
      await fetchApi('/api/students', {
        method: 'POST',
        body: JSON.stringify({
          name: addName.trim(),
          codeforcesHandle: addHandle.trim(),
          classId: addClassId,
        }),
      });

      setAddName('');
      setAddHandle('');
      setIsAddModalOpen(false);
      await handleSyncAll();
    } catch (err: any) {
      setAddError(err.message || 'Failed to add student. Please check handle.');
    } finally {
      setAddSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-zinc-400">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm">Connecting to Codeforces telemetry via your API tokens...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-xl border border-rose-900/50 bg-rose-950/20 text-center max-w-xl mx-auto my-12">
        <h3 className="text-lg font-semibold text-rose-300 mb-2">Backend Connection Issue</h3>
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

  // Filter student submissions
  const allSubmissions = classSummary.recentActivity || [];
  const filteredSubmissions = allSubmissions.filter((sub) => {
    const matchesSearch =
      sub.problemName.toLowerCase().includes(problemSearch.toLowerCase()) ||
      sub.problemIndex.toLowerCase().includes(problemSearch.toLowerCase()) ||
      sub.studentName.toLowerCase().includes(problemSearch.toLowerCase()) ||
      sub.studentHandle.toLowerCase().includes(problemSearch.toLowerCase()) ||
      sub.tags.some((t) => t.toLowerCase().includes(problemSearch.toLowerCase()));

    const matchesVerdict = verdictFilter === 'all' ? true : sub.verdict === 'OK';
    const matchesStudent =
      selectedStudentFilter === 'all' ? true : sub.studentHandle === selectedStudentFilter;

    return matchesSearch && matchesVerdict && matchesStudent;
  });

  const nextContest = upcomingContests[0];

  return (
    <div className="space-y-8">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-2xl bg-card border border-border shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-white tracking-tight">Student Problem & Contest Hub</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                API Tokens Active
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-0.5">
              Monitoring <span className="text-zinc-200 font-semibold">{classSummary.totalStudents} students</span> across{' '}
              <span className="text-zinc-200 font-semibold">{classSummary.totalSolvedProblems} solved questions</span>.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-blue-600/20"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>

          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium border border-border transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Querying Codeforces...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{syncMsg}</span>
        </div>
      )}

      {/* Class Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <span className="text-xs text-zinc-400">Total Enrolled</span>
          <div className="text-2xl font-bold text-white mt-1">
            {classSummary.totalStudents} <span className="text-xs font-normal text-zinc-400">students</span>
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">
            {classSummary.activeStudents} active monitoring
          </span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <span className="text-xs text-zinc-400">Total Questions Solved</span>
          <div className="text-2xl font-bold text-purple-400 mt-1">
            {classSummary.totalSolvedProblems}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            ~{classSummary.averageSolvedProblems} per student
          </span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <span className="text-xs text-zinc-400">Class Average Rating</span>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            {classSummary.averageRating}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Median: {classSummary.medianRating}
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

      {/* SECTION 1: LIVE STUDENT QUESTIONS SOLVED FEED */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Code2 className="w-5 h-5 text-emerald-400" />
              What Questions Are Students Solving?
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Live submission feed across all enrolled students with problem tags, difficulty, and verdicts.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
              <input
                type="text"
                placeholder="Search problem, tag, or handle..."
                value={problemSearch}
                onChange={(e) => setProblemSearch(e.target.value)}
                className="bg-zinc-900 border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 w-56"
              />
            </div>

            {/* Verdict Filter */}
            <select
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value as any)}
              className="bg-zinc-900 border border-border rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Verdicts</option>
              <option value="solved">Accepted (Solved) Only</option>
            </select>

            {/* Student Filter */}
            <select
              value={selectedStudentFilter}
              onChange={(e) => setSelectedStudentFilter(e.target.value)}
              className="bg-zinc-900 border border-border rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Students</option>
              {leaderboard.map((s) => (
                <option key={s.studentId} value={s.handle}>
                  {s.name} (@{s.handle})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Questions Table */}
        <div className="overflow-x-auto rounded-xl border border-border-subtle bg-zinc-900/30">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/70 border-b border-border text-xs text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Question / Problem</th>
                <th className="py-3 px-4">Tags & Topics</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4 text-right">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500 text-xs">
                    No submissions matching your filter criteria. Hit "Sync Now" to refresh from Codeforces.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.slice(0, 30).map((sub) => {
                  const verdict = getVerdictBadge(sub.verdict);
                  const isAccepted = sub.verdict === 'OK';

                  return (
                    <tr key={sub.id} className="hover:bg-zinc-900/50 transition">
                      <td className="py-3 px-4">
                        <Link
                          href={`/students/${sub.studentId}`}
                          className="font-medium text-zinc-200 hover:text-blue-400 transition"
                        >
                          {sub.studentName}
                        </Link>
                        <span className="text-xs text-zinc-400 block font-mono">@{sub.studentHandle}</span>
                      </td>

                      <td className="py-3 px-4">
                        <a
                          href={
                            sub.contestId
                              ? `https://codeforces.com/contest/${sub.contestId}/problem/${sub.problemIndex}`
                              : `https://codeforces.com/problemset/problem/${sub.contestId}/${sub.problemIndex}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-zinc-200 hover:text-blue-400 transition inline-flex items-center gap-1.5"
                        >
                          <span>{sub.problemIndex}. {sub.problemName}</span>
                          <ExternalLink className="w-3 h-3 text-zinc-500" />
                        </a>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {sub.tags && sub.tags.length > 0 ? (
                            sub.tags.slice(0, 3).map((tag: string) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 border border-border-subtle"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-zinc-600">—</span>
                          )}
                          {sub.tags && sub.tags.length > 3 && (
                            <span className="text-[10px] text-zinc-500">+{sub.tags.length - 3}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {sub.problemRating ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-border font-semibold text-zinc-200">
                            ★ {sub.problemRating}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${verdict.className}`}>
                          {verdict.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-zinc-400 font-mono">
                        {sub.language}
                      </td>

                      <td className="py-3 px-4 text-right text-xs text-zinc-500">
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: CLASS LEADERBOARD & CONTESTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Leaderboard */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Class Leaderboard & Contest Ratings
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
                  <th className="pb-3 font-medium text-right">Recent Contest Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {leaderboard.map((item) => (
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
                    <td className="py-3 text-zinc-300 font-semibold">{item.solvedCount}</td>
                    <td className="py-3 text-zinc-400">{item.contestCount}</td>
                    <td className="py-3 text-right">
                      {item.recentRatingChange !== 0 ? (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
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

        {/* Upcoming Contest Tracker Card */}
        <div className="space-y-6">
          {nextContest && (
            <div className="p-5 rounded-2xl bg-card border border-blue-900/40 space-y-3 bg-blue-950/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Upcoming Contest
                </span>
                <Link href="/contests" className="text-xs text-blue-400 hover:underline">
                  All Rounds &rarr;
                </Link>
              </div>
              <h4 className="text-sm font-bold text-white">{nextContest.name}</h4>
              <p className="text-xs text-zinc-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                {new Date(nextContest.startTime).toLocaleString()}
              </p>
              <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
                <span className="text-zinc-400">Duration:</span>
                <span className="text-zinc-200 font-medium">{formatDuration(nextContest.durationSeconds)}</span>
              </div>
            </div>
          )}

          {/* Most Improved Students */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              Top Rating Climbers
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

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                Add Student to Track
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                &times;
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Smith"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full bg-zinc-900 border border-border rounded-lg px-3 py-2 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Codeforces Handle
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. tourist, Benq, jiangly"
                  value={addHandle}
                  onChange={(e) => setAddHandle(e.target.value)}
                  className="w-full bg-zinc-900 border border-border rounded-lg px-3 py-2 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Validated against the Codeforces API using your configured tokens.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Classroom
                </label>
                <select
                  value={addClassId}
                  onChange={(e) => setAddClassId(e.target.value)}
                  className="w-full bg-zinc-900 border border-border rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {addSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {addSubmitting ? 'Validating...' : 'Track Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
