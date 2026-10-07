import { NextResponse } from 'next/server';
import { serverStore } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId') || undefined;
    const assignments = serverStore.getAssignments(classId);
    return NextResponse.json(assignments);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, classId, problemInput, dueDate } = body;

    if (!title || !classId || !problemInput) {
      return NextResponse.json(
        { error: 'Title, classroom, and at least one problem ID or link are required.' },
        { status: 400 }
      );
    }

    const assignment = await serverStore.addAssignment({
      title: String(title).slice(0, 150),
      description: description ? String(description).slice(0, 500) : undefined,
      classId: String(classId),
      problemInput: String(problemInput),
      dueDate: dueDate || undefined,
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create assignment' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    const success = serverStore.deleteAssignment(id);
    if (!success) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Assignment deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete assignment' }, { status: 500 });
  }
}
