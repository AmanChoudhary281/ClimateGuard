# ClimateGuard — Production Polish & Feature Expansion Plan

Comprehensive evaluation and roadmap for ClimateGuard, preserving the locked 3D Earth foundation while extending climate telemetry and operational capabilities.

### User Review & Critical Decisions

> [!IMPORTANT]
> The current 3D Earth composition, day/night atmospheric shaders, and command-center UI have been confirmed as authentic and production-ready. All core visual assets remain strictly locked.

- **Confirmed Decision 1**: Retain current visual identity, Three.js photorealistic Earth, and command-center layout as the approved baseline.
- **Confirmed Decision 2**: Expand interactive capabilities via a non-disruptive telemetry drawer and optional environmental sound layer without altering hero composition.

---

### 1. Overview & Core Concept

- **What It Does**: ClimateGuard provides real-time planetary climate risk detection, localized geocoded perimeter monitoring, and automated early warning intelligence for individuals and organizations.
- **Target Audience / Persona**: Climate analysts, facility operators, and individuals monitoring localized meteorological and thermal risk factors.
- **Key Value**: Immediate situational awareness combining high-fidelity orbital observation with actionable regional perimeter alerts.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. *Orbital Surface Inspection*: Users observe planetary conditions, live UTC telemetry, and surface lock status.
  2. *Perimeter Registration*: Operators enter credentials, view real-time address geocoding (`[MANUAL]` → `[RESOLVING...]` → `[LOCATED]`), and track readiness (0% → 100%).
  3. *Handshake & Risk Diagnostic*: The champagne CTA initiates a 4-phase cryptographic link, surfacing active climate advisories and localized risk scores.
- **Visual Identity & Theme**:
  - *Palette*: Deep space black (`#02040a`), crisp neutral white (`#f8fafc`), glacial cyan accent (`#38bdf8`), and status emerald (`#10b981`).
  - *Typography*: High-legibility sans (`Plus Jakarta Sans`) paired with aerospace monospace (`JetBrains Mono`) for tabular coordinates.
  - *HUD Styling*: Minimalist hairline borders, corner crosshair brackets (`+`), and zero decorative pill enclosures.
- **Motion & Micro-Interactions**:
  - Parallax depth response across stars, HUD, and Earth layers.
  - Dynamic 2.4s telemetry bar oscillation reflecting microclimate variance.
  - Magnetic button attraction on cursor proximity.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Preserve Exact Three.js Earth Implementation**
  - *Chosen Approach*: Maintain current dual-texture shader (daytime landmasses + nighttime city lights), cloud layer, and Fresnel atmospheric limb glow.
  - *Why*: User and product brief strictly mandate visual lock on the approved 3D Earth.
  - *Alternatives Considered*: Procedural noise globes (rejected: lacks authentic planetary realism).

- **Decision 2: Non-Disruptive Extended Telemetry Drawer**
  - *Chosen Approach*: Retain the clean hero layout and allow deep-dive metrics (24h thermal trend, barometric pressure) to slide out smoothly only upon user request.
  - *Why*: Keeps the dominant editorial headline and registration card clutter-free while providing deeper data.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌───────────────────────────────────────────────────────────────┐
│                       CLIMATEGUARD UI                         │
├───────────────────────────────┬───────────────────────────────┤
│          HERO & 3D            │       SECURE RISK CARD        │
│  ┌─────────────────────────┐  │  ┌─────────────────────────┐  │
│  │ Three.js Earth Scene    │  │  │ Operator Form [AUTH]    │  │
│  │ (Day/Night GLSL, Rim)   │  │  │ Geocoding State Machine │  │
│  └─────────────────────────┘  │  │ Segmented Readiness     │  │
│  ┌─────────────────────────┐  │  │ Magnetic CTA Handshake  │  │
│  │ Live Monitoring Panel   │  │  └─────────────────────────┘  │
│  │ (Fluctuating Telemetry) │  │  ┌─────────────────────────┐  │
│  └─────────────────────────┘  │  │ Risk Diagnostic Modal   │  │
└───────────────────────────────┴──┴─────────────────────────┴──┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                     CLIMATE SERVICE LAYER                     │
│  ┌──────────────────────┐           ┌──────────────────────┐  │
│  │ Open-Meteo API /     │           │ Nominatim Geocoder / │  │
│  │ Empirical Risk Engine│           │ Geolocation API      │  │
│  └──────────────────────┘           └──────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

- **State Model**:
  - `Coordinates`: Real-time latitude and longitude with tracking label.
  - `ClimateConditions`: Temperature, relative humidity, wind speed, precipitation, and 4-tier risk classification (`LOW`, `MODERATE`, `HIGH`, `SEVERE`).
  - `InitPhase`: Multi-phase state machine driving registration feedback.
