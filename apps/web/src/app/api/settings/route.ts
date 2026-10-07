import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { serverStore, type AppSettings } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

function publicSettings(settings: AppSettings) {
  const { telegramBotToken, cfApiKey, cfApiSecret, ...safeSettings } = settings;
  return {
    ...safeSettings,
    telegramBotTokenConfigured: Boolean(telegramBotToken),
    cfApiKeyConfigured: Boolean(cfApiKey),
    cfApiSecretConfigured: Boolean(cfApiSecret),
  };
}

function publicHealth() {
  const { storagePath, ...health } = serverStore.getStorageHealth();
  return health;
}

export async function GET(req: Request) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const settings = serverStore.getSettings();
    return NextResponse.json({
      settings: publicSettings(settings),
      health: publicHealth(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Settings must be an object.' }, { status: 400 });
    }

    const updates = { ...body };
    for (const key of ['telegramBotToken', 'cfApiKey', 'cfApiSecret']) {
      if (typeof updates[key] !== 'string' || !updates[key].trim()) {
        delete updates[key];
      }
    }

    const updated = serverStore.updateSettings(updates);
    return NextResponse.json({
      success: true,
      settings: publicSettings(updated),
      health: publicHealth(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save settings' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    await serverStore.clearCache();
    return NextResponse.json({
      success: true,
      message: 'Telemetry cache successfully cleared',
      health: publicHealth(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to clear cache' }, { status: 500 });
  }
}
