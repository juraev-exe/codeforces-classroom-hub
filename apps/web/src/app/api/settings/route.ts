import { NextResponse } from 'next/server';
import { serverStore } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rawSettings = serverStore.getSettings();
    const health = serverStore.getStorageHealth();

    // Mask sensitive secrets to prevent exposure
    const settings = {
      ...rawSettings,
      telegramBotToken: rawSettings.telegramBotToken
        ? `${rawSettings.telegramBotToken.slice(0, 4)}••••••••${rawSettings.telegramBotToken.slice(-4)}`
        : '',
      cfApiSecret: rawSettings.cfApiSecret ? '••••••••••••••••' : '',
    };

    return NextResponse.json({
      settings,
      health,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = serverStore.getSettings();

    // If masked placeholder was sent back, preserve existing secrets
    if (body.telegramBotToken && body.telegramBotToken.includes('••••')) {
      body.telegramBotToken = current.telegramBotToken;
    }
    if (body.cfApiSecret && body.cfApiSecret.includes('••••')) {
      body.cfApiSecret = current.cfApiSecret;
    }

    const updated = serverStore.updateSettings(body);
    const health = serverStore.getStorageHealth();

    const maskedUpdated = {
      ...updated,
      telegramBotToken: updated.telegramBotToken
        ? `${updated.telegramBotToken.slice(0, 4)}••••••••${updated.telegramBotToken.slice(-4)}`
        : '',
      cfApiSecret: updated.cfApiSecret ? '••••••••••••••••' : '',
    };

    return NextResponse.json({
      success: true,
      settings: maskedUpdated,
      health,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save settings' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await serverStore.clearCache();
    const health = serverStore.getStorageHealth();
    return NextResponse.json({
      success: true,
      message: 'Telemetry cache successfully cleared',
      health,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to clear cache' }, { status: 500 });
  }
}
