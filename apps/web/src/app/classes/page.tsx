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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-blue-500" />
            Classrooms
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Organize student batches, track group analytics, and view class-specific rankings.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Create New Class
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-zinc-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          Loading classes...
        </div>
      ) : classes.length === 0 ? (
        <div className="p-12 text-center text-zinc-400 bg-card rounded-2xl border border-border">
          No classrooms created yet. Click "Create New Class" to begin.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((c) => (
            <div
              key={c.id}
              className="p-6 rounded-2xl bg-card border border-border hover:border-zinc-700 transition flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-white">{c.name}</h3>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-950/60 text-blue-400 border border-blue-800/40 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {c.studentCount || 0} students
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 line-clamp-2">
                  {c.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-border-subtle flex items-center gap-3">
                <Link
                  href={`/leaderboard?classId=${c.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-border text-xs font-medium text-zinc-200 transition"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Leaderboard
                </Link>
                <Link
                  href={`/analytics?classId=${c.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-border text-xs font-medium text-zinc-200 transition"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                  Analytics
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-500" />
                Create Classroom
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Algorithms Batch 2026"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-border rounded-lg px-3 py-2 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional details, objectives, schedule..."
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-border rounded-lg px-3 py-2 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {submitting ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
