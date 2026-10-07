import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { serverStore } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId') || undefined;
    const search = searchParams.get('search') || undefined;
    await serverStore.syncFromSupabase();
    const students = serverStore.getStudents(classId, search);
    return NextResponse.json(students);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { name, codeforcesHandle, classId, group } = body;
    if (!name || !codeforcesHandle || !classId) {
      return NextResponse.json(
        { error: 'Name, codeforcesHandle, and classId are required.' },
        { status: 400 }
      );
    }
    const student = await serverStore.addStudent({
      name,
      codeforcesHandle,
      classId,
      group,
    });
    return NextResponse.json(student, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
