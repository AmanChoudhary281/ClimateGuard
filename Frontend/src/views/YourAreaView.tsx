import React, { useEffect, useState } from 'react';
import { MapPin, Thermometer, Wind, Droplets, AlertTriangle, ArrowRight, RefreshCw, Activity } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { audioService } from '../services/audioService';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

export const YourAreaView: React.FC = () => {
  const { coordinates, conditions, locationStatus, requestLocation, setCurrentView, alerts } = useClimate();

  // Smooth number interpolation for atmospheric values
  const animatedTemp = useAnimatedNumber(conditions.temperature, 700);
  const animatedHum = useAnimatedNumber(conditions.humidity, 700);
  const animatedWind = useAnimatedNumber(conditions.windSpeed, 700);

  // Staged entrance animation tracker
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const getRiskStyles = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400' };
      case 'MODERATE':
        return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-400' };
      case 'HIGH':
        return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', dot: 'bg-orange-400' };
      case 'SEVERE':
        return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', dot: 'bg-rose-400' };
      default:
        return { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30', dot: 'bg-sky-400' };
    }
  };

  const riskStyle = getRiskStyles(conditions.risk);

  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col gap-6">
      {/* 1. Header Section with Smooth Slide-in */}
      <div
        className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-5 transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-sky-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span>LOCALIZED PERIMETER MONITORING</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mt-1 tracking-tight">
            YOUR AREA · {coordinates.city || coordinates.label || 'Monitored Sector'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time environmental surveillance, atmospheric stability, and personalized safety intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              audioService.playTick();
              requestLocation();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span>SYNC GPS</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards Grid with Sequential Stagger */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Geographic Location Card */}
        <div
          className={`bg-[#040814]/85 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all duration-600 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="uppercase tracking-wider">GEOGRAPHIC SECTOR</span>
            <MapPin className="w-4 h-4 text-sky-400" />
          </div>

          <div className="my-4">
            <div className="text-xl font-bold text-white tracking-tight">
              {coordinates.label || `${coordinates.lat}° N, ${coordinates.lng}° E`}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1 tabular-nums">
              LAT {coordinates.lat.toFixed(4)}° · LON {coordinates.lng.toFixed(4)}°
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">STATUS:</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{locationStatus}</span>
            </span>
          </div>
        </div>

        {/* Card 2: Climate Risk Rating */}
        <div
          style={{ transitionDelay: '100ms' }}
          className={`bg-[#040814]/85 border ${riskStyle.border} rounded-2xl p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all duration-600 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="uppercase tracking-wider">CURRENT CLIMATE RISK</span>
            <AlertTriangle className={`w-4 h-4 ${riskStyle.text}`} />
          </div>

          <div className="my-4">
            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full ${riskStyle.dot} animate-pulse`} />
              <span className={`text-2xl font-bold ${riskStyle.text} tracking-tight uppercase`}>
                {conditions.risk} RISK
              </span>
            </div>
            <div className="text-xs text-slate-300 mt-1.5 font-sans">
              {conditions.conditionDescription}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">DIRECTIVES:</span>
            <button
              onClick={() => {
                audioService.playTick();
                setCurrentView('RISK');
              }}
              className="text-sky-400 hover:text-sky-300 underline underline-offset-2 cursor-pointer"
            >
              INSPECT THREAT →
            </button>
          </div>
        </div>

        {/* Card 3: Weather Telemetry with Counting Numbers */}
        <div
          style={{ transitionDelay: '200ms' }}
          className={`bg-[#040814]/85 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all duration-600 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="uppercase tracking-wider">ATMOSPHERIC STATE</span>
            <Thermometer className="w-4 h-4 text-amber-400" />
          </div>

          <div className="my-4 flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
                {animatedTemp}°C
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Feels like {conditions.feelsLike ?? conditions.temperature}°C
              </div>
            </div>
            <div className="text-right text-xs font-mono text-slate-400 space-y-0.5">
              <div>HUM: <span className="text-slate-200">{animatedHum}%</span></div>
              <div>WIND: <span className="text-slate-200">{animatedWind} km/h</span></div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">LAST TELEMETRY:</span>
            <span className="text-slate-300 flex items-center gap-1">
              <Activity className="w-3 h-3 text-sky-400" />
              <span>{conditions.lastUpdated}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Operational Quick Nav Deck with Staggered Entrance */}
      <div
        style={{ transitionDelay: '300ms' }}
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 transition-all duration-600 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <button
          onClick={() => {
            audioService.playTick();
            setCurrentView('WEATHER');
          }}
          className="bg-slate-950/60 hover:bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 rounded-xl text-left transition-all cursor-pointer group hover:-translate-y-0.5"
        >
          <div className="text-sky-400 font-mono text-[10px] tracking-wider uppercase">01 // OBSERVATION</div>
          <div className="text-sm font-semibold text-white mt-1 group-hover:text-sky-300 flex items-center justify-between">
            <span>Weather & Forecast</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
          <p className="text-xs text-slate-400 mt-1">7-day meteorological projection & thermal cycles.</p>
        </button>

        <button
          onClick={() => {
            audioService.playTick();
            setCurrentView('RISK');
          }}
          className="bg-slate-950/60 hover:bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 rounded-xl text-left transition-all cursor-pointer group hover:-translate-y-0.5"
        >
          <div className="text-amber-400 font-mono text-[10px] tracking-wider uppercase">02 // THREAT ENGINE</div>
          <div className="text-sm font-semibold text-white mt-1 group-hover:text-amber-300 flex items-center justify-between">
            <span>Heat & Rain Risk</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
          <p className="text-xs text-slate-400 mt-1">Heatwave & precipitation vector monitoring.</p>
        </button>

        <button
          onClick={() => {
            audioService.playTick();
            setCurrentView('ALERTS');
          }}
          className="bg-slate-950/60 hover:bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 rounded-xl text-left transition-all cursor-pointer group hover:-translate-y-0.5"
        >
          <div className="text-rose-400 font-mono text-[10px] tracking-wider uppercase">
            03 // DIRECTIVES {alerts.length > 0 && `(${alerts.length})`}
          </div>
          <div className="text-sm font-semibold text-white mt-1 group-hover:text-rose-300 flex items-center justify-between">
            <span>Active Alerts</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
          <p className="text-xs text-slate-400 mt-1">Actionable safety notices & perimeter dispatches.</p>
        </button>

        <button
          onClick={() => {
            audioService.playTick();
            setCurrentView('ASSISTANT');
          }}
          className="bg-slate-950/60 hover:bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 rounded-xl text-left transition-all cursor-pointer group hover:-translate-y-0.5"
        >
          <div className="text-emerald-400 font-mono text-[10px] tracking-wider uppercase">04 // INTELLIGENCE</div>
          <div className="text-sm font-semibold text-white mt-1 group-hover:text-emerald-300 flex items-center justify-between">
            <span>AI Assistant</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
          <p className="text-xs text-slate-400 mt-1">Consult localized preparedness & climate guidance.</p>
        </button>
      </div>
    </div>
  );
};
