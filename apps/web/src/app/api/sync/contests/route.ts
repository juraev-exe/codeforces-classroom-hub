import { NextResponse } from 'next/server';
import { serverStore } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const contests = await serverStore.getUpcomingContests();
    return NextResponse.json({ success: true, count: contests.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
