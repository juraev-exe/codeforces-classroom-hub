'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Bot,
  RefreshCw,
  Database,
  Save,
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  Clock,
  Key,
  ShieldCheck,
  ExternalLink,
  Sliders,
  Sparkles,
  Palette,
  Trophy,
  Award,
  FileText,
  Layers,
  Code2,
  Check,
  Zap,
  Copy,
  RotateCcw,
  Cloud,
  CheckCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthHeaders } from '@/lib/api';
import type { AppSettings, BrandTheme, LeaderboardMetric, DensityMode, PotdTarget } from '@cf-hub/types';

interface StorageHealth {
  storageFile: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  totalStudents: number;
  totalClasses: number;
  totalSubmissions: number;
  supabaseConfigured: boolean;
}

type SettingsTab = 'all' | 'branding' | 'leaderboard' | 'telegram' | 'reports' | 'coach' | 'system';

const BRAND_THEMES: {
  id: BrandTheme;
  name: string;
  badge: string;
  bgGradient: string;
  glowColor: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
}[] = [
  {
    id: 'blue',
    name: 'Electric Blue',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    bgGradient: 'from-blue-600 to-indigo-600',
    glowColor: 'shadow-blue-500/25',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/50',
    dotColor: 'bg-blue-500',
  },
  {
    id: 'purple',
    name: 'Cyber Purple',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    bgGradient: 'from-purple-600 to-pink-600',
    glowColor: 'shadow-purple-500/25',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/50',
    dotColor: 'bg-purple-500',
  },
  {
    id: 'emerald',
    name: 'Olympiad Emerald',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    bgGradient: 'from-emerald-600 to-teal-600',
    glowColor: 'shadow-emerald-500/25',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/50',
    dotColor: 'bg-emerald-500',
  },
  {
    id: 'amber',
    name: 'Grandmaster Amber',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    bgGradient: 'from-amber-600 to-orange-600',
    glowColor: 'shadow-amber-500/25',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/50',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'rose',
    name: 'Crimson Rose',
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    bgGradient: 'from-rose-600 to-red-600',
    glowColor: 'shadow-rose-500/25',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/50',
    dotColor: 'bg-rose-500',
  },
  {
    id: 'cyan',
    name: 'Cyber Cyan',
    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    bgGradient: 'from-cyan-600 to-blue-600',
    glowColor: 'shadow-cyan-500/25',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/50',
    dotColor: 'bg-cyan-500',
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('all');
  const [settings, setSettings] = useState<AppSettings>({
    teacherName: 'Abubakr Juraev',
    teacherHandle: 'AbubakrJ',
    teacherTitle: 'Lead Algorithms & CP Coach',
    acmpId: '515125',
    telegramBotToken: '',
    telegramAdminIds: '',
    contestAlertEnabled: true,
    contestAlertMinutesBefore: 30,
    ratingDigestEnabled: true,
    pollIntervalMinutes: 30,
    cfApiKey: '',
    cfApiSecret: '',
    academyName: 'Codeforces Classroom Hub',
    academyTagline: 'Algorithms & Competitive Programming 2026',
    academyLogoText: 'CF',
    brandTheme: 'blue',
    leaderboardRankingMetric: 'rating',
    showUnratedInLeaderboard: true,
    minRatingFilter: 0,
    telegramWelcomeMessage: "Welcome to Coach Abubakr's Algorithms classroom! Solve problems, track ratings, and compete live.",
    potdRatingTarget: 'all',
    reportCardIssuer: 'Lead Algorithms & CP Coach',
    reportCardAccreditation: 'Classroom Hub Verified Authenticity',
    reportCardShowSignature: true,
    densityMode: 'comfortable',
  });

  const [health, setHealth] = useState<StorageHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [checkingContests, setCheckingContests] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<{
    url?: string;
    has_custom_certificate?: boolean;
    pending_update_count?: number;
    ip_address?: string;
  } | null>(null);
  const [syncingWebhook, setSyncingWebhook] = useState(false);

  // Demo pitch mode state
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [togglingDemo, setTogglingDemo] = useState(false);

  // Vercel deployment checklist state
  const [copiedEnv, setCopiedEnv] = useState(false);

  // Security masks
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [showCfSecret, setShowCfSecret] = useState(false);

  // Toast / Status feedback
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
    fetchSettings();
    fetchWebhookInfo();
    fetchDemoStatus();
  }, []);

  async function fetchDemoStatus() {
    try {
      const res = await fetch('/api/demo/roster', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setIsDemoActive(!!data.isDemoActive);
      }
    } catch {}
  }

  async function handleToggleDemo(action: 'load' | 'restore') {
    try {
      setTogglingDemo(true);
      const res = await fetch('/api/demo/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsDemoActive(action === 'load');
        triggerStatus('success', data.message || (action === 'load' ? 'Demo Olympiad cohort loaded! 🏆' : 'Authentic student roster restored! ✅'));
        fetchSettings();
      } else {
        triggerStatus('error', data.error || 'Failed to update demo mode');
      }
    } catch {
      triggerStatus('error', 'Network error updating demo mode');
    } finally {
      setTogglingDemo(false);
    }
  }

  function handleCopyVercelEnv() {
    const envTemplate = `# Codeforces Classroom Hub - Production Environment Variables
# Copy directly into Vercel Project Settings -> Environment Variables

NEXT_PUBLIC_APP_URL=https://your-academy.vercel.app
NEXT_PUBLIC_ADMIN_PIN=2026

# Telegram Bot Automation (from @BotFather)
TELEGRAM_BOT_TOKEN=${settings.telegramBotToken || 'YOUR_BOT_TOKEN_FROM_BOTFATHER'}
TELEGRAM_ADMIN_IDS=${settings.telegramAdminIds || 'YOUR_TELEGRAM_USER_ID'}

# Optional Codeforces Official API Credentials
CODEFORCES_API_KEY=${settings.cfApiKey || ''}
CODEFORCES_API_SECRET=${settings.cfApiSecret || ''}

# Optional Supabase Database Mirror (for 100% persistent cloud SQL storage)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
`;
    navigator.clipboard.writeText(envTemplate);
    setCopiedEnv(true);
    triggerStatus('success', 'Copied Vercel Environment Variables template to clipboard! 📋');
    setTimeout(() => setCopiedEnv(false), 3000);
  }

  async function fetchWebhookInfo() {
    try {
      const res = await fetch('/api/telegram/webhook?action=info', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.ok && data.result) {
        setWebhookInfo(data.result);
      }
    } catch {}
  }

  async function handleSyncWebhook() {
    try {
      setSyncingWebhook(true);
      const res = await fetch('/api/telegram/webhook?action=set', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        triggerStatus('success', '24/7 Cloud Webhook linked with Telegram! Works even with PC off. ✅');
        fetchWebhookInfo();
      } else {
        triggerStatus('error', data.telegram?.description || 'Failed to register webhook with Telegram');
      }
    } catch {
      triggerStatus('error', 'Network error linking Telegram webhook');
    } finally {
      setSyncingWebhook(false);
    }
  }

  async function handleUnsetWebhook() {
    try {
      setSyncingWebhook(true);
      const res = await fetch('/api/telegram/webhook?action=delete', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        triggerStatus('info', 'Webhook removed. Telegram bot switched to local polling mode.');
        fetchWebhookInfo();
      } else {
        triggerStatus('error', 'Failed to remove webhook');
      }
    } catch {
      triggerStatus('error', 'Network error unsetting webhook');
    } finally {
      setSyncingWebhook(false);
    }
  }

  async function fetchSettings() {
    try {
      setLoading(true);
      const res = await fetch('/api/settings', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
          }));
        }
        if (data.health) setHealth(data.health);
      }
    } catch {
      triggerStatus('error', 'Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
          }));
        }
        if (data.health) setHealth(data.health);
        triggerStatus('success', 'Customization & settings saved successfully! 🚀');
      } else {
        const err = await res.json();
        triggerStatus('error', err.error || 'Failed to save settings');
      }
    } catch {
      triggerStatus('error', 'Network error while saving settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestTelegram() {
    try {
      setTestingTelegram(true);
      const res = await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ type: 'test' }),
      });

      const data = await res.json();
      if (data.success) {
        triggerStatus('success', 'Test message delivered to Telegram successfully! ✅');
      } else {
        triggerStatus('error', data.error || 'Failed to dispatch Telegram message. Check token and Chat ID.');
      }
    } catch {
      triggerStatus('error', 'Could not reach Telegram dispatcher API');
    } finally {
      setTestingTelegram(false);
    }
  }

  async function handleCheckContestsNow() {
    try {
      setCheckingContests(true);
      const res = await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ type: 'contest_check' }),
      });
      const data = await res.json();
      if (data.success) {
        const count = data.alerted?.length || 0;
        triggerStatus(
          'info',
          count > 0
            ? `Alert dispatched for ${count} upcoming contest(s)!`
            : 'Contest scan complete: No contests starting in <30 mins.'
        );
      }
    } catch {
      triggerStatus('error', 'Failed to execute contest scan');
    } finally {
      setCheckingContests(false);
    }
  }

  async function handleClearCache() {
    if (!window.confirm('Purge cached submissions and contest participations? This will trigger fresh Codeforces syncing on next request.')) {
      return;
    }
    try {
      setClearingCache(true);
      const res = await fetch('/api/settings', { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.health) setHealth(data.health);
        triggerStatus('success', 'Telemetry cache cleared. Next visit will pull fresh data.');
      }
    } catch {
      triggerStatus('error', 'Failed to clear cache');
    } finally {
      setClearingCache(false);
    }
  }

  function handleDownloadBackup() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cf_hub_settings_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  const activeTheme = BRAND_THEMES.find((t) => t.id === settings.brandTheme) || BRAND_THEMES[0];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
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
            {statusMessage.type === 'info' && <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{statusMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/[0.08] relative overflow-hidden">
        <div className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-40 ${activeTheme.bgGradient}`} />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase border ${activeTheme.badge}`}>
                White-label & Customization
              </span>
              <span className="text-xs text-zinc-400">Classroom Hub Commercial</span>
              {isDemoActive && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Pitch Mode Active (Olympiad Cohort)</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Settings className={`w-7 h-7 ${activeTheme.textColor}`} />
              Settings & Customization Suite
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Personalize academy branding, leaderboard scoring criteria, automated Telegram notifications, and official certification sign-offs.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${activeTheme.bgGradient} hover:opacity-90 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs shadow-lg transition flex items-center gap-2`}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Settings', icon: Sliders },
            { id: 'branding', label: 'Branding & Theme', icon: Palette },
            { id: 'leaderboard', label: 'Leaderboard & Scoring', icon: Trophy },
            { id: 'telegram', label: 'Telegram & POTD', icon: Bot },
            { id: 'reports', label: 'Certification & Reports', icon: FileText },
            { id: 'coach', label: 'Coach Profile', icon: User },
            { id: 'system', label: 'API & Diagnostics', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/20 shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? activeTheme.textColor : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm">Loading classroom settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* ========================================================================= */}
          {/* SECTION 1: WHITE-LABEL & ACADEMY BRANDING                                */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'branding') && (
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
                <div className={`w-9 h-9 rounded-xl bg-purple-500/10 ${activeTheme.textColor} flex items-center justify-center border border-purple-500/20`}>
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">White-label & Academy Branding</h2>
                  <p className="text-xs text-zinc-400">Customize the academy name, sidebar monogram badge, and platform accent theme</p>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Live Brand Identity Preview</span>
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${activeTheme.bgGradient} flex items-center justify-center font-extrabold text-white text-sm shadow-xl ring-2 ring-white/20 shrink-0`}>
                      {settings.academyLogoText || 'CF'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white tracking-tight">
                          {settings.academyName || 'Codeforces Classroom Hub'}
                        </span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border ${activeTheme.badge}`}>
                          PRO
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {settings.academyTagline || 'Algorithms & Competitive Programming 2026'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-zinc-500 block">Theme Palette</span>
                    <span className={`text-xs font-semibold ${activeTheme.textColor}`}>{activeTheme.name}</span>
                  </div>
                </div>
              </div>

              {/* Brand Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300">Academy / School Name</label>
                  <input
                    type="text"
                    value={settings.academyName || ''}
                    onChange={(e) => setSettings({ ...settings, academyName: e.target.value })}
                    placeholder="e.g. Codeforces Classroom Hub or Stanford CP Lab"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition"
                  />
                  <p className="text-[10px] text-zinc-500">Appears in sidebar header, page titles, report cards, and client portals.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Logo Monogram (2-4 chars)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={settings.academyLogoText || ''}
                    onChange={(e) => setSettings({ ...settings, academyLogoText: e.target.value.toUpperCase() })}
                    placeholder="CF"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs font-mono font-bold uppercase focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition text-center"
                  />
                  <p className="text-[10px] text-zinc-500">Compact mark for the sidebar badge.</p>
                </div>

                <div className="space-y-1.5 sm:col-span-3">
                  <label className="text-xs font-semibold text-zinc-300">Cohort Subtitle / Academy Tagline</label>
                  <input
                    type="text"
                    value={settings.academyTagline || ''}
                    onChange={(e) => setSettings({ ...settings, academyTagline: e.target.value })}
                    placeholder="e.g. Algorithms & Competitive Programming 2026"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition"
                  />
                </div>
              </div>

              {/* Theme Swatch Selector */}
              <div className="space-y-2.5 pt-2">
                <label className="text-xs font-semibold text-zinc-300 block">Brand Accent Color Theme</label>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  {BRAND_THEMES.map((theme) => {
                    const isSelected = (settings.brandTheme || 'blue') === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSettings({ ...settings, brandTheme: theme.id })}
                        className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between gap-3 relative ${
                          isSelected
                            ? `${theme.borderColor} bg-white/[0.06] shadow-lg ring-1 ring-white/20`
                            : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`w-6 h-6 rounded-xl bg-gradient-to-br ${theme.bgGradient} shadow-md`} />
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{theme.name}</span>
                          <span className={`text-[10px] ${theme.textColor} uppercase font-mono font-semibold`}>
                            {theme.id}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: LEADERBOARD & SCORING RULES                                   */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'leaderboard') && (
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Leaderboard & Competition Rules</h2>
                  <p className="text-xs text-zinc-400">Configure default ranking formulas, unrated coder handling, and UI density</p>
                </div>
              </div>

              {/* Default Ranking Metric */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-zinc-300 block">Default Standings Metric</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'rating' as LeaderboardMetric,
                      title: 'Codeforces Rating',
                      desc: 'Rank by live official Codeforces rating. Standard benchmark.',
                      icon: Zap,
                    },
                    {
                      id: 'solved' as LeaderboardMetric,
                      title: 'Problems Solved',
                      desc: 'Rank by unique accepted problems solved on Codeforces.',
                      icon: CheckCircle2,
                    },
                    {
                      id: 'contests' as LeaderboardMetric,
                      title: 'Contest Participation',
                      desc: 'Rank by number of rated Codeforces rounds attended.',
                      icon: Trophy,
                    },
                  ].map((metric) => {
                    const isSelected = (settings.leaderboardRankingMetric || 'rating') === metric.id;
                    const Icon = metric.icon;
                    return (
                      <button
                        key={metric.id}
                        type="button"
                        onClick={() => setSettings({ ...settings, leaderboardRankingMetric: metric.id })}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
                            : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-zinc-400'}`} />
                          {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                        </div>
                        <span className="text-xs font-bold text-white block">{metric.title}</span>
                        <p className="text-[11px] text-zinc-400 mt-1">{metric.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Leaderboard Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <label className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.showUnratedInLeaderboard !== false}
                    onChange={(e) => setSettings({ ...settings, showUnratedInLeaderboard: e.target.checked })}
                    className="mt-0.5 rounded border-white/20 bg-zinc-900 text-blue-600 focus:ring-blue-500/40"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">Include Unrated Coders</span>
                    <p className="text-[11px] text-zinc-400">
                      When enabled, coders without rated contest experience appear at the base of the table with unrated badges.
                    </p>
                  </div>
                </label>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                  <label className="text-xs font-semibold text-white block">Minimum Rating Floor Filter</label>
                  <input
                    type="number"
                    min={0}
                    max={4000}
                    step={100}
                    value={settings.minRatingFilter || 0}
                    onChange={(e) => setSettings({ ...settings, minRatingFilter: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-500/60"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Filter out coders whose rating is below this threshold by default (0 = show all).
                  </p>
                </div>
              </div>

              {/* Density Mode */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-zinc-300 block">Table UI Density Mode</label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  {[
                    { id: 'comfortable' as DensityMode, label: 'Comfortable', desc: 'Spacious padding, ideal for desktops' },
                    { id: 'compact' as DensityMode, label: 'Compact Density', desc: 'Tight rows, ideal for classrooms & projectors' },
                  ].map((mode) => {
                    const isSelected = (settings.densityMode || 'comfortable') === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setSettings({ ...settings, densityMode: mode.id })}
                        className={`p-3 rounded-xl border text-left transition ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500/50 text-white'
                            : 'bg-white/[0.02] border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold block">{mode.label}</span>
                        <span className="text-[10px] text-zinc-500">{mode.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: TELEGRAM BOT TEMPLATES & POTD                                 */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'telegram') && (
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">Telegram Bot & Problem of the Day (POTD)</h2>
                    <p className="text-xs text-zinc-400">Configure welcome greetings, POTD difficulty filters, and automated contest dispatches</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://t.me/CodeForcesStudents_Bot"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 active:scale-95 text-blue-400 font-semibold text-xs border border-blue-500/30 transition flex items-center gap-1.5"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Open @CodeForcesStudents_Bot</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={testingTelegram}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 active:scale-95 disabled:opacity-50 text-indigo-300 font-semibold text-xs border border-indigo-500/30 transition flex items-center gap-1.5"
                  >
                    {testingTelegram ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Test Telegram Ping</span>
                  </button>
                </div>
              </div>

              {/* 24/7 Cloud Webhook Diagnostic Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${webhookInfo?.url ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    <div>
                      <span className="text-xs font-bold text-white tracking-wide">
                        {webhookInfo?.url ? '24/7 Cloud Webhook Active' : 'Polling Mode (Local Only)'}
                      </span>
                      <p className="text-[11px] text-zinc-400">
                        {webhookInfo?.url
                          ? 'Telegram routes messages to Vercel edge servers. Works 24/7 even when your PC is turned off.'
                          : 'No cloud webhook is set. Bot only runs if local terminal process is active.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSyncWebhook}
                      disabled={syncingWebhook}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
                    >
                      {syncingWebhook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      <span>Sync 24/7 Cloud Webhook</span>
                    </button>

                    {webhookInfo?.url && (
                      <button
                        type="button"
                        onClick={handleUnsetWebhook}
                        disabled={syncingWebhook}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 text-zinc-400 hover:text-zinc-200 text-xs border border-white/10 transition"
                      >
                        Unset
                      </button>
                    )}
                  </div>
                </div>

                {webhookInfo?.url && (
                  <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between text-[10px] text-zinc-400 font-mono gap-2">
                    <span className="truncate max-w-md">URL: {webhookInfo.url}</span>
                    <span>Pending Updates: {webhookInfo.pending_update_count || 0}</span>
                  </div>
                )}
              </div>

              {/* Bot Welcome Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Custom Telegram Welcome Message (/start)</label>
                <textarea
                  rows={3}
                  value={settings.telegramWelcomeMessage || ''}
                  onChange={(e) => setSettings({ ...settings, telegramWelcomeMessage: e.target.value })}
                  placeholder="Welcome to Coach Abubakr's Algorithms classroom! Solve problems, track ratings, and compete live."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500/60 transition resize-none"
                />
                <p className="text-[10px] text-zinc-500">Dispatched to students and guests upon starting the bot.</p>
              </div>

              {/* POTD Difficulty Target */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 block">Problem of the Day (POTD) Difficulty Target</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'all' as PotdTarget, label: 'All Levels (800 - 2000+)', subtitle: 'Mixed variety' },
                    { id: '800-1200' as PotdTarget, label: 'Div. 3 (800 - 1200)', subtitle: 'Beginner fundamentals' },
                    { id: '1200-1600' as PotdTarget, label: 'Div. 2 (1200 - 1600)', subtitle: 'Intermediate practice' },
                    { id: '1600-2000' as PotdTarget, label: 'Div. 1/2 (1600 - 2000)', subtitle: 'Olympiad hard' },
                  ].map((target) => {
                    const isSelected = (settings.potdRatingTarget || 'all') === target.id;
                    return (
                      <button
                        key={target.id}
                        type="button"
                        onClick={() => setSettings({ ...settings, potdRatingTarget: target.id })}
                        className={`p-3 rounded-xl border text-left transition ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-md'
                            : 'bg-white/[0.02] border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold block">{target.label}</span>
                        <span className="text-[10px] text-zinc-500">{target.subtitle}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.contestAlertEnabled}
                    onChange={(e) => setSettings({ ...settings, contestAlertEnabled: e.target.checked })}
                    className="mt-0.5 rounded border-white/20 bg-zinc-900 text-blue-600 focus:ring-blue-500/40"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">Pre-Contest Kickoff Alerts</span>
                    <p className="text-[11px] text-zinc-400">
                      Notify classroom {settings.contestAlertMinutesBefore || 30} minutes before scheduled Codeforces rounds.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.ratingDigestEnabled}
                    onChange={(e) => setSettings({ ...settings, ratingDigestEnabled: e.target.checked })}
                    className="mt-0.5 rounded border-white/20 bg-zinc-900 text-blue-600 focus:ring-blue-500/40"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">Post-Contest Rating Digests</span>
                    <p className="text-[11px] text-zinc-400">
                      Send class delta summaries as soon as official rating updates drop.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 4: REPORT CARD & ACADEMIC CERTIFICATION                          */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'reports') && (
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Report Card & Certification Branding</h2>
                  <p className="text-xs text-zinc-400">Configure printable PDF report cards, accreditation seals, and coach sign-offs</p>
                </div>
              </div>

              {/* Live Mini Preview of Sign-off */}
              <div className="p-4 rounded-2xl bg-white text-black font-sans space-y-3">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
                  Report Card Print Seal Mockup (Bottom of PDF)
                </span>
                <div className="border-t-2 border-black pt-3 flex justify-between items-end text-xs">
                  <div>
                    <p className="font-bold text-black uppercase">{settings.teacherName || 'ABUBAKR JURAEV'}</p>
                    <p className="text-gray-600">{settings.reportCardIssuer || settings.teacherTitle || 'Lead Algorithms & CP Coach'}</p>
                    <p className="text-gray-500 font-mono text-[10px]">
                      CF: @{settings.teacherHandle} {settings.acmpId ? `| ACMP: #${settings.acmpId}` : ''}
                    </p>
                  </div>
                  {settings.reportCardShowSignature !== false && (
                    <div className="text-right space-y-1">
                      <div className="w-36 border-b border-black mb-1"></div>
                      <p className="text-[10px] text-gray-500">Instructor Endorsement Signature</p>
                      <p className="text-[9px] text-gray-400 font-semibold">{settings.reportCardAccreditation || 'Classroom Hub Verified Authenticity'}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Report Card Issuer Designation</label>
                  <input
                    type="text"
                    value={settings.reportCardIssuer || ''}
                    onChange={(e) => setSettings({ ...settings, reportCardIssuer: e.target.value })}
                    placeholder="e.g. Lead Algorithms & CP Coach or Department Head"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500/60 transition"
                  />
                  <p className="text-[10px] text-zinc-500">Official title printed under the instructor's name.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Accreditation & Seal Text</label>
                  <input
                    type="text"
                    value={settings.reportCardAccreditation || ''}
                    onChange={(e) => setSettings({ ...settings, reportCardAccreditation: e.target.value })}
                    placeholder="e.g. Classroom Hub Verified Authenticity"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500/60 transition"
                  />
                  <p className="text-[10px] text-zinc-500">Verification note on generated academic certificates.</p>
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.reportCardShowSignature !== false}
                  onChange={(e) => setSettings({ ...settings, reportCardShowSignature: e.target.checked })}
                  className="mt-0.5 rounded border-white/20 bg-zinc-900 text-emerald-600 focus:ring-emerald-500/40"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white block">Include Signature Line</span>
                  <p className="text-[11px] text-zinc-400">
                    Print an official pen signature bar and institutional seal line on student grade cards.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 5: TEACHER & COACH IDENTITY                                      */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'coach') && (
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Teacher & Coach Profile</h2>
                  <p className="text-xs text-zinc-400">Identifies the lead instructor across the dashboard, leaderboards, and bot</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Teacher Display Name</label>
                  <input
                    type="text"
                    value={settings.teacherName}
                    onChange={(e) => setSettings({ ...settings, teacherName: e.target.value })}
                    placeholder="e.g. Abubakr Juraev"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                    <span>Codeforces Handle</span>
                    <a
                      href={`https://codeforces.com/profile/${settings.teacherHandle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-mono"
                    >
                      <span>View CF Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-zinc-500 text-xs font-mono select-none">@</span>
                    <input
                      type="text"
                      value={settings.teacherHandle}
                      onChange={(e) => setSettings({ ...settings, teacherHandle: e.target.value })}
                      placeholder="AbubakrJ"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Professional Title / Role</label>
                  <input
                    type="text"
                    value={settings.teacherTitle || ''}
                    onChange={(e) => setSettings({ ...settings, teacherTitle: e.target.value })}
                    placeholder="Lead Algorithms & CP Coach"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                    <span>ACMP.ru User ID</span>
                    {settings.acmpId && (
                      <a
                        href={`https://acmp.ru/index.asp?main=user&id=${settings.acmpId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-mono"
                      >
                        <span>ACMP Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </label>
                  <input
                    type="text"
                    value={settings.acmpId || ''}
                    onChange={(e) => setSettings({ ...settings, acmpId: e.target.value })}
                    placeholder="515125"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 6: API KEYS & STORAGE HEALTH                                     */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'system') && (
            <>
              {/* Telegram & CF Credentials */}
              <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-xl space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">API Credentials & Telegram Keys</h2>
                    <p className="text-xs text-zinc-400">Configure bot token and Codeforces official API credentials</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Telegram Bot Token</label>
                    <div className="relative">
                      <input
                        type={showTelegramToken ? 'text' : 'password'}
                        value={settings.telegramBotToken || ''}
                        onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                        placeholder="e.g. 123456789:ABCdefGHIjkl..."
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTelegramToken(!showTelegramToken)}
                        className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition"
                      >
                        {showTelegramToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-500">Obtained from @BotFather on Telegram.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Authorized Recipient / Admin Chat IDs</label>
                    <input
                      type="text"
                      value={settings.telegramAdminIds || ''}
                      onChange={(e) => setSettings({ ...settings, telegramAdminIds: e.target.value })}
                      placeholder="e.g. 585721832, -100123456789"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition"
                    />
                    <p className="text-[10px] text-zinc-500">Comma-separated numeric User IDs or Group Chat IDs.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Codeforces API Key (Optional)</label>
                    <input
                      type="text"
                      value={settings.cfApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, cfApiKey: e.target.value })}
                      placeholder="e.g. 7a3b4c5d6e..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Codeforces API Secret (Optional)</label>
                    <div className="relative">
                      <input
                        type={showCfSecret ? 'text' : 'password'}
                        value={settings.cfApiSecret || ''}
                        onChange={(e) => setSettings({ ...settings, cfApiSecret: e.target.value })}
                        placeholder="e.g. 98f7e6d5c4..."
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCfSecret(!showCfSecret)}
                        className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition"
                      >
                        {showCfSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Storage Health & Maintenance */}
              <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-xl space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">Telemetry Storage & Health Diagnostics</h2>
                    <p className="text-xs text-zinc-400">Classroom offline store status, sync intervals, and system maintenance</p>
                  </div>
                </div>

                {/* Sync Cadence Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 block">Telemetry Sync Polling Cadence</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[15, 30, 60].map((interval) => (
                      <button
                        key={interval}
                        type="button"
                        onClick={() => setSettings({ ...settings, pollIntervalMinutes: interval })}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                          settings.pollIntervalMinutes === interval
                            ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-md shadow-blue-500/10'
                            : 'bg-white/[0.02] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        Every {interval} minutes
                      </button>
                    ))}
                  </div>
                </div>

                {/* Health KPI Cards */}
                {health && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Storage File</span>
                      <span className="text-xs font-mono font-bold text-white truncate block mt-0.5">{health.storageFile}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{health.fileSizeFormatted}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Total Students</span>
                      <span className="text-sm font-mono font-bold text-blue-400 block mt-0.5">{health.totalStudents}</span>
                      <span className="text-[10px] text-zinc-500">Active roster</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Cached Submissions</span>
                      <span className="text-sm font-mono font-bold text-emerald-400 block mt-0.5">{health.totalSubmissions}</span>
                      <span className="text-[10px] text-zinc-500">Fast local queries</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Cloud Mirror</span>
                      <span className="text-xs font-semibold text-purple-300 block mt-0.5">
                        {health.supabaseConfigured ? 'Supabase Sync OK' : 'Local Fallback'}
                      </span>
                      <span className="text-[10px] text-zinc-500">Persistence layer</span>
                    </div>
                  </div>
                )}

                {/* Maintenance Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadBackup}
                      className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 text-zinc-300 text-xs font-semibold border border-white/10 transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Export Settings JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearCache}
                      disabled={clearingCache}
                      className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 disabled:opacity-50 text-rose-300 text-xs font-semibold border border-rose-500/25 transition flex items-center gap-1.5"
                    >
                      {clearingCache ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                      <span>Purge Telemetry Cache</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save All Settings</span>
                  </button>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION 6B: COMMERCIAL DEMO PITCH MODE                                   */}
              {/* ========================================================================= */}
              <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white tracking-tight">Sales Pitch & Demo Mode</h2>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isDemoActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-zinc-800 text-zinc-400'}`}>
                          {isDemoActive ? 'Active Demo Cohort' : 'Authentic Roster'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">Instantly populate a vibrant 6-student Olympiad team across all ranks for client presentations</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isDemoActive ? (
                      <button
                        type="button"
                        onClick={() => handleToggleDemo('restore')}
                        disabled={togglingDemo}
                        className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold text-xs active:scale-95 disabled:opacity-50 transition flex items-center gap-2 shadow-sm"
                      >
                        {togglingDemo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        <span>Restore Authentic Student Roster</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleDemo('load')}
                        disabled={togglingDemo}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs active:scale-95 disabled:opacity-50 transition flex items-center gap-2 shadow-lg shadow-amber-600/20"
                      >
                        {togglingDemo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>Load Sample Olympiad Cohort</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Presenting to school principals, investors, or academy clients? Instead of showing an empty classroom or exposing private student data, 1-click loads a balanced competitive programming cohort with complete solved problem telemetry:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                      <div className="text-[10px] uppercase font-bold text-purple-400">Candidate Master</div>
                      <div className="text-xs font-mono font-bold text-white mt-0.5">1942</div>
                      <div className="text-[10px] text-zinc-400 truncate">Sardor U.</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                      <div className="text-[10px] uppercase font-bold text-blue-400">Expert</div>
                      <div className="text-xs font-mono font-bold text-white mt-0.5">1685</div>
                      <div className="text-[10px] text-zinc-400 truncate">Madina K.</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                      <div className="text-[10px] uppercase font-bold text-cyan-400">Specialist</div>
                      <div className="text-xs font-mono font-bold text-white mt-0.5">1430</div>
                      <div className="text-[10px] text-zinc-400 truncate">Jasur T.</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <div className="text-[10px] uppercase font-bold text-emerald-400">Pupil</div>
                      <div className="text-xs font-mono font-bold text-white mt-0.5">1240</div>
                      <div className="text-[10px] text-zinc-400 truncate">Shoxrux B.</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-500/10 border border-zinc-500/20 text-center">
                      <div className="text-[10px] uppercase font-bold text-zinc-400">Newbie</div>
                      <div className="text-xs font-mono font-bold text-white mt-0.5">988</div>
                      <div className="text-[10px] text-zinc-400 truncate">Dilshod N.</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-700/10 border border-zinc-700/20 text-center">
                      <div className="text-[10px] uppercase font-bold text-zinc-500">Unrated</div>
                      <div className="text-xs font-mono font-bold text-zinc-400 mt-0.5">New</div>
                      <div className="text-[10px] text-zinc-400 truncate">Aziza M.</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Your genuine classroom roster is backed up safely to <code className="text-zinc-300 font-mono text-[10px] bg-black/40 px-1 py-0.5 rounded">classroom_data.real_backup.json</code> and can be restored at any time.</span>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION 6C: 24/7 CLOUD READINESS & VERCEL CHECKLIST                       */}
              {/* ========================================================================= */}
              <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white tracking-tight">24/7 Cloud Architecture & Vercel Readiness</h2>
                      <p className="text-xs text-zinc-400">Serverless zero-maintenance deployment checklist with 1-click environment sync</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyVercelEnv}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs active:scale-95 transition flex items-center gap-2 shadow-lg shadow-cyan-600/20"
                    >
                      {copiedEnv ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedEnv ? 'Copied .env Template!' : 'Copy Vercel Environment Variables'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Next.js Edge Runtime</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Ready</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      API routes and webhooks run serverlessly with sub-second response times on global CDN edges.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Cloud Webhook</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${webhookInfo?.url ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                        {webhookInfo?.url ? 'Connected 24/7' : 'Local Polling'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Telegram dispatches incoming student commands directly into Vercel even when your laptop is offline.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Database Storage</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${health?.supabaseConfigured ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-purple-400 bg-purple-500/10 border-purple-500/20'}`}>
                        {health?.supabaseConfigured ? 'Supabase Sync OK' : 'Local + Cloud JSON'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Dual-layer data persistence: automatic JSON fallback with optional instant Supabase PostgreSQL replication.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span>DEPLOYMENT QUICK-START COMMANDS</span>
                    <span>Bash / PowerShell</span>
                  </div>
                  <pre className="text-blue-300 text-[11px] leading-relaxed overflow-x-auto whitespace-pre p-2 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                    {`# 1. Login & link project with Vercel\nvercel login && vercel link\n\n# 2. Push production build with configured env vars\nvercel --prod`}
                  </pre>
                </div>
              </div>
            </>
          )}

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className={`px-8 py-3 rounded-2xl bg-gradient-to-r ${activeTheme.bgGradient} hover:opacity-90 active:scale-95 disabled:opacity-50 text-white font-bold text-xs shadow-xl transition flex items-center gap-2`}
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save & Apply Customization</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
