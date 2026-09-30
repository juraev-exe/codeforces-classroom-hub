import { NextResponse } from 'next/server';
import { fetchCF } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const handle = searchParams.get('handle');
    if (!handle) {
      return NextResponse.json({ error: 'Handle parameter is required' }, { status: 400 });
    }
    const users = await fetchCF<any[]>('user.info', { handles: handle });
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(users[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
