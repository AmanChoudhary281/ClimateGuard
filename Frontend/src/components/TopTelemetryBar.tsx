import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { audioService } from '../services/audioService';

interface TopTelemetryBarProps {
  orbitalLat?: number;
  orbitalLon?: number;
  isSurfaceLocked?: boolean;
}

export const TopTelemetryBar: React.FC<TopTelemetryBarProps> = ({
  orbitalLat,
  orbitalLon,
  isSurfaceLocked = false,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(true);

  const handleToggleAudio = () => {
    const nextMuted = audioService.toggleMute();
    setIsMuted(nextMuted);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${hours}:${minutes}:${seconds} UTC`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative z-20 w-full px-6 pt-5 pb-2 flex items-start justify-between text-xs font-mono select-none">
      {/* Left: System Identification, Version & Audio Toggle */}
      <div className="flex items-center gap-3 tracking-widest text-[11px] text-slate-300">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-medium tracking-widest uppercase">Climate Intelligence System</span>
        </div>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">V0.1</span>
        <button
          onClick={handleToggleAudio}
          title={isMuted ? 'Enable Mission Control audio' : 'Mute telemetry audio'}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer border ${
            isMuted
              ? 'text-slate-500 border-slate-800 hover:text-slate-300'
              : 'text-sky-400 border-sky-500/30 bg-sky-500/10'
          }`}
        >
          {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          <span className="text-[9px]">{isMuted ? 'AUDIO MUTE' : 'AUDIO LIVE'}</span>
        </button>
      </div>

      {/* Center: System Status Headline */}
      <div className="hidden md:flex items-center gap-2 text-emerald-400/90 text-[11px] tracking-widest uppercase font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Observation Active</span>
      </div>

      {/* Right: Telemetry Surface Lock & Real-Time Coordinates */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-4 py-2 text-[11px] backdrop-blur-md shadow-2xl flex flex-col gap-0.5 min-w-[210px]">
        <div className="flex items-center justify-between text-slate-400 tabular-nums">
          <span className="text-slate-500 tracking-wider">LAT</span>
          <span className="text-slate-200 font-medium">
            {orbitalLat == null ? '—' : `${orbitalLat.toFixed(3)}° ${orbitalLat >= 0 ? 'N' : 'S'}`}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-400 tabular-nums">
          <span className="text-slate-500 tracking-wider">LON</span>
          <span className="text-slate-200 font-medium">
            {orbitalLon == null ? '—' : `${orbitalLon.toFixed(3)}° ${orbitalLon >= 0 ? 'E' : 'W'}`}
          </span>
        </div>
        <div className="mt-1 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{isSurfaceLocked ? 'SURFACE LOCK' : 'SCANNING'}</span>
          </div>
          <span className="text-slate-400 font-mono tabular-nums">{utcTime || '--:--:-- UTC'}</span>
        </div>
      </div>
    </header>
  );
};
