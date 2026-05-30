import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/eight/auth';
import { getCurrentHeatingStatus } from '@/lib/eight/user';
import { getRoutinesData } from '@/lib/eight/user';

export async function GET() {
  try {
    const email = process.env.EIGHT_EMAIL ?? '';
    const password = process.env.EIGHT_PASSWORD ?? '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    }

    const token = await authenticate(email, password);
    const [heating, alarm] = await Promise.all([
      getCurrentHeatingStatus(token),
      getRoutinesData(token, token.eightUserId).catch(() => null),
    ]);

    return NextResponse.json({ heating, alarm });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
