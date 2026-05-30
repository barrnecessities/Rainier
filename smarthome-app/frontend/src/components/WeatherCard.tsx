'use client';

import useSWR from 'swr';
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Droplets } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface HaState {
  state: string;
  attributes: Record<string, unknown>;
}

function WeatherIcon({ condition }: { condition: string }) {
  if (condition.includes('rain') || condition.includes('drizzle')) return <CloudRain size={18} />;
  if (condition.includes('snow')) return <CloudSnow size={18} />;
  if (condition.includes('cloud') || condition.includes('overcast')) return <Cloud size={18} />;
  if (condition.includes('wind')) return <Wind size={18} />;
  return <Sun size={18} />;
}

function conditionLabel(c: string): string {
  return c.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function WeatherCard() {
  const { data } = useSWR<HaState>('/api/ha/states/weather.home', fetcher, {
    refreshInterval: 10 * 60_000,
  });

  const temp = data?.attributes?.temperature as number | undefined;
  const unit = (data?.attributes?.temperature_unit as string | undefined) ?? '°F';
  const humidity = data?.attributes?.humidity as number | undefined;
  const windSpeed = data?.attributes?.wind_speed as number | undefined;
  const windUnit = (data?.attributes?.wind_speed_unit as string | undefined) ?? 'mph';
  const condition = data?.state ?? 'unknown';
  const forecast = (data?.attributes?.forecast as Array<{
    datetime: string;
    condition: string;
    temperature: number;
    templow?: number;
  }> | undefined)?.slice(0, 3) ?? [];

  if (!data) {
    return (
      <div className="card animate-pulse">
        <p className="card-label">Weather</p>
        <div className="h-12 bg-bg-subtle rounded mt-2" />
      </div>
    );
  }

  return (
    <div className="card">
      <p className="card-label mb-3">Weather</p>

      {/* Current conditions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-txt-secondary">
            <WeatherIcon condition={condition} />
          </span>
          <div>
            <p className="text-2xl font-light">
              {temp !== undefined ? `${Math.round(temp)}${unit}` : '—'}
            </p>
            <p className="text-xs text-txt-secondary">{conditionLabel(condition)}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 text-xs text-txt-secondary">
          {humidity !== undefined && (
            <span className="flex items-center gap-1">
              <Droplets size={11} /> {humidity}%
            </span>
          )}
          {windSpeed !== undefined && (
            <span className="flex items-center gap-1">
              <Wind size={11} /> {Math.round(windSpeed)} {windUnit}
            </span>
          )}
        </div>
      </div>

      {/* 3-day forecast */}
      {forecast.length > 0 && (
        <div className="flex gap-2 border-t border-border pt-3">
          {forecast.map((day) => {
            const date = new Date(day.datetime);
            const label = date.toLocaleDateString('en-US', { weekday: 'short' });
            return (
              <div key={day.datetime} className="flex-1 flex flex-col items-center gap-1 text-xs">
                <span className="text-txt-muted">{label}</span>
                <WeatherIcon condition={day.condition} />
                <span className="text-txt-primary">{Math.round(day.temperature)}{unit}</span>
                {day.templow !== undefined && (
                  <span className="text-txt-muted">{Math.round(day.templow)}{unit}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
