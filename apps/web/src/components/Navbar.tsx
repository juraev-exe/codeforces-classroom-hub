'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Trophy,
  Calendar,
  BarChart3,
  Bot,
  ExternalLink,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/classes', label: 'Classes', icon: GraduationCap },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/contests', label: 'Contests', icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/telegram', label: 'Telegram Bot', icon: Bot },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cf_hub_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      // ignore parse error
    }
  }, [pathname]);

  function handleLogout() {
    localStorage.removeItem('cf_hub_token');
    localStorage.removeItem('cf_hub_user');
    document.cookie = 'cf_hub_token=; path=/; max-age=0';
    setCurrentUser(null);
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              CF
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">
              Classroom<span className="text-blue-500">Hub</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-800/80 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://codeforces.com"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white border border-border rounded-lg bg-zinc-900/60 hover:bg-zinc-800/60 transition"
          >
            Codeforces.com
            <ExternalLink className="w-3 h-3" />
          </a>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-300 hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-border">
                <User className="w-3 h-3 text-blue-400" />
                {currentUser.name}
              </span>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-rose-400 border border-border rounded-lg bg-zinc-900/60 hover:bg-zinc-800/60 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-400 hover:text-white border border-blue-500/30 rounded-lg bg-blue-950/30 hover:bg-blue-600 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Teacher Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
