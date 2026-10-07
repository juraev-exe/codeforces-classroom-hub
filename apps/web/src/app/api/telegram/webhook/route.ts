import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { serverStore, fetchCF } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

function getBotToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN || serverStore.getSettings().telegramBotToken || '';
}

const WEB_URL = (process.env.WEB_URL || 'https://codeforces-classroom-hub.vercel.app').replace(/\/+$/, '');

async function sendTelegramMessage(chatId: number | string, text: string, extra: any = {}) {
  try {
    const token = getBotToken();
    if (!token) {
      console.error('Telegram bot token is not configured.');
      return;
    }
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
        ...extra,
      }),
    });
  } catch (err) {
    console.error('sendTelegramMessage error:', err);
  }
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  try {
    const token = getBotToken();
    if (!token) {
      console.error('Telegram bot token is not configured.');
      return;
    }
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
      }),
    });
  } catch {}
}

async function sendLeaderboardMsg(chatId: number | string) {
  const leaderboard = serverStore.getLeaderboard();
  if (leaderboard.length === 0) {
    await sendTelegramMessage(chatId, `ℹ️ Leaderboard is currently empty.`);
    return;
  }
  let msg = `🏆 *Classroom Standings & Leaderboard*\n\n`;
  leaderboard.slice(0, 10).forEach((entry) => {
    const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
    msg += `${medal} *${entry.name}* (@${entry.handle})\n   ⭐ Rating: *${entry.rating}* (${entry.rankTitle}) | Solved: ${entry.solvedCount}\n\n`;
  });
  msg += `🌐 [View Full Leaderboard](${WEB_URL}/leaderboard)`;
  await sendTelegramMessage(chatId, msg, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '⚡ Next Contest', callback_data: 'cb_next' },
          { text: '👥 Students Roster', callback_data: 'cb_students' },
        ],
        [{ text: '🌐 Open Web Leaderboard ↗️', url: `${WEB_URL}/leaderboard` }],
      ],
    },
  });
}

async function sendNextContestMsg(chatId: number | string) {
  const contests = await serverStore.getUpcomingContests();
  if (contests.length === 0) {
    await sendTelegramMessage(chatId, `ℹ️ No upcoming contests found on Codeforces.`);
    return;
  }
  const nextContest = contests[0];
  const date = new Date(nextContest.startTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const hoursLeft = Math.max(0, Math.floor(nextContest.relativeTimeSeconds / -3600));
  const minutesLeft = Math.max(0, Math.floor((nextContest.relativeTimeSeconds / -60) % 60));

  const msg =
    `⚡ *Next Codeforces Contest Alert*\n\n` +
    `🏆 *${nextContest.name}*\n` +
    `⏰ *Start Time:* ${date}\n` +
    `⏳ *Countdown:* In *${hoursLeft}h ${minutesLeft}m*!\n` +
    `⏱ *Duration:* ${Math.round(nextContest.durationSeconds / 3600)} hours\n\n` +
    `🔗 [Register on Codeforces](https://codeforces.com/contestRegistration/${nextContest.codeforcesContestId})`;

  await sendTelegramMessage(chatId, msg, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📅 All Contests', callback_data: 'cb_contests' },
          { text: '🏆 Leaderboard', callback_data: 'cb_leaderboard' },
        ],
        [
          { text: '🔗 Register on Codeforces ↗️', url: `https://codeforces.com/contestRegistration/${nextContest.codeforcesContestId}` },
        ],
      ],
    },
  });
}

async function sendContestsMsg(chatId: number | string) {
  const contests = await serverStore.getUpcomingContests();
  if (contests.length === 0) {
    await sendTelegramMessage(chatId, `ℹ️ No upcoming Codeforces rounds detected at the moment.`);
    return;
  }
  let msg = `📅 *Upcoming Codeforces Contests Schedule*\n\n`;
  contests.slice(0, 5).forEach((c, idx) => {
    const date = new Date(c.startTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    const hoursLeft = Math.max(0, Math.floor(c.relativeTimeSeconds / -3600));
    msg += `${idx + 1}. *${c.name}*\n   ⏰ Start: ${date} (in ~${hoursLeft}h)\n   ⏱ Duration: ${Math.round(c.durationSeconds / 3600)}h\n\n`;
  });
  msg += `🌐 [Register & View Schedule](${WEB_URL}/contests)`;
  await sendTelegramMessage(chatId, msg, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '⚡ Nearest Contest', callback_data: 'cb_next' }],
        [{ text: '🌐 View On Dashboard ↗️', url: `${WEB_URL}/contests` }],
      ],
    },
  });
}

