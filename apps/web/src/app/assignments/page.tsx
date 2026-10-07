'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Users,
  Award,
  Layers,
  Sparkles,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import type { AssignmentWithProgress, Classroom } from '@cf-hub/types';

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40' width='40' height='40'><rect width='40' height='40' rx='10' fill='%231e293b'/><circle cx='20' cy='15' r='6' fill='%2364748b'/><path d='M10 32c0-5 4.5-8 10-8s10 3 10 8' fill='%2364748b'/></svg>";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentWithProgress[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [classInput, setClassInput] = useState('');
  const [problemInput, setProblemInput] = useState('');
  const [dueDaysInput, setDueDaysInput] = useState('7');
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status feedback
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function triggerStatus(type: 'success' | 'error', text: string) {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3500);
  }

  async function loadData() {
    try {
      setLoading(true);
      const [assignRes, classRes] = await Promise.all([
        fetchApi<AssignmentWithProgress[]>('/api/assignments'),
        fetchApi<Classroom[]>('/api/classes'),
      ]);
      setAssignments(Array.isArray(assignRes) ? assignRes : []);
      setClasses(Array.isArray(classRes) ? classRes : []);
      if (Array.isArray(classRes) && classRes.length > 0 && !classInput) {
        setClassInput(classRes[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredAssignments = useMemo(() => {
    if (selectedClass === 'all') return assignments;
    return assignments.filter((a) => a.classId === selectedClass);
  }, [assignments, selectedClass]);

  const stats = useMemo(() => {
    const total = assignments.length;
    const totalProblems = assignments.reduce((acc, a) => acc + a.problems.length, 0);
    const avgCompletion =
      total > 0
        ? Math.round(assignments.reduce((acc, a) => acc + a.completionRate, 0) / total)
        : 0;
    return { total, totalProblems, avgCompletion };
  }, [assignments]);

  async function handleCreateAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!titleInput.trim() || !classInput || !problemInput.trim()) {
      triggerStatus('error', 'Please fill in Title, Classroom, and Problems.');
      return;
    }

    try {
      setSubmitting(true);
      const dueDate = new Date(Date.now() + parseInt(dueDaysInput, 10) * 24 * 3600 * 1000).toISOString();
      await fetchApi('/api/assignments', {
        method: 'POST',
        body: JSON.stringify({
          title: titleInput.trim(),
          description: descInput.trim() || undefined,
          classId: classInput,
          problemInput: problemInput.trim(),
          dueDate,
        }),
      });

      triggerStatus('success', 'Assignment published successfully! ✅');
      setTitleInput('');
      setDescInput('');
      setProblemInput('');
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      triggerStatus('error', err.message || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this problem set?')) return;
    try {
      await fetchApi(`/api/assignments?id=${id}`, { method: 'DELETE' });
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      triggerStatus('success', 'Problem set deleted.');
    } catch (err: any) {
      triggerStatus('error', err.message || 'Failed to delete');
    }
  }

  function copyTelegramAnnouncement(assign: AssignmentWithProgress, e: React.MouseEvent) {
    e.stopPropagation();
    const problemList = assign.problems.map((p, idx) => `${idx + 1}. [${p.id} - ${p.name}](${p.url})`).join('\n');
    const text = `📚 *New Homework Assignment: ${assign.title}*\n\n` +
      `${assign.description ? `_${assign.description}_\n\n` : ''}` +
      `🎯 *Problems to Solve:*\n${problemList}\n\n` +
      `⏰ *Due Date:* ${new Date(assign.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}\n` +
      `📊 Track your status on the classroom leaderboard!`;

    navigator.clipboard.writeText(text);
    setCopiedId(assign.id);
    triggerStatus('success', 'Telegram announcement copied to clipboard! 📋');
    setTimeout(() => setCopiedId(null), 2500);
  }

  return (
    <div className="space-y-7">
      {/* Toast Notification */}
      {statusMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border backdrop-blur-xl animate-in fade-in slide-in-from-top-3 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/[0.08] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <BookOpen className="w-3 h-3 text-blue-400" />
                Curriculum & Homework
              </span>
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                Auto Solved-Sync Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Classroom Problem Sets
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              Assign targeted Codeforces problems by topic or rating. The system automatically cross-references student AC submissions in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Problem Set</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 transition"
              title="Refresh problem sets"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-white/[0.06]">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider block">Active Assignments</span>
            <span className="text-xl font-bold font-mono text-white mt-0.5 block">{stats.total}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider block">Assigned Problems</span>
            <span className="text-xl font-bold font-mono text-blue-400 mt-0.5 block">{stats.totalProblems}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider block">Avg Completion Rate</span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">{stats.avgCompletion}%</span>
          </div>
        </div>
      </div>

      {/* Classroom Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedClass('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            selectedClass === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.06]'
          }`}
        >
          All Classrooms ({assignments.length})
        </button>
        {classes.map((c) => {
          const count = assignments.filter((a) => a.classId === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedClass(c.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                selectedClass === c.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {c.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-panel p-6 rounded-3xl border border-white/[0.08] animate-pulse h-40" />
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-white/[0.08] text-center space-y-4 max-w-md mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No problem sets found</h3>
            <p className="text-xs text-zinc-400">Create your first assignment to start tracking student solutions automatically.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition"
          >
            Create Assignment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assign) => {
            const isExpanded = expandedId === assign.id;
            const daysLeft = Math.ceil((new Date(assign.dueDate).getTime() - Date.now()) / (1000 * 3600 * 24));
            const isPastDue = daysLeft < 0;

            return (
              <div
                key={assign.id}
                className="glass-panel rounded-3xl border border-white/[0.08] overflow-hidden transition-all duration-200 hover:border-white/[0.15]"
              >
                {/* Header Card */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : assign.id)}
                  className="p-5 sm:p-6 cursor-pointer hover:bg-white/[0.01] transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold font-mono">
                          {assign.className || 'Classroom'}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold font-mono ${
                            isPastDue
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : daysLeft <= 2
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                          }`}
                        >
                          <Clock className="w-3 h-3 inline mr-1" />
                          {isPastDue ? 'Past Due' : `${daysLeft} days left`}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                        {assign.title}
                      </h2>
                      {assign.description && (
                        <p className="text-xs text-zinc-400 line-clamp-1">{assign.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => copyTelegramAnnouncement(assign, e)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition"
                        title="Copy announcement for Telegram"
                      >
                        {copiedId === assign.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">Telegram Post</span>
                      </button>

                      <button
                        onClick={(e) => handleDelete(assign.id, e)}
                        className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="p-1.5 text-zinc-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Progress & Problems Chips */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400">Classroom Progress</span>
                      <span className="text-white font-bold">{assign.completionRate}% Completed</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${assign.completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Problems List */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[11px] uppercase font-bold text-zinc-500 font-mono">Problems:</span>
                    {assign.problems.map((p) => (
                      <a
                        key={p.id}
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-zinc-300 hover:text-blue-400 transition"
                      >
                        <span className="font-bold text-white">{p.id}</span>
                        {p.rating && <span className="text-[10px] text-amber-400">({p.rating})</span>}
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Expanded Student Solver Roster */}
                {isExpanded && (
                  <div className="border-t border-white/[0.06] bg-white/[0.01] p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        Student Completion Breakdown ({assign.studentProgress.length} students)
                      </h4>
                    </div>

                    {assign.studentProgress.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-3 text-center">No students currently enrolled in this classroom.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {assign.studentProgress.map((sp) => (
                          <div
                            key={sp.studentId}
                            className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={sp.avatar || DEFAULT_AVATAR}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).onerror = null;
                                  (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                                }}
                                alt=""
                                className="w-8 h-8 rounded-xl object-cover border border-white/10 shrink-0"
                              />
                              <div className="min-w-0">
                                <Link
                                  href={`/students/${sp.studentId}`}
                                  className="text-xs font-semibold text-white hover:text-blue-400 transition block truncate"
                                >
                                  {sp.studentName}
                                </Link>
                                <span className="text-[10px] text-zinc-500 font-mono">@{sp.handle}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Problems Solved Pills */}
                              <div className="flex items-center gap-1">
                                {assign.problems.map((prob) => {
                                  const solved = sp.solvedProblemIds.includes(prob.id);
                                  return (
                                    <span
                                      key={prob.id}
                                      title={`${prob.id}: ${solved ? 'Solved' : 'Not solved yet'}`}
                                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold ${
                                        solved
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                          : 'bg-white/[0.03] text-zinc-600 border border-white/[0.05]'
                                      }`}
                                    >
                                      {prob.index}
                                    </span>
                                  );
                                })}
                              </div>

                              <span
                                className={`text-[11px] font-mono px-2 py-0.5 rounded-lg font-bold ${
                                  sp.completed
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-zinc-500/10 text-zinc-400 border border-white/[0.06]'
                                }`}
                              >
                                {sp.solvedCount}/{sp.totalCount}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Problem Set */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/10 p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-t-0 border-b border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Create Problem Set</h3>
                <p className="text-xs text-zinc-400">Assign Codeforces problems for auto-tracking</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Assignment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Week 3: Binary Search on Monotonic Predicates"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Target Classroom *</label>
                <select
                  required
                  value={classInput}
                  onChange={(e) => setClassInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Problems * <span className="text-zinc-500 font-normal">(IDs like 706B, 455A or full URLs)</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={`706B\nhttps://codeforces.com/problemset/problem/455/A\n189A`}
                  value={problemInput}
                  onChange={(e) => setProblemInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500 font-mono transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Due In (Days)</label>
                  <select
                    value={dueDaysInput}
                    onChange={(e) => setDueDaysInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="3" className="bg-zinc-900">3 Days</option>
                    <option value="7" className="bg-zinc-900">7 Days (1 Week)</option>
                    <option value="14" className="bg-zinc-900">14 Days (2 Weeks)</option>
                    <option value="30" className="bg-zinc-900">30 Days (1 Month)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Short Description</label>
                  <input
                    type="text"
                    placeholder="Optional focus note"
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
