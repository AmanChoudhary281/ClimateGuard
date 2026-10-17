import { createFileRoute, Link } from "@tanstack/react-router";
import { ClimateBackground } from "@/components/ClimateBackground";
import { useClimateGuard } from "@/context/ClimateGuardContext";
import { fmtLat, fmtLon } from "@/lib/sector";
import {
  ShieldAlert,
  ShieldCheck,
  Compass,
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  RefreshCw,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Clock,
  Radio,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/area")({
  component: YourAreaPage,
});

function YourAreaPage() {
  const {
    locationStatus,
    latitude,
    longitude,
    cityName,
    locality,
    displayName,
    weather,
    weatherStatus,
    forecast,
    riskLevel,
    heatRisk,
    rainRisk,
    refreshWeather,
    lastUpdatedTime,
    utcTime,
    alerts,
  } = useClimateGuard();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshWeather();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "SEVERE":
        return {
          text: "text-red-400",
          border: "border-red-500/40",
          bg: "bg-red-500/10",
          dot: "bg-red-400",
          label: "SEVERE RISK",
        };
      case "HIGH":
        return {
          text: "text-orange-400",
          border: "border-orange-500/40",
          bg: "bg-orange-500/10",
          dot: "bg-orange-400",
          label: "HIGH RISK",
        };
      case "MODERATE":
        return {
          text: "text-amber-400",
          border: "border-amber-500/40",
          bg: "bg-amber-500/10",
          dot: "bg-amber-400",
          label: "MODERATE RISK",
        };
      default:
        return {
          text: "text-emerald-400",
          border: "border-emerald-500/40",
          bg: "bg-emerald-500/10",
          dot: "bg-emerald-400",
          label: "LOW RISK (NOMINAL)",
        };
    }
  };

  const riskStyle = getRiskColor(riskLevel);

  return (
    <div className="min-h-screen text-white relative isolate overflow-x-hidden pt-18 pb-20 px-4 sm:px-8 max-w-7xl mx-auto">
      <ClimateBackground />

      {/* Top Telemetry Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.08] text-[11px] font-mono mb-8">
        <div className="flex items-center gap-3">
          <span className="text-white/40">SYS.PERIMETER // REGIONAL</span>
          <span className="text-white/20">/</span>
          <span className="text-cyan-400 font-semibold">{cityName}</span>
          <span className="text-white/20">/</span>
          <span className="text-white/60">{locality}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${riskStyle.dot} animate-pulse`} />
            <span className={riskStyle.text}>{riskStyle.label}</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/70 hover:text-white transition-all disabled:opacity-50"
            title="Refresh Area Telemetry"
          >
            <RefreshCw size={11} className={isRefreshing ? "animate-spin text-cyan-400" : ""} />
            <span>{isRefreshing ? "SYNCING..." : "SYNC"}</span>
          </button>
        </div>
      </div>

      {/* Hero: Regional Climate Intelligence Header */}
      <div className="grid lg:grid-cols-12 gap-8 items-start mb-10">
        <div className="lg:col-span-8">
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-cyan-400/90 mb-2 font-semibold flex items-center gap-2">
            <Compass size={13} />
            <span>PRIMARY SURVEILLANCE SECTOR</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
            YOUR AREA: <span className="text-cyan-300 font-normal">{cityName}</span>
          </h1>
          <p className="text-white/60 text-sm sm:text-base max-w-2xl leading-relaxed">
            Live atmospheric sensor telemetry, biometeorological hazard indexes, and early warning status for your active geolocation perimeter.
          </p>

          <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-white/50">
            <span>FULL SECTOR: <strong className="text-white/80">{displayName}</strong></span>
          </div>
        </div>

        {/* Global Area Risk Badge Card */}
        <div className={`lg:col-span-4 p-5 rounded-2xl border ${riskStyle.border} ${riskStyle.bg} backdrop-blur-xl transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)]`}>
          <div className="flex items-center justify-between mb-3 text-[10px] font-mono">
            <span className="text-white/60 tracking-wider">COMPOSITE CLIMATE RISK</span>
            <span className={`px-2 py-0.5 rounded border ${riskStyle.border} ${riskStyle.text} font-bold`}>
              {riskLevel}
            </span>
          </div>

          <div className="flex items-center gap-3 my-2">
            {riskLevel === "SEVERE" || riskLevel === "HIGH" ? (
              <ShieldAlert size={36} className={riskStyle.text} />
            ) : (
              <ShieldCheck size={36} className={riskStyle.text} />
            )}
            <div>
              <div className={`text-xl font-bold tracking-tight ${riskStyle.text}`}>
                {riskLevel === "SEVERE"
                  ? "EMERGENCY PROTOCOL"
                  : riskLevel === "HIGH"
                    ? "HEIGHTENED ALERT"
                    : riskLevel === "MODERATE"
                      ? "MODERATE MONITORING"
                      : "PERIMETER NOMINAL"}
              </div>
              <div className="text-xs text-white/60 font-mono">
                Heat: {heatRisk} · Rain: {rainRisk}
              </div>
            </div>
          </div>

          <p className="text-xs text-white/70 mt-3 pt-3 border-t border-white/10 leading-relaxed">
            {riskLevel === "SEVERE"
              ? "Dangerous heat or heavy rainfall threshold breached. Restrict outdoor exposure and monitor alerts."
              : riskLevel === "HIGH"
                ? "Elevated atmospheric stress detected. Hydration protocol recommended and avoid midday direct sun."
                : riskLevel === "MODERATE"
                  ? "Thermal or moisture indices show mild deviation from seasonal baseline."
                  : "All regional atmospheric parameters are within safe biometeorological comfort levels."}
          </p>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Temperature */}
        <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md relative overflow-hidden group hover:border-cyan-400/30 transition-all">
          <div className="flex items-center justify-between text-white/50 text-xs mb-2">
            <span className="font-mono uppercase tracking-wider">TEMPERATURE</span>
            <Thermometer size={16} className="text-cyan-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-1">
            {weather ? `${weather.temperature}°C` : weatherStatus === "SYNCING" ? "..." : "24°C"}
          </div>
          <div className="text-[11px] font-mono text-white/40">
            Feels like: {weather?.feelsLike ? `${Math.round(weather.feelsLike)}°C` : "24°C"}
          </div>
        </div>

        {/* Humidity */}
        <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md relative overflow-hidden group hover:border-cyan-400/30 transition-all">
          <div className="flex items-center justify-between text-white/50 text-xs mb-2">
            <span className="font-mono uppercase tracking-wider">HUMIDITY</span>
            <Droplets size={16} className="text-blue-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-1">
            {weather ? `${weather.humidity}%` : weatherStatus === "SYNCING" ? "..." : "68%"}
          </div>
          <div className="text-[11px] font-mono text-white/40">
            Thermal Index: {heatRisk}
          </div>
        </div>

        {/* Rainfall */}
        <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md relative overflow-hidden group hover:border-cyan-400/30 transition-all">
          <div className="flex items-center justify-between text-white/50 text-xs mb-2">
            <span className="font-mono uppercase tracking-wider">PRECIPITATION</span>
            <CloudRain size={16} className="text-indigo-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-1">
            {weather ? `${weather.rainfall} mm` : weatherStatus === "SYNCING" ? "..." : "0.0 mm"}
          </div>
          <div className="text-[11px] font-mono text-white/40">
            Drainage status: {rainRisk}
          </div>
        </div>

        {/* Wind Speed */}
        <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md relative overflow-hidden group hover:border-cyan-400/30 transition-all">
          <div className="flex items-center justify-between text-white/50 text-xs mb-2">
            <span className="font-mono uppercase tracking-wider">WIND SPEED</span>
            <Wind size={16} className="text-teal-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-1">
            {weather ? `${weather.windSpeed} km/h` : weatherStatus === "SYNCING" ? "..." : "12 km/h"}
          </div>
          <div className="text-[11px] font-mono text-white/40">
            Pressure gradient: Nominal
          </div>
        </div>
      </div>

      {/* Dual Column Telemetry: Location Details & Active Risk Matrix */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Location Card */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-white/60">GEOGRAPHIC LOCK</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                locationStatus === "LOCATION_LOCKED"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              }`}
            >
              {locationStatus === "LOCATION_LOCKED" ? "GPS / SATELLITE LOCKED" : "MANUAL SECTOR"}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <dt className="text-white/40 mb-1">LATITUDE</dt>
              <dd className="text-base font-bold text-white">
                {latitude !== null ? fmtLat(latitude, 4) : "28.6140° N"}
              </dd>
            </div>
            <div>
              <dt className="text-white/40 mb-1">LONGITUDE</dt>
              <dd className="text-base font-bold text-white">
                {longitude !== null ? fmtLon(longitude, 4) : "077.2090° E"}
              </dd>
            </div>
            <div>
              <dt className="text-white/40 mb-1">LOCALITY / SECTOR</dt>
              <dd className="text-sm font-medium text-white/90">{cityName}</dd>
            </div>
            <div>
              <dt className="text-white/40 mb-1">LAST TELEMETRY UPDATE</dt>
              <dd className="text-sm font-medium text-white/90">{lastUpdatedTime} Local</dd>
            </div>
          </dl>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Radio size={12} className="text-emerald-400" />
              Continuous Telemetry Online
            </span>
            <Link to="/weather" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
              <span>View full forecast</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Climate Risk Matrix Card */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-white/60">HAZARD BREAKDOWN</span>
            <Link to="/risk" className="text-xs text-cyan-400 hover:underline">
              Detailed analysis →
            </Link>
          </div>

          <div className="space-y-4">
            {/* Heat Risk Progress */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-white/80">HEATWAVE THERMAL RISK</span>
                <span className="font-bold text-amber-400">{heatRisk}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    heatRisk === "SEVERE"
                      ? "w-full bg-red-500"
                      : heatRisk === "HIGH"
                        ? "w-3/4 bg-orange-500"
                        : heatRisk === "MODERATE"
                          ? "w-1/2 bg-amber-400"
                          : "w-1/4 bg-emerald-400"
                  }`}
                />
              </div>
            </div>

            {/* Rain Risk Progress */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-white/80">PRECIPITATION & FLOOD RISK</span>
                <span className="font-bold text-blue-400">{rainRisk}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    rainRisk === "SEVERE"
                      ? "w-full bg-red-500"
                      : rainRisk === "HIGH"
                        ? "w-3/4 bg-orange-500"
                        : rainRisk === "MODERATE"
                          ? "w-1/2 bg-blue-400"
                          : "w-1/4 bg-emerald-400"
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-[11px] font-mono text-white/50">
              Evaluated against Open-Meteo & ClimateGuard backend
            </div>
            <Link to="/alerts" className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1">
              <span>View alerts ({alerts.length})</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* 3-Day Forecast Strip */}
      {forecast.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Clock size={16} className="text-cyan-400" />
              <span>Multi-Day Regional Forecast</span>
            </h2>
            <Link to="/weather" className="text-xs font-mono text-cyan-400 hover:underline">
              Hourly breakdown →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {forecast.slice(0, 3).map((day) => (
              <div
                key={day.date}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-mono text-white/50">{day.dayName}</div>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {day.tempMax}° / <span className="text-white/50 text-sm font-normal">{day.tempMin}°C</span>
                  </div>
                  <div className="text-[11px] text-white/70 mt-1">{day.condition}</div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="text-blue-300 flex items-center justify-end gap-1">
                    <CloudRain size={12} />
                    <span>{day.rainSum} mm</span>
                  </div>
                  <div className="mt-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        day.risk === "HIGH" || day.risk === "SEVERE"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : day.risk === "MODERATE"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {day.risk}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direct AI Assistant Call-to-Action Console */}
      <div className="p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-black/60 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Need Personalized Climate Guidance?</h3>
            <p className="text-xs text-white/60 mt-0.5">
              Ask ClimateGuard AI about temperature trends, heat protection, or evacuation protocols for {cityName}.
            </p>
          </div>
        </div>

        <Link
          to="/assistant"
          className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] flex items-center gap-2 whitespace-nowrap active:scale-95"
        >
          <span>Consult AI Assistant</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
