import { createFileRoute } from "@tanstack/react-router";
import { ClimateBackground } from "@/components/ClimateBackground";
import { useClimateGuard } from "@/context/ClimateGuardContext";
import {
  Bell,
  CheckCircle,
  AlertOctagon,
  Clock,
  ShieldAlert,
  Flame,
  CloudRain,
  Radio,
  Send,
  Eye,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  const {
    alerts,
    unreadAlertsCount,
    updateAlertStatus,
    triggerSimulationAlert,
    cityName,
  } = useClimateGuard();

  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "RESOLVED">("ALL");

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "ACTIVE") return a.status === "PENDING" || a.status === "SENT";
    if (filter === "RESOLVED") return a.status === "READ" || a.status === "RESOLVED";
    return true;
  });

  const getSeverityStyle = (s: string) => {
    switch (s) {
      case "SEVERE":
        return {
          border: "border-red-500/40",
          bg: "bg-red-500/10",
          text: "text-red-400",
          badge: "bg-red-500/20 text-red-400 border-red-500/40",
        };
      case "HIGH":
        return {
          border: "border-orange-500/40",
          bg: "bg-orange-500/10",
          text: "text-orange-400",
          badge: "bg-orange-500/20 text-orange-400 border-orange-500/40",
        };
      case "MODERATE":
        return {
          border: "border-amber-500/40",
          bg: "bg-amber-500/10",
          text: "text-amber-400",
          badge: "bg-amber-500/20 text-amber-400 border-amber-500/40",
        };
      default:
        return {
          border: "border-emerald-500/40",
          bg: "bg-emerald-500/10",
          text: "text-emerald-400",
          badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
        };
    }
  };

  return (
    <div className="min-h-screen text-white relative isolate overflow-x-hidden pt-18 pb-20 px-4 sm:px-8 max-w-7xl mx-auto">
      <ClimateBackground />

      {/* Breadcrumb Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.08] text-[11px] font-mono mb-8">
        <div className="flex items-center gap-3">
          <span className="text-white/40">EARLY WARNING BROADCAST</span>
          <span className="text-white/20">/</span>
          <span className="text-cyan-400 font-semibold">{cityName}</span>
          <span className="text-white/20">/</span>
          <span className="text-white/60">SECTOR ALERTS</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-white/50">ACTIVE NOTIFICATIONS:</span>
          <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 font-bold">
            {unreadAlertsCount} PENDING
          </span>
        </div>
      </div>

      {/* Main Alerts Header with Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-cyan-400/90 mb-1 font-semibold flex items-center gap-2">
            <Radio size={13} className="animate-pulse" />
            <span>DISASTER TELEMETRY STREAM</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Climate Emergency Alerts
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-1">
            Real-time hazard notifications dispatched to regional primary operators.
          </p>
        </div>

        {/* Simulator Button */}
        <button
          onClick={triggerSimulationAlert}
          className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-white/90 text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 self-start sm:self-auto active:scale-95"
        >
          <Bell size={14} className="text-amber-400" />
          <span>Simulate Emergency Alert</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {(["ALL", "ACTIVE", "RESOLVED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
              filter === tab
                ? "bg-white/15 text-white border border-white/30 font-semibold"
                : "bg-white/[0.03] text-white/50 border border-white/5 hover:text-white/80"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Alerts Stream List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 rounded-2xl border border-white/10 bg-white/[0.02] text-center backdrop-blur-md">
            <ShieldAlert size={36} className="text-white/20 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white/70">NO ACTIVE CLIMATE ALERTS</h3>
            <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
              Perimeter sensors indicate standard atmospheric equilibrium. Zero emergency thresholds breached in {cityName}.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const style = getSeverityStyle(alert.severity);
            const dateStr = new Date(alert.sent_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border ${style.border} ${style.bg} backdrop-blur-md transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4`}
              >
                {/* Left: Type, Icon & Message */}
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl border ${style.border} bg-black/40 ${style.text}`}>
                    {alert.alert_type.includes("Heat") ? (
                      <Flame size={20} />
                    ) : alert.alert_type.includes("Rain") || alert.alert_type.includes("Flood") ? (
                      <CloudRain size={20} />
                    ) : (
                      <AlertOctagon size={20} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="font-bold text-sm tracking-wide text-white uppercase">
                        {alert.alert_type}
                      </span>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold border ${style.badge}`}>
                        {alert.severity}
                      </span>
                      <span className="text-[10px] font-mono text-white/40">
                        {dateStr}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </div>

                {/* Right: Status Pill & Actions */}
                <div className="flex items-center gap-3 self-end md:self-center font-mono text-xs">
                  <span
                    className={`px-2 py-1 rounded text-[10px] border ${
                      alert.status === "RESOLVED" || alert.status === "READ"
                        ? "text-white/40 border-white/10 bg-white/[0.03]"
                        : "text-amber-400 border-amber-500/30 bg-amber-500/10 animate-pulse"
                    }`}
                  >
                    {alert.status}
                  </span>

                  {alert.status !== "RESOLVED" && (
                    <button
                      onClick={() => updateAlertStatus(alert.id, "RESOLVED")}
                      className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-[11px] transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle size={12} className="text-emerald-400" />
                      <span>Acknowledge</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
