'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Home, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function useClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    function tick() {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
    tick();
    const t = setInterval(tick, 10_000);
    return () => clearInterval(t);
  }, []);
  return time;
}

export default function Header() {
  const time = useClock();
  const router = useRouter();
  const { data } = useSWR<{ state: string }>('/api/ha/states/person.home_owner', fetcher, {
    refreshInterval: 30_000,
  });

  const isHome = !data || data.state === 'home';

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.replace('/login');
  }

  return (
    <div className="flex items-center justify-between pt-4 pb-1">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔥</span>
        <span className="font-semibold text-txt-primary">Hearth</span>
      </div>

      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border
          ${isHome
            ? 'border-success/40 text-success bg-success/10'
            : 'border-txt-muted/40 text-txt-secondary bg-bg-card'
          }`}
        >
          <Home size={12} />
          {isHome ? 'Home' : 'Away'}
        </div>

        <span className="text-txt-primary font-mono text-base tabular-nums">{time}</span>

        <button onClick={logout} className="icon-btn" aria-label="Log out">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
