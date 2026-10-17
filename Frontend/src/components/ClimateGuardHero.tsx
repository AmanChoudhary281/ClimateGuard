
import { useState, useSyncExternalStore } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  LoaderCircle,
  User,
  Phone,
  MapPin,
} from "lucide-react";

import { ClimateBackground } from "@/components/ClimateBackground";
import { EarthScene } from "@/components/EarthScene";
import { HudTelemetry } from "@/components/HudTelemetry";
import { CameraPresetBar } from "@/components/CameraPresetBar";
import { earthBus } from "@/lib/earth-bus";
import { fmtLat, fmtLon } from "@/lib/sector";
import { useClimateGuard } from "@/context/ClimateGuardContext";

type InitStage =
  | "idle"
  | "initializing"
  | "linking"
  | "locating"
  | "building"
  | "ready";

export function ClimateGuardHero() {
  const navigate = useNavigate();

  const {
    locationStatus,
    latitude,
    longitude,
    weather,
    weatherStatus,
    riskLevel,
    operatorName,
    operatorPhone,
    operatorAddress,
    readiness,
    setProfileField,
    registerOperator,
  } = useClimateGuard();

  const snap = useSyncExternalStore(
    earthBus.subscribe,
    earthBus.getSnapshot,
    earthBus.getSnapshot,
  );

  const [initStage, setInitStage] = useState<InitStage>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  const handleInitSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (initStage !== "idle") return;

    setFormError(null);

    if (!operatorName.trim()) {
      setFormError("PRIMARY OPERATOR NAME IS REQUIRED.");
      return;
    }

    const cleanPhone = operatorPhone.replace(/\D/g, "");

    if (cleanPhone.length < 7) {
      setFormError("VALID MOBILE NUMBER REQUIRED.");
      return;
    }

    if (!operatorAddress.trim()) {
      setFormError("REGIONAL PERIMETER ADDRESS REQUIRED.");
      return;
    }

    try {
      setInitStage("initializing");
      await new Promise<void>((resolve) => setTimeout(resolve, 450));

      setInitStage("linking");
      await new Promise<void>((resolve) => setTimeout(resolve, 600));

      setInitStage("locating");
      const registered = await registerOperator();

      if (!registered) {
        setFormError(
          "REGISTRATION FAILED. CHECK YOUR DETAILS AND TRY AGAIN.",
        );
        setInitStage("idle");
        return;
      }

      setInitStage("building");
      await new Promise<void>((resolve) => setTimeout(resolve, 650));

      setInitStage("ready");

      if (typeof navigator.vibrate === "function") {
        navigator.vibrate([20, 60, 20]);
      }

      await new Promise<void>((resolve) => setTimeout(resolve, 450));

      await navigate({ to: "/area" });
    } catch (err: unknown) {
      setFormError(
        err instanceof Error
          ? err.message
          : "INITIALIZATION SEQUENCE FAILED.",
      );
      setInitStage("idle");
    }
  };

  const getButtonText = (): string => {
    switch (initStage) {
      case "initializing":
        return "INITIALIZING...";
      case "linking":
        return "ESTABLISHING SECURE LINK...";
      case "locating":
        return "RESOLVING LOCATION...";
      case "building":
        return "BUILDING RISK PROFILE...";
      case "ready":
        return "PERIMETER SECURED";
      default:
        return "INITIALIZE CLIMATEGUARD";
    }
  };

  const displayLat =
    latitude !== null
      ? fmtLat(latitude, 1)
      : locationStatus === "REQUESTING_LOCATION"
        ? "Locating..."
        : "28.6° N";

  const displayLon =
    longitude !== null
      ? fmtLon(longitude, 1)
      : locationStatus === "REQUESTING_LOCATION"
        ? "Locating..."
        : "77.2° E";

  const displayConditions = weather
    ? `${weather.temperature}°C · ${weather.humidity}% humidity`
    : weatherStatus === "SYNCING"
      ? "Syncing weather data..."
      : "Weather data unavailable";

  const riskColor =
    riskLevel === "SEVERE"
      ? "text-red-400"
      : riskLevel === "HIGH"
        ? "text-orange-400"
        : riskLevel === "MODERATE"
          ? "text-amber-400"
          : "text-emerald-400";

  return (
    <main className="climate-entry pt-14">
      <ClimateBackground />

      <div className="fixed top-16 left-6 pointer-events-none text-white/20 font-mono text-xs select-none">
        +
      </div>
      <div className="fixed top-16 right-6 pointer-events-none text-white/20 font-mono text-xs select-none">
        +
      </div>
      <div className="fixed bottom-6 left-6 pointer-events-none text-white/20 font-mono text-xs select-none">
        +
      </div>
      <div className="fixed bottom-6 right-6 pointer-events-none text-white/20 font-mono text-xs select-none">
        +
      </div>

      <section className="climate-stage" aria-labelledby="climate-title">
        <HudTelemetry />

        <div className="flex items-center justify-between w-full max-w-7xl mx-auto mb-4">
          <div className="system-status">
            <i />
            CLIMATE INTELLIGENCE SYSTEM <span>v0.1</span>
          </div>

          <div className="hidden md:block text-[11px] font-mono tracking-widest text-emerald-400/90 font-medium">
            OBSERVATION ACTIVE
          </div>
        </div>

        <div className="earth-viewport">
          <EarthScene />

          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              className="absolute w-[82%] h-[68%] rounded-full border border-cyan-400/25 -rotate-12 pointer-events-none shadow-[0_0_15px_rgba(34,211,238,0.08)]"
              style={{ borderStyle: "dashed" }}
            />

            <div className="absolute top-[28%] right-[22%] px-2 py-0.5 rounded border border-white/20 bg-black/60 backdrop-blur-sm text-[9px] font-mono tracking-widest text-white/70">
              ORBITAL VIEW • 03
            </div>

            <div className="absolute bottom-[22%] right-[16%] rotate-[-12deg] text-[9px] font-mono text-cyan-300/80 tracking-wider bg-black/40 px-2 py-0.5 rounded border border-cyan-500/20">
              EQ /{" "}
              {latitude !== null ? fmtLat(latitude, 4) : "28.6139° N"} /{" "}
              {longitude !== null ? fmtLon(longitude, 4) : "077.2090° E"} /{" "}
              {weather ? `${weather.temperature}°C` : "—"}
            </div>
          </div>
        </div>

        <div className="climate-copy">
          <div className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-cyan-400/90 mb-3 font-semibold">
            LOCATION-AWARE CLIMATE FORESIGHT
          </div>

          <h1 id="climate-title">
            <span>Know the Risk.</span>
            <span>Before It Reaches You.</span>
          </h1>

          <p>Personalized climate intelligence for where you live.</p>
        </div>

        <dl className="climate-readouts">
          <div>
            <dt>LIVE MONITORING</dt>
            <dd>
              <i />
              System online
            </dd>
          </div>

          <div>
            <dt>CURRENT LOCATION</dt>
            <dd>
              {displayLat} / {displayLon}
            </dd>
          </div>

          <div>
            <dt>CURRENT CONDITIONS</dt>
            <dd>{displayConditions}</dd>
          </div>

          <div>
            <dt>CLIMATE RISK</dt>
            <dd>
              <i className={riskColor.replace("text-", "bg-")} />
              <span className={riskColor}>{riskLevel}</span>
            </dd>
          </div>

          <div className="border-none !pl-0 pt-2 flex items-end gap-1 h-6 opacity-75">
            {[45, 70, 30, 85, 60, 40, 95, 55, 75, 50].map(
              (height, index) => (
                <span
                  key={index}
                  className="w-1 bg-cyan-400/80 rounded-t-sm transition-all duration-700"
                  style={{
                    height: `${height}%`,
                    animation: `pulse 1.8s ease-in-out infinite alternate ${index * 0.15}s`,
                  }}
                />
              ),
            )}
          </div>
        </dl>

        <CameraPresetBar />
      </section>

      <form className="profile-panel" onSubmit={handleInitSubmit}>
        <i className="panel-edge" aria-hidden="true" />

        <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] font-mono">
          <span className="text-white/60 tracking-wider">SYS.ID // 084-CG</span>

          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-widest">SAT-LINK ONLINE</span>
          </div>
        </div>

        <header>
          <h2 className="text-xl font-bold tracking-tight text-white/95">
            Secure Risk Profile
          </h2>
          <p className="text-xs text-white/60">
            Establish regional perimeter monitoring
          </p>
        </header>

        {formError && (
          <div
            role="alert"
            className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] font-mono"
          >
            {formError}
          </div>
        )}

        <label>
          <span className="text-[10px] font-mono tracking-wider text-white/70">
            PRIMARY OPERATOR [AUTH]
          </span>
          <div className="relative">
            <User
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              name="name"
              autoComplete="name"
              placeholder="Your full name"
              value={operatorName}
              onChange={(e) => setProfileField("name", e.target.value)}
              className="!pl-10 text-xs"
              required
            />
          </div>
        </label>

        <label>
          <span className="text-[10px] font-mono tracking-wider text-white/70">
            ENCRYPTED MOBILE [E.164]
          </span>
          <div className="relative">
            <Phone
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={operatorPhone}
              onChange={(e) => setProfileField("phone", e.target.value)}
              className="!pl-10 text-xs font-mono"
              required
            />
          </div>
        </label>

        <label>
          <span className="text-[10px] font-mono tracking-wider text-white/70">
            ADDRESS [MANUAL]
          </span>
          <div className="relative">
            <MapPin
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              name="address"
              autoComplete="street-address"
              placeholder="Street, city"
              value={operatorAddress}
              onChange={(e) => setProfileField("address", e.target.value)}
              className="!pl-10 text-xs"
              required
            />
          </div>
        </label>

        <div className="py-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-white/60 mb-2">
            <span>READINESS</span>
            <span className="font-semibold text-white/90">{readiness}%</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(0, (readiness / 33) * 100))}%`,
                }}
              />
            </div>

            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-500 ease-out"
                style={{
                  width:
                    readiness > 33
                      ? `${Math.min(100, Math.max(0, ((readiness - 33) / 33) * 100))}%`
                      : "0%",
                }}
              />
            </div>

            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-500 ease-out"
                style={{
                  width:
                    readiness > 66
                      ? `${Math.min(100, Math.max(0, ((readiness - 66) / 34) * 100))}%`
                      : "0%",
                }}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={initStage !== "idle"}
          className={`w-full h-13 mt-2 rounded-xl font-bold tracking-wider uppercase text-xs transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
            initStage !== "idle"
              ? "bg-[#dcd5c9]/80 text-black/80 cursor-wait"
              : "bg-[#e8e2d5] hover:bg-[#f2ede2] text-black active:scale-[0.98] shadow-white/10"
          }`}
        >
          <span>{getButtonText()}</span>

          {initStage === "idle" && <ArrowRight size={16} />}

          {initStage !== "idle" && initStage !== "ready" && (
            <LoaderCircle size={16} className="animate-spin" />
          )}

          {initStage === "ready" && (
            <Check size={16} className="text-emerald-800" />
          )}
        </button>

        <div className="text-[9px] font-mono tracking-widest text-white/40 text-center uppercase pt-1">
          AES-256 GEOGRAPHIC ISOLATION • ZERO-TELEMETRY LOGGING
        </div>
      </form>
    </main>
  );
}
