'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { SlidersHorizontal, RefreshCw, Sunset } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CoverState {
  state: string;
  attributes: { current_position?: number; friendly_name?: string };
}

const COVERS = [
  { entity: 'cover.topdownbottomup_0001_combined', label: 'Living Room' },
];

function PositionSlider({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="range"
      min={0}
      max={100}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-accent disabled:opacity-40"
    />
  );
}

export default function BlindsCard() {
  const [pending, setPending] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [autoMode, setAutoMode] = useState(true);

  const { data: covers, mutate } = useSWR<Record<string, CoverState>>(
    COVERS.map((c) => c.entity).join(','),
    async () => {
      const results = await Promise.all(
        COVERS.map((c) => fetch(`/api/ha/states/${c.entity}`).then((r) => r.json())),
      );
      return Object.fromEntries(COVERS.map((c, i) => [c.entity, results[i]]));
    },
    { refreshInterval: 15_000 },
  );

  function getPosition(entity: string): number {
    if (pending[entity] !== undefined) return pending[entity];
    return covers?.[entity]?.attributes?.current_position ?? 50;
  }

  const setPosition = useCallback(
    async (entity: string, position: number) => {
      setSaving((s) => ({ ...s, [entity]: true }));
      try {
        await fetch('/api/ha/services/cover/set_cover_position', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_id: entity,
            position,
          }),
        });
        setPending((p) => ({ ...p, [entity]: position }));
        setTimeout(() => {
          mutate();
          setPending((p) => { const n = { ...p }; delete n[entity]; return n; });
        }, 3000);
      } finally {
        setSaving((s) => ({ ...s, [entity]: false }));
      }
    },
    [mutate],
  );

  async function closeAll() {
    await Promise.all(COVERS.map((c) => setPosition(c.entity, 0)));
  }

  async function openAll() {
    await Promise.all(COVERS.map((c) => setPosition(c.entity, 100)));
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <p className="card-label flex items-center gap-1.5">
          <SlidersHorizontal size={12} /> Blinds
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoMode((v) => !v)}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
              autoMode
                ? 'border-accent/40 text-accent bg-accent/10'
                : 'border-border text-txt-secondary'
            }`}
          >
            Auto
          </button>
        </div>
      </div>

      <div className="space-y-4 mb-4">
        {COVERS.map((cover) => {
          const position = getPosition(cover.entity);
          const isSaving = saving[cover.entity];
          return (
            <div key={cover.entity}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-txt-secondary">{cover.label}</span>
                <span className="text-txt-primary tabular-nums">{position}%</span>
              </div>
              <PositionSlider
                value={position}
                disabled={isSaving}
                onChange={(v) => setPending((p) => ({ ...p, [cover.entity]: v }))}
              />
              <button
                className="text-xs text-accent mt-1 disabled:opacity-40"
                disabled={isSaving}
                onClick={() => setPosition(cover.entity, position)}
              >
                {isSaving ? 'Moving…' : 'Apply'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button onClick={closeAll} className="btn-secondary flex-1 text-sm">
          <Sunset size={13} className="inline mr-1" /> Close All
        </button>
        <button onClick={openAll} className="btn-secondary flex-1 text-sm">
          <RefreshCw size={13} className="inline mr-1" /> Open All
        </button>
      </div>

      {autoMode && (
        <p className="text-xs text-txt-muted text-center mt-3">
          Auto-adjusting with sun position · Override clears at next sun event
        </p>
      )}
    </div>
  );
}
