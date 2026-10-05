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
  Code2,
  Trophy,
  Activity,
  Layers,
  Link2,
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
  const [copiedLink, setCopiedLink] = useState(false);

  function copyJoinLink() {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/join`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }

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

      // Self-healing vault sync
      if (typeof window !== 'undefined' && Array.isArray(studentsData)) {
        try {
          const vault: any[] = JSON.parse(localStorage.getItem('cf_roster_vault') || '[]');
          const vaultHandles = new Set(vault.map((v) => (v.handle || '').toLowerCase()));
          const serverHandles = new Set(studentsData.map((s) => (s.codeforcesHandle || '').toLowerCase()));

          let vaultUpdated = false;
          for (const s of studentsData) {
            const h = (s.codeforcesHandle || '').toLowerCase();
            if (h && h !== 'abubakrj' && !vaultHandles.has(h)) {
              vault.push({ name: s.name, handle: s.codeforcesHandle, classId: s.classId });
              vaultHandles.add(h);
              vaultUpdated = true;
            }
          }
          if (vaultUpdated) {
            localStorage.setItem('cf_roster_vault', JSON.stringify(vault));
          }

          const missing = vault.filter((v) => v.handle && !serverHandles.has(v.handle.toLowerCase()));
          if (missing.length > 0) {
            Promise.all(
              missing.map((m) =>
                fetchApi('/api/students', {
                  method: 'POST',
                  body: JSON.stringify({
                    name: m.name,
                    codeforcesHandle: m.handle,
                    classId: m.classId || (classesData[0] ? classesData[0].id : 'class-algorithms-2026'),
                  }),
                }).catch(() => null)
              )
            ).then(() => {
              fetchApi<Student[]>('/api/students').then(setStudents).catch(() => {});
            });
          }
        } catch {}
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

      // Save to local vault
      if (typeof window !== 'undefined') {
        try {
          const vault: any[] = JSON.parse(localStorage.getItem('cf_roster_vault') || '[]');
          if (!vault.some((v) => v.handle.toLowerCase() === handleInput.trim().toLowerCase())) {
            vault.push({ name: nameInput.trim(), handle: handleInput.trim(), classId: classInput });
            localStorage.setItem('cf_roster_vault', JSON.stringify(vault));
          }
        } catch {}
      }

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

  async function handleDeleteStudent(id: string, name: string, handle: string) {
    if (!confirm(`Are you sure you want to remove student "${name}" (@${handle}) from the classroom?`)) return;
    try {
      await fetchApi(`/api/students/${id}`, { method: 'DELETE' });

      // Clean local storage vault so student does not get restored automatically
      if (typeof window !== 'undefined') {
        try {
          const vault: any[] = JSON.parse(localStorage.getItem('cf_roster_vault') || '[]');
          const updatedVault = vault.filter(
            (v) => (v.handle || '').toLowerCase() !== (handle || '').toLowerCase()
          );
          localStorage.setItem('cf_roster_vault', JSON.stringify(updatedVault));
        } catch {}
      }

      setStudents((prev) => prev.filter((s) => s.id !== id && s.codeforcesHandle.toLowerCase() !== handle.toLowerCase()));
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
    <div className="space-y-7">
      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/[0.08] relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Directory
              </span>
              <span className="text-xs text-zinc-400">
                {students.length} students enrolled
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-blue-400" />
              Student Roster & Profiles
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Monitor individual Codeforces handles, live ratings, problem counts, and performance history.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={copyJoinLink}
              className="flex items-center justify-center gap-2 px-4 py-2.5 glass-pill hover:bg-white/[0.08] text-zinc-200 hover:text-white rounded-xl text-xs font-semibold transition-all border border-white/10 active:scale-[0.97]"
              title="Copy student join link"
            >
              {copiedLink ? (
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
              onClick={() => {
                setModalError(null);
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-blue-600/25 active:scale-[0.97] w-fit"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Student Handle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search student name or @handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        {/* Class Filter */}
        <div className="relative">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-all"
          >
            <option value="" className="bg-zinc-900">All Classrooms</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id} className="bg-zinc-900">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 py-1 text-center rounded-lg transition-all ${
              statusFilter === 'all'
                ? 'bg-white/10 text-white font-medium shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({students.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`flex-1 py-1 text-center rounded-lg transition-all ${
              statusFilter === 'active'
                ? 'bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`flex-1 py-1 text-center rounded-lg transition-all ${
              statusFilter === 'inactive'
                ? 'bg-zinc-800 text-zinc-300 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="glass-panel rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
            <p className="text-xs font-medium">Retrieving student telemetry...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-zinc-400 space-y-2">
            <Users className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-sm font-medium text-zinc-300">No students found matching current filters.</p>
            <p className="text-xs text-zinc-500">Try modifying your search or click "Add Student Handle" above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] border-b border-white/[0.06] text-[11px] text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Student</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Rank Tier</th>
                  <th className="py-3.5 px-4">Solved</th>
                  <th className="py-3.5 px-4">Contests</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={s.stats?.avatar ? (s.stats?.avatar.startsWith('//') ? `https:${s.stats?.avatar}` : s.stats?.avatar) : 'https://userpic.codeforces.org/no-avatar.jpg'} onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = 'https://userpic.codeforces.org/no-avatar.jpg'; }}
                          alt={s.codeforcesHandle}
                          className="w-10 h-10 rounded-2xl object-cover border border-white/10 bg-black/40 shadow-sm"
                        />
                        <div>
                          <Link
                            href={`/students/${s.id}`}
                            className="font-semibold text-zinc-100 hover:text-blue-400 transition flex items-center gap-1.5"
                          >
                            <span>{s.name}</span>
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs font-mono font-medium ${getRankColor(s.stats?.rank)}`}>
                              @{s.codeforcesHandle}
                            </span>
                            {s.group && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.06]">
                                {s.group}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-zinc-300">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-300">
                        {s.className || 'General'}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`text-base font-bold font-mono ${getRankColor(s.stats?.rank)}`}>
                        {s.stats?.rating || '—'}
                      </span>
                      {s.stats?.maxRating ? (
                        <span className="text-[10px] text-zinc-500 font-mono block">
                          max: {s.stats.maxRating}
                        </span>
                      ) : null}
                    </td>

                    <td className="py-4 px-4">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getRankBadgeClass(s.stats?.rank)}`}>
                        {s.stats?.rank || 'unrated'}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-200 font-mono">
                        <Code2 className="w-3.5 h-3.5 text-purple-400" />
                        {s.stats?.solvedCount ?? '—'}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-xs">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        {s.stats?.contestCount ?? '—'}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {s.active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 bg-white/[0.03] border border-white/[0.06] px-2.5 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSyncStudent(s.id)}
                          disabled={syncingId === s.id}
                          title="Sync Codeforces Telemetry"
                          className="p-2 rounded-xl text-zinc-400 hover:text-blue-400 hover:bg-white/[0.06] transition disabled:opacity-50 active:scale-[0.95]"
                        >
                          <RefreshCw className={`w-4 h-4 ${syncingId === s.id ? 'animate-spin text-blue-400' : ''}`} />
                        </button>

                        <Link
                          href={`/students/${s.id}`}
                          title="View Telemetry Dashboard"
                          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition active:scale-[0.95]"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleDeleteStudent(s.id, s.name, s.codeforcesHandle)}
                          title="Remove Student"
                          className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition active:scale-[0.95]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl glass-panel border border-white/15 p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Add Student to Roster</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white text-lg w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition"
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Student Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Johnson"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 text-xs transition"
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
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 text-xs transition font-mono"
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
                  value={classInput}
                  onChange={(e) => setClassInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:border-blue-500 text-xs transition"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Optional Group / Cohort
                </label>
                <input
                  type="text"
                  placeholder="e.g. Division 1 Prep, ICPC Team Alpha"
                  value={groupInput}
                  onChange={(e) => setGroupInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 text-xs transition"
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
                  {submitting ? 'Verifying with Codeforces...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