async function sendStudentsMsg(chatId: number | string) {
  const students = serverStore.getStudents();
  if (students.length === 0) {
    await sendTelegramMessage(chatId, `ℹ️ No students registered in the classroom yet.\n\nSend \`/join <cf_handle>\` to enroll!`);
    return;
  }
  let msg = `👥 *Enrolled Classroom Students (${students.length})*\n\n`;
  students.forEach((s, idx) => {
    const rating = s.stats?.rating || 'Unrated';
    const rank = s.stats?.rank || 'unrated';
    const solved = s.stats?.solvedCount || 0;
    msg += `${idx + 1}. *${s.name}* (@${s.codeforcesHandle})\n   ⭐ Rating: ${rating} (${rank}) | Solved: ${solved}\n\n`;
  });
  msg += `🌐 [View Roster on Dashboard](${WEB_URL}/students)`;
  await sendTelegramMessage(chatId, msg, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🏆 Leaderboard', callback_data: 'cb_leaderboard' },
          { text: '➕ How to Join', callback_data: 'cb_join' },
        ],
        [{ text: '🌐 View Student Profiles ↗️', url: `${WEB_URL}/students` }],
      ],
    },
  });
}

async function sendCoachProfileMsg(chatId: number | string) {
  const data = await serverStore.getTeacherDashboard();
  const t = data.teacher;
  const msg =
    `👨‍🏫 *Teacher & Coach Profile: ${t.name}* (@${t.handle})\n` +
    `_${t.title || 'Lead Algorithms & CP Coach'}_\n\n` +
    `⭐ *Codeforces Rating:* ${t.rating} (${t.rank})\n` +
    `🏆 *Max Rating:* ${t.maxRating} (${t.maxRank})\n` +
    `🎯 *Problems Solved:* ${t.totalSolved}\n` +
    `📊 *Contests Attended:* ${t.totalContests}\n\n` +
    (t.acmp?.id ? `🏅 *ACMP.ru Rating:* ${t.acmp.rating} (Solved: ${t.acmp.solvedCount})\n\n` : '') +
    `🌐 [View Web Dashboard](${WEB_URL})`;

  await sendTelegramMessage(chatId, msg, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '👥 Classroom Roster', callback_data: 'cb_students' },
          { text: '🏆 Leaderboard', callback_data: 'cb_leaderboard' },
        ],
        [{ text: '🌐 Open Coach Profile ↗️', url: `${WEB_URL}` }],
      ],
    },
  });
}

async function sendClassOverviewMsg(chatId: number | string) {
  const summary = serverStore.getAnalytics();
  const msg =
    `🏫 *Classroom Analytics Overview*\n\n` +
    `👥 *Total Students:* ${summary.totalStudents} (${summary.activeStudents} active)\n` +
    `📈 *Average Rating:* ${summary.averageRating}\n` +
    `🎯 *Median Rating:* ${summary.medianRating}\n` +
    `🌟 *Highest Rating:* ${summary.highestRating}\n` +
    `📉 *Lowest Rating:* ${summary.lowestRating}\n` +
    `✅ *Total Solved Problems:* ${summary.totalSolvedProblems}\n` +
    `📊 *Avg Solved Per Student:* ${summary.averageSolvedProblems}\n` +
    `🏆 *Total Contests Attended:* ${summary.totalContestsParticipated}\n\n` +
    `🌐 [View Live Analytics](${WEB_URL}/analytics)`;

  await sendTelegramMessage(chatId, msg, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🏆 Leaderboard', callback_data: 'cb_leaderboard' },
          { text: '👥 Students', callback_data: 'cb_students' },
        ],
        [{ text: '🌐 Open Live Analytics ↗️', url: `${WEB_URL}/analytics` }],
      ],
    },
  });
}

