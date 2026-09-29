'use client';

import { Bot, Shield, Send, Terminal, CheckCircle2, AlertTriangle, Key, Zap, Bell } from 'lucide-react';

export default function TelegramBotPage() {
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
    { command: '/help', desc: 'List all commands and usage guide' },
  ];

  return (
    <div className="space-y-7 max-w-4xl mx-auto">
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

      {/* Setup Guide */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] space-y-5 shadow-2xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
          <Key className="w-4 h-4 text-amber-400" />
          Setup & Bot Pairing
        </h2>

        <div className="space-y-3.5 text-xs text-zinc-300">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3.5">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              1
            </span>
            <div>
              <p className="font-semibold text-white text-sm">Create your Bot on Telegram</p>
              <p className="text-zinc-400 mt-1 leading-relaxed">
                Open Telegram, message <span className="text-blue-400 font-mono font-medium">@BotFather</span>, and send{' '}
                <span className="font-mono bg-white/[0.08] px-1.5 py-0.5 rounded text-zinc-200">/newbot</span> to generate your secure Bot API Token.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3.5">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              2
            </span>
            <div className="w-full">
              <p className="font-semibold text-white text-sm">Store Token in Environment</p>
              <p className="text-zinc-400 mt-1">
                Add your bot token and your Telegram User ID into your server environment configuration:
              </p>
              <div className="mt-2.5 p-3 rounded-xl bg-black/60 text-xs font-mono text-emerald-400 border border-white/10 overflow-x-auto">
                TELEGRAM_BOT_TOKEN="your_bot_token_here"<br />
                TELEGRAM_ADMIN_IDS="your_telegram_numeric_id"
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3.5">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              3
            </span>
            <div>
              <p className="font-semibold text-white text-sm">Security & Access Whitelist</p>
              <p className="text-zinc-400 mt-1 leading-relaxed">
                Only Telegram User IDs specified in <span className="font-mono text-zinc-300 bg-white/[0.05] px-1 py-0.5 rounded">TELEGRAM_ADMIN_IDS</span> can trigger queries. If an unrecognized user pings your bot, it securely outputs their Telegram ID to simplify whitelisting.
              </p>
            </div>
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
              The backend background cron checks upcoming Codeforces rounds every 10 minutes and automatically sends a high-priority push reminder 30 minutes before round kickoff.
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
