import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { serverStore, sendTelegramNotification } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const type = body.type || 'test';

    if (type === 'test') {
      const settings = serverStore.getSettings();
      const allowedAdminIds = (settings.telegramAdminIds || process.env.TELEGRAM_ADMIN_IDS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const customChatId = body.chatId ? String(body.chatId).trim() : undefined;
      if (customChatId && allowedAdminIds.length > 0 && !allowedAdminIds.includes(customChatId)) {
        return NextResponse.json(
          { success: false, error: 'Custom chat ID is not authorized for dispatch' },
          { status: 403 }
        );
      }

      const rawMsg = typeof body.message === 'string' ? body.message.slice(0, 500) : null;
      const testMsg =
        rawMsg ||
        `🔔 *Codeforces Classroom Hub — Live Test Alert*

Status: *Active & Connected* ✅
Teacher: *${settings.teacherName}* (@${settings.teacherHandle})
System Time: \`${new Date().toISOString()}\`

Classroom telemetry and contest reminders are operational! 🚀`;

      const result = await sendTelegramNotification(testMsg, customChatId);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to dispatch test notification' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Test notification delivered successfully to Telegram',
      });
    }

    if (type === 'contest_check') {
      const result = await serverStore.checkContestAlerts();
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    return NextResponse.json({ error: `Unknown notification type: ${type}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Telegram notification error' }, { status: 500 });
  }
}
