import { NextResponse } from 'next/server';
import { signSession, sessionCookie, clearCookie } from '@/lib/auth';

const APP_PASSWORD = process.env.APP_PASSWORD ?? '';

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };

  if (!password || password !== APP_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = signSession();
  const response = NextResponse.json({ ok: true });
  response.headers.set('Set-Cookie', sessionCookie(token));
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.headers.set('Set-Cookie', clearCookie());
  return response;
}
