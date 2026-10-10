import React, { useEffect, useState, useMemo } from 'react';
import { Thermometer, Wind, Droplets, CloudRain, Sun, Compass, Gauge, Clock, RefreshCw } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { audioService } from '../services/audioService';

export const WeatherView: React.FC = () => {
  const { coordinates, conditions, refreshWeather } = useClimate();

  // Smooth number interpolation on mount / data refresh
  const animTemp = useAnimatedNumber(conditions.temperature, 800);
  const animFeels = useAnimatedNumber(conditions.feelsLike ?? conditions.temperature, 800);
  const animHum = useAnimatedNumber(conditions.humidity, 800);
  const animWind = useAnimatedNumber(conditions.windSpeed, 800);
  const animPress = useAnimatedNumber(conditions.pressure ?? 1013, 800);

  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleRefresh = async () => {
    audioService.playTick();
    setIsRefreshing(true);
    await refreshWeather();
    audioService.playChirp();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // 24-hour diurnal curve points
  const hourlyPoints = useMemo(() => {
    const list: Array<{ hour: string; temp: number }> = [];
    for (let i = 0; i <= 24; i += 3) {
      const h = `${String(i).padStart(2, '0')}:00`;
      const offset = Math.sin(((i - 8) / 24) * 2 * Math.PI) * 4.5;
      list.push({ hour: h, temp: Math.round(conditions.temperature + offset) });
    }
    return list;
  }, [conditions.temperature]);

  const minTemp = Math.min(...hourlyPoints.map((d) => d.temp)) - 1;
  const maxTemp = Math.max(...hourlyPoints.map((d) => d.temp)) + 1;
  const range = Math.max(1, maxTemp - minTemp);
  const svgWidth = 700;
  const svgHeight = 110;
  const padX = 35;
  const padY = 20;

  const points = hourlyPoints.map((d, idx) => {
    const x = padX + (idx / (hourlyPoints.length - 1)) * (svgWidth - 2 * padX);
    const y = svgHeight - padY - ((d.temp - minTemp) / range) * (svgHeight - 2 * padY);
    return { x, y, temp: d.temp, hour: d.hour };
  });

  const pathD = points.reduce((acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col gap-6">
      {/* Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-4 transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-sky-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span>METEOROLOGICAL OBSERVATION STATION</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mt-1 tracking-tight">
            Current Atmospheric Dynamics & Forecast
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-mono">
            SECTOR: {coordinates.label || 'Monitored Perimeter'} · SOURCE: {conditions.source.toUpperCase()}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'SYNCING...' : 'SYNC DATA'}</span>
        </button>
      </div>

      {/* Main Weather Metric Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Large Primary Temperature Block */}
        <div
          className={`lg:col-span-5 bg-[#040814]/85 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all duration-600 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="uppercase tracking-wider">PRIMARY THERMAL READING</span>
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE
              </span>
            </div>

            <div className="mt-6 flex items-baseline gap-4">
              <div className="text-6xl sm:text-7xl font-bold text-white tabular-nums tracking-tighter">
                {animTemp}°
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-200">Celsius</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Apparent: {animFeels}°C
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm font-medium text-sky-400 flex items-center gap-2">
              <Sun className="w-4 h-4" />
              <span>{conditions.conditionDescription}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">PRECIPITATION:</span>
              <span className="text-slate-200 font-semibold">{conditions.rainfallMm ?? 0} mm</span>
            </div>
            <div>
              <span className="text-slate-500 block">PROBABILITY:</span>
              <span className="text-slate-200 font-semibold">{conditions.precipitationChance}%</span>
            </div>
          </div>
        </div>

        {/* Supporting Secondary Metric Grid with Interpolated Numbers */}
        <div
          style={{ transitionDelay: '150ms' }}
          className={`lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4 transition-all duration-600 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Humidity */}
          <div className="bg-[#040814]/85 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Droplets className="w-4 h-4 text-sky-400" />
              <span>HUMIDITY</span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold text-white tabular-nums">{animHum}%</div>
              <div className="text-[10px] text-slate-400 mt-1">Relative vapor ratio</div>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div className="bg-sky-400 h-full transition-all duration-700" style={{ width: `${conditions.humidity}%` }} />
            </div>
          </div>

          {/* Wind Speed */}
          <div className="bg-[#040814]/85 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Wind className="w-4 h-4 text-sky-400" />
              <span>WIND SPEED</span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold text-white tabular-nums">{animWind} <span className="text-sm font-normal">km/h</span></div>
              <div className="text-[10px] text-slate-400 mt-1">Velocity nominal</div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Compass className="w-3 h-3 text-sky-400" />
              <span>Vector {conditions.windDirection ?? 68}°</span>
            </div>
          </div>

          {/* Barometric Pressure */}
          <div className="bg-[#040814]/85 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Gauge className="w-4 h-4 text-amber-400" />
              <span>PRESSURE</span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold text-white tabular-nums">{animPress} <span className="text-sm font-normal">hPa</span></div>
              <div className="text-[10px] text-emerald-400 mt-1">Isobaric balance</div>
            </div>
            <div className="text-[10px] font-mono text-slate-400">Standard sea level</div>
          </div>

          {/* Solar UV */}
          <div className="bg-[#040814]/85 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>SOLAR UV</span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold text-white tabular-nums">{conditions.uvIndex ?? 4.2}</div>
              <div className="text-[10px] text-slate-400 mt-1">Moderate radiant flux</div>
            </div>
            <div className="text-[10px] font-mono text-slate-400">Albedo factor 0.28</div>
          </div>

          {/* Precipitation Potential */}
          <div className="bg-[#040814]/85 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <CloudRain className="w-4 h-4 text-sky-400" />
              <span>PRECIP. CHANCE</span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold text-white tabular-nums">{conditions.precipitationChance}%</div>
              <div className="text-[10px] text-slate-400 mt-1">Probability index</div>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div className="bg-sky-400 h-full transition-all duration-700" style={{ width: `${conditions.precipitationChance}%` }} />
            </div>
          </div>

          {/* Telemetry Cycle */}
          <div className="bg-[#040814]/85 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>TELEMETRY CYCLE</span>
            </div>
            <div className="my-2">
              <div className="text-sm font-bold text-white font-mono">{conditions.lastUpdated}</div>
              <div className="text-[10px] text-emerald-400 mt-1">Synchronized nominal</div>
            </div>
            <div className="text-[10px] font-mono text-slate-400">Orbital surface lock</div>
          </div>
        </div>
      </div>

      {/* 24-Hour Diurnal Curve (Drawn in smoothly) */}
      <div
        style={{ transitionDelay: '250ms' }}
        className={`bg-[#040814]/85 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-xl transition-all duration-600 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3 pb-2 border-b border-slate-800/80">
          <span className="uppercase tracking-wider">DIURNAL THERMAL TRAJECTORY (24-HOUR)</span>
          <span className="text-sky-400">SMOOTH ISOBARIC SAMPLING</span>
        </div>

        <div className="relative bg-[#070d1e]/80 border border-slate-800/80 rounded-xl p-3 overflow-hidden">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-24 overflow-visible">
            <defs>
              <linearGradient id="weatherGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#weatherGrad)" />
            <path
              d={pathD}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            {points.map((p, idx) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r="3" fill="#040814" stroke="#7dd3fc" strokeWidth="2" />
                <text x={p.x} y={p.y - 7} textAnchor="middle" className="fill-slate-300 font-mono text-[9px]">
                  {p.temp}°
                </text>
                <text x={p.x} y={svgHeight - 2} textAnchor="middle" className="fill-slate-500 font-mono text-[8px]">
                  {p.hour}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Multi-Day Forecast Timeline (Staggered Left to Right) */}
      <div
        style={{ transitionDelay: '350ms' }}
        className={`bg-[#040814]/85 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-xl transition-all duration-600 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-4 pb-3 border-b border-slate-800/80">
          <span className="uppercase tracking-wider">REGIONAL MULTI-DAY FORECAST MATRIX</span>
          <span className="text-sky-400">6-DAY PROJECTION</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {conditions.forecast && conditions.forecast.map((day, idx) => (
            <div
              key={idx}
              style={{ transitionDelay: `${400 + idx * 80}ms` }}
              className={`p-4 rounded-xl border transition-all duration-500 flex flex-col justify-between ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              } ${
                idx === 0
                  ? 'bg-sky-500/10 border-sky-500/40'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="text-xs font-mono font-semibold text-white">{day.dayName}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{day.condition}</div>
              </div>

              <div className="my-3">
                <div className="text-xl font-bold text-white tabular-nums">{day.maxTemp}°</div>
                <div className="text-xs font-mono text-slate-400 tabular-nums">Low {day.minTemp}°</div>
              </div>

              <div className="text-[10px] font-mono text-sky-400 flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span>RAIN</span>
                <span>{day.precipProb}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
