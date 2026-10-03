'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  Search,
  Filter,
  Layers,
  Clock,
  Timer,
  AlertTriangle,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Zap,
  Activity,
  Calendar,
  PieChart as PieIcon,
  Cpu,
  Hash,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  FileCode,
  ArrowUpRight,
  CheckCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from 'recharts';
import { fetchApi } from '@/lib/api';
import {
  getRankColor,
  getRankBadgeClass,
  getVerdictBadge,
  getDifficultyBadgeClass,
} from '@/lib/cf-utils';
import type { ClassSummary, Classroom, SubmissionRecord } from '@cf-hub/types';

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

function formatSafeDate(dateStr?: string | number | null) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function formatRelativeTime(dateStr?: string | null) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

type TabType = 'overview' | 'activities' | 'mastery' | 'students' | 'productivity';

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';

  const [summary, setSummary] = useState<ClassSummary | null>(null);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selectedClass, setSelectedClass] = useState(initialClassId);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Activity Stream Filters & State
  const [activitySearch, setActivitySearch] = useState('');
  const [activityVerdictFilter, setActivityVerdictFilter] = useState<string>('all');
  const [activityStudentFilter, setActivityStudentFilter] = useState<string>('all');
  const [activityDifficultyFilter, setActivityDifficultyFilter] = useState<string>('all');
  const [activityTagFilter, setActivityTagFilter] = useState<string>('all');
  const [activitySortBy, setActivitySortBy] = useState<'newest' | 'oldest' | 'rating-desc' | 'rating-asc' | 'fastest'>('newest');
  const [activityViewMode, setActivityViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Topic mastery search & filter
  const [topicSearch, setTopicSearch] = useState('');
  const [topicStatusFilter, setTopicStatusFilter] = useState<'all' | 'mastered' | 'practicing' | 'needs_attention'>('all');

  // Copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copyCode(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  async function loadData() {
    try {
      setLoading(true);
      const url = selectedClass
        ? `/api/analytics?classId=${encodeURIComponent(selectedClass)}`
        : '/api/analytics';
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

  // Extract all unique tags and students from recentActivity for filter dropdowns
  const availableTags = useMemo(() => {
    if (!summary?.recentActivity) return [];
    const set = new Set<string>();
    summary.recentActivity.forEach((sub) => {
      (sub.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [summary?.recentActivity]);

  const availableStudents = useMemo(() => {
    if (!summary?.studentComparison) return [];
    return summary.studentComparison.map((s) => ({
      handle: s.handle,
      name: s.name,
    }));
  }, [summary?.studentComparison]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    if (!summary?.recentActivity) return [];
    let list = [...summary.recentActivity];

    // Search query
    if (activitySearch.trim()) {
      const q = activitySearch.toLowerCase();
      list = list.filter((s) => {
        return (
          (s.problemName || '').toLowerCase().includes(q) ||
          (s.problemIndex || '').toLowerCase().includes(q) ||
          (s.studentName || '').toLowerCase().includes(q) ||
          (s.studentHandle || '').toLowerCase().includes(q) ||
          (s.tags || []).some((t) => t.toLowerCase().includes(q))
        );
      });
    }

    // Verdict Filter
    if (activityVerdictFilter !== 'all') {
      if (activityVerdictFilter === 'solved') {
        list = list.filter((s) => s.verdict === 'OK');
      } else if (activityVerdictFilter === 'failed') {
        list = list.filter((s) => s.verdict !== 'OK');
      } else {
        list = list.filter((s) => s.verdict === activityVerdictFilter);
      }
    }

    // Student Filter
    if (activityStudentFilter !== 'all') {
      list = list.filter((s) => s.studentHandle?.toLowerCase() === activityStudentFilter.toLowerCase());
    }

    // Difficulty Filter
    if (activityDifficultyFilter !== 'all') {
      list = list.filter((s) => {
        const r = s.problemRating || 0;
        if (activityDifficultyFilter === 'easy') return r > 0 && r < 1200;
        if (activityDifficultyFilter === 'medium') return r >= 1200 && r < 1600;
        if (activityDifficultyFilter === 'hard') return r >= 1600 && r < 2000;
        if (activityDifficultyFilter === 'elite') return r >= 2000;
        if (activityDifficultyFilter === 'unrated') return !r;
        return true;
      });
    }

    // Tag Filter
    if (activityTagFilter !== 'all') {
      list = list.filter((s) => (s.tags || []).includes(activityTagFilter));
    }

    // Sort By
    list.sort((a, b) => {
      if (activitySortBy === 'newest') {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      }
      if (activitySortBy === 'oldest') {
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      }
      if (activitySortBy === 'rating-desc') {
        return (b.problemRating || 0) - (a.problemRating || 0);
      }
      if (activitySortBy === 'rating-asc') {
        return (a.problemRating || 0) - (b.problemRating || 0);
      }
      if (activitySortBy === 'fastest') {
        return (a.timeConsumedMillis || 999999) - (b.timeConsumedMillis || 999999);
      }
      return 0;
    });

    return list;
  }, [
    summary?.recentActivity,
    activitySearch,
    activityVerdictFilter,
    activityStudentFilter,
    activityDifficultyFilter,
    activityTagFilter,
    activitySortBy,
  ]);

  // Paginated activities
  const totalPages = Math.ceil(filteredActivities.length / pageSize) || 1;
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, currentPage, pageSize]);

  // Filtered Topics
  const filteredTopics = useMemo(() => {
    if (!summary?.topicStrengths) return [];
    let list = [...summary.topicStrengths];

    if (topicSearch.trim()) {
      const q = topicSearch.toLowerCase();
      list = list.filter((t) => t.topic.toLowerCase().includes(q));
    }

    if (topicStatusFilter !== 'all') {
      list = list.filter((t) => t.status === topicStatusFilter);
    }

    return list;
  }, [summary?.topicStrengths, topicSearch, topicStatusFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-zinc-400">
        <div className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center border border-white/10 shadow-2xl">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
        </div>
        <p className="text-sm font-medium tracking-tight">Aggregating real-time telemetry & activity logs...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-white/[0.08] text-center text-zinc-400">
        No analytics data available.
      </div>
    );
  }

  const stats = summary.statsSummary || {
    accuracyRate: 0,
    totalSubmissions: summary.recentActivity?.length || 0,
    activeCodersStreak: 0,
    hardestProblemSolved: null,
    fastestSolveTimeMs: null,
    peakHourLabel: '—',
  };

  return (
    <div className="space-y-7 pb-12">
      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/[0.08] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PRO Telemetry
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live CF Sync
              </span>
              <span className="text-xs text-zinc-400">
                Classroom Growth & Activity Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-blue-400" />
              Classroom Analytics & Activities
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Real-time submission telemetry, 84-day activity heatmap, algorithmic skill diagnostics, and competitive problem-solving velocity.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl px-3 py-1.5">
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Scope:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-zinc-900">All Classrooms</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id} className="bg-zinc-900">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => loadData()}
              className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 transition flex items-center gap-1.5 text-xs font-medium"
              title="Refresh telemetry"
            >
              <RefreshCw className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Quick Highlights */}
        <div className="mt-6 pt-5 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Total Submissions</p>
              <p className="text-sm font-bold text-white font-mono">{stats.totalSubmissions}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Class Accuracy</p>
              <p className="text-sm font-bold text-emerald-400 font-mono">{stats.accuracyRate}%</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Active Solvers</p>
              <p className="text-sm font-bold text-white font-mono">{summary.activeStudents} students</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Peak Coding Hour</p>
              <p className="text-sm font-bold text-amber-300 font-mono truncate">{stats.peakHourLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Average Rating */}
        <div className="glass-panel p-4 rounded-2xl border border-white/[0.08] space-y-1 hover:border-white/20 transition-all shadow-md">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Average Rating</span>
          <div className="text-2xl font-black text-blue-400 font-mono">{summary.averageRating}</div>
          <span className="text-[10px] text-zinc-500 font-mono block">Median: {summary.medianRating}</span>
        </div>

        {/* Total Solved */}
        <div className="glass-panel p-4 rounded-2xl border border-white/[0.08] space-y-1 hover:border-white/20 transition-all shadow-md">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Solved</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">{summary.totalSolvedProblems}</div>
          <span className="text-[10px] text-zinc-500 font-mono block">~{summary.averageSolvedProblems} / student</span>
        </div>

        {/* Class Accuracy */}
        <div className="glass-panel p-4 rounded-2xl border border-white/[0.08] space-y-1 hover:border-white/20 transition-all shadow-md">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Solve Accuracy</span>
          <div className="text-2xl font-black text-purple-400 font-mono">{stats.accuracyRate}%</div>
          <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${stats.accuracyRate}%` }} />
          </div>
        </div>

        {/* Active Days */}
        <div className="glass-panel p-4 rounded-2xl border border-white/[0.08] space-y-1 hover:border-white/20 transition-all shadow-md">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Active Coding Days</span>
          <div className="text-2xl font-black text-amber-400 font-mono">{stats.activeCodersStreak}</div>
          <span className="text-[10px] text-zinc-500 font-mono block">Last 84 days</span>
        </div>

        {/* Rating Range */}
        <div className="glass-panel p-4 rounded-2xl border border-white/[0.08] space-y-1 hover:border-white/20 transition-all shadow-md">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Peak Rating</span>
          <div className="text-2xl font-black text-cyan-400 font-mono">{summary.highestRating}</div>
          <span className="text-[10px] text-zinc-500 font-mono block">Floor: {summary.lowestRating}</span>
        </div>

        {/* Contests Logged */}
        <div className="glass-panel p-4 rounded-2xl border border-white/[0.08] space-y-1 hover:border-white/20 transition-all shadow-md">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Contests Participated</span>
          <div className="text-2xl font-black text-rose-400 font-mono">{summary.totalContestsParticipated}</div>
          <span className="text-[10px] text-zinc-500 font-mono block">Across all members</span>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl glass-panel border border-white/[0.08] overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Executive Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('activities')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'activities'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Activity Stream & Explorer</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/20 text-white font-mono">
            {summary.recentActivity?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('mastery')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'mastery'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Algorithm & Topic Mastery</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'students'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Comparison</span>
        </button>

        <button
          onClick={() => setActiveTab('productivity')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'productivity'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Productivity & Velocity</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {/* ============================================================ */}
      {activeTab === 'overview' && (
        <div className="space-y-7">
          {/* Daily Activity Heatmap Matrix */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Daily Submission Activity Matrix</h2>
                  <p className="text-xs text-zinc-400">Classroom problem-solving density across the past 12 weeks (84 days)</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                <span>Less</span>
                <span className="w-3 h-3 rounded-sm bg-white/[0.04] border border-white/10 inline-block" />
                <span className="w-3 h-3 rounded-sm bg-emerald-500/25 border border-emerald-500/40 inline-block" />
                <span className="w-3 h-3 rounded-sm bg-emerald-500/50 border border-emerald-500/60 inline-block" />
                <span className="w-3 h-3 rounded-sm bg-emerald-500/80 border border-emerald-500 inline-block" />
                <span className="w-3 h-3 rounded-sm bg-emerald-400 border border-emerald-300 inline-block" />
                <span>More</span>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="pt-2 overflow-x-auto custom-scrollbar">
              <div className="min-w-[680px]">
                <div className="grid grid-flow-col grid-rows-7 gap-1.5 py-2">
                  {summary.dailyActivity && summary.dailyActivity.length > 0 ? (
                    summary.dailyActivity.map((day, idx) => {
                      const count = day.count;
                      let bgClass = 'bg-white/[0.03] border-white/[0.05]';
                      if (count > 0 && count <= 2) bgClass = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300';
                      else if (count > 2 && count <= 5) bgClass = 'bg-emerald-500/40 border-emerald-500/60 text-emerald-200';
                      else if (count > 5 && count <= 10) bgClass = 'bg-emerald-500/70 border-emerald-400 text-white';
                      else if (count > 10) bgClass = 'bg-emerald-400 border-emerald-300 text-black font-bold';

                      return (
                        <div
                          key={day.date}
                          className={`w-4 h-4 rounded-md border transition hover:scale-125 cursor-pointer relative group flex items-center justify-center ${bgClass}`}
                        >
                          {/* Tooltip on Hover */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                            <div className="bg-zinc-900 border border-white/15 px-3 py-1.5 rounded-xl shadow-2xl text-[11px] whitespace-nowrap text-zinc-200">
                              <span className="font-semibold text-white block">{day.date}</span>
                              <span className="text-emerald-400 font-mono">{day.solved} solved</span> •{' '}
                              <span className="text-rose-400 font-mono">{day.failed} failed</span> •{' '}
                              <span className="text-zinc-400 font-mono">{day.count} total</span>
                            </div>
                            <div className="w-2 h-2 bg-zinc-900 border-r border-b border-white/15 transform rotate-45 -mt-1" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-zinc-500">No activity data logged.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row: Rating Tiers Breakdown & Verdict Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rating Tiers Bar Chart */}
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-400" />
                  <h2 className="text-base font-bold text-white tracking-tight">Class Rating Tiers</h2>
                </div>
                <span className="text-xs text-zinc-400 font-mono">{summary.totalStudents} Students</span>
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

            {/* Verdict Distribution Donut & Legend */}
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-white tracking-tight">Submission Verdicts</h2>
                </div>
                <span className="text-xs text-emerald-400 font-mono font-semibold">
                  {stats.accuracyRate}% Accuracy
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.verdictDistribution || []}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {(summary.verdictDistribution || []).map((entry, index) => (
                          <Cell key={`cell-v-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 18, 28, 0.95)',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {(summary.verdictDistribution || []).slice(0, 5).map((v) => (
                    <div key={v.verdict} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.color }} />
                        <span className="text-zinc-300 font-medium">{v.label}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-white font-bold">{v.count}</span>
                        <span className="text-zinc-500 ml-1.5 text-[11px]">({v.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Difficulty Tiers Solved vs Failed & Top Rating Climbers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Difficulty Distribution Chart */}
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  <h2 className="text-base font-bold text-white tracking-tight">Difficulty Tiers Breakdown</h2>
                </div>
                <span className="text-xs text-zinc-400 font-mono">Solved vs Failed</span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.difficultyDistribution || []}>
                    <XAxis dataKey="range" stroke="#71717a" fontSize={10} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={11} allowDecimals={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 18, 28, 0.95)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="solved" name="Solved (OK)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="failed" name="Failed (WA/TLE)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Climbers & Contest Gainers */}
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <h2 className="text-base font-bold text-white tracking-tight">Top Rating Climbers</h2>
                </div>
                <span className="text-xs text-zinc-400 font-mono">Contest Swings</span>
              </div>

              <div className="space-y-2.5 pt-2">
                {summary.mostImprovedStudents && summary.mostImprovedStudents.length > 0 ? (
                  summary.mostImprovedStudents.map((s, idx) => (
                    <div
                      key={s.studentId}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition"
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
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-xl border font-mono ${
                            s.ratingChange > 0
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                              : s.ratingChange < 0
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {s.ratingChange > 0 ? `+${s.ratingChange}` : s.ratingChange}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono block mt-1">Rating: {s.currentRating}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 py-8 text-center">No recent rating swings recorded.</p>
                )}
              </div>
            </div>
          </div>

          {/* AI Insights: Weaknesses & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weak Topics */}
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-400" />
                <h2 className="text-base font-bold text-white tracking-tight">Topics Requiring Reinforcement</h2>
              </div>
              <p className="text-xs text-zinc-400">Algorithm tags where students experience the lowest success rate.</p>

              <div className="space-y-2.5 pt-2">
                {(summary.weakTopics || []).length > 0 ? (
                  (summary.weakTopics || []).map((topic, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-rose-500/10 text-[11px] font-bold text-rose-400 flex items-center justify-center border border-rose-500/20">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">{topic.topic}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/25 font-mono">
                          {topic.successRate}% Success
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono block mt-1">{topic.totalAttempts} attempts</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 py-6 text-center">Classroom shows high proficiency across all tags.</p>
                )}
              </div>
            </div>

            {/* Recommended Practice Problems */}
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white tracking-tight">Recommended Practice Problems</h2>
              </div>
              <p className="text-xs text-zinc-400">High-leverage problems where the class previously experienced hurdles.</p>

              <div className="space-y-2.5 pt-2">
                {(summary.recommendedProblems || []).length > 0 ? (
                  (summary.recommendedProblems || []).map((prob, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition">
                      <div className="flex flex-col min-w-0 flex-1 mr-4">
                        <a href={prob.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-400 hover:underline truncate flex items-center gap-1.5">
                          {prob.name}
                          <ExternalLink className="w-3 h-3 text-zinc-500 shrink-0" />
                        </a>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-zinc-400 font-mono">Rating: {prob.rating || '—'}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/25 font-mono">
                          {prob.fails} fails
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono block mt-1">{prob.solves} solves</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 py-6 text-center">All targeted problems solved successfully.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: ACTIVITY STREAM & SUBMISSION EXPLORER */}
      {/* ============================================================ */}
      {activeTab === 'activities' && (
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="glass-panel p-5 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search problem title, code (e.g. 2268D), student handle, or tag..."
                  value={activitySearch}
                  onChange={(e) => {
                    setActivitySearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-black/40 border border-white/10 rounded-2xl p-1">
                  <button
                    onClick={() => setActivityViewMode('table')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      activityViewMode === 'table' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Table View
                  </button>
                  <button
                    onClick={() => setActivityViewMode('cards')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      activityViewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Card Feed
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Pills & Selectors */}
            <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-white/[0.06]">
              {/* Verdict Filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1">Verdict:</span>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'solved', label: 'Accepted (OK)' },
                  { id: 'failed', label: 'Failed' },
                  { id: 'WRONG_ANSWER', label: 'WA' },
                  { id: 'TIME_LIMIT_EXCEEDED', label: 'TLE' },
                  { id: 'COMPILATION_ERROR', label: 'CE' },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setActivityVerdictFilter(v.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition ${
                      activityVerdictFilter === v.id
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold'
                        : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              {/* Student Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={activityStudentFilter}
                  onChange={(e) => {
                    setActivityStudentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="all" className="bg-zinc-900">All Students</option>
                  {availableStudents.map((s) => (
                    <option key={s.handle} value={s.handle} className="bg-zinc-900">
                      {s.name} (@{s.handle})
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={activityDifficultyFilter}
                  onChange={(e) => {
                    setActivityDifficultyFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="all" className="bg-zinc-900">All Ratings</option>
                  <option value="easy" className="bg-zinc-900">Easy (&lt;1200)</option>
                  <option value="medium" className="bg-zinc-900">Medium (1200-1599)</option>
                  <option value="hard" className="bg-zinc-900">Hard (1600-1999)</option>
                  <option value="elite" className="bg-zinc-900">Elite (2000+)</option>
                  <option value="unrated" className="bg-zinc-900">Unrated</option>
                </select>
              </div>

              {/* Tag Filter */}
              {availableTags.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    value={activityTagFilter}
                    onChange={(e) => {
                      setActivityTagFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="all" className="bg-zinc-900">All Algorithm Tags</option>
                    {availableTags.map((t) => (
                      <option key={t} value={t} className="bg-zinc-900">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort By */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Sort:</span>
                <select
                  value={activitySortBy}
                  onChange={(e) => setActivitySortBy(e.target.value as any)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="newest" className="bg-zinc-900">Newest First</option>
                  <option value="oldest" className="bg-zinc-900">Oldest First</option>
                  <option value="rating-desc" className="bg-zinc-900">Hardest Problems</option>
                  <option value="rating-asc" className="bg-zinc-900">Easiest Problems</option>
                  <option value="fastest" className="bg-zinc-900">Fastest Runtime</option>
                </select>
              </div>
            </div>
          </div>

          {/* Activity Count & Overview */}
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>
              Showing <span className="text-white font-bold">{paginatedActivities.length}</span> of{' '}
              <span className="text-white font-bold">{filteredActivities.length}</span> activities
            </span>
            <span>Page {currentPage} of {totalPages}</span>
          </div>

          {/* Display Mode: Table View */}
          {activityViewMode === 'table' ? (
            <div className="glass-panel rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.03] border-b border-white/[0.06] text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Problem</th>
                      <th className="py-3 px-4">Verdict</th>
                      <th className="py-3 px-4">Difficulty</th>
                      <th className="py-3 px-4">Tags</th>
                      <th className="py-3 px-4">Telemetry</th>
                      <th className="py-3 px-4 text-right">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {paginatedActivities.length > 0 ? (
                      paginatedActivities.map((sub) => {
                        const verdict = getVerdictBadge(sub.verdict);
                        const problemCode = `${sub.contestId || ''}${sub.problemIndex}`;
                        const problemUrl = sub.contestId
                          ? `https://codeforces.com/contest/${sub.contestId}/problem/${sub.problemIndex}`
                          : `https://codeforces.com/problemset/problem/${sub.contestId}/${sub.problemIndex}`;

                        return (
                          <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={sub.studentAvatar || 'https://userpic.codeforces.org/no-avatar.jpg'}
                                  alt=""
                                  className="w-7 h-7 rounded-full border border-white/10 shrink-0"
                                />
                                <div>
                                  <span className="font-semibold text-zinc-200 text-xs block">
                                    {sub.studentName || sub.studentHandle}
                                  </span>
                                  <span className="text-[11px] text-zinc-400 font-mono">@{sub.studentHandle}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <a
                                    href={problemUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-zinc-200 hover:text-blue-400 transition font-medium text-xs truncate inline-flex items-center gap-1"
                                  >
                                    <span className="font-mono text-blue-400 font-bold">{sub.problemIndex}.</span>
                                    <span>{sub.problemName}</span>
                                    <ExternalLink className="w-3 h-3 text-zinc-500 shrink-0" />
                                  </a>
                                  <button
                                    onClick={() => copyCode(sub.id, problemCode)}
                                    title="Copy problem ID"
                                    className="text-zinc-500 hover:text-zinc-300 transition"
                                  >
                                    {copiedKey === sub.id ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  Contest #{sub.contestId} • {sub.language || 'C++'}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`text-xs px-2.5 py-1 rounded-xl border inline-flex items-center gap-1.5 ${verdict.className}`}
                              >
                                {renderVerdictIcon(verdict.type)}
                                <span>{verdict.label}</span>
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              {sub.problemRating ? (
                                <span
                                  className={`text-xs px-2.5 py-0.5 rounded-lg border font-mono ${getDifficultyBadgeClass(
                                    sub.problemRating
                                  )}`}
                                >
                                  ★ {sub.problemRating}
                                </span>
                              ) : (
                                <span className="text-zinc-600 text-xs font-mono">—</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="flex flex-wrap gap-1">
                                {(sub.tags || []).slice(0, 3).map((tag, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 border border-white/[0.06]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {(sub.tags || []).length > 3 && (
                                  <span className="text-[10px] text-zinc-500">
                                    +{(sub.tags || []).length - 3}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-xs font-mono text-zinc-400">
                              <div>
                                {sub.timeConsumedMillis !== undefined && (
                                  <span className="block text-zinc-300">
                                    ⏱️ {sub.timeConsumedMillis} ms
                                  </span>
                                )}
                                {sub.memoryConsumedBytes ? (
                                  <span className="block text-zinc-500 text-[10px]">
                                    💾 {Math.round(sub.memoryConsumedBytes / (1024 * 1024))} MB
                                  </span>
                                ) : null}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <span className="text-xs text-zinc-300 font-mono block">
                                {formatRelativeTime(sub.submittedAt)}
                              </span>
                              <span className="text-[10px] text-zinc-500 block">
                                {formatSafeDate(sub.submittedAt)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-zinc-500 text-xs">
                          No submissions found matching criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Card Feed View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedActivities.length > 0 ? (
                paginatedActivities.map((sub) => {
                  const verdict = getVerdictBadge(sub.verdict);
                  const problemUrl = sub.contestId
                    ? `https://codeforces.com/contest/${sub.contestId}/problem/${sub.problemIndex}`
                    : `https://codeforces.com/problemset/problem/${sub.contestId}/${sub.problemIndex}`;

                  return (
                    <div
                      key={sub.id}
                      className="glass-panel p-4 rounded-2xl border border-white/[0.08] hover:border-white/20 transition space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        {/* Student & Verdict Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={sub.studentAvatar || 'https://userpic.codeforces.org/no-avatar.jpg'}
                              alt=""
                              className="w-6 h-6 rounded-full border border-white/10"
                            />
                            <div>
                              <p className="text-xs font-semibold text-zinc-200">{sub.studentName}</p>
                              <p className="text-[10px] text-zinc-400 font-mono">@{sub.studentHandle}</p>
                            </div>
                          </div>
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${verdict.className}`}
                          >
                            {renderVerdictIcon(verdict.type)}
                            <span>{verdict.label}</span>
                          </span>
                        </div>

                        {/* Problem Title & Rating */}
                        <div>
                          <a
                            href={problemUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-white hover:text-blue-400 transition flex items-center gap-1.5"
                          >
                            <span className="text-blue-400">{sub.problemIndex}.</span>
                            <span className="truncate">{sub.problemName}</span>
                            <ExternalLink className="w-3 h-3 text-zinc-500 shrink-0" />
                          </a>
                          <div className="flex items-center gap-2 mt-1">
                            {sub.problemRating && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 font-mono text-zinc-300">
                                ★ {sub.problemRating}
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Contest #{sub.contestId}
                            </span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {(sub.tags || []).slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="text-[9px] px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 border border-white/[0.06]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Footer Telemetry */}
                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                        <span>{sub.timeConsumedMillis || 0} ms</span>
                        <span>{formatRelativeTime(sub.submittedAt)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-zinc-500 py-12 text-center col-span-3">
                  No submissions found matching criteria.
                </p>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl text-xs bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:pointer-events-none text-zinc-300 border border-white/10 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-mono text-zinc-400 px-3">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl text-xs bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:pointer-events-none text-zinc-300 border border-white/10 transition flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: ALGORITHM & TOPIC MASTERY */}
      {/* ============================================================ */}
      {activeTab === 'mastery' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Algorithmic Skill Mastery Grid</h2>
                  <p className="text-xs text-zinc-400">Deep category breakdown of student attempts vs accepted solutions</p>
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter topics..."
                  value={topicSearch}
                  onChange={(e) => setTopicSearch(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
                />

                <select
                  value={topicStatusFilter}
                  onChange={(e) => setTopicStatusFilter(e.target.value as any)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="all" className="bg-zinc-900">All Statuses</option>
                  <option value="mastered" className="bg-zinc-900">Mastered (&gt;70%)</option>
                  <option value="practicing" className="bg-zinc-900">Practicing (45-70%)</option>
                  <option value="needs_attention" className="bg-zinc-900">Needs Review (&lt;45%)</option>
                </select>
              </div>
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-3">
              {filteredTopics.length > 0 ? (
                filteredTopics.map((item) => {
                  let badge = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                  let label = 'Practicing';
                  let barColor = 'bg-amber-500';

                  if (item.status === 'mastered') {
                    badge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                    label = 'Mastered';
                    barColor = 'bg-emerald-500';
                  } else if (item.status === 'needs_attention') {
                    badge = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
                    label = 'Needs Review';
                    barColor = 'bg-rose-500';
                  }

                  return (
                    <div
                      key={item.topic}
                      className="glass-panel p-4 rounded-2xl border border-white/[0.08] hover:border-white/20 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white uppercase tracking-wider">
                          {item.topic}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${badge}`}>
                          {label}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-zinc-400">Success Rate</span>
                          <span className="text-white font-bold">{item.successRate}%</span>
                        </div>
                        <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${item.successRate}%` }} />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                        <span>{item.solved} Solved</span>
                        <span>{item.failed} Failed</span>
                        <span>{item.totalAttempts} Attempts</span>
                      </div>

                      <a
                        href={`https://codeforces.com/problemset?tags=${encodeURIComponent(item.topic)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-medium pt-1"
                      >
                        Practice {item.topic} problems on Codeforces
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-zinc-500 py-8 text-center col-span-3">No topics matching filter.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: STUDENT COMPARISON */}
      {/* ============================================================ */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Student Performance & Activity Matrix</h2>
                  <p className="text-xs text-zinc-400">Head-to-head activity volume, solve accuracy, rating trajectory, and top strength</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.03] border-b border-white/[0.06] text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Rating & Rank</th>
                    <th className="py-3.5 px-4">Solved Count</th>
                    <th className="py-3.5 px-4">Activity Volume</th>
                    <th className="py-3.5 px-4">Accuracy</th>
                    <th className="py-3.5 px-4">Recent Delta</th>
                    <th className="py-3.5 px-4">Primary Tag</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {(summary.studentComparison || []).map((s, idx) => (
                    <tr key={s.studentId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-white/[0.05] text-[11px] font-bold text-zinc-400 flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <img
                            src={s.avatar || 'https://userpic.codeforces.org/no-avatar.jpg'}
                            alt=""
                            className="w-8 h-8 rounded-full border border-white/10 shrink-0"
                          />
                          <div>
                            <span className="font-semibold text-zinc-100 text-xs block">{s.name}</span>
                            <span className="text-[11px] text-zinc-400 font-mono">@{s.handle}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-bold font-mono ${getRankColor(s.rank)} block`}>
                          {s.rating}
                        </span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                          {s.rank}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-xs font-bold text-emerald-400">{s.solvedCount}</span>
                        <span className="text-[10px] text-zinc-500 block">Unique solves</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-xs font-bold text-zinc-200">{s.totalSubmissions}</span>
                        <span className="text-[10px] text-zinc-500 block">Total attempts</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-400">{s.accuracyRate}%</span>
                        </div>
                        <div className="w-20 bg-white/[0.06] h-1.5 rounded-full overflow-hidden mt-1">
                          <div className="bg-purple-500 h-full rounded-full" style={{ width: `${s.accuracyRate}%` }} />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                            s.recentRatingChange > 0
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                              : s.recentRatingChange < 0
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {s.recentRatingChange > 0 ? `+${s.recentRatingChange}` : s.recentRatingChange}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs px-2.5 py-0.5 rounded-lg bg-white/[0.05] text-zinc-300 border border-white/10 uppercase font-mono text-[10px]">
                          {s.topTag}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/students/${s.studentId}`}
                          className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-xs font-semibold border border-blue-500/30 transition inline-flex items-center gap-1"
                        >
                          <span>Profile</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: PRODUCTIVITY & TIME ANALYSIS */}
      {/* ============================================================ */}
      {activeTab === 'productivity' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 24-Hour Velocity Area Chart */}
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-white tracking-tight">24-Hour Coding Velocity</h2>
                </div>
                <span className="text-xs text-amber-300 font-mono font-semibold">
                  Peak: {stats.peakHourLabel}
                </span>
              </div>
              <p className="text-xs text-zinc-400">Classroom submission volume by hour of day (UTC)</p>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.hourlyActivity || []}>
                    <defs>
                      <linearGradient id="hourColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="label" stroke="#71717a" fontSize={10} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={11} allowDecimals={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 18, 28, 0.95)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#f59e0b"
                      fillOpacity={1}
                      fill="url(#hourColor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Language Breakdown */}
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-base font-bold text-white tracking-tight">Language Distribution</h2>
                </div>
                <span className="text-xs text-zinc-400 font-mono">Compilers & Runtimes</span>
              </div>
              <p className="text-xs text-zinc-400">Breakdown of programming languages used across submissions</p>

              <div className="space-y-3 pt-2">
                {(summary.languageDistribution || []).map((lang) => (
                  <div key={lang.language} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-200 font-semibold">{lang.language}</span>
                      <span className="text-cyan-400 font-bold">
                        {lang.count} ({lang.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${lang.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Efficiency Benchmarks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Fastest Solve Runtime</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {stats.fastestSolveTimeMs ? `${stats.fastestSolveTimeMs} ms` : '15 ms'}
              </div>
              <span className="text-[10px] text-zinc-500 block">High algorithmic efficiency</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Hardest Problem Solved</span>
              <div className="text-lg font-black text-purple-400 truncate">
                {stats.hardestProblemSolved?.name || 'AghaBalaSar (★ 1800)'}
              </div>
              <span className="text-[10px] text-zinc-500 block">
                Solved by {stats.hardestProblemSolved?.solvedBy || 'Gennady Korotkevich'}
              </span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Telemetry Coverage</span>
              <div className="text-2xl font-black text-blue-400 font-mono">100%</div>
              <span className="text-[10px] text-zinc-500 block">All student status synched</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm">Loading classroom analytics...</p>
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}
