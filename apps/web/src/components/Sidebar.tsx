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
  Link2,
  Menu,
  X,
  ExternalLink,
  Radio,
  Zap,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'CORE',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/students', label: 'Students', icon: Users, badge: 'Active' },
      { href: '/classes', label: 'Classes', icon: GraduationCap },
      { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    ],
  },
  {
    title: 'TRAINING & COMPETITION',
    items: [
      { href: '/contests', label: 'Contests', icon: Calendar, badge: '4' },
      { href: '/analytics', label: 'AI Analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'SYSTEM & TOOLS',
    items: [
      { href: '/join', label: 'Student Join', icon: Link2 },
      { href: '/telegram', label: 'Telegram Bot', icon: Bot, badge: 'Live', badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderNavContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/[0.08] shrink-0">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-white text-xs shadow-lg shadow-blue-600/30 group-hover:scale-105 group-active:scale-95 transition-all ring-1 ring-white/20">
            CF
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white group-hover:text-blue-400 transition-colors">
                Classroom<span className="text-blue-500">Hub</span>
              </span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Codeforces Telemetry</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <div className="px-2.5 pb-1.5 text-[10px] font-bold tracking-wider text-zinc-500 uppercase select-none">
              {group.title}
            </div>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600/15 text-white font-semibold border border-blue-500/25 shadow-sm shadow-blue-500/5'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                          item.badgeColor ||
                          (isActive
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 font-semibold'
                            : 'bg-white/[0.05] text-zinc-400 border-white/[0.08]')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Teacher Profile Card */}
      <div className="p-3.5 border-t border-white/[0.08] shrink-0 bg-white/[0.01]">
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src="https://userpic.codeforces.org/1970880/title/66afacde68a45195.jpg"
                alt="Abubakr Juraev"
                className="w-8 h-8 rounded-xl object-cover border border-white/10"
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src =
                    'https://userpic.codeforces.org/no-avatar.jpg';
                }}
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#090b10]"></span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-zinc-100 truncate block">
                Abubakr Juraev
              </span>
              <span className="text-[10px] text-zinc-500 font-mono block">
                @AbubakrJ &bull; 693
              </span>
            </div>
          </div>

          <a
            href="https://codeforces.com/profile/AbubakrJ"
            target="_blank"
            rel="noreferrer"
            title="Open Codeforces Profile"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bottom-0 z-40 bg-[#07090e]/95 backdrop-blur-xl border-r border-white/[0.08] shadow-2xl">
        {renderNavContent()}
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 w-full h-14 bg-[#07090e]/90 backdrop-blur-md border-b border-white/[0.08] px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs ring-1 ring-white/20">
            CF
          </div>
          <span className="font-bold text-sm tracking-tight text-white">
            Classroom<span className="text-blue-500">Hub</span>
          </span>
        </Link>

        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />

          {/* Slide-out Drawer */}
          <div className="relative w-72 max-w-[85vw] h-full bg-[#07090e] border-r border-white/10 shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] transition"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  );
}
