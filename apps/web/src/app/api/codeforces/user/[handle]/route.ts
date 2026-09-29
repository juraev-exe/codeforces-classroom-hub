import { NextResponse } from 'next/server';
import { fetchCF } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { handle: string } }
) {
  try {
    const users = await fetchCF<any[]>('user.info', { handles: params.handle });
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(users[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
