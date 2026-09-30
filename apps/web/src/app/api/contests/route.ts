import { NextResponse } from 'next/server';
import { serverStore } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phase = searchParams.get('phase');
    const limit = parseInt(searchParams.get('limit') || '40', 10);

    if (phase === 'BEFORE' || phase === 'upcoming') {
      const contests = await serverStore.getUpcomingContests();
      return NextResponse.json(contests);
    }

    const contests = await serverStore.getPastContests(limit);
    return NextResponse.json(contests);
  } catch (err: any) {
    return NextResponse.json([], { status: 200 });
  }
}
