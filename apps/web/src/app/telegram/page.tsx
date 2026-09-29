'use client';

import { Bot, Shield, Send, Terminal, CheckCircle2, AlertTriangle, Key } from 'lucide-react';

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
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Bot className="w-6 h-6 text-blue-500" />
          Telegram Notification & Tracker Bot
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Connected to the classroom backend for automated contest reminders, leaderboard queries, and student reports.
        </p>
      </div>

      {/* Setup Guide */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400" />
          Setup & Configuration
        </h2>

        <div className="space-y-3 text-sm text-zinc-300">
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-border-subtle flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              1
            </span>
            <div>
              <p className="font-medium text-white">Create your Bot on Telegram</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Message <span className="text-blue-400 font-mono">@BotFather</span> on Telegram and send{' '}
                <span className="font-mono bg-zinc-800 px-1 rounded">/newbot</span> to receive your Bot Token.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-border-subtle flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              2
            </span>
            <div>
              <p className="font-medium text-white">Configure your environment (.env)</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Paste the token into your root <span className="font-mono text-zinc-300">.env</span> file:
              </p>
              <pre className="mt-2 p-2.5 rounded-lg bg-black text-xs font-mono text-emerald-400 border border-zinc-800 overflow-x-auto">
                TELEGRAM_BOT_TOKEN="your_bot_token_here"<br />
                TELEGRAM_ADMIN_IDS="123456789"
              </pre>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-border-subtle flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              3
            </span>
            <div>
              <p className="font-medium text-white">Whitelist Telegram User IDs (Security)</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Only Telegram User IDs specified in <span className="font-mono text-zinc-300">TELEGRAM_ADMIN_IDS</span>{' '}
                can query sensitive class and student data. When an unauthorized user sends a command, the bot prints their User ID for easy whitelisting.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Commands */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Supported Bot Commands
        </h2>

        <div className="divide-y divide-border-subtle">
          {commands.map((cmd) => (
            <div key={cmd.command} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-blue-400 bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-900/40 w-fit">
                {cmd.command}
              </span>
              <span className="text-xs text-zinc-400 sm:text-right">{cmd.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Automated Notifications */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          Automated Cron Notifications
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-300">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-border-subtle space-y-2">
            <h3 className="font-semibold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Contest Reminders (30m Alert)
            </h3>
            <p className="text-zinc-400">
              The bot automatically checks upcoming rounds every 10 minutes and dispatches alert messages 30 minutes before contest start time.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-border-subtle space-y-2">
            <h3 className="font-semibold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Contest Result Summaries
            </h3>
            <p className="text-zinc-400">
              After rounds conclude, rating changes and solved problem numbers for enrolled students are compiled into Telegram class reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
