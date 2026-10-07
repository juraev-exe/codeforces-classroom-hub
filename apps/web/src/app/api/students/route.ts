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
    const { name, codeforcesHandle, classId, group, age, telegramChatId, telegramUsername } = body;
    if (!name || !codeforcesHandle || !classId) {
      return NextResponse.json(
        { error: 'Name, codeforcesHandle, and classId are required.' },
        { status: 400 }
      );
    }

    const trimmedName = String(name).trim().slice(0, 80);
    const cleanHandle = String(codeforcesHandle).trim().replace(/^@/, '');

    // Strictly validate Codeforces handle format
    if (!/^[a-zA-Z0-9_\-\.]{3,30}$/.test(cleanHandle)) {
      return NextResponse.json(
        { error: 'Invalid Codeforces handle. Must be 3-30 alphanumeric characters, dots, underscores, or hyphens.' },
        { status: 400 }
      );
    }

    // Validate age if provided
    let parsedAge: number | undefined = undefined;
    if (age !== undefined && age !== null && age !== '') {
      const numAge = Number(age);
      if (isNaN(numAge) || numAge < 5 || numAge > 120) {
        return NextResponse.json(
          { error: 'Invalid age. Must be a valid number between 5 and 120.' },
          { status: 400 }
        );
      }
      parsedAge = Math.floor(numAge);
    }

    const cleanClassId = String(classId).trim().slice(0, 50);
    const cleanGroup = group ? String(group).trim().slice(0, 50) : undefined;
    const cleanTelegramUsername = telegramUsername
      ? String(telegramUsername).trim().replace(/^@/, '').slice(0, 50)
      : undefined;

    const student = await serverStore.addStudent({
      name: trimmedName,
      codeforcesHandle: cleanHandle,
      classId: cleanClassId,
      group: cleanGroup,
      age: parsedAge,
      telegramChatId: telegramChatId ? String(telegramChatId).trim() : undefined,
      telegramUsername: cleanTelegramUsername,
    });
    return NextResponse.json(student, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
