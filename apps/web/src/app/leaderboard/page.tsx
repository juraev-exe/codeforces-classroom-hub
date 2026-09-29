'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Trophy, RefreshCw, Filter, ArrowUpRight } from 'lucide-react';
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
      setLeaderboard(lbData);
      setClasses(classesData);
    } catch (err: any) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedClass]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            Class Leaderboard
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time rankings based on live Codeforces ratings and contest participation.
          </p>
        </div>

        {/* Filter by class */}
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

      {/* Leaderboard Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            Calculating standings...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            No students found in the leaderboard.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900/60 border-b border-border text-xs text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Tier</th>
                  <th className="py-3.5 px-4">Solved</th>
                  <th className="py-3.5 px-4">Contests</th>
                  <th className="py-3.5 px-4 text-right">Recent Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {leaderboard.map((item) => (
                  <tr key={item.studentId} className="hover:bg-zinc-900/40 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-sm">
                        {item.rank === 1 ? '🥇 1' : item.rank === 2 ? '🥈 2' : item.rank === 3 ? '🥉 3' : `#${item.rank}`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.avatar || 'https://userpic.codeforces.org/no-avatar.jpg'}
                          alt={item.handle}
                          className="w-9 h-9 rounded-full object-cover border border-border bg-zinc-900"
                        />
                        <div>
                          <Link
                            href={`/students/${item.studentId}`}
                            className="font-medium text-zinc-200 hover:text-blue-400 transition"
                          >
                            {item.name}
                          </Link>
                          <div className={`text-xs ${getRankColor(item.rankTitle)}`}>
                            @{item.handle}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-300">
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-border">
                        {item.className}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-base font-bold ${getRankColor(item.rankTitle)}`}>
                        {item.rating || '—'}
                      </span>
                      {item.maxRating ? (
                        <span className="text-[11px] text-zinc-500 block">
                          max: {item.maxRating}
                        </span>
                      ) : null}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getRankBadgeClass(item.rankTitle)}`}>
                        {item.rankTitle.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-zinc-200">
                      {item.solvedCount}
                    </td>

                    <td className="py-3.5 px-4 text-zinc-400">
                      {item.contestCount}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {item.recentRatingChange !== 0 ? (
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
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
        )}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-zinc-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          Loading leaderboard...
        </div>
      }
    >
      <LeaderboardContent />
    </Suspense>
  );
}
