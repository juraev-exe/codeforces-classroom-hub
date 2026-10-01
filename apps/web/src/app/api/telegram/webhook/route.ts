import { NextResponse } from 'next/server';
import { serverStore, fetchCF } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8844111620:AAGJ5RP8hCm9-q0b5ONFfFt4Ons5ZZJE3bo';
const WEB_URL = process.env.WEB_URL || 'https://codeforces-classroom-hub.vercel.app';

async function sendTelegramMessage(chatId: number | string, text: string, extra: any = {}) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
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
    console.error('Failed to send Telegram message:', err);
  }
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

  if (action === 'set') {
    const webhookUrl = `${WEB_URL}/api/telegram/webhook`;
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    const data = await res.json();
    return NextResponse.json({ success: true, webhookUrl, telegram: data });
  }

  if (action === 'info') {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const data = await res.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({ status: 'Telegram webhook endpoint active', bot: '@CodeForcesStudents_Bot' });
}

export async function POST(req: Request) {
  try {
    const update = await req.json();
    const message = update?.message;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const command = text.split(' ')[0].toLowerCase().replace('@codeforcesstudents_bot', '');
    const args = text.split(' ').slice(1);

    // Sync state from Supabase cloud database
    await serverStore.syncFromSupabase();

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
      await sendTelegramMessage(
        chatId,
        `👋 *Welcome to Codeforces Classroom Hub Bot!*\n` +
          `_Managed by Abubakr Juraev (@AbubakrJ)_\n\n` +
          `Students can join the classroom instantly:\n` +
          `• \`/add <cf_handle> [Name]\` - Add student to classroom\n• \`/join <cf_handle> [Name]\` - Self-enroll in classroom\n` +
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
          `🌐 [Open Classroom Dashboard](${WEB_URL})`
      );
      return NextResponse.json({ ok: true });
    }

    if (command === '/help') {
      await sendTelegramMessage(
        chatId,
        `📚 *Codeforces Classroom Hub Guide*\n\n` +
          `• \`/add <handle> [name]\` : Add a student to the classroom\n• \`/join <handle> [name]\` : Self-enroll in the classroom\n` +
          `• \`/link\` : Shareable student join invite URL\n` +
          `• \`/my\` : Teacher Abubakr Juraev profile & live stats\n` +
          `• \`/class\` : Class overview (avg rating, total solved, students)\n` +
          `• \`/students\` : Roster of enrolled students and their ratings\n` +
          `• \`/leaderboard\` : Top ranked students in the classroom\n` +
          `• \`/contests\` : Upcoming official Codeforces rounds\n` +
          `• \`/next\` : Countdown to the nearest upcoming round\n` +
          `• \`/rating <handle>\` : Real-time rating check for any CF handle\n` +
          `• \`/problems <handle>\` : Solved count and activity breakdown\n• \`/ai <question>\` : Ask the AI assistant anything (algorithms, students, CP)\n\n` +
          `🌐 Dashboard: ${WEB_URL}`
      );
      return NextResponse.json({ ok: true });
    }

    if (command === '/link') {
      await sendTelegramMessage(
        chatId,
        `🔗 *Student Classroom Join Link*\n\n` +
          `Share this link with your students to automatically join the classroom:\n` +
          `👉 \`${WEB_URL}/join\`\n\n` +
          `Or students can message this bot (@CodeForcesStudents_Bot):\n` +
          `\`/join <handle> [Full Name]\`\n\n` +
          `_No passwords or login required!_`
      );
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

    if (command === '/my') {
      const data = await serverStore.getTeacherDashboard();
      const t = data.teacher;

      await sendTelegramMessage(
        chatId,
        `👨‍🏫 *Teacher Profile: ${t.name}* (@${t.handle})\n\n` +
          `⭐ *Rating:* ${t.rating} (${t.rank})\n` +
          `🏆 *Max Rating:* ${t.maxRating} (${t.maxRank})\n` +
          `🎯 *Problems Solved:* ${t.totalSolved}\n` +
          `📊 *Total Contests:* ${t.totalContests}\n\n` +
          `🌐 [View Web Dashboard](${WEB_URL})`
      );
      return NextResponse.json({ ok: true });
    }

    if (command === '/class') {
      const summary = serverStore.getAnalytics();

      await sendTelegramMessage(
        chatId,
        `🏫 *Classroom Analytics Overview*\n\n` +
          `👥 *Total Students:* ${summary.totalStudents} (${summary.activeStudents} active)\n` +
          `📈 *Average Rating:* ${summary.averageRating}\n` +
          `🎯 *Median Rating:* ${summary.medianRating}\n` +
          `🌟 *Highest Rating:* ${summary.highestRating}\n` +
          `📉 *Lowest Rating:* ${summary.lowestRating}\n` +
          `✅ *Total Solved Problems:* ${summary.totalSolvedProblems}\n` +
          `📊 *Avg Solved Per Student:* ${summary.averageSolvedProblems}\n` +
          `🏆 *Total Contests Attended:* ${summary.totalContestsParticipated}\n\n` +
          `🌐 [View Live Analytics](${WEB_URL}/analytics)`
      );
      return NextResponse.json({ ok: true });
    }

    if (command === '/students') {
      const students = serverStore.getStudents();

      if (students.length === 0) {
        await sendTelegramMessage(chatId, `ℹ️ No students registered in the classroom yet.\n\nSend \`/join <cf_handle>\` to enroll!`);
        return NextResponse.json({ ok: true });
      }

      let msg = `👥 *Enrolled Classroom Students (${students.length})*\n\n`;
      students.forEach((s, idx) => {
        const rating = s.stats?.rating || 'Unrated';
        const rank = s.stats?.rank || 'unrated';
        const solved = s.stats?.solvedCount || 0;
        msg += `${idx + 1}. *${s.name}* (@${s.codeforcesHandle})\n   ⭐ Rating: ${rating} (${rank}) | Solved: ${solved}\n\n`;
      });

      msg += `🌐 [View Roster on Dashboard](${WEB_URL}/students)`;
      await sendTelegramMessage(chatId, msg);
      return NextResponse.json({ ok: true });
    }

    if (command === '/leaderboard') {
      const leaderboard = serverStore.getLeaderboard();

      if (leaderboard.length === 0) {
        await sendTelegramMessage(chatId, `ℹ️ Leaderboard is currently empty.`);
        return NextResponse.json({ ok: true });
      }

      let msg = `🏆 *Classroom Standings & Leaderboard*\n\n`;
      leaderboard.slice(0, 10).forEach((entry) => {
        const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
        msg += `${medal} *${entry.name}* (@${entry.handle})\n   ⭐ Rating: *${entry.rating}* (${entry.rankTitle}) | Solved: ${entry.solvedCount}\n\n`;
      });

      msg += `🌐 [View Full Leaderboard](${WEB_URL}/leaderboard)`;
      await sendTelegramMessage(chatId, msg);
      return NextResponse.json({ ok: true });
    }

    if (command === '/contests') {
      const contests = await serverStore.getUpcomingContests();

      if (contests.length === 0) {
        await sendTelegramMessage(chatId, `ℹ️ No upcoming Codeforces rounds detected at the moment.`);
        return NextResponse.json({ ok: true });
      }

      let msg = `📅 *Upcoming Codeforces Contests*\n\n`;
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
      await sendTelegramMessage(chatId, msg);
      return NextResponse.json({ ok: true });
    }

    if (command === '/next') {
      const contests = await serverStore.getUpcomingContests();

      if (contests.length === 0) {
        await sendTelegramMessage(chatId, `ℹ️ No upcoming contests found on Codeforces.`);
        return NextResponse.json({ ok: true });
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
        `⏳ *Countdown:* Starting in *${hoursLeft} hours and ${minutesLeft} minutes*!\n` +
        `⏱ *Duration:* ${Math.round(nextContest.durationSeconds / 3600)} hours\n\n` +
        `🔗 [Open Contest Page](https://codeforces.com/contestRegistration/${nextContest.codeforcesContestId})`;

      await sendTelegramMessage(chatId, msg);
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
