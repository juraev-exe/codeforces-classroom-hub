import { NextResponse } from 'next/server';
import { sendTelegramNotification } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { academyName, contactName, emailOrTelegram, studentCount, tier, notes } = body;

    if (!contactName || !emailOrTelegram) {
      return NextResponse.json(
        { error: 'Contact name and email or Telegram handle are required.' },
        { status: 400 }
      );
    }

    const cleanAcademy = String(academyName || 'Not specified').slice(0, 120);
    const cleanContact = String(contactName).slice(0, 100);
    const cleanHandle = String(emailOrTelegram).slice(0, 100);
    const cleanTier = String(tier || 'Academy Pro ($79/mo)').slice(0, 50);
    const cleanCount = String(studentCount || '20-50').slice(0, 30);
    const cleanNotes = notes ? String(notes).slice(0, 500) : 'None provided';

    // Dispatch instant high-priority notification to Coach Abubakr via Telegram
    try {
      const tgMessage =
        `💼 *New Commercial SaaS Pilot Inquiry!* 🚀\n\n` +
        `🏫 *Academy / School:* ${cleanAcademy}\n` +
        `👤 *Contact Person:* ${cleanContact}\n` +
        `📬 *Email / Telegram:* \`${cleanHandle}\`\n` +
        `👥 *Expected Students:* ${cleanCount}\n` +
        `📦 *Selected Tier:* *${cleanTier}*\n` +
        `📝 *Notes / Goals:* _${cleanNotes}_\n\n` +
        `⏰ *Received:* ${new Date().toLocaleString()}`;

      await sendTelegramNotification(tgMessage);
    } catch (tgErr) {
      console.warn('Failed to dispatch telegram notification for inquiry:', tgErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Your inquiry has been received. Coach Abubakr and our engineering team will get in touch shortly.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to submit inquiry' },
      { status: 500 }
    );
  }
}
