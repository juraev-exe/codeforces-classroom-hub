import { NextResponse } from 'next/server';
import { serverStore } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // If CRON_SECRET is configured, require Authorization header
    if (process.env.CRON_SECRET) {
      const auth = req.headers.get('authorization');
      if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
      }
    }

    // Sync state from Supabase
    await serverStore.syncFromSupabase();

    // Check upcoming contests and send automated alerts to Telegram
    const result = await serverStore.checkContestAlerts();

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      alerted: result.alerted || [],
      skippedCount: result.skipped?.length || 0,
    });
  } catch (err: any) {
    console.error('Contest cron error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
