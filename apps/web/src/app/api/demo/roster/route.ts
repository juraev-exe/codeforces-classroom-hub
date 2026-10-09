import { NextResponse } from 'next/server';
import { serverStore } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isDemo = serverStore.isDemoActive();
    const students = serverStore.getStudents();
    return NextResponse.json({
      isDemoActive: isDemo,
      studentCount: students.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to check demo status' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'load';

    if (action === 'restore') {
      const result = serverStore.restoreRealRoster();
      return NextResponse.json(result);
    } else {
      const result = serverStore.loadDemoRoster();
      return NextResponse.json(result);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to toggle demo roster' }, { status: 500 });
  }
}
