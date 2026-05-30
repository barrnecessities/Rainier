'use client';

import { useEffect, useState } from 'react';
import AlarmCard from '@/components/AlarmCard';
import WeatherCard from '@/components/WeatherCard';
import BlindsCard from '@/components/BlindsCard';
import LightsCard from '@/components/LightsCard';
import PresenceCard from '@/components/PresenceCard';
import Header from '@/components/Header';

export default function Dashboard() {
  // Apply night-mode dim when it's late/early
  useEffect(() => {
    function applyNightMode() {
      const h = new Date().getHours();
      const isNight = h >= 21 || h < 7;
      document.body.classList.toggle('night-mode', isNight);
    }
    applyNightMode();
    const t = setInterval(applyNightMode, 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 pb-10">
      <Header />
      <div className="space-y-3 mt-3">
        <AlarmCard />
        <WeatherCard />
        <BlindsCard />
        <LightsCard />
        <PresenceCard />
      </div>
    </div>
  );
}