async function sendPotdMsg(chatId: number | string) {
  const POTD_LIST = [
    { contestId: 706, index: 'B', name: 'Interesting drink', rating: 1100, tags: ['binary search', 'dp', 'sortings'] },
    { contestId: 467, index: 'A', name: 'George and Accommodation', rating: 800, tags: ['implementation'] },
    { contestId: 158, index: 'B', name: 'Taxi', rating: 1100, tags: ['greedy', 'special problem'] },
    { contestId: 580, index: 'A', name: 'Kefa and First Steps', rating: 900, tags: ['dp', 'implementation'] },
    { contestId: 455, index: 'A', name: 'Boredom', rating: 1500, tags: ['dp'] },
    { contestId: 1352, index: 'C', name: 'K-th Not Divisible by n', rating: 1200, tags: ['binary search', 'math'] },
    { contestId: 189, index: 'A', name: 'Cut Ribbon', rating: 1300, tags: ['dp'] },
  ];

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const p = POTD_LIST[dayOfYear % POTD_LIST.length];
  const url = `https://codeforces.com/contest/${p.contestId}/problem/${p.index}`;

  const msg =
    `💡 *Daily Algorithmic Problem of the Day (POTD)*\n\n` +
    `🎯 *${p.index}. ${p.name}* (Contest #${p.contestId})\n` +
    `★ *Difficulty Rating:* \`${p.rating}\`\n` +
    `🏷️ *Topic Tags:* ${p.tags.map((t) => `\`${t}\``).join(', ')}\n\n` +
    `Solve this problem today to maintain your coding streak! 🚀`;

  await sendTelegramMessage(chatId, msg, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Solve on Codeforces ↗️', url }],
        [
          { text: '🏆 Leaderboard', callback_data: 'cb_leaderboard' },
          { text: '⚡ Next Contest', callback_data: 'cb_next' },
        ],
      ],
    },
  });
}

async function sendJoinGuideMsg(chatId: number | string) {
  const msg =
    `➕ *How to Enroll in Codeforces Classroom Hub*\n\n` +
    `You can enroll in 2 simple ways:\n\n` +
    `*Option 1: In this Chat*\n` +
    `Send: \`/join <cf_handle> [Full Name]\`\n` +
    `_Example:_ \`/join tourist Gennady Korotkevich\`\n\n` +
    `*Option 2: 1-Click Web Invite*\n` +
    `Open: \`${WEB_URL}/join\`\n\n` +
    `Once enrolled, your Codeforces submissions, rating milestones, and contest performance will automatically appear in Coach Abubakr's classroom analytics! 🌟`;

  await sendTelegramMessage(chatId, msg, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🌐 Open Web Join Portal ↗️', url: `${WEB_URL}/join` }],
        [{ text: '🏆 View Leaderboard', callback_data: 'cb_leaderboard' }],
      ],
    },
  });
}


