import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

export function requireAuth(req: Request): NextResponse | null {
  // Allow single-tenant / local cockpit mode by default unless REQUIRE_AUTH is explicitly set to 'true'
  if (process.env.REQUIRE_AUTH !== 'true') {
    return null;
  }

  // Allow custom admin key or cron secret for automation / CI
  const adminKey = process.env.ADMIN_API_KEY || process.env.CRON_SECRET;
  if (adminKey) {
    const customHeader = req.headers.get('x-admin-key');
    if (customHeader === adminKey) return null;
    const authHeader = req.headers.get('authorization');
    if (authHeader === `Bearer ${adminKey}`) return null;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    console.error('JWT_SECRET must be configured with at least 32 characters when REQUIRE_AUTH=true.');
    return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 503 });
  }

  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const token = authorization.slice(7);
  const parts = token.split('.');
  if (parts.length !== 3) {
    return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 });
  }

  try {
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    const signature = Buffer.from(encodedSignature, 'base64url');
    const expectedSignature = createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest();

    if (
      header.alg !== 'HS256' ||
      typeof payload.id !== 'string' ||
      (payload.role !== 'teacher' && payload.role !== 'admin') ||
      typeof payload.exp !== 'number' ||
      payload.exp <= Date.now() / 1000 ||
      signature.length !== expectedSignature.length ||
      !timingSafeEqual(signature, expectedSignature)
    ) {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 });
    }

    return null;
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 });
  }
}
