import { NextResponse } from 'next/server';
import { haGet, haPost } from '@/lib/ha-client';

type Params = { params: { path: string[] } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const path = params.path.join('/');
    const data = await haGet(path);
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'HA request failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const path = params.path.join('/');
    const body: unknown = await req.json().catch(() => undefined);
    const data = await haPost(path, body);
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'HA request failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
