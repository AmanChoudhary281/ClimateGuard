import React, { useEffect, useState } from 'react';
import { ClimateConditions, Coordinates, RiskLevel } from '../types/climate';
import { audioService } from '../services/audioService';

interface LiveMonitoringPanelProps {
  coordinates: Coordinates;
  conditions: ClimateConditions;
  onCycleRisk?: (newRisk: RiskLevel) => void;
  onRequestDeviceLocation?: () => void;
  onOpenExtendedTelemetry?: () => void;
  isLocating?: boolean;
  isRegistered?: boolean;
}

export const LiveMonitoringPanel: React.FC<LiveMonitoringPanelProps> = ({
  coordinates,
  conditions,
  onCycleRisk,
  onRequestDeviceLocation,
  onOpenExtendedTelemetry,
  isLocating = false,
  isRegistered = true,
}) => {
  // Bar graph heights state for dynamic telemetry fluctuation
  const [barHeights, setBarHeights] = useState<number[]>([
    25, 40, 30, 55, 65, 80, 95, 70, 50, 35, 60, 45,
  ]);

  useEffect(() => {
    // Subtle telemetry bar fluctuation every 2.4 seconds
    const interval = setInterval(() => {
      setBarHeights((prev) =>
        prev.map((h) => {
          const delta = (Math.random() - 0.5) * 16;
          return Math.max(15, Math.min(100, Math.round(h + delta)));
        })
      );
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'LOW':
        return {
          text: 'text-emerald-400',
          dot: 'bg-emerald-400',
          bar: 'bg-emerald-400/80',
          border: 'border-emerald-500/20',
        };
      case 'MODERATE':
        return {
          text: 'text-amber-400',
          dot: 'bg-amber-400',
          bar: 'bg-amber-400/80',
          border: 'border-amber-500/20',
        };
      case 'HIGH':
        return {
          text: 'text-orange-400',
          dot: 'bg-orange-400',
          bar: 'bg-orange-400/80',
          border: 'border-orange-500/20',
        };
      case 'SEVERE':
        return {
          text: 'text-rose-400',
          dot: 'bg-rose-400',
          bar: 'bg-rose-400/80',
          border: 'border-rose-500/20',
        };
    }
  };

  const riskStyles = getRiskColor(conditions.risk);

  const formattedLat = `${Math.abs(coordinates.lat).toFixed(1)}° ${
    coordinates.lat >= 0 ? 'N' : 'S'
  }`;
  const formattedLng = `${Math.abs(coordinates.lng).toFixed(1)}° ${
    coordinates.lng >= 0 ? 'E' : 'W'
  }`;

  return (
    <div className="relative z-20 flex flex-col gap-3.5 select-none font-mono text-xs max-w-[260px]">
      {/* 1. Live Monitoring Section */}
      <div>
        <div className="text-[10px] tracking-widest text-slate-500 uppercase font-medium">LIVE MONITORING</div>
        <div className="mt-1 flex items-center gap-2 text-slate-300">
          <span className={`w-1.5 h-1.5 rounded-full ${isRegistered ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-[13px] font-sans font-normal text-slate-200">{isRegistered ? 'System online' : 'Awaiting profile initialization'}</span>
        </div>
      </div>

      {/* 2. Current Location */}
      <div>
        <div className="flex items-center justify-between text-[10px] tracking-widest text-slate-500 uppercase font-medium">
          <span>CURRENT LOCATION</span>
          {isRegistered && onRequestDeviceLocation && (
            <button
              onClick={() => {
                audioService.playTick();
                onRequestDeviceLocation();
              }}
              disabled={isLocating}
              title="Sync GPS location"
              className="text-[9px] text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors cursor-pointer"
            >
              {isLocating ? 'LOCATING...' : 'SYNC GPS'}
            </button>
          )}
        </div>
        <div className="mt-1 text-[13px] text-slate-200 tabular-nums">
          {isRegistered ? `${formattedLat} ${formattedLng}` : 'AWAITING PROFILE'}
        </div>
      </div>

      {/* 3. Current Conditions */}
      <div>
        <div className="text-[10px] tracking-widest text-slate-500 uppercase font-medium">
          CURRENT CONDITIONS
        </div>
        <div className="mt-1 text-[13px] text-slate-200 tabular-nums font-sans">
          {isRegistered ? `${conditions.temperature}°C · ${conditions.humidity}% humidity` : '—'}
        </div>
      </div>

      {/* 4. Climate Risk */}
      <div>
        <div className="flex items-center justify-between text-[10px] tracking-widest text-slate-500 uppercase font-medium">
          <span>CLIMATE RISK</span>
          {isRegistered && onCycleRisk && (
            <button
              onClick={() => {
                audioService.playTick();
                const next: Record<RiskLevel, RiskLevel> = {
                  LOW: 'MODERATE',
                  MODERATE: 'HIGH',
                  HIGH: 'SEVERE',
                  SEVERE: 'LOW',
                };
                onCycleRisk(next[conditions.risk]);
              }}
              title="Click to cycle and preview risk levels"
              className="text-[9px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              CYCLE STATE
            </button>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${riskStyles.dot} transition-colors duration-500`} />
          <span className={`text-[13px] font-sans capitalize ${riskStyles.text} transition-colors duration-500`}>
            {isRegistered ? conditions.risk.charAt(0) + conditions.risk.slice(1).toLowerCase() : 'Locked'}
          </span>
        </div>
      </div>

      {/* 5. Telemetry Mini Bar Visualizer & Extended Metrics Trigger */}
      <div className="mt-1 flex items-center justify-between gap-3">
        <div className="flex items-end gap-1 h-6 w-24">
          {barHeights.map((h, idx) => (
            <div
              key={idx}
              className={`w-1 rounded-xs ${isRegistered ? riskStyles.bar : 'bg-slate-700/70'} transition-all duration-700 ease-out`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>

        {isRegistered && onOpenExtendedTelemetry && (
          <button
            onClick={() => {
              audioService.playTick();
              onOpenExtendedTelemetry();
            }}
            className="text-[9px] text-sky-400 hover:text-sky-300 font-mono tracking-wider transition-colors cursor-pointer border border-sky-500/20 px-1.5 py-0.5 rounded bg-sky-500/5 hover:bg-sky-500/10"
          >
            24H MATRIX ↗
          </button>
        )}
      </div>
    </div>
  );
};