async function buildAIClassroomContext(): Promise<string> {
  const students = serverStore.getStudents();
  const leaderboard = serverStore.getLeaderboard();
  let contests: any[] = [];
  try {
    contests = await serverStore.getUpcomingContests();
  } catch {}
  const analytics = serverStore.getAnalytics();

  return `You are the dedicated AI Teaching & Development Assistant for Codeforces Classroom Hub, working directly with Teacher Abubakr Juraev (@AbubakrJ).
Classroom live telemetry:
- Teacher: Abubakr Juraev (@AbubakrJ, CF Rating: 693; ACMP.ru ID: 515125, Rating: 984, Solved: 79)
- Total Students Enrolled: ${students.length}
- Students: ${students.map(s => `@${s.codeforcesHandle} (${s.name}, Rating: ${s.stats?.rating || 0}, Solved: ${s.stats?.solvedCount || 0})`).join(', ')}
- Top Ranked: ${leaderboard.slice(0, 3).map(l => `#${l.rank} ${l.name} (@${l.handle}, ${l.rating})`).join(', ')}
- Next Upcoming Contests: ${contests.slice(0, 3).map(c => `${c.name}`).join('; ')}
- Classroom Solved Problems: ${analytics.totalSolvedProblems}
- Classroom Average Rating: ${analytics.averageRating}

Your mission:
1. Act as a co-teacher & developer assistant for Abubakr Juraev.
2. Help solve competitive programming problems (C++, Python, algorithms, math, data structures).
3. Provide curriculum advice, contest preparation drills, and topic recommendations.
4. Keep responses concise, clear, and perfectly formatted with Telegram markdown.`;
}

async function callAI(prompt: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  const context = await buildAIClassroomContext();

  // 1. Google Gemini (Preferred free tier)
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: context }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 900, temperature: 0.7 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (e: any) {
      console.error('Gemini error:', e.message);
    }
  }

  // 2. OpenAI fallback
  if (openAiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: context },
            { role: 'user', content: prompt }
          ],
          max_tokens: 800
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch (e: any) {
      console.error('OpenAI error:', e.message);
    }
  }

  // 3. Built-in Classroom Intelligence Engine (Zero API Key needed)
  const q = prompt.toLowerCase();

  if (q.includes('top') || q.includes('best') || q.includes('winner') || q.includes('highest')) {
    const lb = serverStore.getLeaderboard();
    if (lb.length === 0) return 'Currently, no students are registered in the classroom yet. Add students using /add <handle>.';
    const top = lb[0];
    return `🏆 *Top Student in Classroom:*\n\n🥇 *${top.name}* (@${top.handle})\n⭐ Rating: *${top.rating}* (${top.rankTitle})\n✅ Problems Solved: *${top.solvedCount}*\n\n[View Leaderboard](${WEB_URL}/leaderboard)`;
  }

  if (q.includes('how many') || q.includes('total students') || q.includes('roster count')) {
    const students = serverStore.getStudents();
    return `👥 *Classroom Status:* You currently have *${students.length} students* enrolled in your competitive programming batch.\n\nView roster: ${WEB_URL}/students`;
  }

  if (q.includes('weak') || q.includes('practice') || q.includes('study') || q.includes('recommend')) {
    const analytics = serverStore.getAnalytics();
    const weak = analytics.weakTopics || [];
    let msg = `💡 *AI Practice & Study Recommendations:*\n\n`;
    if (weak.length > 0) {
      msg += `🎯 *Topics needing reinforcement based on student error rates:*\n`;
      weak.slice(0, 3).forEach((w: any) => {
        msg += `• *${w.tag}* (${w.accuracy}% pass rate across ${w.totalAttempts} submissions)\n`;
      });
    } else {
      msg += `• Focus on *Dynamic Programming (knapsack & 1D state)*\n• Practice *Binary Search on Answer*\n• Implement *Graph BFS/DFS shortest path*\n`;
    }
    msg += `\n📊 [View AI Insights on Dashboard](${WEB_URL}/analytics)`;
    return msg;
  }

  if (q.includes('dp') || q.includes('dynamic programming')) {
    return '💡 *Competitive Programming Guide: Dynamic Programming*\n\n*Core steps for solving DP problems:*\n1. **Define the State:** dp[i] = optimal answer considering first i items.\n2. **Find the Transition:** How does dp[i] build upon dp[i-1] or earlier states?\n3. **Base Case:** Identify minimum boundary condition (e.g. dp[0] = 0).\n4. **Order of Computation:** Ensure required previous subproblems are computed first.\n\n*Recommended starter practice:* CF 706B, CF 455A, CF 189A.';
  }

  if (q.includes('segment tree') || q.includes('segtree')) {
    return '🌲 *Segment Tree Quick Reference (C++)*\n\n*Properties:*\n• Query: O(log N)\n• Point Update: O(log N)\n• Space: 4 * N\n\n*Use when:* You need range queries (min/max/sum) with frequent point or range updates.\nFor pure range sum with point updates, consider **Fenwick Tree (Binary Indexed Tree)** for simpler O(log N) code!';
  }

  return '🤖 *Classroom AI Assistant*\n\nI am your competitive programming co-pilot! You can ask me:\n• *"Who is leading the class?"*\n• *"What topics should students practice next?"*\n• *"Explain segment tree or binary search"*\n• *"Add student <handle>"*\n\n💡 *Tip:* To unlock full generative chat with Gemini, add `GEMINI_API_KEY="your_free_key"` to your environment (free from aistudio.google.com)!';
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  if (action) {
    const authError = requireAuth(req);
    if (authError) return authError;
  }

  const token = getBotToken();
  if (action && !token) {
    return NextResponse.json({ error: 'Telegram bot token is not configured.' }, { status: 503 });
  }

  if (action === 'set') {
    const customUrl = searchParams.get('url');
    const webhookUrl = customUrl || `${WEB_URL}/api/telegram/webhook`;
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    const data = await res.json();
    return NextResponse.json({ success: data.ok, webhookUrl, telegram: data });
  }

  if (action === 'delete' || action === 'unset') {
    const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
    const data = await res.json();
    return NextResponse.json({ success: data.ok, telegram: data });
  }

  if (action === 'info') {
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const data = await res.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({
    status: 'Telegram webhook endpoint active',
    bot: '@CodeForcesStudents_Bot',
    cloudUrl: `${WEB_URL}/api/telegram/webhook`,
  });
}

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // Sync state from Supabase cloud database
    await serverStore.syncFromSupabase();

    // 1. Handle Interactive Inline Keyboard Callbacks
    if (update.callback_query) {
      const cb = update.callback_query;
      const callbackId = cb.id;
      const chatId = cb.message?.chat?.id || cb.from?.id;
      const data = cb.data;

      await answerCallbackQuery(callbackId);

      if (data === 'cb_leaderboard') {
        await sendLeaderboardMsg(chatId);
      } else if (data === 'cb_next') {
        await sendNextContestMsg(chatId);
      } else if (data === 'cb_contests') {
        await sendContestsMsg(chatId);
      } else if (data === 'cb_students') {
        await sendStudentsMsg(chatId);
      } else if (data === 'cb_my') {
        await sendCoachProfileMsg(chatId);
      } else if (data === 'cb_class') {
        await sendClassOverviewMsg(chatId);
      } else if (data === 'cb_potd') {
        await sendPotdMsg(chatId);
      } else if (data === 'cb_join') {
        await sendJoinGuideMsg(chatId);
      } else if (data === 'cb_ai') {
        await sendTelegramMessage(
          chatId,
          '💬 *Ask the AI Teaching Assistant*\n\nSend your message starting with `/ai <question>` or simply write your coding, algorithm, or contest preparation question directly in this chat!'
        );
      } else if (data === 'cb_alert_test') {
        const result = await serverStore.checkContestAlerts();
        const count = result.alerted?.length || 0;
        await sendTelegramMessage(
          chatId,
          count > 0
            ? `🔔 *Contest Alert Check:* Triggered reminder for ${count} upcoming round(s)!`
            : `🔔 *Contest Alert Check:* No Codeforces rounds starting in under 30 minutes.`
        );
      }

      return NextResponse.json({ ok: true });
    }

    const message = update?.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const command = text.split(' ')[0].toLowerCase().replace('@codeforcesstudents_bot', '');
    const args = text.split(' ').slice(1);

    const fromId = String(message.from?.id || '');
    const fromUsername = (message.from?.username || '').toLowerCase();
    const firstName = message.from?.first_name || 'Coder';

    const settings = serverStore.getSettings();
    const adminIds = (settings.telegramAdminIds || process.env.TELEGRAM_ADMIN_IDS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const teacherHandle = (settings.teacherHandle || 'AbubakrJ').toLowerCase();

    const isTeacher =
      adminIds.includes(fromId) ||
      fromUsername === teacherHandle ||
      fromUsername === 'abubakrj' ||
      (message.chat?.type === 'private' &&
        (fromUsername.includes('abubakr') || (message.from?.first_name || '').toLowerCase().includes('abubakr')));

    const students = serverStore.getStudents();
    const enrolledStudent = students.find(
      (s) =>
        (fromUsername && s.codeforcesHandle.toLowerCase() === fromUsername) ||
        (s.name && s.name.toLowerCase().includes(firstName.toLowerCase()))
    );

    if (command === '/ai' || command === '/ask') {
      const prompt = args.join(' ').trim();
      if (!prompt) {
        await sendTelegramMessage(chatId, '💬 *Ask me anything!*\n\nUsage: `/ai <your question or code question>`\n\n*Example:* `/ai How to explain binary search to students?`');
        return NextResponse.json({ ok: true });
      }

      await sendTelegramMessage(chatId, '🧠 *Thinking...*');
      const aiReply = await callAI(prompt);
      await sendTelegramMessage(chatId, aiReply);
      return NextResponse.json({ ok: true });
    }

    if (command === '/start') {
      if (isTeacher) {
        const analytics = serverStore.getAnalytics();
        let nextRoundText = 'Checking schedule...';
        try {
          const upcoming = await serverStore.getUpcomingContests();
          if (upcoming.length > 0) {
            const n = upcoming[0];
            const hoursLeft = Math.max(0, Math.floor(n.relativeTimeSeconds / -3600));
            nextRoundText = `${n.name} (in ~${hoursLeft}h)`;
          }
        } catch {}

        const teacherGreeting =
`👋 *Assalomu alaykum, Coach ${settings.teacherName || 'Abubakr'}!* 👨‍🏫
*Welcome to your Classroom Command Cockpit*

👥 *Classroom:* Algorithms & Competitive Programming 2026
📊 *Roster:* *${students.length} students enrolled* (${analytics.activeStudents} active)
📈 *Class Avg Rating:* *${analytics.averageRating}* (Floor: ${analytics.lowestRating}, Peak: ${analytics.highestRating})
⏳ *Next Contest:* *${nextRoundText}*

⚡ *Cloud Telemetry & Bot:* Active 24/7 on Vercel

_Select an action below or tap Web App to open the dashboard:_`;

        const teacherKeyboard = {
          inline_keyboard: [
            [
              { text: '🏆 Live Leaderboard', callback_data: 'cb_leaderboard' },
              { text: '⚡ Next Contest', callback_data: 'cb_next' },
            ],
            [
              { text: '👥 Students Roster', callback_data: 'cb_students' },
              { text: '👨‍🏫 My Coach Profile', callback_data: 'cb_my' },
            ],
            [
              { text: '📅 All Contests', callback_data: 'cb_contests' },
              { text: '💡 Problem of the Day', callback_data: 'cb_potd' },
            ],
            [
              { text: '🔔 Test Contest Alert', callback_data: 'cb_alert_test' },
              { text: '🤖 Ask AI Assistant', callback_data: 'cb_ai' },
            ],
            [
              { text: '🌐 Open Web Dashboard ↗️', url: `${WEB_URL}` },
            ],
          ],
        };

        await sendTelegramMessage(chatId, teacherGreeting, { reply_markup: teacherKeyboard });
        return NextResponse.json({ ok: true });
      }

      if (enrolledStudent) {
        const sStats = enrolledStudent.stats;
        const rating = sStats?.rating || 'Unrated';
        const rank = sStats?.rank || 'unrated';
        const solved = sStats?.solvedCount || 0;

        const studentGreeting =
`👋 *Welcome back, ${enrolledStudent.name}!* 🎯
*Codeforces Classroom Hub*
_Coach: Abubakr Juraev (@${settings.teacherHandle})_

⭐ *Your Current Rating:* *${rating}* (${rank})
✅ *Problems Solved:* *${solved}*
🏫 *Batch:* Algorithms & Competitive Programming 2026

Tap below to check the leaderboard, practice today's challenge, or view upcoming contests:`;

        const studentKeyboard = {
          inline_keyboard: [
            [
              { text: '🏆 Classroom Leaderboard', callback_data: 'cb_leaderboard' },
              { text: '⚡ Next Contest', callback_data: 'cb_next' },
            ],
            [
              { text: '💡 Problem of the Day', callback_data: 'cb_potd' },
              { text: '📅 Contests Schedule', callback_data: 'cb_contests' },
            ],
            [
              { text: '🤖 Ask AI Coach', callback_data: 'cb_ai' },
              { text: '👤 My Profile & Stats', url: `${WEB_URL}/students/${enrolledStudent.id}` },
            ],
            [
              { text: '🌐 Open Classroom Hub ↗️', url: `${WEB_URL}` },
            ],
          ],
        };

        await sendTelegramMessage(chatId, studentGreeting, { reply_markup: studentKeyboard });
        return NextResponse.json({ ok: true });
      }

      const guestGreeting =
