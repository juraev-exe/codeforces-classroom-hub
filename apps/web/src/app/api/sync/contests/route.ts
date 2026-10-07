import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { serverStore } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const contests = await serverStore.getUpcomingContests();
    return NextResponse.json({ success: true, count: contests.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
