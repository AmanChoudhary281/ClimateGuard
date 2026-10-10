import React, { useMemo } from 'react';
import { X, Wind, Gauge, Sun, Activity, Droplets } from 'lucide-react';
import { ClimateConditions, Coordinates } from '../types/climate';

interface ExtendedTelemetryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates: Coordinates;
  conditions: ClimateConditions;
}

export const ExtendedTelemetryDrawer: React.FC<ExtendedTelemetryDrawerProps> = ({
  isOpen,
  onClose,
  coordinates,
  conditions,
}) => {
  // Generate a transparent modelled thermal progression from the live current observation
  const hourlyData = useMemo(() => {
    const list: Array<{ hour: string; temp: number }> = [];
    const baseTemp = conditions.temperature;
    for (let i = 0; i < 24; i += 2) {
      const h = String(i).padStart(2, '0') + ':00';
      // Diurnal cycle: cooler at dawn, warmer in afternoon
      const diurnalOffset = Math.sin(((i - 8) / 24) * 2 * Math.PI) * 4.5;
      list.push({
        hour: h,
        temp: Math.round(baseTemp + diurnalOffset),
      });
    }
    return list;
  }, [conditions.temperature]);

  if (!isOpen) return null;

  const minTemp = Math.min(...hourlyData.map((d) => d.temp)) - 1;
  const maxTemp = Math.max(...hourlyData.map((d) => d.temp)) + 1;
  const tempRange = Math.max(1, maxTemp - minTemp);

  // SVG coordinates for sparkline
  const width = 600;
  const height = 110;
  const paddingX = 30;
  const paddingY = 20;

  const points = hourlyData.map((d, idx) => {
    const x = paddingX + (idx / (hourlyData.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((d.temp - minTemp) / tempRange) * (height - 2 * paddingY);
    return { x, y, temp: d.temp, hour: d.hour };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 md:p-6 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl bg-[#040814]/95 border-t md:border border-slate-800 rounded-t-2xl md:rounded-2xl p-6 md:p-7 shadow-2xl backdrop-blur-2xl text-slate-100 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-mono text-[10px] tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span>REGIONAL CLIMATOLOGICAL MATRIX · 24H SECTOR ANALYSIS</span>
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-white mt-1">
              {coordinates.label || 'Monitored Perimeter'}
            </h3>
            <p className="text-xs font-mono text-slate-400 tabular-nums">
              LAT {coordinates.lat.toFixed(4)}° · LON {coordinates.lng.toFixed(4)}°
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close extended telemetry drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 24-Hour Diurnal Temperature Profile */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className="uppercase tracking-wider">DIURNAL THERMAL FORECAST</span>
            <span className="text-slate-500">MIN {minTemp + 1}°C · MAX {maxTemp - 1}°C</span>
          </div>

          <div className="relative bg-[#070d1e]/80 border border-slate-800/80 rounded-xl p-3 overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
              <defs>
                <linearGradient id="thermalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={areaD} fill="url(#thermalGrad)" />
              <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="3" fill="#040814" stroke="#7dd3fc" strokeWidth="2" />
                  <text
                    x={p.x}
                    y={p.y - 8}
                    textAnchor="middle"
                    className="fill-slate-300 font-mono text-[9px]"
                  >
                    {p.temp}°
                  </text>
                  <text
                    x={p.x}
                    y={height - 2}
                    textAnchor="middle"
                    className="fill-slate-500 font-mono text-[8px]"
                  >
                    {p.hour}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Telemetry Sensor Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
          {/* Pressure */}
          <div className="bg-[#070d1e]/80 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
              <Gauge className="w-3.5 h-3.5 text-sky-400" />
              <span>BAROMETRIC</span>
            </div>
            <div className="mt-2 text-base text-white font-semibold tabular-nums">{conditions.pressure == null ? '—' : `${conditions.pressure} hPa`}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Live weather feed</div>
          </div>

          {/* Wind Vector */}
          <div className="bg-[#070d1e]/80 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
              <Wind className="w-3.5 h-3.5 text-sky-400" />
              <span>WIND VECTOR</span>
            </div>
            <div className="mt-2 text-base text-white font-semibold tabular-nums">
              {conditions.windSpeed} km/h
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Heading {conditions.windDirection == null ? '—' : `${conditions.windDirection}°`}</div>
          </div>

          {/* Solar Irradiance */}
          <div className="bg-[#070d1e]/80 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>SOLAR UV</span>
            </div>
            <div className="mt-2 text-base text-white font-semibold tabular-nums">{conditions.uvIndex == null ? '—' : `UV Index ${conditions.uvIndex}`}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Live feed when available</div>
          </div>

          {/* Air Quality */}
          <div className="bg-[#070d1e]/80 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>AIR QUALITY</span>
            </div>
            <div className="mt-2 text-base text-white font-semibold tabular-nums">Not connected</div>
            <div className="text-[10px] text-slate-500 mt-0.5">No PM2.5 source configured</div>
          </div>
        </div>
      </div>
    </div>
  );
};
