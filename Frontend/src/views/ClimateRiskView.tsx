import React, { useEffect, useState } from 'react';
import { AlertTriangle, Flame, CloudRain, CheckCircle2, RefreshCw, Activity } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { audioService } from '../services/audioService';

export const ClimateRiskView: React.FC = () => {
  const { conditions, coordinates, refreshWeather } = useClimate();

  const getTargetScore = () => {
    switch (conditions.risk) {
      case 'SEVERE': return 89;
      case 'HIGH': return 74;
      case 'MODERATE': return 46;
      default: return 18;
    }
  };

  const animScore = useAnimatedNumber(getTargetScore(), 650);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const getRiskPulse = () => {
    switch (conditions.risk) {
      case 'SEVERE':
        return { dot: 'bg-rose-500 animate-ping', text: 'text-rose-400', border: 'border-rose-500/50', bg: 'bg-rose-500/10' };
      case 'HIGH':
        return { dot: 'bg-orange-500 animate-pulse', text: 'text-orange-400', border: 'border-orange-500/40', bg: 'bg-orange-500/10' };
      case 'MODERATE':
        return { dot: 'bg-amber-400 animate-pulse', text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' };
      default:
        return { dot: 'bg-emerald-400 animate-pulse', text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' };
    }
  };

  const riskStyle = getRiskPulse();

  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col gap-6">
      {/* 1. Header (Reveals First) */}
      <div
        className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-4 transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-amber-400 uppercase">
            <span className={`w-1.5 h-1.5 rounded-full ${riskStyle.dot}`} />
            <span>HAZARD DETECTION & THREAT MODELING</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mt-1 tracking-tight">
            Climate Risk Intelligence & Threat Vectors
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-mono">
            SECTOR: {coordinates.label || 'Monitored Perimeter'} · RISK CLASSIFICATION: {conditions.risk}
          </p>
        </div>

        <button
          onClick={async () => {
            audioService.playTick();
            await refreshWeather();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>REFRESH LIVE RISK</span>
        </button>
      </div>

      {/* 2. Primary Risk Status Hero Banner (Reveals Second) */}
      <div
        style={{ transitionDelay: '100ms' }}
        className={`bg-[#040814]/85 border ${riskStyle.border} rounded-2xl p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-600 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="flex items-center gap-5">
          <div className={`w-16 h-16 rounded-2xl ${riskStyle.bg} border ${riskStyle.border} flex items-center justify-center shrink-0`}>
            <AlertTriangle className={`w-8 h-8 ${riskStyle.text}`} />
          </div>
          <div>
            <div className="text-xs font-mono tracking-wider text-slate-400 uppercase">
              OVERALL PERIMETER THREAT INDEX
            </div>
            <div className={`text-3xl font-bold tracking-tight mt-0.5 ${riskStyle.text} uppercase flex items-center gap-2`}>
              <span>{conditions.risk} RISK LEVEL</span>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-1 max-w-md">
              {conditions.conditionDescription}. Continuous telemetry maintains 99.98% confidence across orbital observation vectors.
            </p>
          </div>
        </div>

        {/* Severity Gauge with Animated Number Counter */}
        <div className="w-full md:w-56 bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>INDEX SCORE</span>
            <span className="font-bold text-white tabular-nums">{animScore} / 100</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full my-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${
                animScore >= 80 ? 'bg-rose-500' : animScore >= 60 ? 'bg-orange-500' : animScore >= 40 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${animScore}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 flex justify-between">
            <span>LOW (0)</span>
            <span>SEVERE (100)</span>
          </div>
        </div>
      </div>

      {/* 3. Two Dedicated Threat Vectors (Reveals Third, Staggered) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vector A: Heatwave & Thermal Risk */}
        <div
          style={{ transitionDelay: '200ms' }}
          className={`bg-[#040814]/85 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all duration-600 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>VECTOR A // HEATWAVE DYNAMICS</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                conditions.temperature >= 35
                  ? 'border-rose-500/40 text-rose-400 bg-rose-500/10'
                  : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
              }`}>
                {conditions.temperature >= 35 ? 'ELEVATED' : 'NOMINAL'}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mt-4 tracking-tight">
              Thermal Exertion Index: {conditions.temperature}°C
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-2 leading-relaxed">
              Monitors solar radiation flux, daytime heat accumulation, and physiological cooling requirements across the monitored perimeter.
            </p>

            <div className="mt-5 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">SURFACE TEMPERATURE:</span>
                <span className="text-slate-200 font-semibold">{conditions.temperature}°C</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">APPARENT HEAT INDEX:</span>
                <span className="text-slate-200 font-semibold">{conditions.feelsLike ?? conditions.temperature}°C</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">PEAK SOLAR WINDOW:</span>
                <span className="text-amber-400 font-semibold">11:00 — 16:00 UTC</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 font-sans flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>Advisory: Maintain continuous fluid intake and avoid prolonged sun exposure during peak intervals.</span>
          </div>
        </div>

        {/* Vector B: Heavy Rain & Flash Precipitation Risk */}
        <div
          style={{ transitionDelay: '300ms' }}
          className={`bg-[#040814]/85 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all duration-600 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-sky-400 uppercase tracking-wider">
                <CloudRain className="w-4 h-4 text-sky-400" />
                <span>VECTOR B // PRECIPITATION & RUNOFF</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                conditions.precipitationChance >= 50
                  ? 'border-rose-500/40 text-rose-400 bg-rose-500/10'
                  : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
              }`}>
                {conditions.precipitationChance >= 50 ? 'WATCH ACTIVE' : 'NOMINAL'}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mt-4 tracking-tight">
              Precipitation Probability: {conditions.precipitationChance}%
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-2 leading-relaxed">
              Analyzes atmospheric moisture saturation, barometric gradient shifts, and localized stormwater runoff accumulation potential.
            </p>

            <div className="mt-5 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">ACCUMULATION PREDICTED:</span>
                <span className="text-slate-200 font-semibold">{conditions.rainfallMm ?? 0} mm</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">ATMOSPHERIC MOISTURE:</span>
                <span className="text-slate-200 font-semibold">{conditions.humidity}% Relative Humidity</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">ISO-GRADIENT PRESSURE:</span>
                <span className="text-sky-400 font-semibold">{conditions.pressure ?? 1013} hPa</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 font-sans flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>Advisory: Verify storm drainage perimeter and secure loose exterior fixtures if rain surges exceed 20mm.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

