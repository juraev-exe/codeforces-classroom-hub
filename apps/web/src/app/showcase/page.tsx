'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Trophy,
  Users,
  BookOpen,
  Bot,
  Zap,
  ShieldCheck,
  BarChart3,
  ExternalLink,
  Star,
  Check,
  ChevronRight,
  TrendingUp,
  Radio,
  FileCode,
  Laptop,
  Flame,
  Send,
  X,
  Mail,
  Building,
} from 'lucide-react';

export default function ShowcasePage() {
  const [annualBilling, setAnnualBilling] = useState(true);

  // Inquiry / Demo Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState('Academy Pro ($79/mo)');
  const [academyName, setAcademyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [emailOrTelegram, setEmailOrTelegram] = useState('');
  const [studentCount, setStudentCount] = useState('20 - 50 Students');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  function openDemoModal(tier: string) {
    setSelectedTier(tier);
    setSubmitted(false);
    setStatusError(null);
    setIsModalOpen(true);
  }

  async function handleInquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contactName.trim() || !emailOrTelegram.trim()) {
      setStatusError('Please provide your name and email or Telegram handle.');
      return;
    }

    try {
      setSubmitting(true);
      setStatusError(null);
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academyName: academyName.trim() || undefined,
          contactName: contactName.trim(),
          emailOrTelegram: emailOrTelegram.trim(),
          studentCount,
          tier: selectedTier,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send inquiry');
      }

      setSubmitted(true);
    } catch (err: any) {
      setStatusError(err.message || 'Failed to submit inquiry');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-16 pb-20">
      {/* Ambient background glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* SECTION 1: HERO HEADER */}
      <section className="text-center space-y-6 pt-6 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider shadow-sm shadow-blue-500/10">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>The Next-Gen Competitive Programming Hub</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.15]">
          Turn Codeforces Into Your Academy&apos;s{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300">
            Automated Training OS
          </span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          Monitor student submissions live, automate problem set grading, sync contest ratings, and empower coaches with an intelligent Telegram assistant.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button
            type="button"
            onClick={() => openDemoModal('Academy Pro ($79/mo)')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/35 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            <span>Request Academy Pilot</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-white font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Laptop className="w-4 h-4 text-blue-400" />
            <span>Open Live Dashboard</span>
          </Link>

          <a
            href="https://t.me/CodeForcesStudents_Bot"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-white font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>Test Bot</span>
          </a>
        </div>

        {/* Social Proof Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-white/[0.08] text-left">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">15+ hrs</div>
            <div className="text-xs text-zinc-400 mt-1">Saved weekly per coach</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">100%</div>
            <div className="text-xs text-zinc-400 mt-1">Automated AC verification</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">+180</div>
            <div className="text-xs text-zinc-400 mt-1">Avg rating gain / semester</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">3-Click</div>
            <div className="text-xs text-zinc-400 mt-1">Student self-onboarding</div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CORE VALUE PROPOSITIONS */}
      <section className="space-y-8 max-w-6xl mx-auto px-4">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Features Built For Scale</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything your coaching staff needs
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] hover:border-blue-500/30 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Live Telemetry & Solvers</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Real-time submission radar tracks who is currently coding, problem difficulty tags, verdict breakdowns (AC, WA, TLE), and delta ratings.
            </p>
            <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-white/[0.05]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero manual spreadsheet tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live radar shows active coders</span>
              </li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] hover:border-purple-500/30 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Homework & Problem Sets</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Assign targeted Div. 2/3 problem sets with deadlines. Automatic cross-referencing marks problems completed as soon as a student gets Accepted.
            </p>
            <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-white/[0.05]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Individual solver checklists</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>1-click Telegram announcement generator</span>
              </li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] hover:border-emerald-500/30 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Telegram Bot Co-Pilot</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Students onboard in seconds via an interactive 3-step Telegram wizard. Coaches receive upcoming round reminders and instant leaderboard queries.
            </p>
            <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-white/[0.05]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Interactive /register and /start flows</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Automated contest round notifications</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 3: COMMERCIAL PRICING TIERS */}
      <section className="space-y-8 max-w-5xl mx-auto px-4">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Commercial Packages</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Simple, transparent SaaS pricing
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">Equip your coaching team with high-impact software.</p>

          {/* Billing Switch */}
          <div className="inline-flex items-center gap-2.5 p-1 rounded-full bg-white/[0.04] border border-white/10 mt-3 text-xs">
            <button
              onClick={() => setAnnualBilling(false)}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition ${
                !annualBilling ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnualBilling(true)}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition flex items-center gap-1.5 ${
                annualBilling ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 font-bold">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Plan 1: Starter */}
          <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Independent Coach</span>
                <h3 className="text-xl font-bold text-white mt-1">Starter</h3>
                <p className="text-xs text-zinc-400 mt-1">Ideal for solo tutors and small competitive programming clubs.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                  ${annualBilling ? '24' : '29'}
                </span>
                <span className="text-xs text-zinc-400 font-medium">/ month</span>
              </div>

              <ul className="space-y-2.5 text-xs text-zinc-300 pt-4 border-t border-white/[0.06]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1 Active Classroom</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to 30 Enrolled Students</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Live Leaderboard & Roster</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Telegram Bot Integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>CSV Roster Exports</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => openDemoModal('Coach ($29/mo)')}
              className="w-full py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-semibold text-xs text-center transition block active:scale-[0.98]"
            >
              Start Coach Pilot
            </button>
          </div>

          {/* Plan 2: Academy Pro (Featured) */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border-2 border-blue-500 shadow-2xl shadow-blue-500/15 flex flex-col justify-between space-y-6 relative bg-gradient-to-b from-blue-500/[0.08] to-transparent">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
              Most Popular
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">CP Academy</span>
                <h3 className="text-xl font-bold text-white mt-1">Academy Pro</h3>
                <p className="text-xs text-zinc-300 mt-1">For competitive programming centers and Olympiad teams.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                  ${annualBilling ? '64' : '79'}
                </span>
                <span className="text-xs text-zinc-400 font-medium">/ month</span>
              </div>

              <ul className="space-y-2.5 text-xs text-zinc-200 pt-4 border-t border-white/[0.08]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span><strong>Unlimited</strong> Classrooms</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Up to 150 Students</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span><strong>Auto-Grading Problem Sets</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>AI Coach Diagnosis (Gemini Flash)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Printable Executive Report Cards</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Telegram Round Reminders</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => openDemoModal('Academy Pro ($79/mo)')}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs text-center shadow-lg shadow-blue-600/30 transition block active:scale-[0.98]"
            >
              Start 14-Day Free Pilot
            </button>
          </div>

          {/* Plan 3: Enterprise */}
          <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Universities & National Teams</span>
                <h3 className="text-xl font-bold text-white mt-1">Enterprise</h3>
                <p className="text-xs text-zinc-400 mt-1">Custom infrastructure for high-scale CP bootcamps and universities.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                  ${annualBilling ? '159' : '199'}
                </span>
                <span className="text-xs text-zinc-400 font-medium">/ month</span>
              </div>

              <ul className="space-y-2.5 text-xs text-zinc-300 pt-4 border-t border-white/[0.06]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited Students & Coaches</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dedicated Bot Instance & Domain</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Custom Export Integrations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ACMP.ru & Codeforces Multi-Sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>24/7 Dedicated Support SLA</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => openDemoModal('Enterprise ($199/mo)')}
              className="w-full py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-semibold text-xs text-center transition block active:scale-[0.98]"
            >
              Contact Enterprise Sales
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 4: FINAL CALL TO ACTION */}
      <section className="glass-panel rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto border border-blue-500/20 relative overflow-hidden space-y-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-purple-600/10 pointer-events-none" />
        <div className="space-y-2 relative">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to upgrade your classroom workflow?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
            Zero complex server setup required. Run on Vercel with one-click Codeforces synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 relative">
          <button
            type="button"
            onClick={() => openDemoModal('Academy Pro ($79/mo)')}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition active:scale-[0.98]"
          >
            Request Academy Pilot
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-semibold text-xs transition active:scale-[0.98]"
          >
            Open Live Classroom
          </Link>
          <Link
            href="/assignments"
            className="px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-semibold text-xs transition active:scale-[0.98]"
          >
            Explore Problem Sets
          </Link>
        </div>
      </section>

      {/* INTERACTIVE DEMO & INQUIRY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/15 p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white tracking-tight">Pilot Request Received!</h3>
                  <p className="text-xs text-zinc-300 max-w-xs mx-auto">
                    Thank you! An instant alert has been sent to Coach Abubakr. We will reach out to get your classroom activated.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-300 space-y-2">
                  <p className="font-semibold text-white">Need an immediate setup?</p>
                  <p>Message lead instructor directly on Telegram:</p>
                  <a
                    href="https://t.me/AbubakrJ"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 font-semibold border border-blue-500/30 transition"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Chat with @AbubakrJ on Telegram ↗</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {selectedTier}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Request an Academy Pilot
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Get full access to automated problem set grading and Telegram bot automation.
                  </p>
                </div>

                {statusError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    {statusError}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Academy / School / Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. Tashkent STEM Academy"
                      value={academyName}
                      onChange={(e) => setAcademyName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-300">Your Full Name *</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Sardor Umarov"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-300">Email or Telegram *</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. @sardor or email"
                        value={emailOrTelegram}
                        onChange={(e) => setEmailOrTelegram(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Estimated Student Cohort Size</label>
                    <select
                      value={studentCount}
                      onChange={(e) => setStudentCount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="10 - 25 Students" className="bg-zinc-900">10 - 25 Students</option>
                      <option value="25 - 60 Students" className="bg-zinc-900">25 - 60 Students (Academy Pro)</option>
                      <option value="60 - 150 Students" className="bg-zinc-900">60 - 150 Students</option>
                      <option value="150+ Students (Enterprise)" className="bg-zinc-900">150+ Students (Enterprise Custom)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Specific Goals or Notes (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. We are training 30 high schoolers for the National Olympiad."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? 'Sending Request...' : 'Submit Pilot Request'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
