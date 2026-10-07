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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthHeaders } from '@/lib/api';

interface AppSettings {
  teacherName: string;
  teacherHandle: string;
  teacherTitle?: string;
  acmpId?: string;
  telegramBotToken?: string;
  telegramAdminIds?: string;
  contestAlertEnabled: boolean;
  contestAlertMinutesBefore: number;
  ratingDigestEnabled: boolean;
  pollIntervalMinutes: number;
  cfApiKey?: string;
  cfApiSecret?: string;
  lastNotifiedContestIds?: (string | number)[];
}

interface StorageHealth {
  storageFile: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  totalStudents: number;
  totalClasses: number;
  totalSubmissions: number;
  supabaseConfigured: boolean;
}

export default function SettingsPage() {
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
  }, []);

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
        if (data.settings) setSettings(data.settings);
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
        if (data.settings) setSettings(data.settings);
        if (data.health) setHealth(data.health);
        triggerStatus('success', 'Settings successfully saved and synchronized');
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
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                System & Configuration
              </span>
              <span className="text-xs text-zinc-400">Classroom Hub Pro</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Settings className="w-7 h-7 text-blue-400" />
              Settings & Integrations
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Configure teacher profiles, Codeforces API keys, automated Telegram alerts, and classroom storage maintenance.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm">Loading classroom settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* SECTION 1: TEACHER & COACH IDENTITY */}
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

          {/* SECTION 2: TELEGRAM AUTOMATION & BOT */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Telegram Automated Alert Engine</h2>
                  <p className="text-xs text-zinc-400">Push upcoming contest reminders and rating changes to your private Telegram channel</p>
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

                <button
                  type="button"
                  onClick={handleCheckContestsNow}
                  disabled={checkingContests}
                  className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 disabled:opacity-50 text-zinc-300 font-semibold text-xs border border-white/10 transition flex items-center gap-1.5"
                >
                  {checkingContests ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                  <span>Scan Contests</span>
                </button>
              </div>
            </div>

            {/* 24/7 Cloud Architecture & Webhook Diagnostic Banner */}
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
                      title="Clear webhook to test with local long-polling"
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
                  {webhookInfo.ip_address && <span>IP: {webhookInfo.ip_address}</span>}
                </div>
              )}
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
                  <span className="text-xs font-semibold text-white block">30-Minute Contest Alerts</span>
                  <p className="text-[11px] text-zinc-400">
                    Automatically dispatch a reminder notification 30 minutes before any scheduled Codeforces round kickoff.
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
                    Send a class summary when official Codeforces contest rating changes and deltas are published.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* SECTION 3: CODEFORCES API CREDENTIALS */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Codeforces Official API Credentials</h2>
                <p className="text-xs text-zinc-400">Optional: Required for private gym contests, mashups, and elevated rate limits</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Codeforces API Key</label>
                <input
                  type="text"
                  value={settings.cfApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, cfApiKey: e.target.value })}
                  placeholder="e.g. 7a3b4c5d6e..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Codeforces API Secret</label>
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

          {/* SECTION 4: TELEMETRY CADENCE & STORAGE HEALTH */}
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
        </form>
      )}
    </div>
  );
}
