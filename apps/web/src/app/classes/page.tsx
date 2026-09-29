'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Plus,
  Users,
  Trophy,
  BarChart3,
  Calendar,
  RefreshCw,
  ArrowRight,
  BookOpen,
  Link2,
  CheckCircle2,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import type { Classroom } from '@cf-hub/types';

export default function ClassesPage() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyJoinLink(classId?: string) {
    if (typeof window !== 'undefined') {
      const url = classId
        ? `${window.location.origin}/join?classId=${classId}`
        : `${window.location.origin}/join`;
      navigator.clipboard.writeText(url);
      setCopiedId(classId || 'all');
      setTimeout(() => setCopiedId(null), 2500);
    }
  }

  async function loadClasses() {
    try {
      setLoading(true);
      const data = await fetchApi<Classroom[]>('/api/classes');
      setClasses(data);
    } catch (err: any) {
      console.error('Error loading classes:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClasses();
  }, []);

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!nameInput.trim()) return;

    try {
      setSubmitting(true);
      await fetchApi('/api/classes', {
        method: 'POST',
        body: JSON.stringify({
          name: nameInput.trim(),
          description: descInput.trim() || undefined,
        }),
      });

      setNameInput('');
      setDescInput('');
      setIsModalOpen(false);
      await loadClasses();
    } catch (err: any) {
      alert(`Error creating class: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
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
                Cohorts & Batches
              </span>
              <span className="text-xs text-zinc-400">
                {classes.length} active classrooms
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <GraduationCap className="w-7 h-7 text-blue-400" />
              Classrooms & Student Groups
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Organize student batches, track group analytics, and view class-specific rankings and contest reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => copyJoinLink()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 glass-pill hover:bg-white/[0.08] text-zinc-200 hover:text-white rounded-xl text-xs font-semibold transition-all border border-white/10 active:scale-[0.97]"
              title="Copy student join link"
            >
              {copiedId === 'all' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Join Link Copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 text-blue-400" />
                  <span>Copy Join Link</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-blue-600/25 active:scale-[0.97] w-fit"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Class</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
          <p className="text-xs font-medium">Loading classrooms...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl border border-white/[0.08] text-center text-zinc-400 space-y-2">
          <GraduationCap className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-sm font-medium text-zinc-300">No classrooms created yet.</p>
          <p className="text-xs text-zinc-500">Click "Create New Class" above to create your first student batch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((c) => (
            <div
              key={c.id}
              className="glass-card p-6 rounded-3xl border border-white/[0.08] flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">{c.name}</h3>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1 font-medium">
                    <Users className="w-3 h-3" />
                    {c.studentCount || 0} students
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-2.5 line-clamp-2 leading-relaxed">
                  {c.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center gap-2.5">
                <Link
                  href={`/leaderboard?classId=${c.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl glass-pill hover:bg-white/[0.08] text-xs font-semibold text-zinc-200 transition active:scale-[0.97]"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Leaderboard
                </Link>
                <Link
                  href={`/analytics?classId=${c.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl glass-pill hover:bg-white/[0.08] text-xs font-semibold text-zinc-200 transition active:scale-[0.97]"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                  Analytics
                </Link>
                <button
                  onClick={() => copyJoinLink(c.id)}
                  title="Copy direct invite link for this classroom"
                  className="px-3 py-2.5 rounded-xl glass-pill hover:bg-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white transition active:scale-[0.97] flex items-center justify-center gap-1.5"
                >
                  {copiedId === c.id ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Link2 className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span>{copiedId === c.id ? 'Copied' : 'Invite'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl glass-panel border border-white/15 p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Create New Classroom</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white text-lg w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Classroom Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Competitive Programming Batch 2026"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 text-xs transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional details, target contest ratings, schedule..."
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 text-xs transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center gap-1.5 active:scale-[0.97]"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {submitting ? 'Creating...' : 'Create Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
