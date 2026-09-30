import { NextResponse } from 'next/server';
import { serverStore } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function POST() {
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
