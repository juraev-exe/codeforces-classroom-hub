'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Trophy,
  RefreshCw,
  Filter,
  ArrowUpRight,
  Award,
  Crown,
  Medal,
  TrendingUp,
  TrendingDown,
  Code2,
  Calendar,
  User,
  Zap,
  GraduationCap,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Download,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { getRankColor, getRankBadgeClass } from '@/lib/cf-utils';
import type { LeaderboardEntry, Classroom, LeaderboardMetric, DensityMode } from '@cf-hub/types';

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40' width='40' height='40'><rect width='40' height='40' rx='12' fill='%231e293b'/><circle cx='20' cy='15' r='6' fill='%2364748b'/><path d='M10 32c0-5 4.5-8 10-8s10 3 10 8' fill='%2364748b'/></svg>";

function LeaderboardContent() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selectedClass, setSelectedClass] = useState(initialClassId);
  const [loading, setLoading] = useState(true);

  // Customization & Ranking Controls
  const [metric, setMetric] = useState<LeaderboardMetric>('rating');
  const [includeUnrated, setIncludeUnrated] = useState<boolean>(true);
  const [density, setDensity] = useState<DensityMode>('comfortable');
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);

  async function loadData() {
    try {
      setLoading(true);
      const url = selectedClass ? `/api/classes/${selectedClass}/leaderboard` : '/api/leaderboard';
      const [lbData, classesData, settingsRes] = await Promise.all([
        fetchApi<LeaderboardEntry[]>(url),
        fetchApi<Classroom[]>('/api/classes'),
        fetch('/api/settings').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      setLeaderboard(Array.isArray(lbData) ? lbData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);

      if (settingsRes?.settings) {
        if (settingsRes.settings.leaderboardRankingMetric) {
          setMetric(settingsRes.settings.leaderboardRankingMetric);
        }
        if (typeof settingsRes.settings.showUnratedInLeaderboard === 'boolean') {
          setIncludeUnrated(settingsRes.settings.showUnratedInLeaderboard);
        }
        if (settingsRes.settings.densityMode) {
          setDensity(settingsRes.settings.densityMode);
        }
        if (typeof settingsRes.settings.minRatingFilter === 'number') {
          setMinRatingFilter(settingsRes.settings.minRatingFilter);
        }
      }
    } catch (err: any) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedClass]);

  // Dynamically filter, sort, and assign ranks according to active metric
  const rankedLeaderboard = useMemo(() => {
    let list = [...leaderboard];

    // Filter unrated
    if (!includeUnrated) {
      list = list.filter((item) => item.rating > 0);
    }

    // Filter minimum rating
    if (minRatingFilter > 0) {
      list = list.filter((item) => (item.rating || 0) >= minRatingFilter);
    }

    // Sort according to metric
    list.sort((a, b) => {
      if (metric === 'solved') {
        if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
        return (b.rating || 0) - (a.rating || 0);
      }
      if (metric === 'contests') {
        if (b.contestCount !== a.contestCount) return b.contestCount - a.contestCount;
        return (b.rating || 0) - (a.rating || 0);
      }
      // Default: rating
      if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
      return b.solvedCount - a.solvedCount;
    });

    return list.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [leaderboard, metric, includeUnrated, minRatingFilter]);

  function handleExportCSV() {
    if (rankedLeaderboard.length === 0) return;
    const headers = ['Rank', 'Name', 'Handle', 'Class', 'Rating', 'Rank Tier', 'Solved', 'Contests', 'Delta'];
    const rows = rankedLeaderboard.map((item) => [
      item.rank,
      `"${item.name.replace(/"/g, '""')}"`,
      item.handle,
      `"${item.className.replace(/"/g, '""')}"`,
      item.rating || 0,
      item.rankTitle,
      item.solvedCount,
      item.contestCount,
      item.recentRatingChange || 0,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leaderboard_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  const top3 = rankedLeaderboard.slice(0, 3);

  return (
    <div className="space-y-7">
      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/[0.08] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Official Standings
              </span>
              <span className="text-xs text-zinc-400">
                Sorted by {metric === 'rating' ? 'Codeforces Rating' : metric === 'solved' ? 'Problems Solved' : 'Contests Attended'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Trophy className="w-7 h-7 text-amber-400" />
              Classroom Leaderboard
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Competitive programming standings calculated from live Codeforces ratings, problem solve counts, and contest deltas.
            </p>
          </div>

          {/* Filter by class */}
          <div className="flex items-center gap-3">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 transition-all"
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

        {/* Customization & Metric Selector Control Bar */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-2 bg-white/[0.03] p-1 rounded-2xl border border-white/[0.08]">
            {[
              { id: 'rating' as LeaderboardMetric, label: 'Rating', icon: Zap },
              { id: 'solved' as LeaderboardMetric, label: 'Solved Problems', icon: CheckCircle2 },
              { id: 'contests' as LeaderboardMetric, label: 'Contests', icon: Trophy },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = metric === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMetric(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Secondary Controls: Unrated toggle & UI Density */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIncludeUnrated(!includeUnrated)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                includeUnrated
                  ? 'bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/[0.08]'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              }`}
              title="Toggle unrated coders"
            >
              {includeUnrated ? <Eye className="w-3.5 h-3.5 text-zinc-400" /> : <EyeOff className="w-3.5 h-3.5 text-amber-400" />}
              <span>{includeUnrated ? 'Unrated: Shown' : 'Unrated: Hidden'}</span>
            </button>

            <button
              type="button"
              onClick={() => setDensity(density === 'comfortable' ? 'compact' : 'comfortable')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 transition flex items-center gap-1.5"
              title="Toggle density"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              <span>{density === 'compact' ? 'Compact' : 'Comfortable'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 border border-amber-500/30 text-amber-300 transition flex items-center gap-1.5 shadow-sm shadow-amber-500/10"
              title="Download Leaderboard as CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {!loading && top3.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Rank 2 (Silver) */}
          <div className="glass-card rounded-3xl p-6 border border-slate-400/20 shadow-xl flex flex-col items-center text-center relative overflow-hidden order-2 md:order-1">
            <div className="absolute top-3 left-3 flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-slate-400/10 border border-slate-400/30 px-2 py-0.5 rounded-lg">
              <Award className="w-3.5 h-3.5 text-slate-300" /> 2nd
            </div>
            <img
              src={top3[1].avatar ? (top3[1].avatar.startsWith('//') ? `https:${top3[1].avatar}` : top3[1].avatar) : DEFAULT_AVATAR}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).onerror = null;
                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
              }}
              alt={top3[1].handle}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-400/30 bg-black/40 shadow-lg mt-4"
            />
            <Link
              href={`/students/${top3[1].studentId}`}
              className="font-bold text-base text-zinc-100 hover:text-blue-400 transition mt-3"
            >
              {top3[1].name}
            </Link>
            <span className={`text-xs font-mono font-medium ${getRankColor(top3[1].rankTitle)}`}>
              @{top3[1].handle}
            </span>
            <div className="mt-4 pt-3 border-t border-white/[0.06] w-full flex items-center justify-around text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Rating</span>
                <span className={`font-bold font-mono text-sm ${getRankColor(top3[1].rankTitle)}`}>
                  {top3[1].rating || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Solved</span>
                <span className="font-bold font-mono text-sm text-zinc-200">
                  {top3[1].solvedCount}
                </span>
              </div>
            </div>
          </div>

          {/* Rank 1 (Gold - Champion) */}
          <div className="glass-card rounded-3xl p-6 border border-amber-500/30 shadow-2xl shadow-amber-500/10 flex flex-col items-center text-center relative overflow-hidden order-1 md:order-2 bg-gradient-to-b from-amber-500/[0.07] to-transparent">
            <div className="absolute top-3 left-3 flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-lg">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> 1st Champion
            </div>
            <img
              src={top3[0].avatar ? (top3[0].avatar.startsWith('//') ? `https:${top3[0].avatar}` : top3[0].avatar) : DEFAULT_AVATAR}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).onerror = null;
                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
              }}
              alt={top3[0].handle}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400/50 bg-black/40 shadow-xl shadow-amber-500/20 mt-4 ring-4 ring-amber-400/10"
            />
            <Link
              href={`/students/${top3[0].studentId}`}
              className="font-bold text-lg text-white hover:text-amber-300 transition mt-3"
            >
              {top3[0].name}
            </Link>
            <span className={`text-xs font-mono font-medium ${getRankColor(top3[0].rankTitle)}`}>
              @{top3[0].handle}
            </span>
            <div className="mt-4 pt-3 border-t border-amber-500/20 w-full flex items-center justify-around text-xs">
              <div>
                <span className="text-[10px] text-amber-300/70 block uppercase font-semibold">Rating</span>
                <span className={`font-bold font-mono text-base ${getRankColor(top3[0].rankTitle)}`}>
                  {top3[0].rating || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-amber-300/70 block uppercase font-semibold">Solved</span>
                <span className="font-bold font-mono text-base text-zinc-100">
                  {top3[0].solvedCount}
                </span>
              </div>
            </div>
          </div>

          {/* Rank 3 (Bronze) */}
          <div className="glass-card rounded-3xl p-6 border border-amber-700/30 shadow-xl flex flex-col items-center text-center relative overflow-hidden order-3">
            <div className="absolute top-3 left-3 flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-700/10 border border-amber-700/30 px-2 py-0.5 rounded-lg">
              <Medal className="w-3.5 h-3.5 text-amber-600" /> 3rd
            </div>
            <img
              src={top3[2].avatar ? (top3[2].avatar.startsWith('//') ? `https:${top3[2].avatar}` : top3[2].avatar) : DEFAULT_AVATAR}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).onerror = null;
                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
              }}
              alt={top3[2].handle}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-700/40 bg-black/40 shadow-lg mt-4"
            />
            <Link
              href={`/students/${top3[2].studentId}`}
              className="font-bold text-base text-zinc-100 hover:text-blue-400 transition mt-3"
            >
              {top3[2].name}
            </Link>
            <span className={`text-xs font-mono font-medium ${getRankColor(top3[2].rankTitle)}`}>
              @{top3[2].handle}
            </span>
            <div className="mt-4 pt-3 border-t border-white/[0.06] w-full flex items-center justify-around text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Rating</span>
                <span className={`font-bold font-mono text-sm ${getRankColor(top3[2].rankTitle)}`}>
                  {top3[2].rating || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Solved</span>
                <span className="font-bold font-mono text-sm text-zinc-200">
                  {top3[2].solvedCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="glass-panel rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
            <p className="text-xs font-medium">Calculating official standings...</p>
          </div>
        ) : rankedLeaderboard.length === 0 ? (
          <div className="p-16 text-center text-zinc-400 space-y-2">
            <Trophy className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-sm font-medium text-zinc-300">No students found matching current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] border-b border-white/[0.06] text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className={`px-5 ${density === 'compact' ? 'py-2.5' : 'py-3.5'}`}>
                    <span className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-400" /> Rank
                    </span>
                  </th>
                  <th className={`px-4 ${density === 'compact' ? 'py-2.5' : 'py-3.5'}`}>
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" /> Student
                    </span>
                  </th>
                  <th className={`px-4 ${density === 'compact' ? 'py-2.5' : 'py-3.5'}`}>
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> Class
                    </span>
                  </th>
                  <th className={`px-4 ${density === 'compact' ? 'py-2.5' : 'py-3.5'} ${metric === 'rating' ? 'bg-amber-500/5 text-amber-300' : ''}`}>
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Rating {metric === 'rating' ? '★' : ''}
                    </span>
                  </th>
                  <th className={`px-4 ${density === 'compact' ? 'py-2.5' : 'py-3.5'}`}>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Rank Tier
                    </span>
                  </th>
                  <th className={`px-4 ${density === 'compact' ? 'py-2.5' : 'py-3.5'} ${metric === 'solved' ? 'bg-purple-500/5 text-purple-300' : ''}`}>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Solved {metric === 'solved' ? '★' : ''}
                    </span>
                  </th>
                  <th className={`px-4 ${density === 'compact' ? 'py-2.5' : 'py-3.5'} ${metric === 'contests' ? 'bg-amber-500/5 text-amber-300' : ''}`}>
                    <span className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" /> Contests {metric === 'contests' ? '★' : ''}
                    </span>
                  </th>
                  <th className={`px-5 text-right ${density === 'compact' ? 'py-2.5' : 'py-3.5'}`}>
                    <span className="flex items-center justify-end gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Contest Delta
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {rankedLeaderboard.map((item) => (
                  <tr key={item.studentId} className="hover:bg-white/[0.02] transition-colors group">
                    <td className={`px-5 ${density === 'compact' ? 'py-2.5' : 'py-4'}`}>
                      {item.rank === 1 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl shadow-sm shadow-amber-500/10">
                          <Crown className="w-3.5 h-3.5 text-amber-400" /> 1
                        </span>
                      ) : item.rank === 2 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 bg-slate-400/10 border border-slate-400/30 px-2.5 py-1 rounded-xl shadow-sm shadow-slate-400/10">
                          <Award className="w-3.5 h-3.5 text-slate-300" /> 2
                        </span>
                      ) : item.rank === 3 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-700/10 border border-amber-700/30 px-2.5 py-1 rounded-xl shadow-sm shadow-amber-700/10">
                          <Medal className="w-3.5 h-3.5 text-amber-600" /> 3
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-zinc-400 px-2 font-mono">#{item.rank}</span>
                      )}
                    </td>

                    <td className={`px-4 ${density === 'compact' ? 'py-2.5' : 'py-4'}`}>
                      <div className="flex items-center gap-3">
                        <img
                          src={item.avatar ? (item.avatar.startsWith('//') ? `https:${item.avatar}` : item.avatar) : DEFAULT_AVATAR}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).onerror = null;
                            (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                          }}
                          alt={item.handle}
                          className={`rounded-2xl object-cover border border-white/10 bg-black/40 shadow-sm ${
                            density === 'compact' ? 'w-8 h-8' : 'w-10 h-10'
                          }`}
                        />
                        <div>
                          <Link
                            href={`/students/${item.studentId}`}
                            className="font-semibold text-zinc-100 hover:text-blue-400 transition"
                          >
                            {item.name}
                          </Link>
                          <div className={`text-xs font-mono font-medium ${getRankColor(item.rankTitle)}`}>
                            @{item.handle}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className={`px-4 text-zinc-300 ${density === 'compact' ? 'py-2.5' : 'py-4'}`}>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-300">
                        {item.className}
                      </span>
                    </td>

                    <td className={`px-4 ${density === 'compact' ? 'py-2.5' : 'py-4'} ${metric === 'rating' ? 'bg-amber-500/5' : ''}`}>
                      <span className={`text-base font-bold font-mono ${getRankColor(item.rankTitle)}`}>
                        {item.rating || '—'}
                      </span>
                      {item.maxRating ? (
                        <span className="text-[10px] text-zinc-500 font-mono block">
                          max: {item.maxRating}
                        </span>
                      ) : null}
                    </td>

                    <td className={`px-4 ${density === 'compact' ? 'py-2.5' : 'py-4'}`}>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getRankBadgeClass(item.rankTitle)}`}>
                        {item.rankTitle.toUpperCase()}
                      </span>
                    </td>

                    <td className={`px-4 ${density === 'compact' ? 'py-2.5' : 'py-4'} ${metric === 'solved' ? 'bg-purple-500/5' : ''}`}>
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-200 font-mono">
                        <Code2 className="w-3.5 h-3.5 text-purple-400" />
                        {item.solvedCount}
                      </div>
                    </td>

                    <td className={`px-4 ${density === 'compact' ? 'py-2.5' : 'py-4'} ${metric === 'contests' ? 'bg-amber-500/5' : ''}`}>
                      <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-xs">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        {item.contestCount}
                      </div>
                    </td>

                    <td className={`px-5 text-right ${density === 'compact' ? 'py-2.5' : 'py-4'}`}>
                      {item.recentRatingChange !== 0 ? (
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-xl font-mono ${
                            item.recentRatingChange > 0
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm shadow-emerald-500/10'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                          }`}
                        >
                          {item.recentRatingChange > 0 ? `+${item.recentRatingChange}` : item.recentRatingChange}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500 font-mono">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
          <p className="text-xs font-medium">Loading leaderboard...</p>
        </div>
      }
    >
      <LeaderboardContent />
    </Suspense>
  );
}
