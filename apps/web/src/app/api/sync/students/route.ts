import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { serverStore } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const students = serverStore.getStudents();
    for (const s of students) {
      await serverStore.syncStudent(s.id).catch(() => null);
    }
    return NextResponse.json({ success: true, syncedStudentsCount: students.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
