'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { AlarmClock, ChevronUp, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function parseTime(val: string): { h: number; m: number } {
  const [h = 6, m = 30] = val.split(':').map(Number);
  return { h, m };
}

function formatDisplay(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export default function AlarmCard() {
  const { data: haAlarm } = useSWR<{ state: string }>(
    '/api/ha/states/input_datetime.wake_alarm',
    fetcher,
    { refreshInterval: 60_000 },
  );

  const storedTime = haAlarm?.state?.slice(0, 5) ?? '06:30';
  const { h: initH, m: initM } = parseTime(storedTime);

  const [hours, setHours] = useState(initH);
  const [minutes, setMinutes] = useState(initM);
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'warn' | 'err'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  // Sync from HA when data loads
  useEffect(() => {
    if (haAlarm?.state) {
      const { h, m } = parseTime(haAlarm.state.slice(0, 5));
      setHours(h);
      setMinutes(m);
    }
  }, [haAlarm?.state]);

  function adjustH(delta: number) {
    setHours((prev) => (prev + delta + 24) % 24);
    setStatus('idle');
  }

  function adjustM(delta: number) {
    setMinutes((prev) => (prev + delta + 60) % 60);
    setStatus('idle');
  }

  async function save() {
    setSaving(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/alarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wakeTime: `${pad2(hours)}:${pad2(minutes)}`, enabled }),
      });
      const data = await res.json() as { ok?: boolean; warning?: string; error?: string };
      if (data.warning) {
        setStatus('warn');
        setStatusMsg(data.warning);
      } else if (data.ok) {
        setStatus('ok');
        setStatusMsg('Alarm set');
      } else {
        setStatus('err');
        setStatusMsg(data.error ?? 'Failed');
      }
    } catch {
      setStatus('err');
      setStatusMsg('Network error');
    } finally {
      setSaving(false);
    }
  }

  // Next alarm label
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const isToday = target.getDate() === now.getDate();
  const dayLabel = isToday ? 'Today' : 'Tomorrow';

  const statusColors = {
    idle: '',
    ok: 'text-success',
    warn: 'text-warning',
    err: 'text-danger',
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <p className="card-label flex items-center gap-1.5">
          <AlarmClock size={12} /> Wake Alarm
        </p>
        <button
          onClick={() => { setEnabled((v) => !v); setStatus('idle'); }}
          className="text-txt-secondary active:text-txt-primary transition-colors"
          aria-label={enabled ? 'Disable alarm' : 'Enable alarm'}
        >
          {enabled
            ? <ToggleRight size={22} className="text-accent" />
            : <ToggleLeft size={22} />}
        </button>
      </div>

      {/* Time picker */}
      <div className={`flex items-center justify-center gap-6 mb-4 transition-opacity ${enabled ? 'opacity-100' : 'opacity-30'}`}>
        {/* Hours */}
        <div className="flex flex-col items-center">
          <button onClick={() => adjustH(1)} className="icon-btn" disabled={!enabled}><ChevronUp size={20} /></button>
          <span className="text-4xl font-light tabular-nums w-16 text-center py-1">{pad2(hours)}</span>
          <button onClick={() => adjustH(-1)} className="icon-btn" disabled={!enabled}><ChevronDown size={20} /></button>
        </div>
        <span className="text-3xl font-extralight text-txt-secondary pb-1">:</span>
        {/* Minutes */}
        <div className="flex flex-col items-center">
          <button onClick={() => adjustM(5)} className="icon-btn" disabled={!enabled}><ChevronUp size={20} /></button>
          <span className="text-4xl font-light tabular-nums w-16 text-center py-1">{pad2(minutes)}</span>
          <button onClick={() => adjustM(-5)} className="icon-btn" disabled={!enabled}><ChevronDown size={20} /></button>
        </div>
        <div className="flex flex-col gap-1 pb-1">
          <span className="text-sm text-txt-primary font-medium">
            {hours >= 12 ? 'PM' : 'AM'}
          </span>
          <span className="text-xs text-txt-secondary">{dayLabel}</span>
        </div>
      </div>

      {/* What fires */}
      <p className="text-xs text-txt-secondary text-center mb-4">
        {enabled
          ? `Hue ramp · Blinds open · Pod thermal · ${formatDisplay(hours, minutes)}`
          : 'Alarm disabled'}
      </p>

      <button onClick={save} disabled={saving} className="btn-primary w-full disabled:opacity-40">
        {saving ? 'Setting…' : enabled ? `Set Alarm — ${formatDisplay(hours, minutes)}` : 'Save (disabled)'}
      </button>

      {status !== 'idle' && (
        <p className={`text-xs text-center mt-2 ${statusColors[status]}`}>{statusMsg}</p>
      )}

      <p className="text-xs text-txt-muted text-center mt-3">
        Alexa: "set wake alarm to {formatDisplay(hours, minutes)}"
      </p>
    </div>
  );
}
