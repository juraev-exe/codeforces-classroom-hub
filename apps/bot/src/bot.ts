import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or local
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

import { Telegraf } from 'telegraf';
import cron from 'node-cron';
import type {
  TeacherDashboardResponse,
  LeaderboardEntry,
  ClassSummary,
  ContestRecord,
} from '@cf-hub/types';

const token = process.env.TELEGRAM_BOT_TOKEN;
const apiUrl = process.env.API_URL || 'http://localhost:4000';
const adminIds = (process.env.TELEGRAM_ADMIN_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (!token) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN is not set. Bot will not start until configured in .env');
}

const bot = new Telegraf(token || 'dummy_token');

// Authorization Middleware
bot.use(async (ctx, next) => {
  const userId = String(ctx.from?.id);
  const username = ctx.from?.username || 'Unknown';

  if (adminIds.length > 0 && !adminIds.includes(userId)) {
    console.warn(`[Bot Auth Denied] Unauthorized access attempt by ${username} (ID: ${userId})`);
    await ctx.reply(
      `⛔ Unauthorized access. Your Telegram user ID is \`${userId}\`.\nPlease ask the administrator to whitelist your ID.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  return next();
});

// Helper fetch from API
async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${apiUrl}${endpoint}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API returned ${res.status}: ${errorText}`);
  }
  return res.json() as Promise<T>;
}

// ==========================================
// Bot Commands
// ==========================================

bot.start((ctx) => {
  ctx.reply(
    `👋 *Welcome to Codeforces Classroom Hub Bot!*\n\n` +
      `Here are the available commands:\n` +
      `• /my - Show teacher Codeforces statistics\n` +
      `• /class - Show class overview and statistics\n` +
      `• /students - List students and their ratings\n` +
      `• /leaderboard - View current class leaderboard\n` +
      `• /contests - View upcoming Codeforces contests\n` +
      `• /next - Show details for the next upcoming contest\n` +
      `• /rating <handle> - Check a user's Codeforces rating\n` +
      `• /progress <handle> - View rating progress and trend\n` +
      `• /problems <handle> - View problem statistics\n` +
      `• /help - Display this help menu`,
    { parse_mode: 'Markdown' }
  );
});

bot.help((ctx) => {
  ctx.reply(
    `📚 *Command Guide*\n\n` +
      `• \`/my\` : View teacher profile and live rating\n` +
      `• \`/class\` : Summary of active students, avg rating, solved count\n` +
      `• \`/leaderboard\` : Top ranked students in the classroom\n` +
      `• \`/contests\` : Upcoming round schedule\n` +
      `• \`/next\` : Next upcoming contest countdown\n` +
      `• \`/rating tourist\` : Check rating for any CF handle\n` +
      `• \`/problems tourist\` : View tags solved and topic breakdown`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('my', async (ctx) => {
  try {
    const data = await apiGet<TeacherDashboardResponse>('/api/me');
    const t = data.teacher;

    const message =
      `👨‍🏫 *Teacher Profile: ${t.name}* (@${t.handle})\n\n` +
      `⭐ *Rating:* ${t.rating} (${t.rank})\n` +
      `🏆 *Max Rating:* ${t.maxRating} (${t.maxRank})\n` +
      `🎯 *Problems Solved:* ${t.totalSolved}\n` +
      `📊 *Total Contests:* ${t.totalContests}\n\n` +
      `[View Web Dashboard](${process.env.WEB_URL || 'http://localhost:3000'})`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (err: any) {
    await ctx.reply(`❌ Error fetching teacher data: ${err.message}`);
  }
});

bot.command('class', async (ctx) => {
  try {
    const summary = await apiGet<ClassSummary>('/api/analytics');

    const message =
      `🏫 *Classroom Analytics Overview*\n\n` +
      `👥 *Total Students:* ${summary.totalStudents} (${summary.activeStudents} active)\n` +
      `📈 *Average Rating:* ${summary.averageRating}\n` +
      `🎯 *Median Rating:* ${summary.medianRating}\n` +
      `🌟 *Highest Rating:* ${summary.highestRating}\n` +
      `📉 *Lowest Rating:* ${summary.lowestRating}\n` +
      `✅ *Total Solved Problems:* ${summary.totalSolvedProblems}\n` +
      `📊 *Avg Solved Per Student:* ${summary.averageSolvedProblems}\n` +
      `🏆 *Total Contests Attended:* ${summary.totalContestsParticipated}`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (err: any) {
    await ctx.reply(`❌ Error fetching class data: ${err.message}`);
  }
});

bot.command('students', async (ctx) => {
  try {
    const students = await apiGet<any[]>('/api/students');
    if (!students || students.length === 0) {
      return ctx.reply('No students registered yet.');
    }

    let msg = `🎓 *Classroom Students (${students.length})*\n\n`;
    for (const s of students) {
      const rating = s.stats?.rating ? `${s.stats.rating} (${s.stats.rank})` : 'Unrated';
      const solved = s.stats?.solvedCount || 0;
      msg += `• *${s.name}* (@${s.codeforcesHandle}): ${rating} | Solved: ${solved}\n`;
    }

    await ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (err: any) {
    await ctx.reply(`❌ Error fetching students: ${err.message}`);
  }
});

bot.command('leaderboard', async (ctx) => {
  try {
    const leaderboard = await apiGet<LeaderboardEntry[]>('/api/leaderboard');
    if (!leaderboard || leaderboard.length === 0) {
      return ctx.reply('Leaderboard is currently empty.');
    }

    let msg = `🏆 *Classroom Leaderboard*\n\n`;
    msg += `Rank | Handle | Rating | Solved\n`;
    msg += `--------------------------------\n`;

    leaderboard.slice(0, 15).forEach((entry, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${entry.rank}`;
      const change = entry.recentRatingChange >= 0 ? `+${entry.recentRatingChange}` : `${entry.recentRatingChange}`;
      msg += `${medal} *${entry.handle}* - ${entry.rating} (${change}) | Solved: ${entry.solvedCount}\n`;
    });

    await ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (err: any) {
    await ctx.reply(`❌ Error fetching leaderboard: ${err.message}`);
  }
});

bot.command('contests', async (ctx) => {
  try {
    const contests = await apiGet<ContestRecord[]>('/api/contests/upcoming');
    if (!contests || contests.length === 0) {
      return ctx.reply('No upcoming contests found.');
    }

    let msg = `🗓️ *Upcoming Codeforces Contests*\n\n`;
    contests.slice(0, 5).forEach((c) => {
      const date = new Date(c.startTime).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      const hours = Math.floor(c.durationSeconds / 3600);
      const mins = Math.floor((c.durationSeconds % 3600) / 60);

      msg += `🏆 *${c.name}*\n`;
      msg += `📅 *Starts:* ${date}\n`;
      msg += `⏱️ *Duration:* ${hours}h ${mins > 0 ? mins + 'm' : ''}\n\n`;
    });

    await ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (err: any) {
    await ctx.reply(`❌ Error fetching contests: ${err.message}`);
  }
});

bot.command('next', async (ctx) => {
  try {
    const contests = await apiGet<ContestRecord[]>('/api/contests/upcoming');
    if (!contests || contests.length === 0) {
      return ctx.reply('No upcoming contests scheduled right now.');
    }

    const nextContest = contests[0];
    const startDate = new Date(nextContest.startTime);
    const diffMs = startDate.getTime() - Date.now();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    const countdown = diffMs > 0 ? `${diffHours}h ${diffMins}m` : 'Started!';

    const msg =
      `🏆 *NEXT CODEFORCES CONTEST*\n\n` +
      `*${nextContest.name}*\n\n` +
      `📅 *Date:* ${startDate.toLocaleString()}\n` +
      `⏳ *Starts in:* ${countdown}\n` +
      `⏱️ *Duration:* ${Math.floor(nextContest.durationSeconds / 3600)} hours\n\n` +
      `Prepare your templates and good luck!`;

    await ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (err: any) {
    await ctx.reply(`❌ Error fetching next contest: ${err.message}`);
  }
});

bot.command('rating', async (ctx) => {
  const parts = ctx.message.text.split(' ');
  const handle = parts[1];

  if (!handle) {
    return ctx.reply('Usage: `/rating <codeforces_handle>`', { parse_mode: 'Markdown' });
  }

  try {
    const res = await fetch(`https://codeforces.com/api/user.info?handles=${handle.trim()}`);
    const data = await res.json();

    if (data.status !== 'OK' || !data.result?.[0]) {
      return ctx.reply(`❌ Codeforces handle "${handle}" not found.`);
    }

    const user = data.result[0];
    const msg =
      `👤 *Codeforces Profile: ${user.handle}*\n\n` +
      `⭐ *Rating:* ${user.rating || 0} (${user.rank || 'unrated'})\n` +
      `🏆 *Max Rating:* ${user.maxRating || 0} (${user.maxRank || 'unrated'})\n` +
      `🌍 *Country:* ${user.country || 'N/A'}\n` +
      `🏢 *Organization:* ${user.organization || 'N/A'}\n` +
      `🤝 *Contribution:* ${user.contribution}`;

    await ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (err: any) {
    await ctx.reply(`❌ Error: ${err.message}`);
  }
});

// Contest automated reminders cron (every 10 minutes)
cron.schedule('*/10 * * * *', async () => {
  if (!token || adminIds.length === 0) return;

  try {
    const contests = await apiGet<ContestRecord[]>('/api/contests/upcoming');
    const now = Date.now();

    for (const c of contests) {
      const startTime = new Date(c.startTime).getTime();
      const diffMinutes = Math.floor((startTime - now) / 60000);

      // Check if starts in 20-35 minutes
      if (diffMinutes >= 20 && diffMinutes <= 35) {
        const msg =
          `🏆 *CODEFORCES CONTEST REMINDER*\n\n` +
          `*${c.name}*\n\n` +
          `⏱️ Starts in *~${diffMinutes} minutes*!\n` +
          `Duration: ${Math.floor(c.durationSeconds / 3600)}h\n\n` +
          `Good luck to all students!`;

        for (const adminId of adminIds) {
          try {
            await bot.telegram.sendMessage(adminId, msg, { parse_mode: 'Markdown' });
          } catch (e) {
            console.error(`Failed to send reminder to ${adminId}:`, e);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error during scheduled contest reminder check:', err);
  }
});

// Launch bot if token is present
if (token && token !== 'dummy_token') {
  bot
    .launch()
    .then(() => {
      console.log('🤖 Telegram Bot started successfully');
    })
    .catch((err) => {
      console.error('Telegram Bot failed to start:', err.message);
    });

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
