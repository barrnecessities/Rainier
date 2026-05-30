'use client';

import useSWR from 'swr';
import { Home, MapPin, Thermometer } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface HaState {
  state: string;
  attributes: Record<string, unknown>;
}

const PEOPLE = [
  { entity: 'person.home_owner', label: 'You' },
];

function PresenceBadge({ state }: { state: string }) {
  const isHome = state === 'home';
  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
      isHome
        ? 'border-success/40 text-success bg-success/10'
        : 'border-txt-muted/30 text-txt-muted bg-transparent'
    }`}>
      {isHome ? <Home size={10} /> : <MapPin size={10} />}
      {isHome ? 'Home' : 'Away'}
    </span>
  );
}

export default function PresenceCard() {
  const presenceResults = PEOPLE.map((p) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSWR<HaState>(`/api/ha/states/${p.entity}`, fetcher, { refreshInterval: 30_000 }),
  );

  const { data: podData } = useSWR<HaState>(
    '/api/eight/status',
    fetcher,
    { refreshInterval: 60_000 },
  );

  const podTemp = podData?.attributes?.current_temperature as number | undefined;
  const podTarget = podData?.attributes?.target_temperature as number | undefined;
  const podState = podData?.state ?? 'unknown';

  return (
    <div className="card">
      <p className="card-label flex items-center gap-1.5 mb-3">
        <Home size={12} /> Home
      </p>

      {/* Presence */}
      <div className="space-y-2 mb-4">
        {PEOPLE.map((person, i) => {
          const { data } = presenceResults[i];
          return (
            <div key={person.entity} className="flex items-center justify-between">
              <span className="text-sm text-txt-primary">{person.label}</span>
              <PresenceBadge state={data?.state ?? 'unknown'} />
            </div>
          );
        })}
      </div>

      {/* 8sleep Pod status */}
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-txt-secondary">
            <Thermometer size={12} /> Pod 3
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            podState === 'heating'
              ? 'border-orange-500/40 text-orange-400 bg-orange-500/10'
              : podState === 'cooling'
              ? 'border-accent/40 text-accent bg-accent/10'
              : 'border-border text-txt-muted'
          }`}>
            {podState === 'off' ? 'Off' : podState.charAt(0).toUpperCase() + podState.slice(1)}
          </span>
        </div>

        {(podTemp !== undefined || podTarget !== undefined) && (
          <div className="flex gap-4 mt-2 text-xs text-txt-secondary">
            {podTemp !== undefined && (
              <span>Current: <span className="text-txt-primary">{Math.round(podTemp)}°F</span></span>
            )}
            {podTarget !== undefined && (
              <span>Target: <span className="text-txt-primary">{Math.round(podTarget)}°F</span></span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
