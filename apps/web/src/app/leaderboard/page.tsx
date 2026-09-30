'use client';

import { useEffect, useState, Suspense } from 'react';
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
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { getRankColor, getRankBadgeClass } from '@/lib/cf-utils';
import type { LeaderboardEntry, Classroom } from '@cf-hub/types';

function LeaderboardContent() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selectedClass, setSelectedClass] = useState(initialClassId);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const url = selectedClass ? `/api/classes/${selectedClass}/leaderboard` : '/api/leaderboard';
      const [lbData, classesData] = await Promise.all([
        fetchApi<LeaderboardEntry[]>(url),
        fetchApi<Classroom[]>('/api/classes'),
      ]);
      setLeaderboard(Array.isArray(lbData) ? lbData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (err: any) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedClass]);

  const top3 = leaderboard.slice(0, 3);

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
                Live Rating Rankings
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
              src={top3[1].avatar || 'https://userpic.codeforces.org/no-avatar.jpg'}
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
              src={top3[0].avatar || 'https://userpic.codeforces.org/no-avatar.jpg'}
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
              src={top3[2].avatar || 'https://userpic.codeforces.org/no-avatar.jpg'}
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
        ) : leaderboard.length === 0 ? (
          <div className="p-16 text-center text-zinc-400 space-y-2">
            <Trophy className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-sm font-medium text-zinc-300">No students found in the leaderboard.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] border-b border-white/[0.06] text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-5">
                    <span className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-400" /> Rank
                    </span>
                  </th>
                  <th className="py-3.5 px-4">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" /> Student
                    </span>
                  </th>
                  <th className="py-3.5 px-4">
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> Class
                    </span>
                  </th>
                  <th className="py-3.5 px-4">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Rating
                    </span>
                  </th>
                  <th className="py-3.5 px-4">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Rank Tier
                    </span>
                  </th>
                  <th className="py-3.5 px-4">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Solved
                    </span>
                  </th>
                  <th className="py-3.5 px-4">
                    <span className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" /> Contests
                    </span>
                  </th>
                  <th className="py-3.5 px-5 text-right">
                    <span className="flex items-center justify-end gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Contest Delta
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {leaderboard.map((item) => (
                  <tr key={item.studentId} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-5">
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

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.avatar || 'https://userpic.codeforces.org/no-avatar.jpg'}
                          alt={item.handle}
                          className="w-10 h-10 rounded-2xl object-cover border border-white/10 bg-black/40 shadow-sm"
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

                    <td className="py-4 px-4 text-zinc-300">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-300">
                        {item.className}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`text-base font-bold font-mono ${getRankColor(item.rankTitle)}`}>
                        {item.rating || '—'}
                      </span>
                      {item.maxRating ? (
                        <span className="text-[10px] text-zinc-500 font-mono block">
                          max: {item.maxRating}
                        </span>
                      ) : null}
                    </td>

                    <td className="py-4 px-4">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getRankBadgeClass(item.rankTitle)}`}>
                        {item.rankTitle.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-200 font-mono">
                        <Code2 className="w-3.5 h-3.5 text-purple-400" />
                        {item.solvedCount}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-xs">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        {item.contestCount}
                      </div>
                    </td>

                    <td className="py-4 px-5 text-right">
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
