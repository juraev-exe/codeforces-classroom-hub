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
          `• \`/problems <handle>\` : Solved count and activity breakdown\n\n` +
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

    // Default unknown command
    await sendTelegramMessage(chatId, `❓ Unknown command. Send \`/help\` to see available commands.`);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ ok: true }); // Always return 200 OK to Telegram
  }
}
