import { NextResponse } from 'next/server';
import { serverStore } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId') || undefined;
    const leaderboard = serverStore.getLeaderboard(classId);
    return NextResponse.json(leaderboard);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
