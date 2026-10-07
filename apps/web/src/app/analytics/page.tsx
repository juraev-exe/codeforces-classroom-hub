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
  Download,
  Sparkles,
  Brain,
  Compass,
  Printer,
  Share2,
  HelpCircle,
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
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
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

type TabType = 'overview' | 'activities' | 'mastery' | 'students' | 'productivity' | 'ai-insights';

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';

  const [summary, setSummary] = useState<ClassSummary | null>(null);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selectedClass, setSelectedClass] = useState(initialClassId);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // AI Coach Intelligence State
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiHistory, setAiHistory] = useState<{ q: string; a: string; time: string }[]>([]);

  // Interactive Target Simulator State
  const [targetRating, setTargetRating] = useState<number>(1200);

  // Executive Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);

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
  const [exportOpen, setExportOpen] = useState(false);

  async function fetchAiInsights(prompt?: string) {
    try {
      setAiLoading(true);
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt || '' }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
        if (prompt) {
          setAiHistory((prev) => [
            { q: prompt, a: data.analysis, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            ...prev,
          ]);
          setAiQuery('');
        }
      }
    } catch (e) {
      console.error('AI error:', e);
    } finally {
      setAiLoading(false);
    }
  }

  function copyCode(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
    const escapeCsv = (val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const content = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\r\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportStudentSummary() {
    if (!summary?.studentComparison || summary.studentComparison.length === 0) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const headers = [
      'Name',
      'Codeforces Handle',
      'Current Rating',
      'Max Rating',
      'Rank Title',
      'Problems Solved',
      'Total Submissions',
      'Accuracy Rate (%)',
      'Recent Rating Change',
      'Top Skill',
      'Last Active',
    ];
    const rows = summary.studentComparison.map((s) => [
      s.name,
      s.handle,
      s.rating,
      s.maxRating || s.rating,
      s.rank,
      s.solvedCount,
      s.totalSubmissions,
      s.accuracyRate,
      s.recentRatingChange,
      s.topTag || 'General',
      s.lastActive || '—',
    ]);
    downloadCsv(`cf-students-telemetry-${dateStr}.csv`, headers, rows);
    setExportOpen(false);
  }

  function exportActivityLogs() {
    const activities = filteredActivities.length > 0 ? filteredActivities : summary?.recentActivity;
    if (!activities || activities.length === 0) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const headers = [
      'Timestamp',
      'Student Name',
      'Codeforces Handle',
      'Problem ID',
      'Problem Name',
      'Problem Rating',
      'Verdict',
      'Execution Time (ms)',
      'Tags',
    ];
    const rows = activities.map((s) => [
      s.submittedAt ? new Date(s.submittedAt).toISOString() : '—',
      s.studentName || '—',
      s.studentHandle || '—',
      s.contestId ? `${s.contestId}${s.problemIndex}` : (s.problemIndex || '—'),
      s.problemName || '—',
      s.problemRating || 'Unrated',
      s.verdict || '—',
      s.timeConsumedMillis ?? '—',
      (s.tags || []).join('; '),
    ]);
    downloadCsv(`cf-submissions-log-${dateStr}.csv`, headers, rows);
    setExportOpen(false);
  }

  function exportTopicMastery() {
    if (!summary?.topicStrengths || summary.topicStrengths.length === 0) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const headers = [
      'Topic / Tag',
      'Status',
      'Success Rate (%)',
      'Problems Solved',
      'Failed Attempts',
      'Total Submissions',
    ];
    const rows = summary.topicStrengths.map((t) => [
      t.topic,
      t.status,
      t.successRate,
      t.solved,
      t.failed,
      t.totalAttempts,
    ]);
    downloadCsv(`cf-topic-mastery-${dateStr}.csv`, headers, rows);
    setExportOpen(false);
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
    fetchAiInsights();
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
    <div className="space-y-7 pb-16 relative">
      {/* Ambient Frosted Glass Backlight Orbs */}
      <div className="absolute top-12 left-10 w-96 h-96 rounded-full glass-ambient-cyan blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-36 right-10 w-96 h-96 rounded-full glass-ambient-purple blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-96 left-1/3 w-96 h-96 rounded-full glass-ambient-emerald blur-3xl pointer-events-none -z-10" />

      {/* Top Header Card */}
      <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
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
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                AI Enhanced
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

          <div className="flex items-center gap-2.5 flex-wrap">
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
              onClick={() => {
                loadData();
                fetchAiInsights();
              }}
              className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 transition flex items-center gap-1.5 text-xs font-medium"
              title="Refresh telemetry and AI diagnosis"
            >
              <RefreshCw className={`w-4 h-4 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setReportModalOpen(true)}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 text-blue-200 hover:text-white border border-blue-500/30 transition flex items-center gap-1.5 text-xs font-semibold shadow-lg shadow-blue-500/10"
              title="Generate shareable and printable Executive Briefing"
            >
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Executive Report</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setExportOpen((prev) => !prev)}
                className="p-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/20 transition flex items-center gap-1.5 text-xs font-medium"
                title="Export telemetry data as CSV"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <AnimatePresence>
                {exportOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setExportOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 mt-2 w-64 glass-panel bg-zinc-950/95 border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 space-y-0.5 backdrop-blur-xl origin-top-right"
                    >
                      <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Download CSV Reports
                      </div>
                      <button
                        onClick={exportStudentSummary}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/[0.08] transition flex items-center justify-between"
                      >
                        <span>Student Roster & Stats</span>
                        <span className="text-[10px] text-zinc-400 font-mono">.csv</span>
                      </button>
                      <button
                        onClick={exportActivityLogs}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/[0.08] transition flex items-center justify-between"
                      >
                        <span>Submissions Activity Log</span>
                        <span className="text-[10px] text-zinc-400 font-mono">.csv</span>
                      </button>
                      <button
                        onClick={exportTopicMastery}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/[0.08] transition flex items-center justify-between"
                      >
                        <span>Topic Mastery Diagnostic</span>
                        <span className="text-[10px] text-zinc-400 font-mono">.csv</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
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

      {/* Primary KPI Grid with Glassmorphic Interactive Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Average Rating */}
        <div className="glass-card-interactive p-4 rounded-2xl space-y-1 group">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block group-hover:text-blue-300 transition-colors">Average Rating</span>
          <div className="text-2xl font-black text-blue-400 font-mono tracking-tight">{summary.averageRating}</div>
          <span className="text-[10px] text-zinc-500 font-mono block">Median: {summary.medianRating}</span>
        </div>

        {/* Total Solved */}
        <div className="glass-card-interactive p-4 rounded-2xl space-y-1 group">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block group-hover:text-emerald-300 transition-colors">Total Solved</span>
          <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">{summary.totalSolvedProblems}</div>
          <span className="text-[10px] text-zinc-500 font-mono block">~{summary.averageSolvedProblems} / student</span>
        </div>

        {/* Class Accuracy */}
        <div className="glass-card-interactive p-4 rounded-2xl space-y-1 group">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block group-hover:text-purple-300 transition-colors">Solve Accuracy</span>
          <div className="text-2xl font-black text-purple-400 font-mono tracking-tight">{stats.accuracyRate}%</div>
          <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full" style={{ width: `${stats.accuracyRate}%` }} />
          </div>
        </div>

        {/* Active Days */}
        <div className="glass-card-interactive p-4 rounded-2xl space-y-1 group">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block group-hover:text-amber-300 transition-colors">Active Coding Days</span>
          <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">{stats.activeCodersStreak}</div>
          <span className="text-[10px] text-zinc-500 font-mono block">Last 84 days</span>
        </div>

        {/* Rating Range */}
        <div className="glass-card-interactive p-4 rounded-2xl space-y-1 group">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block group-hover:text-cyan-300 transition-colors">Peak Rating</span>
          <div className="text-2xl font-black text-cyan-400 font-mono tracking-tight">{summary.highestRating}</div>
          <span className="text-[10px] text-zinc-500 font-mono block">Floor: {summary.lowestRating}</span>
        </div>

        {/* Contests Logged */}
        <div className="glass-card-interactive p-4 rounded-2xl space-y-1 group">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block group-hover:text-rose-300 transition-colors">Contests Logged</span>
          <div className="text-2xl font-black text-rose-400 font-mono tracking-tight">{summary.totalContestsParticipated}</div>
          <span className="text-[10px] text-zinc-500 font-mono block">Across all members</span>
        </div>
      </div>

      {/* Classroom Seasonal Milestone Trajectory Meter */}
      <div className="glass-panel-elevated p-5 sm:p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Classroom Milestone Trajectory
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">Active Season 2026</span>
              </h3>
              <p className="text-[11px] text-zinc-400">Live progress towards classroom seasonal objectives</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>Overall Completion:</span>
            <span className="text-amber-400 font-bold font-mono">
              {Math.min(100, Math.round(((summary.totalSolvedProblems / 1000) * 0.5 + ((summary.activeStudents / Math.max(1, summary.totalStudents)) * 0.5)) * 100))}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Milestone 1: 1,000 Solved Problems */}
          <div className="glass-card p-4 rounded-2xl space-y-2 border border-white/[0.08]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                1,000 Solved Target
              </span>
              <span className="text-emerald-400 font-mono font-bold">
                {summary.totalSolvedProblems} / 1000
              </span>
            </div>
            <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (summary.totalSolvedProblems / 1000) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              {Math.max(0, 1000 - summary.totalSolvedProblems)} problems remaining to unlock Milestone 1
            </p>
          </div>

          {/* Milestone 2: 100% Active Coder Cohort */}
          <div className="glass-card p-4 rounded-2xl space-y-2 border border-white/[0.08]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Active Solver Cohort
              </span>
              <span className="text-blue-400 font-mono font-bold">
                {summary.activeStudents} / {summary.totalStudents} ({Math.round((summary.activeStudents / Math.max(1, summary.totalStudents)) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (summary.activeStudents / Math.max(1, summary.totalStudents)) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              {summary.totalStudents - summary.activeStudents === 0 ? 'All members active this week!' : `${summary.totalStudents - summary.activeStudents} members pending contest check-in`}
            </p>
          </div>

          {/* Milestone 3: Class Average Rating -> Pupil (1200) */}
          <div className="glass-card p-4 rounded-2xl space-y-2 border border-white/[0.08]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-purple-400" />
                Pupil Tier Target (1200)
              </span>
              <span className="text-purple-400 font-mono font-bold">
                {summary.averageRating} / 1200
              </span>
            </div>
            <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (summary.averageRating / 1200) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              {Math.max(0, 1200 - summary.averageRating)} rating points needed to attain cohort Pupil badge
            </p>
          </div>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl glass-panel-elevated border border-white/[0.08] overflow-x-auto custom-scrollbar">
        {[
          { id: 'overview' as const, label: 'Executive Overview', icon: BarChart3 },
          { id: 'ai-insights' as const, label: 'AI Coach Intelligence', icon: Sparkles },
          { id: 'activities' as const, label: 'Activity Stream & Explorer', icon: Activity, count: summary.recentActivity?.length || 0 },
          { id: 'mastery' as const, label: 'Algorithm & Topic Mastery', icon: Target },
          { id: 'students' as const, label: 'Student Comparison', icon: Users },
          { id: 'productivity' as const, label: 'Productivity & Velocity', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                isActive ? 'text-white' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeAnalyticsTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30"
                  transition={{ type: 'spring', duration: 0.25, bounce: 0.15 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className={`w-4 h-4 ${tab.id === 'ai-insights' ? 'text-amber-300' : ''}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-zinc-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >

      {/* ============================================================ */}
      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {/* ============================================================ */}
      {activeTab === 'overview' && (
        <div className="space-y-7">
          {/* AI Coach Classroom Intelligence Briefing */}
          <div className="glass-panel-elevated p-6 sm:p-7 rounded-3xl shadow-2xl relative overflow-hidden space-y-5 border border-purple-500/20">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white tracking-tight">AI Coach Classroom Intelligence</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      Live Telemetry Synthesis
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">Automated diagnostic briefing on cohort momentum, algorithmic gaps, and contest readiness</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchAiInsights()}
                  disabled={aiLoading}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                  <span>Re-analyze</span>
                </button>
                <button
                  onClick={() => setActiveTab('ai-insights')}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <span>Full AI Cockpit</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* AI Analysis Content Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-md space-y-3">
              {aiLoading && !aiAnalysis ? (
                <div className="flex items-center gap-3 py-6 justify-center text-zinc-400 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                  <span>Synthesizing classroom telemetry and submission trajectories...</span>
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-line font-sans">
                  {aiAnalysis || "Classroom telemetry synchronized. Average rating stands at " + summary.averageRating + " with " + summary.totalSolvedProblems + " total problems solved."}
                </div>
              )}
            </div>

            {/* Quick Interactive Prompt Bar */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                <span className="text-[10px] uppercase font-bold text-zinc-500 shrink-0">Quick Queries:</span>
                {[
                  'How to improve Dynamic Programming accuracy?',
                  'Who needs immediate 1-on-1 mentoring?',
                  'Recommended drill set for upcoming contest',
                  'Which students are closest to Pupil ranking?',
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => {
                      setAiQuery(promptText);
                      fetchAiInsights(promptText);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-zinc-300 whitespace-nowrap transition flex items-center gap-1 shrink-0"
                  >
                    <span>{promptText}</span>
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (aiQuery.trim()) {
                    fetchAiInsights(aiQuery);
                  }
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="Ask AI Coach a question about classroom performance, students, or topic drills..."
                    className="w-full pl-3 pr-8 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50"
                  />
                  {aiQuery && (
                    <button
                      type="button"
                      onClick={() => setAiQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={aiLoading || !aiQuery.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask Coach</span>
                </button>
              </form>
            </div>
          </div>

          {/* Interactive Classroom Target & Rating Simulator */}
          <div className="glass-panel-elevated p-6 sm:p-7 rounded-3xl shadow-2xl space-y-5 border border-cyan-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white tracking-tight">Classroom Target & Rating Simulator</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      Interactive Projector
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">Simulate rating milestones, point deficits, and estimated contests required</p>
                </div>
              </div>

              {/* Target Selector Buttons */}
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/10">
                {[
                  { rating: 1000, label: '1000 ★' },
                  { rating: 1200, label: '1200 Pupil' },
                  { rating: 1400, label: '1400 Specialist' },
                  { rating: 1600, label: '1600 Expert' },
                ].map((tier) => (
                  <button
                    key={tier.rating}
                    onClick={() => setTargetRating(tier.rating)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      targetRating === tier.rating
                        ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulator Output Metrics */}
            {(() => {
              const studentsList = summary.studentComparison || [];
              const studentsBelow = studentsList.filter((s) => s.rating < targetRating);
              const studentsAtOrAbove = studentsList.filter((s) => s.rating >= targetRating);
              const totalDeficit = studentsBelow.reduce((acc, s) => acc + (targetRating - s.rating), 0);
              const avgDeficit = studentsList.length > 0 ? Math.round(totalDeficit / studentsList.length) : 0;
              const estimatedContests = Math.max(1, Math.ceil(avgDeficit / 65));

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Target Tier</span>
                      <div className="text-xl font-black text-cyan-400 font-mono">{targetRating} Rating</div>
                      <span className="text-[10px] text-zinc-500">Benchmark goal</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Qualified Members</span>
                      <div className="text-xl font-black text-emerald-400 font-mono">
                        {studentsAtOrAbove.length} / {studentsList.length}
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {studentsList.length > 0 ? Math.round((studentsAtOrAbove.length / studentsList.length) * 100) : 0}% achieved
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Cohort Deficit</span>
                      <div className="text-xl font-black text-amber-400 font-mono">+{totalDeficit} pts</div>
                      <span className="text-[10px] text-zinc-500">~{avgDeficit} pts / student</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Estimated Rounds</span>
                      <div className="text-xl font-black text-purple-400 font-mono">~{estimatedContests} Contests</div>
                      <span className="text-[10px] text-zinc-500">At +65 pts / round pace</span>
                    </div>
                  </div>

                  {/* Student Proximity Meters */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
                    <div className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                      <span>Student Proximity to {targetRating} Target</span>
                      <span className="text-[10px] text-zinc-500 font-mono">Ranked by closest to target</span>
                    </div>
                    <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                      {studentsList
                        .slice()
                        .sort((a, b) => b.rating - a.rating)
                        .map((s) => {
                          const pct = Math.min(100, Math.round((s.rating / targetRating) * 100));
                          const pointsToTarget = Math.max(0, targetRating - s.rating);
                          const isAchieved = s.rating >= targetRating;

                          return (
                            <div key={s.handle} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-mono">
                                <span className="font-semibold text-zinc-200">
                                  {s.name}{' '}
                                  <span className="text-zinc-500 font-normal">(@{s.handle})</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-bold">{s.rating}</span>
                                  {isAchieved ? (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                                      ✓ Achieved
                                    </span>
                                  ) : (
                                    <span className="text-amber-400 text-[10px]">
                                      +{pointsToTarget} pts
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isAchieved
                                      ? 'bg-emerald-400'
                                      : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

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
          {/* Multi-Student Rating Evolution Chart */}
          {(summary as any).ratingEvolution && (summary as any).ratingEvolution.length > 0 && (
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Historical Rating Evolution Trajectory
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Comparative multi-student rating growth curves across official Codeforces contest rounds
                    </p>
                  </div>
                </div>

                {/* Legend badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {((summary as any).studentCurves || []).map((sc: any) => (
                    <div
                      key={sc.handle}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/10 flex items-center gap-2 font-mono text-[11px]"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: sc.color }}
                      />
                      <span className="text-zinc-200">@{sc.handle}</span>
                      <span className="text-zinc-400">({sc.rating})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(summary as any).ratingEvolution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="date"
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#71717a"
                      fontSize={11}
                      domain={['auto', 'auto']}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 18, 28, 0.95)',
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                        borderRadius: '14px',
                        backdropFilter: 'blur(12px)',
                        fontSize: '12px',
                      }}
                      labelFormatter={(label, payload) => {
                        const contest = payload?.[0]?.payload?.contestName;
                        return contest ? `${contest} (${label})` : label;
                      }}
                    />
                    {((summary as any).studentCurves || []).map((sc: any) => (
                      <Line
                        key={sc.handle}
                        type="monotone"
                        dataKey={sc.handle}
                        name={`@${sc.handle}`}
                        stroke={sc.color}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: sc.color }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

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

      {/* ============================================================ */}
      {/* TAB 6: AI COACH COCKPIT & TELEMETRY INTELLIGENCE */}
      {/* ============================================================ */}
      {activeTab === 'ai-insights' && (
        <div className="space-y-7">
          {/* Top AI Strategic Banner */}
          <div className="glass-panel-elevated p-6 sm:p-8 rounded-3xl relative overflow-hidden space-y-5 border border-purple-500/30">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/30 shrink-0">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white tracking-tight">AI Coach Telemetry Cockpit</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      Active AI Advisor
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">Deep telemetry diagnostics, student intervention triggers, and algorithmic drill sets</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => fetchAiInsights()}
                  disabled={aiLoading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh AI Synthesis</span>
                </button>
              </div>
            </div>

            {/* AI Diagnosis Report Box */}
            <div className="p-5 rounded-2xl bg-black/50 border border-white/[0.08] backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-xs">
                <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Live Classroom Diagnostic Briefing
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Updated just now</span>
              </div>
              <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-line font-sans">
                {aiLoading && !aiAnalysis ? (
                  <div className="flex items-center gap-3 py-8 justify-center text-zinc-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
                    <span>Analyzing submission velocity, error distributions, and topic mastery...</span>
                  </div>
                ) : (
                  aiAnalysis || 'Classroom telemetry synchronized. All students active.'
                )}
              </div>
            </div>
          </div>

          {/* Interactive AI Coaching Assistant Console */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Interactive Q&A Console */}
            <div className="lg:col-span-2 glass-panel-elevated p-6 rounded-3xl space-y-5 border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Interactive Coach Console</h3>
                    <p className="text-[11px] text-zinc-400">Ask algorithmic questions, request personalized student advice, or design contest drills</p>
                  </div>
                </div>
              </div>

              {/* Preset Query Badges */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {[
                  'Which students are struggling most with Time Limit Exceeded (TLE)?',
                  'Suggest 3 practice problems to prepare for Div 3 Problem C',
                  'How to explain Dynamic Programming memoization simply?',
                  'Who has the highest solve velocity this month?',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setAiQuery(q);
                      fetchAiInsights(q);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-zinc-300 hover:text-white transition whitespace-nowrap shrink-0 flex items-center gap-1.5"
                  >
                    <span>{q}</span>
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (aiQuery.trim()) {
                    fetchAiInsights(aiQuery);
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Ask Coach AI anything about classroom performance or contest drills..."
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiQuery.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Submit</span>
                </button>
              </form>

              {/* Q&A Thread History */}
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Coaching Conversation Log ({aiHistory.length})
                </div>
                {aiHistory.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center text-xs text-zinc-500">
                    No custom questions asked yet. Click any suggested prompt above or type your question!
                  </div>
                ) : (
                  aiHistory.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-purple-300 font-mono">Q: {item.q}</span>
                        <span className="text-[10px] text-zinc-500">{item.time}</span>
                      </div>
                      <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line pl-2 border-l-2 border-purple-500/50">
                        {item.a}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Col: Student Intervention & Tactical Drill Box */}
            <div className="space-y-6">
              {/* Student Intervention Triggers */}
              <div className="glass-panel-elevated p-6 rounded-3xl space-y-4 border border-rose-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Coach Attention Flags</h3>
                    <p className="text-[10px] text-zinc-400">Students needing motivation or guidance</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {(summary.studentComparison || [])
                    .slice()
                    .filter((s) => s.accuracyRate < 50 || s.solvedCount < 10)
                    .slice(0, 4)
                    .map((s) => (
                      <div key={s.handle} className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-200">{s.name}</span>
                          <span className="text-rose-400 font-mono text-[10px]">{s.accuracyRate}% accuracy</span>
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          {s.solvedCount} problems solved • Recommend starting with 800-rated implementation problems.
                        </p>
                      </div>
                    ))}
                  {(summary.studentComparison || []).filter((s) => s.accuracyRate < 50 || s.solvedCount < 10).length === 0 && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 text-center">
                      ✓ No at-risk student flags. Entire classroom is pacing well!
                    </div>
                  )}
                </div>
              </div>

              {/* Recommended CP Practice Drills */}
              <div className="glass-panel-elevated p-6 rounded-3xl space-y-4 border border-emerald-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Curated Topic Drills</h3>
                    <p className="text-[10px] text-zinc-400">Recommended for upcoming Codeforces round</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { topic: 'Dynamic Programming', name: 'Cut Ribbon (189A)', rating: 1300, link: 'https://codeforces.com/problemset/problem/189/A' },
                    { topic: 'Greedy & Sorting', name: 'Chat room (58A)', rating: 1000, link: 'https://codeforces.com/problemset/problem/58/A' },
                    { topic: 'Binary Search', name: 'Interesting drink (706B)', rating: 1100, link: 'https://codeforces.com/problemset/problem/706/B' },
                  ].map((drill) => (
                    <a
                      key={drill.name}
                      href={drill.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-between text-xs transition group block"
                    >
                      <div>
                        <span className="font-semibold text-zinc-200 group-hover:text-emerald-300 block">{drill.name}</span>
                        <span className="text-[10px] text-zinc-500">{drill.topic}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                        ★ {drill.rating}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </motion.div>
      </AnimatePresence>

      {/* ============================================================ */}
      {/* EXECUTIVE REPORT MODAL (PRINTABLE & SHAREABLE) */}
      {/* ============================================================ */}
      <AnimatePresence>
        {reportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-4xl glass-panel-elevated p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20 space-y-6 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Classroom Executive Telemetry Briefing</h2>
                    <p className="text-xs text-zinc-400">
                      Algorithms & Competitive Programming 2026 • Coach Abubakr Juraev
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setReportModalOpen(false)}
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-zinc-400 hover:text-white transition"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Body Content */}
              <div className="space-y-6 print:space-y-4 text-zinc-200 text-xs">
                {/* Highlights Table */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Average Rating</span>
                    <div className="text-xl font-bold text-blue-400 font-mono">{summary.averageRating}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total Solved</span>
                    <div className="text-xl font-bold text-emerald-400 font-mono">{summary.totalSolvedProblems}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Solve Accuracy</span>
                    <div className="text-xl font-bold text-purple-400 font-mono">{stats.accuracyRate}%</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Active Solvers</span>
                    <div className="text-xl font-bold text-amber-400 font-mono">
                      {summary.activeStudents} / {summary.totalStudents}
                    </div>
                  </div>
                </div>

                {/* AI Executive Assessment */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    AI Diagnostic Summary
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                    {aiAnalysis || 'Classroom active and progressing on schedule.'}
                  </p>
                </div>

                {/* Student Roster Standings Table */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                    Student Roster Standings ({summary.studentComparison?.length || 0})
                  </span>
                  <div className="rounded-2xl border border-white/10 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/[0.05] text-[10px] font-bold uppercase text-zinc-400">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Student</th>
                          <th className="py-2.5 px-3">Rating</th>
                          <th className="py-2.5 px-3">Solved</th>
                          <th className="py-2.5 px-3">Accuracy</th>
                          <th className="py-2.5 px-3">Top Skill</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05] font-mono">
                        {(summary.studentComparison || []).map((s, idx) => (
                          <tr key={s.handle} className="hover:bg-white/[0.02]">
                            <td className="py-2 px-3 text-zinc-500">#{idx + 1}</td>
                            <td className="py-2 px-3 font-sans font-semibold text-zinc-200">
                              {s.name} <span className="text-zinc-500 font-mono text-[10px]">(@{s.handle})</span>
                            </td>
                            <td className={`py-2 px-3 font-bold ${getRankColor(s.rank)}`}>{s.rating}</td>
                            <td className="py-2 px-3 text-emerald-400">{s.solvedCount}</td>
                            <td className="py-2 px-3 text-purple-400">{s.accuracyRate}%</td>
                            <td className="py-2 px-3 font-sans text-zinc-400 text-[10px]">{s.topTag}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-[11px] text-zinc-500 font-mono">
                  Report generated on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const md =
                        `# Classroom Executive Telemetry Report\n` +
                        `*Date:* ${new Date().toLocaleDateString()}\n` +
                        `*Coach:* Abubakr Juraev\n` +
                        `*Average Rating:* ${summary.averageRating}\n` +
                        `*Total Solved:* ${summary.totalSolvedProblems}\n` +
                        `*Accuracy:* ${stats.accuracyRate}%\n\n` +
                        `## Diagnostic Assessment\n${aiAnalysis}\n\n` +
                        `## Student Standings\n` +
                        (summary.studentComparison || [])
                          .map((s, i) => `${i + 1}. **${s.name}** (@${s.handle}) - Rating: ${s.rating}, Solved: ${s.solvedCount}`)
                          .join('\n');
                      navigator.clipboard.writeText(md);
                      setReportCopied(true);
                      setTimeout(() => setReportCopied(false), 2000);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-xs font-semibold text-zinc-200 hover:text-white transition flex items-center gap-1.5"
                  >
                    {reportCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{reportCopied ? 'Copied Markdown!' : 'Copy Markdown'}</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-lg shadow-blue-600/30"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
