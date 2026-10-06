'use client';

import { useState, useEffect } from 'react';
import {
  Bot,
  Shield,
  Send,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Key,
  Zap,
  Bell,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CloudLightning,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TelegramBotPage() {
  const [webhookInfo, setWebhookInfo] = useState<any>(null);
  const [testingPing, setTestingPing] = useState(false);
  const [syncingWebhook, setSyncingWebhook] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  function triggerStatus(type: 'success' | 'error' | 'info', text: string) {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  }

  useEffect(() => {
    fetchWebhookInfo();
  }, []);

  async function fetchWebhookInfo() {
    try {
      const res = await fetch('/api/telegram/webhook?action=info');
      const data = await res.json();
      if (data.ok && data.result) {
        setWebhookInfo(data.result);
      }
    } catch {}
  }

  async function handleTestPing() {
    try {
      setTestingPing(true);
      const res = await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'test' }),
      });
      const data = await res.json();
      if (data.success) {
        triggerStatus('success', 'Ping notification dispatched successfully to Telegram! ✅');
      } else {
        triggerStatus('error', data.error || 'Failed to dispatch test notification');
      }
    } catch {
      triggerStatus('error', 'Network error during Telegram ping');
    } finally {
      setTestingPing(false);
    }
  }

  async function handleSyncWebhook() {
    try {
      setSyncingWebhook(true);
      const res = await fetch('/api/telegram/webhook?action=set');
      const data = await res.json();
      if (data.success) {
        triggerStatus('success', '24/7 Cloud Webhook linked to Vercel! Works even when your PC is turned off. 🚀');
        fetchWebhookInfo();
      } else {
        triggerStatus('error', data.telegram?.description || 'Failed to link webhook with Telegram');
      }
    } catch {
      triggerStatus('error', 'Error syncing webhook');
    } finally {
      setSyncingWebhook(false);
    }
  }

  const commands = [
    { command: '/my', desc: "Show teacher's Codeforces live statistics and rating" },
    { command: '/class', desc: 'Display classroom analytics, active count, and average rating' },
    { command: '/students', desc: 'List registered students and their current Codeforces ratings' },
    { command: '/leaderboard', desc: 'Display current ranked classroom leaderboard' },
    { command: '/contests', desc: 'View upcoming Codeforces contest schedule' },
    { command: '/next', desc: 'Show countdown and start time for the next Codeforces contest' },
    { command: '/rating <handle>', desc: "Look up any Codeforces user's rating & tier" },
    { command: '/progress <handle>', desc: 'View recent rating changes and trends for a student' },
    { command: '/problems <handle>', desc: 'Breakdown of solved problem tags and practice recommendations' },
    { command: '/add <handle> [name]', desc: 'Enroll a new student directly from Telegram' },
    { command: '/ai <prompt>', desc: 'Ask the AI teaching assistant any algorithm or classroom question' },
    { command: '/help', desc: 'List all commands and usage guide' },
  ];

  return (
    <div className="space-y-7 max-w-4xl mx-auto pb-16">
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-3 backdrop-blur-xl ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/30'
                : 'bg-blue-950/90 text-blue-200 border-blue-500/30'
            }`}
          >
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{statusMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/[0.08] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Integrations & Bots
            </span>
            <span className="text-xs text-zinc-400">
              Personal Push Notification Channel
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Bot className="w-7 h-7 text-blue-400" />
            Telegram Notification & Tracker Bot
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
            Connected to your Codeforces Classroom Hub backend for instant contest reminders, leaderboard queries, and automated student performance digests.
          </p>
        </div>
      </div>

      {/* 24/7 Cloud Architecture & Webhook Live Card */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-5 bg-gradient-to-br from-blue-950/30 via-zinc-950/60 to-purple-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <CloudLightning className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  24/7 Cloud Architecture Active
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                The bot runs continuously on Vercel Edge Serverless functions. It works 24/7 without needing your personal computer to stay on.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://t.me/CodeForcesStudents_Bot"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4" />
              <span>Open @CodeForcesStudents_Bot</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleSyncWebhook}
              disabled={syncingWebhook}
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 disabled:opacity-50 text-zinc-300 font-semibold text-xs border border-white/10 transition flex items-center gap-1.5"
              title="Re-verify webhook URL with Telegram API"
            >
              {syncingWebhook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
              <span>Sync Webhook</span>
            </button>
          </div>
        </div>

        {webhookInfo && (
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-between text-xs font-mono text-zinc-300 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Destination:</span>
              <span className="text-blue-400 truncate max-w-sm">{webhookInfo.url || 'No webhook set'}</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-zinc-400">
              <span>Pending Updates: <strong className="text-white font-bold">{webhookInfo.pending_update_count || 0}</strong></span>
              {webhookInfo.ip_address && <span>Vercel Edge IP: <strong className="text-white">{webhookInfo.ip_address}</strong></span>}
            </div>
          </div>
        )}
      </div>

      {/* 24/7 Automated Contest Alerts Scheduler Card */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4 bg-gradient-to-br from-purple-950/20 via-zinc-950/60 to-emerald-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  24/7 Automated Contest Alerts Scheduler
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Vercel Cron (*/30 * * * *)
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Automatically scans Codeforces in the cloud every 30 minutes and broadcasts dual reminders: 2-hour advance registration notice and 30-minute urgent call-to-code.
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              try {
                setTestingPing(true);
                const res = await fetch('/api/telegram/cron');
                const data = await res.json();
                if (data.ok) {
                  triggerStatus('success', `Contest alert scan completed: ${data.alerted?.length || 0} alert(s) sent, ${data.skippedCount} checked.`);
                } else {
                  triggerStatus('error', data.error || 'Contest alert check failed');
                }
              } catch {
                triggerStatus('error', 'Network error during cron check');
              } finally {
                setTestingPing(false);
              }
            }}
            disabled={testingPing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-amber-200 hover:text-white font-semibold text-xs transition flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            {testingPing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
            <span>Run Alert Scan Now</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase block font-sans">Cadence</span>
            <span className="text-purple-300 font-bold">Every 30 Minutes</span>
            <span className="text-[10px] text-zinc-400 block font-sans">Cloud Cron (Zero PC Power)</span>
          </div>
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase block font-sans">Alert Lead Time</span>
            <span className="text-emerald-300 font-bold">2 Hours & 30m</span>
            <span className="text-[10px] text-zinc-400 block font-sans">Dual-tier reminder & direct links</span>
          </div>
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase block font-sans">Endpoint Health</span>
            <span className="text-cyan-300 font-bold">/api/telegram/cron</span>
            <span className="text-[10px] text-zinc-400 block font-sans">Ready & Synced</span>
          </div>
        </div>
      </div>

      {/* Available Commands */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] space-y-4 shadow-2xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Supported Telegram Commands
        </h2>

        <div className="divide-y divide-white/[0.04]">
          {commands.map((cmd) => (
            <div key={cmd.command} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 w-fit">
                {cmd.command}
              </span>
              <span className="text-xs text-zinc-400 sm:text-right">{cmd.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Automated Notifications */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] space-y-4 shadow-2xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
          <Bell className="w-4 h-4 text-purple-400" />
          Automated Cron Notifications
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-300">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
            <h3 className="font-semibold text-white flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Contest Reminders (30m Alert)
            </h3>
            <p className="text-zinc-400 leading-relaxed">
              The backend checks upcoming Codeforces rounds and automatically sends a high-priority push reminder 30 minutes before round kickoff with direct registration links.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
            <h3 className="font-semibold text-white flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Post-Round Rating Digest
            </h3>
            <p className="text-zinc-400 leading-relaxed">
              When contests conclude and Codeforces publishes official rating changes, the bot automatically sends a summary of how your students performed and their rating deltas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
