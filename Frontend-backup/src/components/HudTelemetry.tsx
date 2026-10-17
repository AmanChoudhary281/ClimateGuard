import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { earthBus } from "@/lib/earth-bus";
import { fmtLat, fmtLon } from "@/lib/sector";

// Simulated telemetry – replace `buildItems` with live values from the ClimateGuard API.
const buildItems = (t: number): [string, string][] => [
  ["Global Thermal Anomaly", `+${(1.28 + 0.012 * Math.sin(t / 7)).toFixed(2)}°C`],
  ["Solar Flux", `${(1361 + 0.4 * Math.sin(t / 5)).toFixed(1)} W/m²`],
  ["Orbital Velocity", `${(7.66 + 0.004 * Math.sin(t / 3)).toFixed(2)} km/s`],
  ["Orbital Altitude", `${(408 + 1.5 * Math.sin(t / 11)).toFixed(0)} km`],
  ["Geomagnetic Kp", (2.3 + 0.2 * Math.sin(t / 9)).toFixed(1)],
  ["Sensor Array", "12 / 12 Nominal"],
];

const pad = (n: number) => String(n).padStart(2, "0");

export function HudTelemetry() {
  const snap = useSyncExternalStore(earthBus.subscribe, earthBus.getSnapshot, earthBus.getSnapshot);
  const latRef = useRef<HTMLElement>(null);
  const lonRef = useRef<HTMLElement>(null);
  const stateRef = useRef<HTMLElement>(null);
  const [now, setNow] = useState(() => Date.now());
  const [banner, setBanner] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Cursor → geographic readout, written straight to the DOM (no React work per pointer event).
  useEffect(
    () =>
      earthBus.onGeo((geo) => {
        if (latRef.current) latRef.current.textContent = geo ? fmtLat(geo.lat) : "— — —";
        if (lonRef.current) lonRef.current.textContent = geo ? fmtLon(geo.lon) : "— — —";
        if (stateRef.current) stateRef.current.textContent = geo ? "Surface lock" : "Deep space";
      }),
    [],
  );

  useEffect(() => {
    if (snap.radar.phase !== "locked") {
      setBanner(false);
      return;
    }
    setBanner(true);
    const id = window.setTimeout(() => setBanner(false), 6500);
    return () => window.clearTimeout(id);
  }, [snap.radar.phase, snap.radar.id]);

  const items = buildItems(now / 1000);
  const d = new Date(now);
  const clock = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
  const sector = snap.radar.sector;

  return (
    <>
      <div className="hud-ticker" role="region" aria-label="Orbital telemetry">
        <div className="ticker-track">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1}>
              {items.map(([label, value]) => (
                <li key={label}>
                  <span>{label}</span>
                  <b>{value}</b>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div className="hud-coords" aria-label="Cursor coordinates">
        <div>
          <span>Lat</span>
          <b ref={latRef}>— — —</b>
        </div>
        <div>
          <span>Lon</span>
          <b ref={lonRef}>— — —</b>
        </div>
        <div className="hud-coords-meta">
          <i />
          <em ref={stateRef}>Deep space</em>
          <time>{clock}</time>
        </div>
      </div>

      <div className="lock-banner" data-show={banner && !!sector} aria-hidden={!banner}>
        <i aria-hidden="true" />
        <strong>Coordinates secured</strong>
        {sector && (
          <span>
            {sector.name} · {fmtLat(sector.lat, 2)} {fmtLon(sector.lon, 2)}
            {sector.approximate ? " · approx." : ""}
          </span>
        )}
      </div>
    </>
  );
}
