'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Trophy,
  Users,
  Calendar,
  BarChart3,
  Bot,
  ArrowLeft,
  Home,
  Compass,
  Code2,
  Sparkles,
  Search,
} from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  const quickLinks = [
    {
      href: '/',
      title: 'Dashboard Overview',
      desc: 'Live telemetry, classroom feed & activity',
      icon: LayoutDashboard,
      color: 'text-blue-400',
      border: 'hover:border-blue-500/30 hover:bg-blue-500/[0.04]',
    },
    {
      href: '/students',
      title: 'Students Directory',
      desc: 'Enrolled students, CF handles & ratings',
      icon: Users,
      color: 'text-emerald-400',
      border: 'hover:border-emerald-500/30 hover:bg-emerald-500/[0.04]',
    },
    {
      href: '/leaderboard',
      title: 'Class Leaderboard',
      desc: 'Rankings, rating tiers & top solvers',
      icon: Trophy,
      color: 'text-amber-400',
      border: 'hover:border-amber-500/30 hover:bg-amber-500/[0.04]',
    },
    {
      href: '/contests',
      title: 'Contest Schedule',
      desc: 'Upcoming Codeforces rounds & timers',
      icon: Calendar,
      color: 'text-purple-400',
      border: 'hover:border-purple-500/30 hover:bg-purple-500/[0.04]',
    },
    {
      href: '/analytics',
      title: 'Classroom Analytics',
      desc: 'Rating distributions & progress trends',
      icon: BarChart3,
      color: 'text-cyan-400',
      border: 'hover:border-cyan-500/30 hover:bg-cyan-500/[0.04]',
    },
    {
      href: '/telegram',
      title: 'Telegram Bot Hub',
      desc: 'Live notifications & bot commands',
      icon: Bot,
      color: 'text-pink-400',
      border: 'hover:border-pink-500/30 hover:bg-pink-500/[0.04]',
    },
  ];

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-10 px-4">
      {/* 404 Hero Card */}
      <div className="w-full max-w-3xl glass-panel rounded-3xl p-8 sm:p-12 border border-white/[0.08] shadow-2xl relative overflow-hidden text-center space-y-8">
        {/* Ambient background glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold tracking-wide uppercase shadow-sm shadow-rose-500/10">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>HTTP 404 &bull; Resource Not Found</span>
          </div>

          {/* Big Number & Title */}
          <div className="space-y-2">
            <h1 className="text-6xl sm:text-7xl font-black font-mono tracking-tight bg-gradient-to-b from-white via-zinc-200 to-zinc-600 bg-clip-text text-transparent">
              404
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <Compass className="w-6 h-6 text-blue-400 animate-spin" style={{ animationDuration: '10s' }} />
              Lost in the Codeforces Space?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              The page, student profile, or route you are looking for does not exist, has been moved, or is temporarily unavailable.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 text-xs font-semibold transition active:scale-[0.97]"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400" />
              <span>Go Back</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-lg shadow-blue-600/30 active:scale-[0.97]"
            >
              <Home className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Quick Directory Shortcuts */}
        <div className="relative pt-6 border-t border-white/[0.06] text-left space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Explore Active Working Hubs:
            </span>
            <span className="text-[11px] text-zinc-500">Click to navigate</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] ${link.border} transition-all duration-200 block`}
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-7 h-7 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                      <Icon className={`w-3.5 h-3.5 ${link.color}`} />
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-blue-300 transition truncate">
                      {link.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 line-clamp-1 pl-9">
                    {link.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
