import { z } from 'zod';
import { APP_API_URL } from './constants';
import { fetchWithAuth } from './eight';
import type { Token } from './types';

export interface AlarmSettings {
  wakeTime: string;   // "HH:MM" in 24h format
  date?: string;      // "YYYY-MM-DD", defaults to next occurrence of wakeTime
  vibration?: boolean;
  vibrationLevel?: number; // 0-100
  thermalAlarm?: boolean;
}

export async function setAlarm(token: Token, userId: string, settings: AlarmSettings): Promise<void> {
  const url = `${APP_API_URL}v2/users/${userId}/routines`;

  const [hours, minutes] = settings.wakeTime.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(hours!, minutes!, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const isoTimestamp = target.toISOString();

  const body = {
    alarm: {
      enabled: true,
      alarmAt: isoTimestamp,
      vibration: settings.vibration ?? true,
      vibrationLevel: settings.vibrationLevel ?? 50,
      thermalAlarm: settings.thermalAlarm ?? true,
    },
  };

  await fetchWithAuth(url, token, z.unknown(), {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function disableAlarm(token: Token, userId: string): Promise<void> {
  const url = `${APP_API_URL}v2/users/${userId}/routines`;
  await fetchWithAuth(url, token, z.unknown(), {
    method: 'PUT',
    body: JSON.stringify({ alarm: { enabled: false } }),
  });
}
