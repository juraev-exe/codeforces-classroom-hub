'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Trophy,
  Calendar,
  BarChart3,
  Bot,
  ExternalLink,
  Menu,
  X,
  Code2,
  Sparkles,
  Zap,
  Radio,
  ArrowRight,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/classes', label: 'Classes', icon: GraduationCap },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/contests', label: 'Contests', icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/telegram', label: 'Telegram', icon: Bot },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-3 z-50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-all">
      <div className="glass-panel rounded-2xl px-3.5 sm:px-5 h-14 flex items-center justify-between shadow-2xl shadow-black/60 border border-white/[0.08] relative overflow-hidden">
        {/* Subtle top ambient highlight */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent pointer-events-none" />

        {/* Brand */}
        <div className="flex items-center gap-5 sm:gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-blue-500/30 group-hover:scale-105 group-active:scale-95 transition-all duration-200 ring-1 ring-white/20">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">
                Classroom<span className="text-blue-400 font-extrabold">Hub</span>
              </span>
              <span className="hidden sm:inline-flex text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10">
                PRO
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] backdrop-blur-md">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600/20 text-white shadow-sm border border-blue-500/30 text-blue-300'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-zinc-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side telemetry & External CF */}
        <div className="flex items-center gap-2.5">
          {/* Quick Join Link Button */}
          <Link
            href="/join"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold shadow-sm transition active:scale-[0.97]"
          >
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Student</span>
            <span>Join</span>
          </Link>

          {/* Telegram Bot Link */}
          <a
            href="https://t.me/CodeForcesStudents_Bot"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-pill hover:bg-white/[0.08] text-xs text-zinc-300 font-medium transition"
            title="Open Codeforces Telegram Bot"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Bot</span>
          </a>

          {/* Live Telemetry Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-400 font-semibold shadow-sm shadow-emerald-950/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="tracking-tight">CF Live</span>
          </div>

          <a
            href="https://codeforces.com"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white glass-pill rounded-xl transition"
            title="Open official Codeforces website"
          >
            <span>CF</span>
            <ExternalLink className="w-3 h-3 text-zinc-500" />
          </a>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 glass-panel rounded-2xl p-3 border border-white/10 shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                    : 'text-zinc-300 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
              </Link>
            );
          })}

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between px-2 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Radio className="w-3 h-3 animate-pulse" /> Telemetry Online
            </span>
            <a
              href="https://t.me/CodeForcesStudents_Bot"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-cyan-400 hover:underline"
            >
              <Bot className="w-3.5 h-3.5" /> Telegram Bot
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
