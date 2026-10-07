'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Users,
  GraduationCap,
  Trophy,
  Calendar,
  BarChart3,
  BookOpen,
  Sparkles,
  Bot,
  Settings,
  Link2,
  ExternalLink,
  Printer,
  X,
  Command,
} from 'lucide-react';

interface PaletteAction {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'External';
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  action?: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const actions: PaletteAction[] = [
    { id: 'dash', title: 'Dashboard & Telemetry', category: 'Navigation', icon: LayoutDashboard, href: '/' },
    { id: 'students', title: 'Students Roster', category: 'Navigation', icon: Users, href: '/students' },
    { id: 'assignments', title: 'Problem Sets & Homework', category: 'Navigation', icon: BookOpen, href: '/assignments' },
    { id: 'leaderboard', title: 'Classroom Leaderboard', category: 'Navigation', icon: Trophy, href: '/leaderboard' },
    { id: 'contests', title: 'Codeforces Contests Schedule', category: 'Navigation', icon: Calendar, href: '/contests' },
    { id: 'analytics', title: 'AI Analytics & Weak Topics', category: 'Navigation', icon: BarChart3, href: '/analytics' },
    { id: 'classes', title: 'Classrooms Management', category: 'Navigation', icon: GraduationCap, href: '/classes' },
    { id: 'join', title: '1-Click Student Join Portal', category: 'Navigation', icon: Link2, href: '/join' },
    { id: 'showcase', title: 'Product Tour & SaaS Pricing', category: 'Navigation', icon: Sparkles, href: '/showcase' },
    { id: 'telegram', title: 'Telegram Bot Cockpit', category: 'Navigation', icon: Bot, href: '/telegram' },
    { id: 'settings', title: 'System & Bot Settings', category: 'Navigation', icon: Settings, href: '/settings' },
    {
      id: 'print',
      title: 'Print Official Report Card',
      category: 'Actions',
      icon: Printer,
      action: () => window.print(),
      shortcut: 'Ctrl+P',
    },
    {
      id: 'bot_ext',
      title: 'Open @CodeForcesStudents_Bot',
      category: 'External',
      icon: ExternalLink,
      action: () => window.open('https://t.me/CodeForcesStudents_Bot', '_blank'),
    },
    {
      id: 'coach_ext',
      title: 'View Coach Abubakr on Codeforces',
      category: 'External',
      icon: ExternalLink,
      action: () => window.open('https://codeforces.com/profile/AbubakrJ', '_blank'),
    },
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function execute(action: PaletteAction) {
    setOpen(false);
    if (action.action) {
      action.action();
    } else if (action.href) {
      router.push(action.href);
    }
  }

  function handleKeyDownInInput(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        execute(filtered[selectedIndex]);
      }
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/75 backdrop-blur-md print:hidden">
      <div className="w-full max-w-lg rounded-2xl glass-panel border border-white/15 bg-zinc-950/95 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08] gap-3">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInInput}
            placeholder="Search pages, problem sets, or actions..."
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] bg-white/[0.06] border border-white/10 text-zinc-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No results found for "{query}".
            </div>
          ) : (
            filtered.map((action, idx) => {
              const Icon = action.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => execute(action)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition select-none ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-200 border border-blue-500/30'
                      : 'text-zinc-300 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-white/[0.05] text-zinc-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium truncate">{action.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                      {action.category}
                    </span>
                    {action.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] border border-white/10 text-zinc-400 font-mono">
                        {action.shortcut}
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/[0.06] bg-black/40 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>&bull;</span>
            <span>↵ Select</span>
          </div>
          <span>Codeforces Classroom Hub</span>
        </div>
      </div>
    </div>
  );
}
