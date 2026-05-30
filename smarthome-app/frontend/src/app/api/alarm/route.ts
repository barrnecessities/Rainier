import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/lib/eight/auth';
import { setAlarm, disableAlarm } from '@/lib/eight/alarm';
import { setInputDatetime } from '@/lib/ha-client';

const AlarmBody = z.object({
  wakeTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  enabled: z.boolean().default(true),
});

export async function POST(req: Request) {
  try {
    const body = AlarmBody.parse(await req.json());

    const email = process.env.EIGHT_EMAIL ?? '';
    const password = process.env.EIGHT_PASSWORD ?? '';

    if (!email || !password) {
      return NextResponse.json({ error: '8sleep credentials not configured' }, { status: 500 });
    }

    // Set wake time in HA so automations can fire
    const [hours, minutes] = body.wakeTime.split(':').map(Number);
    const now = new Date();
    const target = new Date(now);
    target.setHours(hours!, minutes!, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const datetimeStr = target.toISOString().replace('T', ' ').slice(0, 19);

    await setInputDatetime('input_datetime.wake_alarm', datetimeStr);

    // Set 8sleep alarm (thermal + vibration)
    const token = await authenticate(email, password);
    if (body.enabled) {
      await setAlarm(token, token.eightUserId, {
        wakeTime: body.wakeTime,
        vibration: true,
        vibrationLevel: 50,
        thermalAlarm: true,
      });
    } else {
      await disableAlarm(token, token.eightUserId);
    }

    return NextResponse.json({ ok: true, wakeTime: body.wakeTime });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[alarm]', msg);
    // Return partial success if only 8sleep alarm fails — HA automation still fires
    if (msg.includes('8sleep') || msg.includes('eight') || msg.includes('API request failed')) {
      return NextResponse.json({
        ok: true,
        wakeTime: (await req.json().catch(() => ({}))).wakeTime,
        warning: '8sleep alarm API unavailable — HA wake sequence is set. Set 8sleep buzz alarm manually.',
      });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
