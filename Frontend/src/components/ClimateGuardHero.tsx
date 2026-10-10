import React, { useState, useEffect } from 'react';
import { EarthScene } from './EarthScene';
import { ClimateBackground } from './ClimateBackground';
import { LiveMonitoringPanel } from './LiveMonitoringPanel';
import { RegistrationCard } from './RegistrationCard';
import { ExtendedTelemetryDrawer } from './ExtendedTelemetryDrawer';
import { useClimate } from '../context/ClimateContext';
import { RiskLevel } from '../types/climate';

export const ClimateGuardHero: React.FC = () => {
  const {
    coordinates,
    conditions,
    isRegistered,
    locationStatus,
    initPhase,
    addressState,
    report,
    registrationError,
    requestLocation,
    updateAddress,
    registerOperator,
    cycleRisk,
    dismissReport,
  } = useClimate();

  const [isTelemetryDrawerOpen, setIsTelemetryDrawerOpen] = useState(false);
  const [mouseParallax, setMouseParallax] = useState({ x: 0, y: 0 });

  // Coordinated 3-Phase Stagger Animation:
  // Phase 1 (100ms): Headline fades in first (500ms transition)
  // Phase 2 (650ms): Secure Risk Profile card rising from below (550ms transition)
  // Phase 3 (1250ms): Earth and subtle telemetry indicators (600ms transition)
  const [animPhase, setAnimPhase] = useState<number>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimPhase(1), 100);  // Phase 1: Fade in headline first
    const t2 = setTimeout(() => setAnimPhase(2), 650);  // Phase 2: Card rising from below
    const t3 = setTimeout(() => setAnimPhase(3), 1250); // Phase 3: Earth & subtle telemetry indicators
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Global subtle mouse parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMouseParallax({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-65px)] w-full text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-sky-500/30 selection:text-sky-200">
      {/* 1. Deep Space Cosmic Background with Parallax */}
      <ClimateBackground mouseX={mouseParallax.x} mouseY={mouseParallax.y} />

      {/* 2. Top-Center OBSERVATION ACTIVE Indicator (matching reference screenshot) */}
      <div
        className={`absolute top-4 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 pointer-events-none select-none z-20 transition-all duration-500 ease-out ${
          animPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <span className="font-mono text-[10px] tracking-[0.25em] text-emerald-400 font-medium uppercase drop-shadow-[0_0_8px_rgba(52,211,153,0.35)]">
          OBSERVATION ACTIVE
        </span>
      </div>

      {/* 3. Phase 3: Persistent Photorealistic 3D Earth (Reduced clouds & golden lights) */}
      <EarthScene
        currentLat={coordinates.lat}
        currentLng={coordinates.lng}
        isVisible={true}
      />

      {/* 4. Phase 3: Vertical Earth Telemetry Strip (matching reference screenshot) */}
      <div
        className={`hidden xl:flex absolute right-[440px] 2xl:right-[480px] top-1/2 -translate-y-1/2 flex-col items-center gap-2 pointer-events-none select-none z-10 transition-all duration-500 ease-out ${
          animPhase >= 3 ? 'opacity-70' : 'opacity-0'
        }`}
      >
        <span className="w-1.5 h-px bg-slate-700" />
        <span
          className="font-mono text-[9px] tracking-[0.28em] text-slate-500 whitespace-nowrap"
          style={{ writingMode: 'vertical-rl' }}
        >
          CG / {Math.abs(coordinates.lat).toFixed(4)}° {coordinates.lat >= 0 ? 'N' : 'S'} &nbsp; {Math.abs(coordinates.lng).toFixed(4)}° {coordinates.lng >= 0 ? 'E' : 'W'} / {conditions.temperature}°C
        </span>
        <span className="w-1.5 h-px bg-slate-700" />
      </div>

      {/* 5. Main Viewport Grid: Left Hero & Right Registration Card */}
      <main className="relative z-10 flex-1 px-4 sm:px-8 lg:px-14 py-4 md:py-6 flex flex-col justify-between max-w-[1680px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center my-auto">
          {/* Phase 1: Left Column Hero Editorial Headline & Kicker Fades in First */}
          <div
            className={`lg:col-span-7 flex flex-col justify-center max-w-xl pt-2 lg:pt-0 transition-all duration-500 ease-out ${
              animPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            {/* Eyebrow Kicker */}
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span className="font-mono text-[10px] sm:text-xs tracking-[0.22em] text-slate-400 uppercase font-medium">
                LOCATION-AWARE CLIMATE INTELLIGENCE
              </span>
            </div>

            {/* Editorial Headline with Guaranteed Contrast and Orbital View Badge */}
            <h1 className="mt-3 sm:mt-4 text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.08] drop-shadow-[0_4px_28px_rgba(2,4,10,0.95)]">
              {/* Editorial headline */}
              <span className="block text-white drop-shadow-[0_2px_8px_rgba(2,4,10,0.9)]">
                Your Climate.
              </span>

              {/* Orbital-view telemetry badge */}
              <span className="block text-[#7dd3fc] drop-shadow-[0_0_24px_rgba(56,189,248,0.35)] mt-1">
                Your Risk.
                <span className="inline-flex items-center align-middle ml-3 sm:ml-4 text-[10px] sm:text-xs font-mono font-normal tracking-[0.2em] text-slate-400 border border-slate-700/70 bg-slate-900/60 backdrop-blur-sm px-2.5 py-1 rounded">
                  ORBITAL VIEW · 03
                </span>
              </span>
              <span className="block text-[#7dd3fc] mt-1 drop-shadow-[0_0_24px_rgba(56,189,248,0.35)]">
                Your Warning.
              </span>
            </h1>

            {/* Supporting Editorial Prose */}
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-slate-300 font-normal max-w-lg drop-shadow-[0_2px_12px_rgba(2,4,10,0.85)]">
              Personalized climate intelligence and early warnings for where you live.
            </p>
          </div>

          {/* Phase 2: Right Column Secure Risk Profile Registration Card Rising from Below */}
          <div
            className={`lg:col-span-5 flex justify-center lg:justify-end transition-all duration-550 ease-out ${
              animPhase >= 2
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-12 scale-[0.98]'
            }`}
          >
            <RegistrationCard
              onAddressChange={updateAddress}
              onSubmit={registerOperator}
              registrationError={registrationError}
              addressState={addressState}
              initPhase={initPhase}
              lastReport={report}
              onDismissReport={dismissReport}
            />
          </div>
        </div>

        {/* Phase 3: Bottom Section Live Monitoring Panel & Telemetry Fades in Last */}
        <div
          className={`mt-6 lg:mt-4 transition-all duration-500 ease-out pb-2 ${
            animPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <LiveMonitoringPanel
            coordinates={coordinates}
            conditions={conditions}
            onCycleRisk={(newRisk: RiskLevel) => cycleRisk(newRisk)}
            onRequestDeviceLocation={requestLocation}
            onOpenExtendedTelemetry={() => setIsTelemetryDrawerOpen(true)}
            isLocating={locationStatus === 'REQUESTING LOCATION'}
            isRegistered={isRegistered}
          />
        </div>
      </main>

      {/* 5. Non-Disruptive Extended Telemetry Matrix Drawer */}
      <ExtendedTelemetryDrawer
        isOpen={isTelemetryDrawerOpen}
        onClose={() => setIsTelemetryDrawerOpen(false)}
        coordinates={coordinates}
        conditions={conditions}
      />
    </div>
  );
};
