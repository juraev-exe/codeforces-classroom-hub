import { NextResponse } from 'next/server';
import { fetchCF } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { handle: string } }
) {
  try {
    const cleanHandle = (params.handle || '').trim().replace(/^@/, '');
    if (!/^[a-zA-Z0-9_\-\.]{1,40}$/.test(cleanHandle)) {
      return NextResponse.json({ error: 'Invalid Codeforces handle format' }, { status: 400 });
    }
    const users = await fetchCF<any[]>('user.info', { handles: cleanHandle });
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(users[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
