'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Lightbulb } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const SCENES = [
  { id: 'scene.entire_pad_nighttime', label: 'Night' },
  { id: 'scene.entire_pad_sleepy', label: 'Sleepy' },
  { id: 'scene.entire_pad_read', label: 'Read' },
  { id: 'scene.entire_pad_arise', label: 'Arise' },
];

interface HaLightState {
  state: string;
  attributes: {
    brightness?: number;
    color_temp_kelvin?: number;
    friendly_name?: string;
  };
}

export default function LightsCard() {
  const LIGHTS_GROUP = 'light.bedroom';

  const { data, mutate } = useSWR<HaLightState>(
    `/api/ha/states/${LIGHTS_GROUP}`,
    fetcher,
    { refreshInterval: 10_000 },
  );

  const isOn = data?.state === 'on';
  const brightness = Math.round(((data?.attributes?.brightness ?? 0) / 255) * 100);

  const [activeScene, setActiveScene] = useState<string | null>(null);
  const [localBrightness, setLocalBrightness] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function callService(domain: string, service: string, payload: object) {
    setBusy(true);
    try {
      await fetch(`/api/ha/services/${domain}/${service}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setTimeout(() => { mutate(); setLocalBrightness(null); }, 1500);
    } finally {
      setBusy(false);
    }
  }

  async function toggleLight() {
    if (isOn) {
      await callService('light', 'turn_off', { entity_id: LIGHTS_GROUP });
    } else {
      await callService('light', 'turn_on', { entity_id: LIGHTS_GROUP, brightness_pct: 30 });
    }
  }

  async function activateScene(scene: typeof SCENES[0]) {
    setActiveScene(scene.id);
    await callService('scene', 'turn_on', { entity_id: scene.id });
  }

  async function applyBrightness(pct: number) {
    setLocalBrightness(pct);
    await callService('light', 'turn_on', {
      entity_id: LIGHTS_GROUP,
      brightness_pct: pct,
      transition: 1,
    });
  }

  const displayBrightness = localBrightness ?? brightness;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <p className="card-label flex items-center gap-1.5">
          <Lightbulb size={12} /> Lights
        </p>
        <button
          onClick={toggleLight}
          disabled={busy}
          className={`w-10 h-6 rounded-full transition-colors relative disabled:opacity-40 ${
            isOn ? 'bg-accent' : 'bg-bg-subtle'
          }`}
          aria-label={isOn ? 'Turn off lights' : 'Turn on lights'}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
              isOn ? 'left-4' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {/* Scene buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {SCENES.map((scene) => (
          <button
            key={scene.id}
            onClick={() => activateScene(scene)}
            disabled={busy}
            className={`py-2 px-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 ${
              activeScene === scene.id
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-border text-txt-secondary hover:border-accent/50'
            }`}
          >
            {scene.label}
          </button>
        ))}
      </div>

      {/* Brightness slider — only show when on */}
      <div className={`transition-opacity ${isOn ? 'opacity-100' : 'opacity-30'}`}>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-txt-secondary">Brightness</span>
          <span className="text-txt-primary tabular-nums">{displayBrightness}%</span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          value={displayBrightness}
          disabled={!isOn || busy}
          onChange={(e) => setLocalBrightness(Number(e.target.value))}
          onMouseUp={(e) => applyBrightness(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => applyBrightness(Number((e.target as HTMLInputElement).value))}
          className="w-full accent-accent disabled:opacity-40"
        />
      </div>
    </div>
  );
}
