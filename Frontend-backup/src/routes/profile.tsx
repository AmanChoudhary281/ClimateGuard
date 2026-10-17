import { createFileRoute } from "@tanstack/react-router";
import { ClimateBackground } from "@/components/ClimateBackground";
import { useClimateGuard } from "@/context/ClimateGuardContext";
import { fmtLat, fmtLon } from "@/lib/sector";
import {
  User,
  Phone,
  MapPin,
  Compass,
  Shield,
  BellRing,
  RotateCcw,
  CheckCircle2,
  Lock,
  Radio,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const {
    operatorName,
    operatorPhone,
    operatorAddress,
    operatorId,
    latitude,
    longitude,
    cityName,
    locationStatus,
    riskLevel,
    requestLiveLocation,
    setProfileField,
    registerOperator,
  } = useClimateGuard();

  const [heatAlerts, setHeatAlerts] = useState(true);
  const [rainAlerts, setRainAlerts] = useState(true);
  const [severeAlerts, setSevereAlerts] = useState(true);
  const [unitMetric, setUnitMetric] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await registerOperator();
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen text-white relative isolate overflow-x-hidden pt-18 pb-20 px-4 sm:px-8 max-w-4xl mx-auto">
      <ClimateBackground />

      {/* Breadcrumb Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.08] text-[11px] font-mono mb-8">
        <div className="flex items-center gap-3">
          <span className="text-white/40">OPERATOR CLEARANCE</span>
          <span className="text-white/20">/</span>
          <span className="text-cyan-400 font-semibold">{operatorName || "Primary Operator"}</span>
          <span className="text-white/20">/</span>
          <span className="text-white/60">SYS.ID // 084-CG</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 font-semibold">ENCRYPTED CREDENTIALS</span>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
          Operator Profile &amp; Preferences
        </h1>
        <p className="text-white/60 text-xs sm:text-sm">
          Perimeter registration data, automated warning channels, and telemetry display settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Operator Credentials Form */}
        <form onSubmit={handleSave} className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
            <div className="flex items-center gap-2">
              <User size={16} className="text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Primary Operator Credentials
              </h2>
            </div>
            <span className="text-[10px] font-mono text-white/40 flex items-center gap-1">
              <Lock size={11} />
              AES-256 E.164 PROTECTED
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-white/50 block mb-1.5">
                FULL OPERATOR NAME
              </label>
              <input
                value={operatorName}
                onChange={(e) => setProfileField("name", e.target.value)}
                placeholder="Operator Name"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-white/50 block mb-1.5">
                ENCRYPTED MOBILE (E.164)
              </label>
              <input
                value={operatorPhone}
                onChange={(e) => setProfileField("phone", e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 font-mono"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="text-[10px] font-mono uppercase text-white/50 block mb-1.5">
              REGISTERED PERIMETER ADDRESS
            </label>
            <input
              value={operatorAddress}
              onChange={(e) => setProfileField("address", e.target.value)}
              placeholder="Street, City, Sector"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {saveSuccess ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-mono">
                <CheckCircle2 size={13} />
                Profile updated successfully.
              </span>
            ) : (
              <span className="text-[11px] font-mono text-white/40">
                Operator ID: {operatorId ? `#${operatorId}` : "Assigned on verification"}
              </span>
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Credentials"}
            </button>
          </div>
        </form>

        {/* Geographic Telemetry Lock Info */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Active Perimeter Coordinates
              </h2>
            </div>
            <button
              onClick={() => requestLiveLocation()}
              className="px-3 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono flex items-center gap-1.5 transition-all"
            >
              <RotateCcw size={11} />
              <span>Re-Acquire GPS</span>
            </button>
          </div>

          <dl className="grid sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <dt className="text-white/40 mb-1">LATITUDE</dt>
              <dd className="text-sm font-bold text-white">
                {latitude !== null ? fmtLat(latitude, 4) : "28.6140° N"}
              </dd>
            </div>
            <div>
              <dt className="text-white/40 mb-1">LONGITUDE</dt>
              <dd className="text-sm font-bold text-white">
                {longitude !== null ? fmtLon(longitude, 4) : "077.2090° E"}
              </dd>
            </div>
            <div>
              <dt className="text-white/40 mb-1">SECTOR NAME</dt>
              <dd className="text-sm font-medium text-white/90">{cityName}</dd>
            </div>
            <div>
              <dt className="text-white/40 mb-1">CURRENT RISK</dt>
              <dd className="text-sm font-bold text-emerald-400">{riskLevel}</dd>
            </div>
          </dl>
        </div>

        {/* Notification Preferences */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
          <div className="flex items-center gap-2 pb-4 border-b border-white/10 mb-5">
            <BellRing size={16} className="text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Emergency Warning Dispatch
            </h2>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <label className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5 cursor-pointer">
              <div>
                <span className="font-semibold text-white block">Heatwave Thermal Alerts</span>
                <span className="text-white/40 text-[11px]">Push notification when ambient temp &gt; 35°C</span>
              </div>
              <input
                type="checkbox"
                checked={heatAlerts}
                onChange={(e) => setHeatAlerts(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5 cursor-pointer">
              <div>
                <span className="font-semibold text-white block">Severe Precipitation & Flood Alerts</span>
                <span className="text-white/40 text-[11px]">Push warning when precipitation &gt; 64.5 mm</span>
              </div>
              <input
                type="checkbox"
                checked={rainAlerts}
                onChange={(e) => setRainAlerts(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5 cursor-pointer">
              <div>
                <span className="font-semibold text-white block">Regional Perimeter Siren Link</span>
                <span className="text-white/40 text-[11px]">Instant dispatch during Level 3 municipal hazard emergencies</span>
              </div>
              <input
                type="checkbox"
                checked={severeAlerts}
                onChange={(e) => setSevereAlerts(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
