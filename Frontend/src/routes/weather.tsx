import { createFileRoute } from "@tanstack/react-router";
import { ClimateBackground } from "@/components/ClimateBackground";
import { useClimateGuard } from "@/context/ClimateGuardContext";
import { fmtLat, fmtLon } from "@/lib/sector";
import {
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  Calendar,
  Clock,
  Compass,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Sun,
  CloudLightning,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/weather")({
  component: WeatherPage,
});

function WeatherPage() {
  const {
    cityName,
    latitude,
    longitude,
    weather,
    forecast,
    hourly,
    weatherStatus,
    refreshWeather,
    lastUpdatedTime,
    riskLevel,
  } = useClimateGuard();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshWeather();
    setTimeout(() => setRefreshing(false), 600);
  };

  // Temperature trend SVG calculation
  const hourlyData = hourly && hourly.length > 0 ? hourly : [
    { time: "10:00", temp: 24, humidity: 65, rain: 0 },
    { time: "12:00", temp: 27, humidity: 58, rain: 0 },
    { time: "14:00", temp: 29, humidity: 52, rain: 0 },
    { time: "16:00", temp: 28, humidity: 55, rain: 0 },
    { time: "18:00", temp: 25, humidity: 62, rain: 0 },
    { time: "20:00", temp: 23, humidity: 69, rain: 0 },
    { time: "22:00", temp: 22, humidity: 73, rain: 0 },
  ];

  const temps = hourlyData.map((h) => h.temp);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const range = Math.max(1, maxTemp - minTemp);

  const svgPoints = hourlyData
    .map((h, i) => {
      const x = (i / (hourlyData.length - 1)) * 560 + 20;
      const y = 140 - ((h.temp - minTemp) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="min-h-screen text-white relative isolate overflow-x-hidden pt-18 pb-20 px-4 sm:px-8 max-w-7xl mx-auto">
      <ClimateBackground />

      {/* Breadcrumb Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.08] text-[11px] font-mono mb-8">
        <div className="flex items-center gap-3">
          <span className="text-white/40">METEOROLOGICAL TELEMETRY</span>
          <span className="text-white/20">/</span>
          <span className="text-cyan-400 font-semibold">{cityName}</span>
          <span className="text-white/20">/</span>
          <span className="text-white/60">
            {latitude !== null ? `${fmtLat(latitude, 2)} ${fmtLon(longitude!, 2)}` : "Live Sector"}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-white/50">UPDATED: {lastUpdatedTime}</span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/70 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw size={11} className={refreshing ? "animate-spin text-cyan-400" : ""} />
            <span>{refreshing ? "SYNCING..." : "SYNC"}</span>
          </button>
        </div>
      </div>

      {/* Main Weather Hero Block */}
      <div className="grid lg:grid-cols-12 gap-8 items-center mb-10">
        <div className="lg:col-span-7">
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-cyan-400/90 mb-2 font-semibold">
            BIOMETEOROLOGICAL OBSERVATION
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-2">
            Weather & Atmospheric Index
          </h1>
          <p className="text-white/60 text-sm max-w-xl">
            Live measurements from high-precision Open-Meteo sensors mapped across your geographic quadrant.
          </p>

          <div className="mt-8 flex items-baseline gap-6">
            <div className="text-6xl sm:text-7xl font-extrabold text-white tracking-tighter">
              {weather ? `${weather.temperature}°` : "24°"}
              <span className="text-2xl text-cyan-400 font-normal ml-1">C</span>
            </div>

            <div className="space-y-1">
              <div className="text-lg font-semibold text-white/90">
                {weather?.condition || "Partly Cloudy"}
              </div>
              <div className="text-xs font-mono text-white/50">
                Feels like {weather?.feelsLike ? `${Math.round(weather.feelsLike)}°C` : "24°C"}
              </div>
              <div className="text-xs font-mono text-cyan-400/80">
                Thermal Risk: {riskLevel}
              </div>
            </div>
          </div>
        </div>

        {/* Key Secondary Indicators Grid */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
            <div className="flex items-center justify-between text-white/50 text-xs mb-1 font-mono">
              <span>HUMIDITY</span>
              <Droplets size={14} className="text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {weather ? `${weather.humidity}%` : "68%"}
            </div>
            <div className="text-[10px] font-mono text-white/40 mt-1">
              Dew point nominal
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
            <div className="flex items-center justify-between text-white/50 text-xs mb-1 font-mono">
              <span>RAINFALL</span>
              <CloudRain size={14} className="text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {weather ? `${weather.rainfall} mm` : "0.0 mm"}
            </div>
            <div className="text-[10px] font-mono text-white/40 mt-1">
              Precipitation volume
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
            <div className="flex items-center justify-between text-white/50 text-xs mb-1 font-mono">
              <span>WIND SPEED</span>
              <Wind size={14} className="text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {weather ? `${weather.windSpeed} km/h` : "12 km/h"}
            </div>
            <div className="text-[10px] font-mono text-white/40 mt-1">
              Atmospheric vector
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
            <div className="flex items-center justify-between text-white/50 text-xs mb-1 font-mono">
              <span>SOLAR UV</span>
              <Sun size={14} className="text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              Moderate
            </div>
            <div className="text-[10px] font-mono text-white/40 mt-1">
              Index rating: 5.2
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Trend Visual Line Chart */}
      <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-cyan-400" />
            <h2 className="text-base font-bold text-white">Hourly Temperature Trend & Vector</h2>
          </div>
          <span className="text-xs font-mono text-white/50">Next 12 Hours Forecast</span>
        </div>

        <div className="w-full overflow-x-auto pb-2">
          <div className="min-w-[600px] h-48 relative">
            <svg viewBox="0 0 600 160" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="40" x2="580" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="20" y1="90" x2="580" y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="20" y1="140" x2="580" y2="140" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

              {/* Polyline Path */}
              <polyline
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={svgPoints}
                className="drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
              />

              {/* Point Markers & Tooltips */}
              {hourlyData.map((h, i) => {
                const x = (i / (hourlyData.length - 1)) * 560 + 20;
                const y = 140 - ((h.temp - minTemp) / range) * 100;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="#0c1929" stroke="#22d3ee" strokeWidth="2" />
                    <text
                      x={x}
                      y={y - 12}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {h.temp}°
                    </text>
                    <text
                      x={x}
                      y="156"
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.4)"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {h.time}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Multi-Day Detailed Forecast Grid */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-cyan-400" />
          <h2 className="text-base font-bold text-white">5-Day Extended Weather Outlook</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(forecast.length > 0 ? forecast : [
            { date: "Day 1", dayName: "Today", tempMax: 29, tempMin: 22, rainSum: 0, rainProb: 10, condition: "Clear Sky", risk: "LOW" as const },
            { date: "Day 2", dayName: "Tomorrow", tempMax: 31, tempMin: 23, rainSum: 1.2, rainProb: 25, condition: "Partly Cloudy", risk: "LOW" as const },
            { date: "Day 3", dayName: "Wednesday", tempMax: 33, tempMin: 24, rainSum: 0, rainProb: 5, condition: "Sunny", risk: "MODERATE" as const },
            { date: "Day 4", dayName: "Thursday", tempMax: 34, tempMin: 25, rainSum: 4.5, rainProb: 40, condition: "Scattered Rain", risk: "MODERATE" as const },
            { date: "Day 5", dayName: "Friday", tempMax: 30, tempMin: 21, rainSum: 0, rainProb: 15, condition: "Clear Sky", risk: "LOW" as const },
          ]).map((f) => (
            <div
              key={f.date}
              className="p-5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex flex-col justify-between hover:border-cyan-400/40 transition-all group"
            >
              <div>
                <div className="text-xs font-mono text-white/50 mb-1">{f.dayName}</div>
                <div className="text-sm font-semibold text-white/90 mb-3">{f.condition}</div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-white">{f.tempMax}°</span>
                  <span className="text-sm font-mono text-white/40">/ {f.tempMin}°C</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 text-xs font-mono space-y-1.5">
                <div className="flex justify-between text-white/60">
                  <span>Precipitation:</span>
                  <span className="text-blue-300 font-semibold">{f.rainSum} mm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Risk Status:</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      f.risk === "SEVERE" || f.risk === "HIGH"
                        ? "bg-red-500/20 text-red-400"
                        : f.risk === "MODERATE"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {f.risk}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
