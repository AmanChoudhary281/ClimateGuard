import { createFileRoute, Link } from "@tanstack/react-router";
import { ClimateBackground } from "@/components/ClimateBackground";
import { useClimateGuard } from "@/context/ClimateGuardContext";
import {
  Flame,
  CloudRain,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
  Droplets,
  Thermometer,
  Activity,
} from "lucide-react";

export const Route = createFileRoute("/risk")({
  component: ClimateRiskPage,
});

function ClimateRiskPage() {
  const {
    cityName,
    weather,
    riskLevel,
    heatRisk,
    rainRisk,
    lastUpdatedTime,
  } = useClimateGuard();

  const temp = weather ? weather.temperature : 24;
  const humidity = weather ? weather.humidity : 68;
  const rainfall = weather ? weather.rainfall : 0.0;

  const getRiskBadge = (r: string) => {
    switch (r) {
      case "SEVERE":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border-orange-500/40";
      case "MODERATE":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    }
  };

  return (
    <div className="min-h-screen text-white relative isolate overflow-x-hidden pt-18 pb-20 px-4 sm:px-8 max-w-7xl mx-auto">
      <ClimateBackground />

      {/* Header Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.08] text-[11px] font-mono mb-8">
        <div className="flex items-center gap-3">
          <span className="text-white/40">RISK ASSESSMENT MATRIX</span>
          <span className="text-white/20">/</span>
          <span className="text-cyan-400 font-semibold">{cityName}</span>
          <span className="text-white/20">/</span>
          <span className="text-white/60">OBSERVATION TELEMETRY</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-white/50">STATUS:</span>
          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getRiskBadge(riskLevel)}`}>
            {riskLevel}
          </span>
        </div>
      </div>

      {/* Hero Overview */}
      <div className="mb-10">
        <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-cyan-400/90 mb-2 font-semibold flex items-center gap-2">
          <Activity size={13} />
          <span>MULTI-HAZARD EARLY WARNING SYSTEM</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
          Climate Risk Monitoring
        </h1>
        <p className="text-white/60 text-sm max-w-2xl leading-relaxed">
          Rigorous threshold evaluation based on regional wet-bulb thermal indices and hydrometeorological drainage tolerances.
        </p>
      </div>

      {/* Two Pillar Hazard Grid: Heatwave & Heavy Rain */}
      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        {/* Heatwave Hazard Column */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Flame size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Heatwave Thermal Threat</h2>
                  <p className="text-[11px] font-mono text-white/50">Biometeorological Wet-Bulb Stress</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${getRiskBadge(heatRisk)}`}>
                {heatRisk}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-6">
              <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                <span className="text-white/40 block mb-1">MEASURED AMBIENT</span>
                <span className="text-xl font-bold text-white">{temp}°C</span>
              </div>
              <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                <span className="text-white/40 block mb-1">RELATIVE MOISTURE</span>
                <span className="text-xl font-bold text-white">{humidity}%</span>
              </div>
            </div>

            {/* Threshold Logic Table */}
            <h3 className="text-xs font-mono uppercase tracking-wider text-white/70 mb-2">Backend Classification Rules</h3>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="p-2 rounded bg-black/20 flex justify-between items-center text-white/60">
                <span>Temp ≥ 40°C</span>
                <span className="text-red-400 font-bold">SEVERE</span>
              </div>
              <div className="p-2 rounded bg-black/20 flex justify-between items-center text-white/60">
                <span>Temp ≥ 35°C (Humidity ≥ 60%)</span>
                <span className="text-red-400 font-bold">SEVERE</span>
              </div>
              <div className="p-2 rounded bg-black/20 flex justify-between items-center text-white/60">
                <span>Temp ≥ 35°C (Humidity &lt; 60%)</span>
                <span className="text-orange-400 font-bold">HIGH</span>
              </div>
              <div className="p-2 rounded bg-black/20 flex justify-between items-center text-white/60">
                <span>Temp ≥ 30°C (Humidity ≥ 60%)</span>
                <span className="text-orange-400 font-bold">HIGH</span>
              </div>
              <div className="p-2 rounded bg-black/20 flex justify-between items-center text-white/60">
                <span>Temp ≥ 30°C (Humidity &lt; 60%)</span>
                <span className="text-amber-400 font-bold">MODERATE</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-xs text-white/70">
            <strong>Advisory:</strong>{" "}
            {heatRisk === "SEVERE"
              ? "Critical heat emergency. Suspend physical outdoor activities and seek cooling stations."
              : heatRisk === "HIGH"
                ? "Hydration protocol active. Drink at least 500ml water every 90 minutes."
                : heatRisk === "MODERATE"
                  ? "Standard vigilance. Maintain ventilation and electrolyte intake."
                  : "Thermal risk within safe biological baseline."}
          </div>
        </div>

        {/* Rain & Flood Hazard Column */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <CloudRain size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Heavy Precipitation & Inundation</h2>
                  <p className="text-[11px] font-mono text-white/50">Runoff & Storm Drainage Tolerance</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${getRiskBadge(rainRisk)}`}>
                {rainRisk}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-6">
              <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                <span className="text-white/40 block mb-1">PRECIPITATION ACCUMULATION</span>
                <span className="text-xl font-bold text-white">{rainfall} mm</span>
              </div>
              <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                <span className="text-white/40 block mb-1">HYDROLOGICAL DRAINAGE</span>
                <span className="text-xl font-bold text-emerald-400">Nominal</span>
              </div>
            </div>

            {/* Threshold Logic Table */}
            <h3 className="text-xs font-mono uppercase tracking-wider text-white/70 mb-2">Backend Rainfall Thresholds</h3>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="p-2 rounded bg-black/20 flex justify-between items-center text-white/60">
                <span>Rainfall &gt; 204.4 mm</span>
                <span className="text-red-400 font-bold">SEVERE</span>
              </div>
              <div className="p-2 rounded bg-black/20 flex justify-between items-center text-white/60">
                <span>Rainfall ≥ 115.6 mm</span>
                <span className="text-orange-400 font-bold">HIGH</span>
              </div>
              <div className="p-2 rounded bg-black/20 flex justify-between items-center text-white/60">
                <span>Rainfall ≥ 64.5 mm</span>
                <span className="text-amber-400 font-bold">MODERATE</span>
              </div>
              <div className="p-2 rounded bg-black/20 flex justify-between items-center text-white/60">
                <span>Rainfall &lt; 64.5 mm</span>
                <span className="text-emerald-400 font-bold">LOW</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-xs text-white/70">
            <strong>Advisory:</strong>{" "}
            {rainRisk === "SEVERE"
              ? "Catastrophic flooding threat. Evacuate low-lying sectors and disconnect ground power."
              : rainRisk === "HIGH"
                ? "Urban drainage overwhelmed. Avoid underground routes and highway underpasses."
                : rainRisk === "MODERATE"
                  ? "Slick transit corridors and minor perimeter pooling anticipated."
                  : "Precipitation volume within municipal culvert flow capacities."}
          </div>
        </div>
      </div>

      {/* Safety Protocol Checklist */}
      <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-cyan-400" />
          <span>ClimateGuard Operator Readiness Checklist</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-2">
            <div className="font-semibold text-white/90">Level 1: Normal Watch</div>
            <p className="text-white/60">
              Maintain standard residential hydration, monitor morning telemetry, and verify perimeter sensor links.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-2">
            <div className="font-semibold text-amber-300">Level 2: Heightened Alert</div>
            <p className="text-white/60">
              Store 3L potable water per operator, shade windows from direct sunlight, and verify backup communications.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-2">
            <div className="font-semibold text-red-400">Level 3: Emergency Protocol</div>
            <p className="text-white/60">
              Relocate vulnerable individuals to temperature-controlled shelters, avoid transit corridors, and monitor broadcast sirens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
