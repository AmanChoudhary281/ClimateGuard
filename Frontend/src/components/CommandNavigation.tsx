import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, LockKeyhole } from 'lucide-react';
import { AppView, LocationStatus } from '../types/climate';
import { audioService } from '../services/audioService';

interface CommandNavigationProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  isRegistered: boolean;
  orbitalLat: number;
  orbitalLon: number;
  locationStatus: LocationStatus;
  activeAlertCount?: number;
}

const NAV_ITEMS: Array<{ id: AppView; label: string }> = [
  { id: 'HERO', label: 'HERO' },
  { id: 'AREA', label: 'YOUR AREA' },
  { id: 'WEATHER', label: 'WEATHER' },
  { id: 'RISK', label: 'RISK' },
  { id: 'ALERTS', label: 'ALERTS' },
  { id: 'ASSISTANT', label: 'AI ASSISTANT' },
  { id: 'PROFILE', label: 'PROFILE / LOGIN' },
];

export const CommandNavigation: React.FC<CommandNavigationProps> = ({
  currentView,
  onSelectView,
  isRegistered,
  orbitalLat,
  orbitalLon,
  locationStatus,
  activeAlertCount = 0,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${h}:${m}:${s} UTC`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleAudio = () => {
    const nextMuted = audioService.toggleMute();
    setIsMuted(nextMuted);
  };

  const getLocationBadge = () => {
    switch (locationStatus) {
      case 'LOCATION LOCKED':
        return { label: 'SURFACE LOCK', color: 'text-emerald-400', dot: 'bg-emerald-400' };
      case 'REQUESTING LOCATION':
        return { label: 'ACQUIRING...', color: 'text-amber-400', dot: 'bg-amber-400 animate-ping' };
      case 'LOCATION UNAVAILABLE':
        return { label: 'LOCATION UNAVAILABLE', color: 'text-rose-400', dot: 'bg-rose-400' };
      default:
        return { label: 'LOCATION PENDING', color: 'text-slate-500', dot: 'bg-slate-600' };
    }
  };

  const locBadge = getLocationBadge();

  return (
    <header className="relative z-30 w-full px-4 sm:px-6 pt-4 pb-2 flex flex-col lg:flex-row items-center justify-between gap-3 text-xs font-mono select-none border-b border-slate-800/40 backdrop-blur-md bg-slate-950/40">
      {/* 1. Left System Identity & Audio Control */}
      <div className="flex items-center justify-between w-full lg:w-auto gap-4">
        <div className="flex items-center gap-3 tracking-widest text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-medium tracking-widest uppercase text-slate-200">
              Climate Intelligence System
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">V0.1</span>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={handleToggleAudio}
          title={isMuted ? 'Enable Mission Control audio' : 'Mute telemetry audio'}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer border ${
            isMuted
              ? 'text-slate-500 border-slate-800 hover:text-slate-300'
              : 'text-sky-400 border-sky-500/30 bg-sky-500/10'
          }`}
        >
          {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          <span className="text-[9px] tracking-wider">{isMuted ? 'AUDIO OFF' : 'AUDIO LIVE'}</span>
        </button>
      </div>

      {/* 2. Center Command Navigation Tabs */}
      <nav className="flex items-center gap-1 overflow-x-auto max-w-full py-1 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const isLocked = !isRegistered && item.id !== 'HERO';
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                audioService.playTick();
                onSelectView(item.id);
              }}
              aria-disabled={isLocked}
              title={isLocked ? 'Initialize your ClimateGuard profile first' : item.label}
              className={`relative px-3 py-1.5 rounded-lg text-[11px] tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isLocked
                  ? 'text-slate-600 hover:text-slate-400 hover:bg-slate-900/40'
                  : isActive
                    ? 'text-white bg-slate-800/80 border border-slate-700/80 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span>{item.label}</span>
              {isLocked && <LockKeyhole className="w-3 h-3 opacity-70" />}
              {item.id === 'ALERTS' && activeAlertCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Right Telemetry Coordinates & Surface Lock Block */}
      <div className="hidden sm:flex bg-slate-950/80 border border-slate-800/80 rounded-lg px-3.5 py-1.5 text-[11px] backdrop-blur-md shadow-2xl flex-col gap-0.5 min-w-[210px]">
        <div className="flex items-center justify-between text-slate-400 tabular-nums">
          <span className="text-slate-500 tracking-wider">LAT</span>
          <span className="text-slate-200 font-medium">
            {isRegistered ? `${orbitalLat.toFixed(3)}° ${orbitalLat >= 0 ? 'N' : 'S'}` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-400 tabular-nums">
          <span className="text-slate-500 tracking-wider">LON</span>
          <span className="text-slate-200 font-medium">
            {isRegistered ? `${orbitalLon.toFixed(3)}° ${orbitalLon >= 0 ? 'E' : 'W'}` : '—'}
          </span>
        </div>
        <div className="mt-1 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
          <div className={`flex items-center gap-1.5 ${locBadge.color} font-medium tracking-wider`}>
            <span className={`w-1.5 h-1.5 rounded-full ${locBadge.dot}`} />
            <span>{locBadge.label}</span>
          </div>
          <span className="text-slate-400 font-mono tabular-nums">{utcTime || '--:--:-- UTC'}</span>
        </div>
      </div>
    </header>
  );
};
