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
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-primary/30 group-hover:scale-105 group-active:scale-95 transition-all duration-200 ring-1 ring-white/20">
              <Code2 className="w-4 h-4 text-accent" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">
                Classroom<span className="text-accent font-extrabold">Hub</span>
              </span>
              <span className="hidden sm:inline-flex text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 shadow-sm shadow-accent/10">
                PRO
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/[0.04] backdrop-blur-md">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent' : 'text-zinc-500'}`} />
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 text-xs font-semibold shadow-sm transition active:scale-[0.97]"
          >
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">Student</span>
            <span>Join</span>
          </Link>

          {/* Live Telemetry Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-accent/10 border border-accent/25 text-[11px] text-accent font-semibold shadow-sm shadow-accent/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="tracking-tight">CF Live</span>
          </div>

          <a
            href="https://codeforces.com"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground glass-pill rounded-xl transition"
            title="Open official Codeforces website"
          >
            <span>CF</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
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
          </div>
        </div>
      )}
    </header>
  );
}