`👋 *Welcome, ${firstName}!* 🚀
*Codeforces Classroom Hub*
_Mentored by Coach Abubakr Juraev (@${settings.teacherHandle})_

🎯 *Class:* Algorithms & Competitive Programming 2026
💡 Train algorithms, track your rating trajectory, and get instant contest reminders.

*How to enroll in 10 seconds:*
Send: \`/join <your_codeforces_handle> [Your Name]\`
_Example:_ \`/join tourist Gennady Korotkevich\`

Choose an option below to explore:`;

      const guestKeyboard = {
        inline_keyboard: [
          [
            { text: '🏆 View Leaderboard', callback_data: 'cb_leaderboard' },
            { text: '⚡ Next Contest', callback_data: 'cb_next' },
          ],
          [
            { text: '➕ How to Join Classroom', callback_data: 'cb_join' },
            { text: '💡 Problem of the Day', callback_data: 'cb_potd' },
          ],
          [
            { text: '📅 Contests Schedule', callback_data: 'cb_contests' },
            { text: '🤖 Ask AI Assistant', callback_data: 'cb_ai' },
          ],
          [
            { text: '🌐 Open Web Classroom ↗️', url: `${WEB_URL}` },
          ],
        ],
      };

      await sendTelegramMessage(chatId, guestGreeting, { reply_markup: guestKeyboard });
      return NextResponse.json({ ok: true });
    }

    if (command === '/leaderboard') {
      await sendLeaderboardMsg(chatId);
      return NextResponse.json({ ok: true });
    }

    if (command === '/next') {
      await sendNextContestMsg(chatId);
      return NextResponse.json({ ok: true });
    }

    if (command === '/contests') {
      await sendContestsMsg(chatId);
      return NextResponse.json({ ok: true });
    }

    if (command === '/students') {
      await sendStudentsMsg(chatId);
      return NextResponse.json({ ok: true });
    }

    if (command === '/my') {
      await sendCoachProfileMsg(chatId);
      return NextResponse.json({ ok: true });
    }

    if (command === '/class') {
      await sendClassOverviewMsg(chatId);
      return NextResponse.json({ ok: true });
    }

    if (command === '/potd') {
      await sendPotdMsg(chatId);
      return NextResponse.json({ ok: true });
    }

    if (command === '/help') {
      await sendTelegramMessage(
        chatId,
        `📚 *Codeforces Classroom Hub Guide*\n\n` +
          `• \`/start\` : Interactive button menu & greeting\n` +
          `• \`/leaderboard\` : Classroom standings\n` +
          `• \`/next\` : Nearest upcoming contest countdown\n` +
          `• \`/contests\` : Upcoming Codeforces rounds\n` +
          `• \`/potd\` : Daily algorithmic Problem of the Day\n` +
          `• \`/students\` : Enrolled student roster\n` +
          `• \`/my\` : Coach profile & statistics\n` +
          `• \`/class\` : Classroom analytics overview\n` +
          `• \`/rating <handle>\` : Codeforces rating check\n` +
          `• \`/problems <handle>\` : Problem solve breakdown\n` +
          `• \`/join <handle> [name]\` : Enroll in classroom\n` +
          `• \`/ai <question>\` : Ask AI teaching assistant\n\n` +
          `🌐 Dashboard: ${WEB_URL}`
      );
      return NextResponse.json({ ok: true });
    }

    if (command === '/link') {
      await sendJoinGuideMsg(chatId);
      return NextResponse.json({ ok: true });
    }

    if (command === '/delete' || command === '/remove') {
      const targetHandle = args[0]?.replace('@', '').trim();
      if (!targetHandle) {
        await sendTelegramMessage(chatId, '⚠️ Usage: `/delete <codeforces_handle>`\n\n*Example:* `/delete tourist`');
        return NextResponse.json({ ok: true });
      }

      const deleted = await serverStore.deleteStudent(targetHandle);
      if (deleted) {
        await sendTelegramMessage(chatId, `🗑️ Student \`@${targetHandle}\` has been removed from the classroom and database.`);
      } else {
        await sendTelegramMessage(chatId, `❌ Student with handle \`@${targetHandle}\` was not found in the classroom.`);
      }
      return NextResponse.json({ ok: true });
    }

    if (command === '/rating') {
      const handle = args[0];
      if (!handle) {
        await sendTelegramMessage(chatId, 'Usage: `/rating <codeforces_handle>`');
        return NextResponse.json({ ok: true });
      }

      try {
        const users = await fetchCF<any[]>('user.info', { handles: handle.trim() });
        if (!users || users.length === 0) {
          await sendTelegramMessage(chatId, `❌ Codeforces user "${handle}" not found.`);
          return NextResponse.json({ ok: true });
        }
        const user = users[0];
        const msg =
          `👤 *Codeforces Profile: ${user.handle}*\n\n` +
          `⭐ *Rating:* ${user.rating || 0} (${user.rank || 'unrated'})\n` +
          `🏆 *Max Rating:* ${user.maxRating || 0} (${user.maxRank || 'unrated'})\n` +
          `🌍 *Country:* ${user.country || 'N/A'}\n` +
          `🏢 *Organization:* ${user.organization || 'N/A'}\n` +
          `🤝 *Contribution:* ${user.contribution || 0}`;

        await sendTelegramMessage(chatId, msg);
      } catch (err: any) {
        await sendTelegramMessage(chatId, `❌ Error looking up "${handle}": ${err.message}`);
      }
      return NextResponse.json({ ok: true });
    }

    if (command === '/problems') {
      const handle = args[0];
      if (!handle) {
        await sendTelegramMessage(chatId, 'Usage: `/problems <codeforces_handle>`');
        return NextResponse.json({ ok: true });
      }

      const students = serverStore.getStudents();
      const matched = students.find((s) => s.codeforcesHandle.toLowerCase() === handle.trim().toLowerCase());

      if (matched && matched.stats) {
        const s = matched.stats;
        await sendTelegramMessage(
          chatId,
          `📊 *Classroom Solved Stats: @${matched.codeforcesHandle}* (${matched.name})\n\n` +
            `✅ *Total Solved:* ${s.solvedCount} problems\n` +
            `⭐ *Rating:* ${s.rating || 'Unrated'} (${s.rank || 'unrated'})\n` +
            `🏆 *Contests Attended:* ${s.contestCount || 0}\n\n` +
            `[View Profile on Dashboard](${WEB_URL}/students/${matched.id})`
        );
        return NextResponse.json({ ok: true });
      }

      try {
        const users = await fetchCF<any[]>('user.info', { handles: handle.trim() });
        if (users && users.length > 0) {
          const u = users[0];
          await sendTelegramMessage(
            chatId,
            `📊 *Codeforces Profile: @${u.handle}*\n\n` +
              `⭐ *Rating:* ${u.rating || 0} (${u.rank || 'unrated'})\n` +
              `🏆 *Max Rating:* ${u.maxRating || 0} (${u.maxRank || 'unrated'})\n\n` +
              `💡 *Enroll in classroom to track all submissions and topic accuracy:*\n` +
              `Send: \`/join ${u.handle}\``
          );
        } else {
          await sendTelegramMessage(chatId, `❌ User "${handle}" not found.`);
        }
      } catch (err: any) {
        await sendTelegramMessage(chatId, `❌ Error checking problems for "${handle}": ${err.message}`);
      }
      return NextResponse.json({ ok: true });
    }

    // Shared Enrollment logic for /add, /addstudent, /join, /enroll
    const isAddCommand = ['/add', '/addstudent', '/join', '/enroll'].includes(command);
    const isProfileUrl = text.includes('codeforces.com/profile/');

    if (isAddCommand || isProfileUrl) {
      let handleCandidate = args[0] || '';
      let customNameCandidate = args.slice(1).join(' ').trim();

      if (isProfileUrl && !isAddCommand) {
        const urlMatch = text.match(/codeforces\.com\/profile\/([a-zA-Z0-9_\-\.]+)/i);
        if (urlMatch) {
          handleCandidate = urlMatch[1];
        }
      }

      const urlMatch = handleCandidate.match(/codeforces\.com\/profile\/([a-zA-Z0-9_\-\.]+)/i);
      if (urlMatch) {
        handleCandidate = urlMatch[1];
      }
      const rawHandle = handleCandidate.replace('@', '').trim();

      if (!rawHandle) {
        await sendTelegramMessage(
          chatId,
          `👤 *How to add a student via Telegram:*\n\n` +
            `Send: \`/add <cf_handle> [Full Name]\`\n\n` +
            `*Examples:*\n` +
            `• \`/add tourist\`\n` +
            `• \`/add tourist Gennady Korotkevich\`\n` +
            `• Or simply paste their link: \`https://codeforces.com/profile/tourist\`\n\n` +
            `The bot will automatically verify the handle on Codeforces, fetch their rating, photo, and solved problems, and add them directly to your classroom!`
        );
        return NextResponse.json({ ok: true });
      }

      // Check if student already enrolled
      const existingStudents = serverStore.getStudents();
      const alreadyJoined = existingStudents.find(
        (s) => s.codeforcesHandle.toLowerCase() === rawHandle.toLowerCase()
      );

      if (alreadyJoined) {
        await sendTelegramMessage(
          chatId,
          `ℹ️ *@${rawHandle}* (${alreadyJoined.name}) is already enrolled!\n\n` +
            `⭐ Rating: *${alreadyJoined.stats?.rating || 'Unrated'}* (${alreadyJoined.stats?.rank || 'unrated'})\n` +
            `✅ Solved: *${alreadyJoined.stats?.solvedCount || 0}* problems\n\n` +
            `🔗 [View Student Profile](${WEB_URL}/students/${alreadyJoined.id})`
        );
        return NextResponse.json({ ok: true });
      }

      await sendTelegramMessage(chatId, `⏳ Verifying handle \`@${rawHandle}\` on Codeforces and pulling submissions...`);

      try {
        const users = await fetchCF<any[]>('user.info', { handles: rawHandle });
        if (!users || users.length === 0) {
          await sendTelegramMessage(chatId, `❌ Codeforces user \`@${rawHandle}\` not found. Please double-check the handle spelling.`);
          return NextResponse.json({ ok: true });
        }

        const u = users[0];
        let studentName = customNameCandidate;
        if (!studentName) {
          if (u.firstName && u.lastName) {
            studentName = `${u.firstName} ${u.lastName}`.trim();
          } else if (u.firstName) {
            studentName = u.firstName.trim();
          } else {
            studentName = u.handle;
          }
        }

        const classes = serverStore.getClassrooms();
        const targetClass = classes[0];

        const newStudent = await serverStore.addStudent({
          name: studentName,
          codeforcesHandle: u.handle,
          classId: targetClass.id,
          group: 'Standard',
        });

        const stats = newStudent.stats;
        const rating = stats?.rating || 0;
        const rank = stats?.rank || 'unrated';
        const maxRating = stats?.maxRating || 'N/A';
        const solved = stats?.solvedCount || 0;

        await sendTelegramMessage(
          chatId,
          `🎉 *Successfully Added Student to Classroom!*\n\n` +
            `👤 *Name:* ${newStudent.name}\n` +
            `🎯 *Codeforces Handle:* @${newStudent.codeforcesHandle}\n` +
            `⭐ *Rating:* ${rating} (${rank})\n` +
            `🏆 *Max Rating:* ${maxRating}\n` +
            `✅ *Problems Solved:* ${solved}\n` +
            `🏫 *Classroom:* ${targetClass.name}\n\n` +
            `Submissions and rating are now active in the telemetry cockpit!\n\n` +
            `🔗 [Open Student Profile](${WEB_URL}/students/${newStudent.id})\n` +
            `🏆 [View Leaderboard](${WEB_URL}/leaderboard)`
        );
      } catch (err: any) {
        await sendTelegramMessage(chatId, `❌ Failed to add student: ${err.message}`);
      }
      return NextResponse.json({ ok: true });
    }

    // Natural Language AI Fallback
    // If the message is not a recognized slash command, let the AI assistant process it!
    const aiResponse = await callAI(text);
    await sendTelegramMessage(chatId, aiResponse);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ ok: true }); // Always return 200 OK to Telegram
  }
}
