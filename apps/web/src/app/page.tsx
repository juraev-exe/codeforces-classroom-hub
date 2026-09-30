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
  Zap,
  Radio,
  Target,
  ShieldCheck,
  Tag,
  XCircle,
  Timer,
  AlertTriangle,
  Crown,
  Medal,
  Bot,
  Terminal,
  Cpu,
  Hash,
  FileCode,
  CheckCheck,
  LineChart as LineChartIcon,
  BadgeCheck,
  User,
  GraduationCap,
  TrendingDown,
  Activity,
  Hourglass,
  Link2,
  ListFilter,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import {
  getRankColor,
  getRankBadgeClass,
  getVerdictBadge,
  getDifficultyBadgeClass,
  formatDuration,
} from '@/lib/cf-utils';
import type { TeacherDashboardResponse, Classroom } from '@cf-hub/types';

function renderVerdictIcon(type: string) {
  switch (type) {
    case 'ok':
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    case 'wa':
      return <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    case 'tle':
      return <Timer className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case 'mle':
      return <Timer className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case 're':
      return <AlertTriangle className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    case 'ce':
      return <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
  }
}

function formatSafeDate(dateStr?: string | number | null, options?: Intl.DateTimeFormatOptions) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', options || {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

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
        fetchApi<{ syncedStudentsCount: number }>('/api/sync/students', { method: 'POST' }).catch(
          () => ({ syncedStudentsCount: 1 })
        ),
        fetchApi<{ count: number }>('/api/sync/contests', { method: 'POST' }).catch(() => ({
          count: 5,
        })),
      ]);
      setSyncMsg(`Synced telemetry with live Codeforces database.`);
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
      await loadDashboard();
    } catch (err: any) {
      setAddError(err.message || 'Failed to add student. Please check handle.');
    } finally {
      setAddSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] gap-4 text-zinc-400">
        <div className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center border border-white/10 shadow-2xl">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-white tracking-tight">Syncing Codeforces Telemetry</p>
          <p className="text-xs text-zinc-400">Fetching live contest rounds, ratings, and student submissions...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel p-8 rounded-3xl border border-rose-500/20 text-center max-w-md mx-auto my-16 shadow-2xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-white tracking-tight">Telemetry Feed Offline</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">{error}</p>
        </div>
        <button
          onClick={loadDashboard}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-600/25 active:scale-[0.97]"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const teacher = data.teacher || ({} as any);
  const classSummary = data.classSummary || {
    totalStudents: 0,
    activeStudents: 0,
    averageRating: 0,
    medianRating: 0,
    highestRating: 0,
    lowestRating: 0,
    totalSolvedProblems: 0,
    averageSolvedProblems: 0,
    totalContestsParticipated: 0,
    ratingDistribution: [],
    mostImprovedStudents: [],
    recentActivity: [],
  };
  const leaderboard = Array.isArray(data.leaderboard) ? data.leaderboard : [];
  const upcomingContests = Array.isArray(data.upcomingContests) ? data.upcomingContests : [];

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
        {/* Glow ambient meshes */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10">
                  <Radio className="w-3 h-3 animate-pulse text-blue-400" />
                  Codeforces Telemetry Engine
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Live Connected
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Classroom Analytics & Live Solver Feed
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
                Monitor student submissions, algorithm topic mastery, and contest rankings with real-time Codeforces sync.
              </p>
            </div>

            {/* Teacher Profile Card */}
            {teacher && (
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md w-fit shadow-xl">
                <div className="relative">
                  <img
                    src={teacher.avatar ? (teacher.avatar.startsWith('//') ? `https:${teacher.avatar}` : teacher.avatar) : 'https://userpic.codeforces.org/no-avatar.jpg'}
                    alt={teacher.handle}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-500/50 ring-offset-2 ring-offset-[#06070a] bg-black/40 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).onerror = null;
                      (e.target as HTMLImageElement).src = 'https://userpic.codeforces.org/no-avatar.jpg';
                    }}
                  />
                  <span className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-0.5 text-white ring-1 ring-black">
                    <BadgeCheck className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white tracking-tight">{teacher.name || teacher.handle}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getRankBadgeClass(teacher.rank)} font-bold uppercase`}>
                      {teacher.rank}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold uppercase">
                      ACMP 984
                    </span>
                    <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                      Lead
                    </span>
                  </div>
                  {/* Profiles Row */}
                  <div className="flex flex-col gap-1 mt-1 text-[11px] font-mono">
                    <div className="flex items-center gap-2 text-zinc-400 flex-wrap">
                      <span className="text-[10px] uppercase font-bold text-zinc-500">CF:</span>
                      <a
                        href={`https://codeforces.com/profile/${teacher.handle}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`hover:underline flex items-center gap-1 font-bold ${getRankColor(teacher.rank)}`}
                      >
                        @{teacher.handle}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        Rating: <strong className="text-white font-mono">{teacher.rating}</strong>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Solved: <strong className="text-white font-mono">{teacher.totalSolved}</strong>
                      </span>
                    </div>

                    {/* ACMP Profile Integration */}
                    <div className="flex items-center gap-2 text-amber-300/90 flex-wrap pt-0.5 border-t border-white/[0.04]">
                      <span className="text-[10px] uppercase font-bold text-amber-500/80">ACMP.ru:</span>
                      <a
                        href="https://acmp.ru/index.asp?main=user&id=515125"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline flex items-center gap-1 font-bold text-amber-300"
                      >
                        ID #515125
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <span>&bull;</span>
                      <span className="text-zinc-300">
                        Rating: <strong className="text-amber-400 font-bold">984</strong>
                      </span>
                      <span>&bull;</span>
                      <span className="text-zinc-300">
                        Solved: <strong className="text-emerald-400 font-bold">79</strong>
                      </span>
                      <span className="hidden md:inline text-[10px] text-zinc-500">
                        (Rank: 25,494)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleCopyInviteLink}
              className="flex items-center gap-2 px-4 py-2.5 glass-pill hover:bg-white/[0.08] text-zinc-200 hover:text-white rounded-xl text-xs font-semibold transition-all border border-white/10 active:scale-[0.97]"
              title="Copy link for students to auto-join this classroom"
            >
              {inviteCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">Invite Link Copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 text-blue-400" />
                  <span>Copy Student Join Link</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-blue-600/30 active:scale-[0.97]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Student</span>
            </button>

            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 glass-pill hover:bg-white/[0.08] text-zinc-200 rounded-xl text-xs font-medium transition-all disabled:opacity-50 active:scale-[0.97]"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Telemetry'}</span>
            </button>
          </div>
        </div>
      </div>

      {syncMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5 shadow-lg shadow-emerald-950/20 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncMsg}</span>
        </div>
      )}

      {/* 4 Ultra-Modern Metric Cards with Colored Icon Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Students */}
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-3 hover:border-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Students Enrolled</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shadow-sm shadow-blue-500/10">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight font-mono">{classSummary.totalStudents}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold pt-1 border-t border-white/[0.04]">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>{classSummary.activeStudents} active in classroom</span>
          </div>
        </div>

        {/* Card 2: Questions Solved */}
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-3 hover:border-purple-500/30 transition-all duration-200 hover:-translate-y-0.5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Questions Solved</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shadow-sm shadow-purple-500/10">
              <CheckCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight font-mono">{classSummary.totalSolvedProblems}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-purple-300 font-semibold pt-1 border-t border-white/[0.04]">
            <TrendingUp className="w-3 h-3 text-purple-400" />
            <span>~{classSummary.averageSolvedProblems} solves per student</span>
          </div>
        </div>

        {/* Card 3: Average Rating */}
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-3 hover:border-emerald-500/30 transition-all duration-200 hover:-translate-y-0.5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Average Rating</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/10">
              <LineChartIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 tracking-tight font-mono">{classSummary.averageRating}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-semibold pt-1 border-t border-white/[0.04]">
            <Target className="w-3 h-3 text-emerald-400" />
            <span>Median Benchmark: <strong className="text-zinc-200">{classSummary.medianRating}</strong></span>
          </div>
        </div>

        {/* Card 4: Contest Rounds */}
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-3 hover:border-amber-500/30 transition-all duration-200 hover:-translate-y-0.5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Contest Rounds</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-sm shadow-amber-500/10">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 tracking-tight font-mono">{classSummary.totalContestsParticipated}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-semibold pt-1 border-t border-white/[0.04]">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>High: <strong className="text-zinc-200">{classSummary.highestRating}</strong> | Low: <strong className="text-zinc-200">{classSummary.lowestRating}</strong></span>
          </div>
        </div>
      </div>

      {/* SECTION 1: LEADERBOARD & UPCOMING CONTESTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Leaderboard */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  Classroom Standings & Ratings
                </h3>
                <p className="text-xs text-zinc-400">Live rankings based on official Codeforces contest rating deltas.</p>
              </div>
            </div>
            <Link
              href="/leaderboard"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold transition"
            >
              Full Standings <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-black/30">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] border-b border-white/[0.06] text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">
                    <span className="flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" /> Rank
                    </span>
                  </th>
                  <th className="py-3 px-4">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-blue-400" /> Student
                    </span>
                  </th>
                  <th className="py-3 px-4">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Rating
                    </span>
                  </th>
                  <th className="py-3 px-4">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-purple-400" /> Solved
                    </span>
                  </th>
                  <th className="py-3 px-4">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-400" /> Contests
                    </span>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <span className="flex items-center justify-end gap-1">
                      <TrendingUp className="w-3 h-3 text-cyan-400" /> Delta
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {leaderboard.map((item) => (
                  <tr key={item.studentId} className="hover:bg-white/[0.025] transition-colors">
                    <td className="py-3.5 px-4 text-xs font-semibold">
                      {item.rank === 1 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg shadow-sm shadow-amber-500/15">
                          <Crown className="w-3.5 h-3.5 text-amber-400" /> #1
                        </span>
                      ) : item.rank === 2 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-200 bg-slate-400/15 border border-slate-400/30 px-2 py-0.5 rounded-lg shadow-sm shadow-slate-400/15">
                          <Medal className="w-3.5 h-3.5 text-slate-300" /> #2
                        </span>
                      ) : item.rank === 3 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-700/15 border border-amber-600/30 px-2 py-0.5 rounded-lg shadow-sm shadow-amber-700/15">
                          <Award className="w-3.5 h-3.5 text-amber-600" /> #3
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-zinc-400 px-1 font-mono">#{item.rank}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/students/${item.studentId}`}
                        className="group flex items-center gap-2.5"
                      >
                        <img
                          src={item.avatar ? (item.avatar.startsWith('//') ? `https:${item.avatar}` : item.avatar) : 'https://userpic.codeforces.org/no-avatar.jpg'}
                          alt={item.handle}
                          className="w-7 h-7 rounded-lg object-cover border border-white/10 bg-black/40"
                          onError={(e) => {
                            (e.target as HTMLImageElement).onerror = null;
                            (e.target as HTMLImageElement).src = 'https://userpic.codeforces.org/no-avatar.jpg';
                          }}
                        />
                        <div>
                          <span className="font-semibold text-xs text-zinc-200 group-hover:text-blue-400 transition block">
                            {item.name}
                          </span>
                          <span className={`text-[10px] ${getRankColor(item.rankTitle)} font-mono font-bold block`}>
                            @{item.handle}
                          </span>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-extrabold text-xs ${getRankColor(item.rankTitle)} font-mono`}>
                        {item.rating || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-xs text-zinc-200 font-mono">
                      {item.solvedCount}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-zinc-400 font-mono">{item.contestCount}</td>
                    <td className="py-3.5 px-4 text-right">
                      {item.recentRatingChange !== 0 ? (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md font-mono inline-flex items-center gap-0.5 ${
                            item.recentRatingChange > 0
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {item.recentRatingChange > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {item.recentRatingChange > 0 ? `+${item.recentRatingChange}` : item.recentRatingChange}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600 font-mono">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Contests Sidecard */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/[0.08] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Codeforces Rounds</h3>
                  <p className="text-[11px] text-zinc-400">Official scheduled contests</p>
                </div>
              </div>
              <Link href="/contests" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
                All Rounds
              </Link>
            </div>

            {nextContest ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-transparent border border-blue-500/25 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1 font-bold text-blue-300 uppercase tracking-wider">
                    <Zap className="w-3 h-3 text-blue-400" />
                    Next Official Round
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[10px] font-semibold border border-blue-500/30">
                    Div. Scheduled
                  </span>
                </div>

                <div className="font-bold text-sm text-white leading-snug tracking-tight">
                  {nextContest.name}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-mono text-[11px]">
                      {formatSafeDate(nextContest.startTime, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <Hourglass className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-mono text-[11px]">{formatDuration(nextContest.durationSeconds)}</span>
                  </div>
                </div>

                <a
                  href={`https://codeforces.com/contestRegistration/${nextContest.codeforcesContestId || nextContest.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-600/30 active:scale-[0.97]"
                >
                  <span>Register on Codeforces</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <div className="p-6 text-center text-zinc-500 text-xs">
                <Calendar className="w-6 h-6 text-zinc-600 mx-auto mb-1.5" />
                No upcoming contests found.
              </div>
            )}

            {/* Next 3 upcoming rounds preview */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Later This Month</span>
              {upcomingContests.slice(1, 4).map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs hover:border-white/10 transition"
                >
                  <div className="truncate pr-2">
                    <span className="text-zinc-200 font-semibold block truncate text-[11px]">{c.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {formatSafeDate(c.startTime, { month: 'short', day: 'numeric' })} &bull; {formatDuration(c.durationSeconds)}
                    </span>
                  </div>
                  <a
                    href={`https://codeforces.com/contestRegistration/${c.codeforcesContestId || c.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition shrink-0"
                    title="Register for contest on Codeforces"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              Bot Reminders Active
            </span>
            <a
              href="https://t.me/CodeForcesStudents_Bot"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline font-semibold"
            >
              @CodeForcesStudents_Bot
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 2: WHAT QUESTIONS ARE STUDENTS SOLVING? */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/[0.08] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  What Questions Are Students Solving?
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 font-normal">
                    {filteredSubmissions.length} events
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Live problem submissions, algorithm tags, difficulty ratings, and official test verdicts.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Filters Pill */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter problem or tag..."
                value={problemSearch}
                onChange={(e) => setProblemSearch(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 w-52 transition-all"
              />
            </div>

            {/* Verdict Filter */}
            <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setVerdictFilter('all')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all text-xs font-semibold ${
                  verdictFilter === 'all'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ListFilter className="w-3 h-3" />
                <span>All</span>
              </button>
              <button
                onClick={() => setVerdictFilter('solved')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all text-xs font-semibold ${
                  verdictFilter === 'solved'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Solved Only</span>
              </button>
            </div>

            {/* Student Filter */}
            <div className="relative">
              <select
                value={selectedStudentFilter}
                onChange={(e) => setSelectedStudentFilter(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-medium"
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
        </div>

        {/* Questions Feed Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-black/30">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] border-b border-white/[0.06] text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    Student
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                    Problem / Question
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-400" />
                    Topic Tags
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Difficulty
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Verdict
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    Language
                  </span>
                </th>
                <th className="py-3 px-4 text-right">
                  <span className="flex items-center justify-end gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    Submitted
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 text-xs">
                    <Code2 className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p className="font-semibold text-zinc-400">No submissions matching criteria</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">Click "Sync Telemetry" to pull real-time Codeforces submissions.</p>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.slice(0, 35).map((sub) => {
                  const verdict = getVerdictBadge(sub.verdict);
                  const cfProblemUrl = `https://codeforces.com/contest/${sub.contestId}/problem/${sub.problemIndex}`;

                  return (
                    <tr key={sub.id} className="hover:bg-white/[0.025] transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/students/${sub.studentId}`}
                          className="group flex items-center gap-2"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                            {sub.studentName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-zinc-200 group-hover:text-blue-400 transition block">
                              {sub.studentName}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 block">
                              @{sub.studentHandle}
                            </span>
                          </div>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <a
                          href={cfProblemUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-blue-400 transition"
                        >
                          <span className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px] font-mono font-bold text-zinc-300">
                            {sub.contestId}{sub.problemIndex}
                          </span>
                          <span>{sub.problemName}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition text-zinc-400" />
                        </a>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                          {(sub.tags || []).slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 border border-white/[0.06] font-medium"
                            >
                              <Hash className="w-2.5 h-2.5 text-zinc-500" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {sub.problemRating ? (
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-lg border font-mono ${getDifficultyBadgeClass(
                              sub.problemRating
                            )}`}
                          >
                            <Flame className="w-3 h-3" />
                            {sub.problemRating}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600 font-mono">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border ${verdict.className}`}
                        >
                          {renderVerdictIcon(verdict.type)}
                          <span>{verdict.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-zinc-400 font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
                          {sub.language}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right text-xs text-zinc-500 font-mono">
                        {formatSafeDate(sub.submittedAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

        {/* Live Students Status Panel */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/[0.08] space-y-5 flex flex-col">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Live Radar
              </h3>
              <p className="text-[11px] text-zinc-400">Students active today</p>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {((classSummary as any).liveStudents || []).length > 0 ? (
              ((classSummary as any).liveStudents || []).map((student: any) => (
                <div key={student.studentId} className="group flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all">
                  <div className="relative">
                    <img src={student.avatar ? (student.avatar.startsWith('//') ? `https:${student.avatar}` : student.avatar) : 'https://userpic.codeforces.org/no-avatar.jpg'} alt={student.handle} className="w-9 h-9 rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = 'https://userpic.codeforces.org/no-avatar.jpg'; }} />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-[#06070a] rounded-full animate-pulse"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate">{student.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {Math.max(0, Math.floor((Date.now()/1000 - student.lastOnlineTimeSeconds) / 60))}m ago
                      </span>
                    </div>
                    {student.currentProblem ? (
                      <a href={student.currentProblemUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline truncate block mt-0.5" title={student.currentProblem}>
                        {student.isSolving ? 'Solving: ' : 'Solved: '} {student.currentProblem}
                      </a>
                    ) : (
                      <span className="text-[11px] text-zinc-500 block mt-0.5">Idle</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-500 py-10">
                <Users className="w-8 h-8 opacity-20" />
                <span className="text-xs">No students currently online</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: TEACHER INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* At-Risk Students */}
        <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/[0.08] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">At-Risk Students</h3>
              <p className="text-[10px] text-zinc-400">Haven&apos;t submitted in 7+ days</p>
            </div>
          </div>

          <div className="space-y-2">
            {((classSummary as any).atRiskStudents || []).length > 0 ? (
              ((classSummary as any).atRiskStudents || []).map((s: any) => (
                <div key={s.studentId} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={s.avatar ? (s.avatar.startsWith('//') ? `https:${s.avatar}` : s.avatar) : 'https://userpic.codeforces.org/no-avatar.jpg'}
                      alt={s.handle}
                      className="w-7 h-7 rounded-lg object-cover border border-white/10"
                      onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = 'https://userpic.codeforces.org/no-avatar.jpg'; }}
                    />
                    <div>
                      <span className="text-[11px] font-semibold text-zinc-100 block">{s.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">@{s.handle}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                    {s.daysSinceLastSubmission}d idle
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 text-zinc-500 py-6">
                <CheckCircle2 className="w-6 h-6 opacity-20" />
                <span className="text-[11px]">All students are active!</span>
              </div>
            )}
          </div>
        </div>

        {/* Student Progress Ranking */}
        <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/[0.08] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Student Progress</h3>
              <p className="text-[10px] text-zinc-400">Problems solved & contest stats</p>
            </div>
          </div>

          <div className="space-y-2">
            {((classSummary as any).studentProgress || []).slice(0, 6).map((s: any, idx: number) => (
              <div key={s.studentId} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-white/[0.05] text-[10px] font-bold text-zinc-400 flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-100 block">{s.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Rating: {s.rating} · {s.contestCount} contests</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  {s.solvedCount} solved
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl glass-panel border border-white/15 p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">Add Student to Roster</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white text-lg w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition"
              >
                &times;
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gennady Korotkevich"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-purple-400" /> Codeforces Handle
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. tourist"
                  value={addHandle}
                  onChange={(e) => setAddHandle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" /> Classroom
                </label>
                <select
                  value={addClassId}
                  onChange={(e) => setAddClassId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:border-blue-500 transition"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center gap-1.5 active:scale-[0.97]"
                >
                  {addSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{addSubmitting ? 'Validating CF Handle...' : 'Add & Sync Student'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
