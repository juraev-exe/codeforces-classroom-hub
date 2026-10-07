import { NextResponse } from 'next/server';
import { serverStore, sendTelegramNotification } from '@/lib/server-store';

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
    const { title, description, classId, problemInput, dueDate, notifyTelegram } = body;

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

    if (notifyTelegram) {
      try {
        const probText = assignment.problems.map((p) => `• [${p.id} - ${p.name}](${p.url})`).join('\n');
        const due = assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No deadline';
        await sendTelegramNotification(
          `📚 *New Classroom Assignment Assigned!*\n\n` +
          `📝 *${assignment.title}*\n` +
          (assignment.description ? `_${assignment.description}_\n\n` : '\n') +
          `🎯 *Problems:*\n${probText}\n\n` +
          `⏰ *Due Date:* ${due}\n` +
          `🌐 Open Hub: https://codeforces-classroom-hub.vercel.app/assignments`
        );
      } catch (tgErr) {
        console.warn('Failed to dispatch telegram notification for assignment:', tgErr);
      }
    }

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
