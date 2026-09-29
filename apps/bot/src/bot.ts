import dotenv from 'dotenv';
import path from 'path';

// Load .env from monorepo root or local directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
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
const webUrl = process.env.WEB_URL || 'http://localhost:3000';
const adminIds = (process.env.TELEGRAM_ADMIN_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (!token) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN is not set. Bot will not start until configured in .env');
}

const bot = new Telegraf(token || 'dummy_token');

// Helper fetch from API
async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${apiUrl}${endpoint}`);
  if (!res.ok) {
    const errorText = await res.text();
    let parsed: any;
    try {
      parsed = JSON.parse(errorText);
    } catch {}
    throw new Error(parsed?.error || `API returned ${res.status}: ${errorText}`);
  }
  return res.json() as Promise<T>;
}

async function apiPost<T>(endpoint: string, body: any): Promise<T> {
  const res = await fetch(`${apiUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorText = await res.text();
    let parsed: any;
    try {
      parsed = JSON.parse(errorText);
    } catch {}
    throw new Error(parsed?.error || `API returned ${res.status}: ${errorText}`);
  }
  return res.json() as Promise<T>;
}

// ==========================================
// Bot Commands
// ==========================================

bot.start((ctx) => {
  ctx.reply(
    `👋 *Welcome to Codeforces Classroom Hub Bot!*\n` +
      `_Managed by Abubakr Juraev (@AbubakrJ)_\n\n` +
      `Students can join the classroom instantly:\n` +
      `• \`/join <cf_handle> [Full Name]\` - Enroll in classroom\n` +
      `• \`/link\` - Get the 1-click web join link\n\n` +
      `Classroom & Stats Commands:\n` +
      `• \`/my\` - View teacher profile & stats\n` +
      `• \`/class\` - View classroom statistics\n` +
      `• \`/students\` - View enrolled students\n` +
      `• \`/leaderboard\` - View current classroom rankings\n` +
      `• \`/contests\` - View upcoming Codeforces rounds\n` +
      `• \`/next\` - Next contest countdown\n` +
      `• \`/rating <handle>\` - Check user Codeforces rating\n` +
      `• \`/problems <handle>\` - View solved problems breakdown\n` +
      `• \`/help\` - Show this help menu\n\n` +
      `🌐 [Open Classroom Dashboard](${webUrl})`,
    { parse_mode: 'Markdown' }
  );
});

