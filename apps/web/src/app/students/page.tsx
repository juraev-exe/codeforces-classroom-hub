'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { getRankColor, getRankBadgeClass } from '@/lib/cf-utils';
import type { Student, Classroom } from '@cf-hub/types';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [handleInput, setHandleInput] = useState('');
  const [classInput, setClassInput] = useState('');
  const [groupInput, setGroupInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Row sync tracking
  const [syncingId, setSyncingId] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const [studentsData, classesData] = await Promise.all([
        fetchApi<Student[]>('/api/students'),
        fetchApi<Classroom[]>('/api/classes'),
      ]);
      setStudents(studentsData);
      setClasses(classesData);
      if (classesData.length > 0 && !classInput) {
        setClassInput(classesData[0].id);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!nameInput.trim() || !handleInput.trim() || !classInput) {
      setModalError('Please fill in student name, Codeforces handle, and class.');
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);
      await fetchApi('/api/students', {
        method: 'POST',
        body: JSON.stringify({
          name: nameInput.trim(),
          codeforcesHandle: handleInput.trim(),
          classId: classInput,
          group: groupInput.trim() || undefined,
        }),
      });

      // Reset and close
      setNameInput('');
      setHandleInput('');
      setGroupInput('');
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to add student. Please verify the Codeforces handle.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSyncStudent(id: string) {
    try {
      setSyncingId(id);
      await fetchApi(`/api/students/${id}/sync`, { method: 'POST' });
      await loadData();
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncingId(null);
    }
  }

  async function handleDeleteStudent(id: string, name: string) {
    if (!confirm(`Are you sure you want to remove student "${name}"?`)) return;
    try {
      await fetchApi(`/api/students/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.codeforcesHandle.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass ? s.classId === selectedClass : true;
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? s.active
        : !s.active;
    return matchesSearch && matchesClass && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-500" />
            Student Management
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track student Codeforces profiles, ratings, and contest progression.
          </p>
        </div>

        <button
          onClick={() => {
            setModalError(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-blue-600/20"
        >
          <UserPlus className="w-4 h-4" />
          Add Student Handle
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-card border border-border">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
          <input
            type="text"
            placeholder="Search name or @handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/80 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Class Filter */}
        <div className="relative">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-zinc-900/80 border border-border rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-zinc-900/80 border border-border rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            Loading students...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            No students found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900/60 border-b border-border text-xs text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Solved</th>
                  <th className="py-3 px-4">Contests</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-900/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={s.stats?.avatar || 'https://userpic.codeforces.org/no-avatar.jpg'}
                          alt={s.codeforcesHandle}
                          className="w-9 h-9 rounded-full object-cover border border-border bg-zinc-900"
                        />
                        <div>
                          <Link
                            href={`/students/${s.id}`}
                            className="font-medium text-zinc-200 hover:text-blue-400 transition"
                          >
                            {s.name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-xs ${getRankColor(s.stats?.rank)}`}>
                              @{s.codeforcesHandle}
                            </span>
                            {s.group && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                {s.group}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-300">
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-border">
                        {s.className || 'General'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`font-semibold ${getRankColor(s.stats?.rank)}`}>
                        {s.stats?.rating || '—'}
                      </span>
                      {s.stats?.maxRating ? (
                        <span className="text-[11px] text-zinc-500 block">
                          max: {s.stats.maxRating}
                        </span>
                      ) : null}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getRankBadgeClass(s.stats?.rank)}`}>
                        {s.stats?.rank || 'unrated'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-zinc-200">
                      {s.stats?.solvedCount ?? '—'}
                    </td>

                    <td className="py-3.5 px-4 text-zinc-400">
                      {s.stats?.contestCount ?? '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      {s.active ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSyncStudent(s.id)}
                          disabled={syncingId === s.id}
                          title="Sync Codeforces Data"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${syncingId === s.id ? 'animate-spin text-blue-500' : ''}`} />
                        </button>
                        <Link
                          href={`/students/${s.id}`}
                          title="View Profile"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          title="Remove Student"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                Add Student to Class
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Student Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Johnson"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
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
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-border rounded-lg px-3 py-2 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  The system will validate this handle against the official Codeforces API before saving.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Classroom
                </label>
                <select
                  value={classInput}
                  onChange={(e) => setClassInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-border rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Optional Group / Track
                </label>
                <input
                  type="text"
                  placeholder="e.g. Team A, Division 2, ICPC Squad"
                  value={groupInput}
                  onChange={(e) => setGroupInput(e.target.value)}
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
                  {submitting ? 'Validating Handle...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
