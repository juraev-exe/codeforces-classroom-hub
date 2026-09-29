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
  Sparkles,
  ChevronRight,
  Layers,
  Award,
  Share2,
  Check,
  Copy,
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
  const [inviteCopied, setInviteCopied] = useState(false);

  function handleCopyInviteLink() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const inviteUrl = `${origin}/join`;
    navigator.clipboard.writeText(inviteUrl);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 3000);
  }

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
      setError(err.message || 'Failed to load dashboard data. Ensure backend API is active.');
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
      setSyncMsg(`Synced ${sRes.syncedStudentsCount} students & ${cRes.count} contests from Codeforces.`);
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
      <div className="flex flex-col items-center justify-center min-h-[65vh] gap-4 text-zinc-400">
        <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center border border-white/10 shadow-xl">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
        </div>
        <p className="text-xs font-medium tracking-tight text-zinc-400">Loading student telemetry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel p-8 rounded-3xl border border-rose-500/20 text-center max-w-md mx-auto my-16 shadow-2xl">
        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400 mb-3">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1.5">Connection Offline</h3>
        <p className="text-xs text-zinc-400 mb-5 leading-relaxed">{error}</p>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-600/20"
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
    const searchLower = problemSearch.toLowerCase();
    const matchesSearch =
      (sub.problemName || '').toLowerCase().includes(searchLower) ||
      (sub.problemIndex || '').toLowerCase().includes(searchLower) ||
      (sub.studentName || '').toLowerCase().includes(searchLower) ||
      (sub.studentHandle || '').toLowerCase().includes(searchLower) ||
      (sub.tags || []).some((t) => t.toLowerCase().includes(searchLower));

    const matchesVerdict = verdictFilter === 'all' ? true : sub.verdict === 'OK';
    const matchesStudent =
      selectedStudentFilter === 'all' ? true : sub.studentHandle === selectedStudentFilter;

    return matchesSearch && matchesVerdict && matchesStudent;
  });

  const nextContest = upcomingContests[0];

  return (
    <div className="space-y-7">
      {/* Apple-style Hero Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/[0.08] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Classroom Telemetry
                </span>
                <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  Tokens Verified
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Student Activity & Contest Hub
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
                Real-time monitoring of questions solved, algorithm topic distributions, and contest progression.
              </p>
            </div>

            {/* User Personal Profile Card */}
            {teacher && (
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md w-fit">
                <img
                  src={teacher.avatar || 'https://userpic.codeforces.org/no-avatar.jpg'}
                  alt={teacher.handle}
                  className="w-10 h-10 rounded-xl object-cover border border-white/10 bg-black/40 shadow-sm"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-tight">{teacher.name || teacher.handle}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getRankBadgeClass(teacher.rank)}`}>
                      {teacher.rank.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-0.5">
                    <a
                      href={`https://codeforces.com/profile/${teacher.handle}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`hover:underline flex items-center gap-1 font-semibold ${getRankColor(teacher.rank)}`}
                    >
                      @{teacher.handle}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <span>&bull;</span>
                    <span>Rating: <strong className="text-zinc-200">{teacher.rating}</strong></span>
                    <span>&bull;</span>
                    <span>Solved: <strong className="text-zinc-200">{teacher.totalSolved}</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleCopyInviteLink}
              className="flex items-center gap-1.5 px-3.5 py-2.5 glass-pill hover:bg-white/[0.08] text-zinc-200 rounded-xl text-xs font-semibold transition-all active:scale-[0.97]"
              title="Copy shareable link for students to join this class"
            >
              {inviteCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Invite Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Copy Student Join Link</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-blue-600/25 active:scale-[0.97]"
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </button>

            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 glass-pill hover:bg-white/[0.08] text-zinc-200 rounded-xl text-xs font-medium transition-all disabled:opacity-50 active:scale-[0.97]"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Telemetry'}
            </button>
          </div>
        </div>
      </div>

      {syncMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5 shadow-lg shadow-emerald-950/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{syncMsg}</span>
        </div>
      )}

      {/* 4 Telemetry Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl space-y-1 hover:border-white/15 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Students Enrolled</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{classSummary.totalStudents}</div>
          <span className="text-[11px] text-emerald-400 font-medium block">
            {classSummary.activeStudents} actively tracking
          </span>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-1 hover:border-white/15 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Questions Solved</span>
            <Code2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{classSummary.totalSolvedProblems}</div>
          <span className="text-[11px] text-zinc-400 block font-medium">
            ~{classSummary.averageSolvedProblems} per student
          </span>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-1 hover:border-white/15 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Average Rating</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{classSummary.averageRating}</div>
          <span className="text-[11px] text-zinc-400 block font-medium">
            Median: {classSummary.medianRating}
          </span>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-1 hover:border-white/15 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Contest Rounds</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">{classSummary.totalContestsParticipated}</div>
          <span className="text-[11px] text-zinc-400 block font-medium">
            High: {classSummary.highestRating} | Low: {classSummary.lowestRating}
          </span>
        </div>
      </div>

      {/* SECTION 1: WHAT QUESTIONS ARE STUDENTS SOLVING? */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/[0.08] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                What Questions Are Students Solving?
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Live submission feed across your classroom with tags, rating tier, verdict, and direct Codeforces links.
            </p>
          </div>

          {/* Interactive Filters Pill */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search question or tag..."
                value={problemSearch}
                onChange={(e) => setProblemSearch(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 w-52 transition-all"
              />
            </div>

            {/* Verdict Filter */}
            <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setVerdictFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  verdictFilter === 'all'
                    ? 'bg-white/10 text-white font-medium shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setVerdictFilter('solved')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  verdictFilter === 'solved'
                    ? 'bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Solved Only
              </button>
            </div>

            {/* Student Filter */}
            <select
              value={selectedStudentFilter}
              onChange={(e) => setSelectedStudentFilter(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-all"
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

        {/* Questions Feed Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-black/20">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] border-b border-white/[0.06] text-[11px] text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Problem / Question</th>
                <th className="py-3 px-4">Topic Tags</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4 text-right">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-500 text-xs">
                    No submissions matching your filter criteria. Click "Sync Telemetry" to pull recent data.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.slice(0, 30).map((sub) => {
                  const verdict = getVerdictBadge(sub.verdict);

                  return (
                    <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/students/${sub.studentId}`}
                          className="font-medium text-zinc-200 hover:text-blue-400 transition-colors flex items-center gap-1.5"
                        >
                          <span>{sub.studentName || sub.studentHandle}</span>
                        </Link>
                        <span className="text-[11px] text-zinc-400 font-mono">@{sub.studentHandle}</span>
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
                          className="group inline-flex items-center gap-1.5 font-medium text-zinc-200 hover:text-blue-400 transition-colors"
                        >
                          <span>{sub.problemIndex}. {sub.problemName}</span>
                          <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                        </a>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {sub.tags && sub.tags.length > 0 ? (
                            sub.tags.slice(0, 3).map((tag: string) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-md bg-white/[0.04] text-[10px] text-zinc-300 border border-white/[0.06]"
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

                      <td className="py-3.5 px-4">
                        {sub.problemRating ? (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 font-semibold text-zinc-200 font-mono">
                            ★ {sub.problemRating}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${verdict.className}`}>
                          {verdict.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-zinc-400 font-mono">
                        {sub.language}
                      </td>

                      <td className="py-3.5 px-4 text-right text-xs text-zinc-500">
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

      {/* SECTION 2: LEADERBOARD & CONTESTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Leaderboard */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Class Leaderboard & Contest Ratings
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Rankings based on live Codeforces official rating deltas.</p>
            </div>
            <Link
              href="/leaderboard"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition"
            >
              Full Standings <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-black/20">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] border-b border-white/[0.06] text-[11px] text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Solved</th>
                  <th className="py-3 px-4">Contests</th>
                  <th className="py-3 px-4 text-right">Contest Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {leaderboard.map((item) => (
                  <tr key={item.studentId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 text-xs font-semibold text-zinc-400">
                      {item.rank === 1 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg shadow-sm shadow-amber-500/10">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" /> 1
                        </span>
                      ) : item.rank === 2 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-300 bg-slate-400/10 border border-slate-400/30 px-2 py-0.5 rounded-lg shadow-sm shadow-slate-400/10">
                          <Award className="w-3.5 h-3.5 text-slate-300" /> 2
                        </span>
                      ) : item.rank === 3 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-700/10 border border-amber-600/30 px-2 py-0.5 rounded-lg shadow-sm shadow-amber-700/10">
                          <Award className="w-3.5 h-3.5 text-amber-600" /> 3
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-zinc-400 px-1 font-mono">#{item.rank}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/students/${item.studentId}`}
                        className="group flex items-center gap-2"
                      >
                        <span className="font-medium text-zinc-200 group-hover:text-blue-400 transition-colors">
                          {item.name}
                        </span>
                        <span className={`text-xs ${getRankColor(item.rankTitle)} font-mono`}>
                          @{item.handle}
                        </span>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-bold ${getRankColor(item.rankTitle)} font-mono`}>
                        {item.rating || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-zinc-200">{item.solvedCount}</td>
                    <td className="py-3.5 px-4 text-zinc-400">{item.contestCount}</td>
                    <td className="py-3.5 px-4 text-right">
                      {item.recentRatingChange !== 0 ? (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-md font-mono ${
                            item.recentRatingChange > 0
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
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
            <div className="glass-panel rounded-3xl p-6 shadow-2xl border border-blue-500/20 space-y-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Upcoming Contest
                </span>
                <Link href="/contests" className="text-xs text-blue-400 hover:underline">
                  All Rounds &rarr;
                </Link>
              </div>
              <h4 className="text-sm font-bold text-white leading-snug">{nextContest.name}</h4>
              <p className="text-xs text-zinc-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                {new Date(nextContest.startTime).toLocaleString()}
              </p>
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-zinc-400">Duration:</span>
                <span className="text-zinc-200 font-medium font-mono">{formatDuration(nextContest.durationSeconds)}</span>
              </div>
            </div>
          )}

          {/* Top Rating Climbers */}
          <div className="glass-panel rounded-3xl p-6 shadow-2xl border border-white/[0.08] space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              Top Rating Climbers
            </h3>
            <div className="space-y-2">
              {classSummary.mostImprovedStudents.length > 0 ? (
                classSummary.mostImprovedStudents.map((s) => (
                  <div
                    key={s.studentId}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                  >
                    <div>
                      <p className="text-xs font-medium text-zinc-200">{s.name}</p>
                      <p className="text-[11px] text-zinc-400 font-mono">@{s.handle}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl glass-panel border border-white/15 p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Add Student to Track</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white text-lg w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition"
              >
                &times;
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Student Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Smith"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 text-xs transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Codeforces Handle
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. tourist, Benq, jiangly"
                  value={addHandle}
                  onChange={(e) => setAddHandle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 text-xs transition"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Validated against Codeforces via your configured API tokens.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Classroom
                </label>
                <select
                  value={addClassId}
                  onChange={(e) => setAddClassId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none focus:border-blue-500 text-xs transition"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center gap-1.5 active:scale-[0.97]"
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