bot.help((ctx) => {
  ctx.reply(
    `📚 *Codeforces Classroom Hub Guide*\n\n` +
      `• \`/join <handle> [name]\` : Enroll directly in the classroom\n` +
      `• \`/link\` : Shareable student join invite URL\n` +
      `• \`/my\` : Teacher Abubakr Juraev profile & live stats\n` +
      `• \`/class\` : Class overview (avg rating, total solved, students)\n` +
      `• \`/students\` : Roster of enrolled students and their ratings\n` +
      `• \`/leaderboard\` : Top ranked students in the classroom\n` +
      `• \`/contests\` : Upcoming official Codeforces rounds\n` +
      `• \`/next\` : Countdown to the nearest upcoming round\n` +
      `• \`/rating <handle>\` : Real-time rating check for any CF handle\n` +
      `• \`/problems <handle>\` : Solved count and activity breakdown\n\n` +
      `🌐 Dashboard: ${webUrl}`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('link', (ctx) => {
  ctx.reply(
    `🔗 *Student Classroom Join Link*\n\n` +
      `Share this link with your students to automatically join the classroom:\n` +
      `👉 \`${webUrl}/join\`\n\n` +
      `Or students can message this bot (@CodeForcesStudents_Bot):\n` +
      `\`/join <handle> [Full Name]\`\n\n` +
      `_No passwords or login required!_`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('join', async (ctx) => {
  const text = ctx.message.text.trim();
  const parts = text.split(/\s+/).slice(1);

  if (parts.length === 0) {
    return ctx.reply(
      `ℹ️ *How to join the classroom:*\n\n` +
        `Send: \`/join <CF_Handle> [Your Full Name]\`\n\n` +
        `*Examples:*\n` +
        `• \`/join tourist Gennady Korotkevich\`\n` +
        `• \`/join Petr Petr Mitrichev\`\n\n` +
        `Or use the 1-click web join page:\n` +
        `🔗 ${webUrl}/join`,
      { parse_mode: 'Markdown' }
    );
  }

  const rawHandle = parts[0].replace(/^@/, '');
  const name = parts.slice(1).join(' ') || rawHandle;

  try {
    // 1. Check if user already exists
    const existingStudents = await apiGet<any[]>('/api/students');
    const existing = existingStudents.find(
      (s) => s.codeforcesHandle.toLowerCase() === rawHandle.toLowerCase()
    );

    if (existing) {
      const stats = existing.stats;
      const r = stats?.rating || 'Unrated';
      const rank = stats?.rank || 'unrated';
      const solved = stats?.solvedCount || 0;
      return ctx.reply(
        `✅ *Already Enrolled!*\n\n` +
          `👤 *Name:* ${existing.name}\n` +
          `🎯 *Handle:* @${existing.codeforcesHandle}\n` +
          `⭐ *Rating:* ${r} (${rank})\n` +
          `✅ *Solved:* ${solved} problems\n\n` +
          `[View Classroom Roster](${webUrl}/students)`,
        { parse_mode: 'Markdown' }
      );
    }

    // 2. Fetch available classes
    const classes = await apiGet<any[]>('/api/classes');
    if (!classes || classes.length === 0) {
      return ctx.reply('❌ No active classroom found on the server. Please notify the teacher.');
    }
    const targetClass = classes[0];

    await ctx.reply(`⏳ Validating Codeforces handle \`@${rawHandle}\` and syncing submissions...`, {
      parse_mode: 'Markdown',
    });

    // 3. Register student
    const newStudent = await apiPost<any>('/api/students', {
      name,
      codeforcesHandle: rawHandle,
      classId: targetClass.id,
      group: 'Standard',
    });

    // 4. Sync immediately
    try {
      await apiPost<any>(`/api/students/${newStudent.id}/sync`, {});
    } catch {
      // background sync handles it if already triggered
    }

    // 5. Get final student details
    const updated = await apiGet<any>(`/api/students/${newStudent.id}`);
    const stats = updated.stats;
    const rating = stats?.rating || 'Unrated';
    const rank = stats?.rank || 'unrated';
    const maxRating = stats?.maxRating || 'N/A';
    const solved = stats?.solvedCount || 0;

    await ctx.reply(
      `🎉 *Successfully Enrolled in Classroom Hub!*\n\n` +
        `👤 *Name:* ${updated.name}\n` +
        `🎯 *Codeforces Handle:* @${updated.codeforcesHandle}\n` +
        `⭐ *Rating:* ${rating} (${rank})\n` +
        `🏆 *Max Rating:* ${maxRating}\n` +
        `✅ *Problems Solved:* ${solved}\n` +
        `🏫 *Classroom:* ${targetClass.name}\n\n` +
        `Your daily solves and contest performances are now actively tracked!\n` +
        `🏆 [View Leaderboard](${webUrl}/leaderboard)`,
      { parse_mode: 'Markdown' }
    );
  } catch (err: any) {
    await ctx.reply(`❌ Enrollment error: ${err.message}`);
  }
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
      `🌐 [View Web Dashboard](${webUrl})`;

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
      return ctx.reply('No students registered yet. Use `/join <handle> [name]` to register!');
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
    const user = await apiGet<any>(`/api/codeforces/user/${handle.trim()}`);

    const msg =
      `👤 *Codeforces Profile: ${user.handle}*\n\n` +
      `⭐ *Rating:* ${user.rating || 0} (${user.rank || 'unrated'})\n` +
      `🏆 *Max Rating:* ${user.maxRating || 0} (${user.maxRank || 'unrated'})\n` +
      `🌍 *Country:* ${user.country || 'N/A'}\n` +
      `🏢 *Organization:* ${user.organization || 'N/A'}\n` +
      `🤝 *Contribution:* ${user.contribution || 0}`;

    await ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (err: any) {
    await ctx.reply(`❌ Codeforces handle "${handle}" not found or error: ${err.message}`);
  }
});

bot.command('problems', async (ctx) => {
  const parts = ctx.message.text.split(' ');
  const handle = parts[1];

  if (!handle) {
    return ctx.reply('Usage: `/problems <codeforces_handle>`', { parse_mode: 'Markdown' });
  }

  try {
    const students = await apiGet<any[]>('/api/students');
    const matched = students.find((s) => s.codeforcesHandle.toLowerCase() === handle.trim().toLowerCase());

    if (matched && matched.stats) {
      const s = matched.stats;
      return ctx.reply(
        `📊 *Classroom Solved Stats: @${matched.codeforcesHandle}* (${matched.name})\n\n` +
          `✅ *Total Solved:* ${s.solvedCount} problems\n` +
          `⭐ *Rating:* ${s.rating || 'Unrated'} (${s.rank || 'unrated'})\n` +
          `🏆 *Contests Attended:* ${s.contestCount || 0}\n\n` +
          `[View Profile on Dashboard](${webUrl}/students/${matched.id})`,
        { parse_mode: 'Markdown' }
      );
    }

    const user = await apiGet<any>(`/api/codeforces/user/${handle.trim()}`);
    ctx.reply(
      `📊 *Codeforces Profile: @${user.handle}*\n\n` +
        `⭐ *Rating:* ${user.rating || 0} (${user.rank || 'unrated'})\n` +
        `🏆 *Max Rating:* ${user.maxRating || 0} (${user.maxRank || 'unrated'})\n\n` +
        `💡 *Enroll in classroom to track all submissions and topic accuracy:*\n` +
        `Send: \`/join ${user.handle}\``,
      { parse_mode: 'Markdown' }
    );
  } catch (err: any) {
    await ctx.reply(`❌ Error checking problems for "${handle}": ${err.message}`);
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
  bot.telegram
    .getMe()
    .then((botInfo) => {
      console.log(`🤖 Telegram Bot (@${botInfo.username}) is active and listening for commands!`);
    })
    .catch((err) => {
      console.error('❌ Failed to connect to Telegram Bot API:', err.message);
    });

  bot.launch().catch((err) => {
    console.error('❌ Telegram Bot polling error:', err.message);
  });

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
