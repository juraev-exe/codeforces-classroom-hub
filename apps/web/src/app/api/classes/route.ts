import { NextResponse } from 'next/server';
import { serverStore } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const classes = serverStore.getClassrooms();
    return NextResponse.json(classes);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Valid classroom name is required' }, { status: 400 });
    }
    const cleanName = name.trim().slice(0, 100);
    const cleanDesc = description && typeof description === 'string' ? description.trim().slice(0, 500) : undefined;
    const created = serverStore.addClassroom(cleanName, cleanDesc);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
