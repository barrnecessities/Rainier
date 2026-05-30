const HA_BASE_URL = process.env.HA_BASE_URL ?? 'http://homeassistant.local:8123';
const HA_TOKEN = process.env.HA_TOKEN ?? '';

function headers() {
  return {
    'Authorization': `Bearer ${HA_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export interface HaState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
}

export async function haGet<T = HaState>(path: string): Promise<T> {
  const res = await fetch(`${HA_BASE_URL}/api/${path}`, {
    headers: headers(),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`HA GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function haPost(path: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`${HA_BASE_URL}/api/${path}`, {
    method: 'POST',
    headers: headers(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`HA POST ${path} failed: ${res.status}`);
  return res.json();
}

export async function getState(entityId: string): Promise<HaState> {
  return haGet<HaState>(`states/${entityId}`);
}

export async function getStates(): Promise<HaState[]> {
  return haGet<HaState[]>('states');
}

export async function callService(
  domain: string,
  service: string,
  data: Record<string, unknown>,
): Promise<unknown> {
  return haPost(`services/${domain}/${service}`, data);
}

export async function setInputDatetime(entityId: string, datetime: string): Promise<void> {
  await callService('input_datetime', 'set_datetime', {
    entity_id: entityId,
    datetime,
  });
}

export async function setCoverPosition(entityId: string, position: number): Promise<void> {
  await callService('cover', 'set_cover_position', {
    entity_id: entityId,
    position,
  });
}

export async function openCover(entityId: string): Promise<void> {
  await callService('cover', 'open_cover', { entity_id: entityId });
}

export async function closeCover(entityId: string): Promise<void> {
  await callService('cover', 'close_cover', { entity_id: entityId });
}

export async function turnLightOn(
  entityId: string,
  options?: { brightness_pct?: number; color_temp?: number; kelvin?: number },
): Promise<void> {
  await callService('light', 'turn_on', { entity_id: entityId, ...options });
}

export async function turnLightOff(entityId: string): Promise<void> {
  await callService('light', 'turn_off', { entity_id: entityId });
}

export async function activateScene(entityId: string): Promise<void> {
  await callService('scene', 'turn_on', { entity_id: entityId });
}

export async function setInputBoolean(entityId: string, value: boolean): Promise<void> {
  await callService(
    'input_boolean',
    value ? 'turn_on' : 'turn_off',
    { entity_id: entityId },
  );
}
