import { NextResponse } from 'next/server';
import { serverStore } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = serverStore.getSettings();
    const health = serverStore.getStorageHealth();
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
    const updated = serverStore.updateSettings(body);
    const health = serverStore.getStorageHealth();
    return NextResponse.json({
      success: true,
      settings: updated,
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
