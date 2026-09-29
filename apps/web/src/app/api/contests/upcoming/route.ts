import { NextResponse } from 'next/server';
import { serverStore } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const contests = await serverStore.getUpcomingContests();
    return NextResponse.json(contests);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
