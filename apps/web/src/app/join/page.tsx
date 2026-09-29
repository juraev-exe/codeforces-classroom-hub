'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Code2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Trophy,
  ShieldCheck,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { getRankColor, getRankBadgeClass } from '@/lib/cf-utils';
import type { Classroom, Student } from '@cf-hub/types';

function JoinContent() {
  const searchParams = useSearchParams();
  const preselectedClassId = searchParams.get('classId') || '';

  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId);

  // Form State
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [group, setGroup] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success State
  const [joinedStudent, setJoinedStudent] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Teacher / Lead Profile
  const [teacher, setTeacher] = useState<any | null>(null);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [classesRes, meRes] = await Promise.all([
          fetchApi<Classroom[]>('/api/classes'),
          fetchApi<any>('/api/me').catch(() => null),
        ]);
        setClasses(classesRes);
        if (meRes?.teacher) {
          setTeacher(meRes.teacher);
        }
        if (classesRes.length > 0 && !selectedClassId) {
          setSelectedClassId(preselectedClassId || classesRes[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load classes for join:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [preselectedClassId]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !handle.trim() || !selectedClassId) {
      setError('Please provide your full name, Codeforces handle, and classroom.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 1. Register student into classroom
      const student = await fetchApi<Student>('/api/students', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          codeforcesHandle: handle.trim(),
          classId: selectedClassId,
          group: group.trim() || 'Student',
        }),
      });

      // 2. Trigger instant Codeforces telemetry sync for new student
      try {
        await fetchApi(`/api/students/${student.id}/sync`, { method: 'POST' });
        const detailed = await fetchApi<any>(`/api/students/${student.id}`);
        setJoinedStudent(detailed);
      } catch (e) {
        setJoinedStudent({ student });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join. Please verify your Codeforces handle exists.');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  function copyInviteLink() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-zinc-400">
        <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center border border-white/10 shadow-xl">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
        </div>
        <p className="text-xs font-medium">Loading classroom invitation...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-7 py-4">
      {/* Top Banner Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/[0.08] relative overflow-hidden text-center">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <GraduationCap className="w-3.5 h-3.5" />
            Classroom Enrollment
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Join {selectedClass?.name || 'Competitive Programming 2026'}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Enter your Codeforces handle to join the classroom leaderboard, track live problem-solving telemetry, and receive round alerts.
          </p>

          {/* Teacher Profile Preview */}
          {teacher && (
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-center gap-3">
              <img
                src={teacher.avatar || 'https://userpic.codeforces.org/no-avatar.jpg'}
                alt={teacher.handle}
                className="w-8 h-8 rounded-xl object-cover border border-white/10 bg-black/40 shadow-sm"
              />
              <div className="text-left text-xs">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Teacher & Lead</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-white">{teacher.name || teacher.handle}</span>
                  <span className={`font-mono text-[11px] ${getRankColor(teacher.rank)}`}>@{teacher.handle}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success State */}
      {joinedStudent ? (
        <div className="glass-panel rounded-3xl p-7 shadow-2xl border border-emerald-500/30 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-gradient-to-b from-emerald-500/[0.05] to-transparent">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Welcome, {joinedStudent.student?.name || name}!
            </h2>
            <p className="text-xs text-zinc-400">
              You are now enrolled in <span className="text-zinc-200 font-semibold">{selectedClass?.name}</span>.
            </p>
          </div>

          {/* Student Codeforces Profile Card */}
          <div className="glass-card p-4 rounded-2xl border border-white/[0.08] flex items-center justify-between gap-4 max-w-sm mx-auto text-left">
            <div className="flex items-center gap-3">
              <img
                src={joinedStudent.stats?.avatar || 'https://userpic.codeforces.org/no-avatar.jpg'}
                alt={handle}
                className="w-12 h-12 rounded-xl object-cover border border-white/10 bg-black/40"
              />
              <div>
                <span className="font-bold text-sm text-white block">{name}</span>
                <span className={`text-xs font-mono font-medium ${getRankColor(joinedStudent.stats?.rank)}`}>
                  @{handle}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-sm font-bold font-mono ${getRankColor(joinedStudent.stats?.rank)}`}>
                {joinedStudent.stats?.rating || '—'}
              </span>
              <span className="text-[10px] text-zinc-500 block uppercase font-medium">
                {joinedStudent.stats?.rank || 'newbie'}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono block">
                {joinedStudent.stats?.solvedCount ?? 0} solved
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-blue-600/25 active:scale-[0.97] flex items-center justify-center gap-2"
            >
              <span>View Classroom Live Feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/leaderboard"
              className="w-full sm:w-auto px-5 py-2.5 glass-pill hover:bg-white/[0.08] text-zinc-200 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] flex items-center justify-center gap-2"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Class Leaderboard</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Enrollment Form */
        <div className="glass-panel rounded-3xl p-7 shadow-2xl border border-white/[0.08] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">Student Registration Form</h2>
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" /> No Password Required
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Your Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                placeholder="e.g. tourist, Benq, or your handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 text-xs transition font-mono"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Your rating and solved problems are validated live via Codeforces API.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Target Classroom
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
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
                Optional Team or Cohort
              </label>
              <input
                type="text"
                placeholder="e.g. Team A, Division 2, Beginners"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 text-xs transition"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {submitting ? 'Verifying with Codeforces...' : 'Join Classroom & Start Tracking'}
              </button>
            </div>
          </form>

          {/* Share Link Helper */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
            <span>Invite other classmates:</span>
            <button
              onClick={copyInviteLink}
              className="text-blue-400 hover:text-blue-300 font-medium transition flex items-center gap-1 active:scale-[0.96]"
            >
              {copied ? 'Link Copied!' : 'Copy Invite Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
          <p className="text-xs font-medium">Loading invitation...</p>
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
