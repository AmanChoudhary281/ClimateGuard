import * as THREE from "three";
import type { Sector } from "@/lib/sector";

export const PLANET_RADIUS = 1.48;

/* ───────────────────────── camera presets ─────────────────────────
 * lon   – longitude (deg) rotated to face the camera
 * tilt  – globe x-rotation (rad); positive tips the north pole toward the camera
 * zoom  – camera distance (the wheel keeps working relative to this)
 * lookX/lookY – extra framing offsets added on top of the base framing
 * sun   – world-space sun direction (tweened; shaders are unchanged)
 * horizon/aurora – 0..1 intensity of the limb-glow and auroral shells
 * Tune the numbers here; nothing else needs to change.
 */
export type PresetId = "overview" | "night" | "horizon";

export type Preset = {
  label: string;
  short: string;
  lon: number;
  tilt: number;
  zoom: number;
  lookX: number;
  lookY: number;
  sun: [number, number, number];
  horizon: number;
  aurora: number;
  duration: number;
};

export const PRESETS: Record<PresetId, Preset> = {
  overview: {
    label: "Overview",
    short: "Overview",
    lon: 40,
    tilt: 0.28,
    zoom: 9,
    lookX: 0,
    lookY: 0,
    sun: [0.96, 0.14, 0.22],
    horizon: 0,
    aurora: 0.35,
    duration: 2.6,
  },
  night: {
    label: "Night Megacities",
    short: "Night Cities",
    lon: 100,
    tilt: 0.42,
    zoom: 6.6,
    lookX: 0,
    lookY: -0.45,
    sun: [-0.42, 0.16, -0.89],
    horizon: 0.18,
    aurora: 0.8,
    duration: 3.0,
  },
  horizon: {
    label: "Atmospheric Horizon",
    short: "Horizon",
    lon: 15,
    tilt: 0.16,
    zoom: 4.9,
    lookX: 0,
    lookY: 1.45,
    sun: [0.35, 0.5, -0.79],
    horizon: 1,
    aurora: 0.9,
    duration: 3.2,
  },
};

export const PRESET_ORDER: PresetId[] = ["overview", "night", "horizon"];

/* ───────────────────────── telemetry markers ─────────────────────────
 * Metric values are illustrative placeholders – wire them to the ClimateGuard API.
 */
export type Marker = {
  id: string;
  name: string;
  code: string;
  lat: number;
  lon: number;
  status: string;
  tone: "ok" | "watch" | "alert";
  metrics: { label: string; value: string }[];
};

export const MARKERS: Marker[] = [
  {
    id: "amazon",
    name: "Amazon Rainforest",
    code: "SEC-AMZ",
    lat: -3.47,
    lon: -62.2,
    status: "Watch",
    tone: "watch",
    metrics: [
      { label: "Canopy heat index", value: "+1.9°C" },
      { label: "Humidity", value: "84%" },
      { label: "Fire alerts / 24h", value: "37" },
    ],
  },
  {
    id: "arctic",
    name: "Arctic Monitoring Station",
    code: "SEC-ARC",
    lat: 78.22,
    lon: 15.65,
    status: "Alert",
    tone: "alert",
    metrics: [
      { label: "Surface anomaly", value: "+3.4°C" },
      { label: "Sea-ice extent", value: "−12.2% / dec" },
      { label: "Albedo", value: "0.62" },
    ],
  },
  {
    id: "tokyo",
    name: "Tokyo Sector",
    code: "SEC-TYO",
    lat: 35.68,
    lon: 139.69,
    status: "Nominal",
    tone: "ok",
    metrics: [
      { label: "Urban heat island", value: "+2.4°C" },
      { label: "Air quality index", value: "42" },
      { label: "Typhoon watch", value: "Clear" },
    ],
  },
];

export const latLonToVec3 = (lat: number, lon: number, radius = 1, out = new THREE.Vector3()) => {
  const phi = THREE.MathUtils.degToRad(lat);
  const lam = THREE.MathUtils.degToRad(lon);
  return out.set(
    radius * Math.cos(phi) * Math.cos(lam),
    radius * Math.sin(phi),
    -radius * Math.cos(phi) * Math.sin(lam),
  );
};

/* ───────────────────────── store ───────────────────────── */
type Cmd =
  | { id: number; kind: "none" }
  | { id: number; kind: "preset"; preset: PresetId }
  | { id: number; kind: "sector"; lat: number; lon: number };

export type Radar = { id: number; phase: "idle" | "scanning" | "locked"; sector: Sector | null };
export type Snapshot = { preset: PresetId; cmd: Cmd; radar: Radar };
export type Geo = { lat: number; lon: number } | null;

let snap: Snapshot = {
  preset: "overview",
  cmd: { id: 0, kind: "none" },
  radar: { id: 0, phase: "idle", sector: null },
};
const listeners = new Set<() => void>();
const geoListeners = new Set<(geo: Geo) => void>();
const commit = (next: Partial<Snapshot>) => {
  snap = { ...snap, ...next };
  listeners.forEach((listener) => listener());
};

export const earthBus = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => snap,
  setPreset(preset: PresetId) {
    commit({ preset, cmd: { id: snap.cmd.id + 1, kind: "preset", preset } });
  },
  startRadar(sector: Sector) {
    commit({
      radar: { id: snap.radar.id + 1, phase: "scanning", sector },
      cmd: { id: snap.cmd.id + 1, kind: "sector", lat: sector.lat, lon: sector.lon },
    });
  },
  lockRadar(id: number) {
    if (snap.radar.id === id && snap.radar.phase === "scanning")
      commit({ radar: { ...snap.radar, phase: "locked" } });
  },
  onGeo(listener: (geo: Geo) => void) {
    geoListeners.add(listener);
    return () => {
      geoListeners.delete(listener);
    };
  },
  emitGeo(geo: Geo) {
    geoListeners.forEach((listener) => listener(geo));
  },
};
