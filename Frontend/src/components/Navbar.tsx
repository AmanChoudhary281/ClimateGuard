import { Link, useLocation } from "@tanstack/react-router";
import { useClimateGuard } from "@/context/ClimateGuardContext";
import {
  CloudRain,
  Flame,
  Bell,
  Bot,
  User,
  Radio,
  Compass,
} from "lucide-react";

export function Navbar() {
  const { pathname } = useLocation();

  const {
    weather,
    riskLevel,
    unreadAlertsCount,
    satLinkOnline,
    utcTime,
  } = useClimateGuard();

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "SEVERE":
        return "text-red-400 border-red-500/40 bg-red-500/10";
      case "HIGH":
        return "text-orange-400 border-orange-500/40 bg-orange-500/10";
      case "MODERATE":
        return "text-amber-400 border-amber-500/40 bg-amber-500/10";
      default:
        return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
    }
  };

  const navLinks: Array<{
    to: string;
    label: string;
    icon: typeof Compass;
    badge?: number | null;
  }> = [
    { to: "/area", label: "YOUR AREA", icon: Compass },
    { to: "/weather", label: "WEATHER", icon: CloudRain },
    { to: "/risk", label: "CLIMATE RISK", icon: Flame },
    {
      to: "/alerts",
      label: "ALERTS",
      icon: Bell,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : null,
    },
    { to: "/assistant", label: "AI ASSISTANT", icon: Bot },
    { to: "/profile", label: "PROFILE", icon: User },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-black/40 backdrop-blur-md border-b border-white/[0.08] px-4 md:px-8 py-2.5 flex items-center justify-between text-xs tracking-wider transition-all">
      {/* Left: System ID & Brand */}
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />

          <span className="font-semibold text-white/90 group-hover:text-white uppercase tracking-widest text-[11px]">
            ClimateGuard
          </span>

          <span className="hidden sm:inline-block text-[10px] text-white/40 border-l border-white/10 pl-2">
            SYS.v0.1
          </span>
        </Link>

        {/* Global Satellite Status */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-[10px] text-white/70">
          <Radio
            size={11}
            className={
              satLinkOnline
                ? "text-emerald-400"
                : "text-amber-400 animate-pulse"
            }
          />
          <span>
            {satLinkOnline ? "SAT-LINK ONLINE" : "CONNECTING SAT-LINK"}
          </span>
        </div>
      </div>

      {/* Center: Navigation */}
      <nav className="flex items-center gap-1 sm:gap-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.to;
          const Icon = link.icon;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`relative px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                isActive
                  ? "text-white bg-white/[0.12] border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.08)]"
                  : "text-white/60 hover:text-white/90 hover:bg-white/[0.05]"
              }`}
            >
              <Icon
                size={12}
                className={
                  isActive ? "text-cyan-400" : "text-white/50"
                }
              />

              <span className="hidden md:inline">{link.label}</span>

              {link.badge != null && link.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/80 text-white animate-pulse">
                  {link.badge}
                </span>
              )}

              {isActive && (
                <span className="absolute -bottom-[11px] left-1/2 -translate-x-1/2 w-4 h-[2px] bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right: Live Telemetry & Clock */}
      <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-white/60">
        {weather && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">
            <span>{weather.temperature}°C</span>

            <span className="text-white/30">/</span>

            <span
              className={`px-1.5 py-0.5 rounded font-semibold border ${getRiskColor(
                riskLevel
              )}`}
            >
              {riskLevel}
            </span>
          </div>
        )}

        <div className="flex flex-col text-right">
          <span className="text-white/80 font-mono text-[10px]">
            {utcTime}
          </span>

          <span className="text-[9px] text-emerald-400/80">
            OBSERVATION ACTIVE
          </span>
        </div>
      </div>
    </header>
  );
}