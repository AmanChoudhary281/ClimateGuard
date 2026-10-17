import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import {
  fetchLiveWeather,
  geocodeAddress,
  reverseGeocode,
  registerUser,
  fetchAlerts,
  calculateHeatRisk,
  calculateRainRisk,
  determineCompositeRisk,
  type WeatherData,
  type DailyForecast,
  type HourlyForecast,
  type AlertItem,
} from "@/services/api";
import { earthBus } from "@/lib/earth-bus";

export type LocationStatus =
  | "INITIALIZING"
  | "REQUESTING_LOCATION"
  | "LOCATION_LOCKED"
  | "LOCATION_UNAVAILABLE";

export type WeatherSyncStatus = "IDLE" | "SYNCING" | "SYNCED" | "UNAVAILABLE";

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "SEVERE";

export interface ClimateGuardContextType {
  // Location
  locationStatus: LocationStatus;
  latitude: number | null;
  longitude: number | null;
  cityName: string;
  locality: string;
  displayName: string;
  requestLiveLocation: () => Promise<boolean>;
  setManualLocation: (lat: number, lon: number, name?: string) => Promise<void>;

  // Weather
  weatherStatus: WeatherSyncStatus;
  weather: WeatherData | null;
  forecast: DailyForecast[];
  hourly: HourlyForecast[];
  refreshWeather: () => Promise<void>;

  // Risk
  riskLevel: RiskLevel;
  heatRisk: RiskLevel;
  rainRisk: RiskLevel;

  // Operator / Profile
  operatorName: string;
  operatorPhone: string;
  operatorAddress: string;
  operatorId: number | null;
  isRegistered: boolean;
  readiness: number;
  setProfileField: (field: "name" | "phone" | "address", val: string) => void;
  registerOperator: (customAddress?: string) => Promise<boolean>;

  // Alerts
  alerts: AlertItem[];
  unreadAlertsCount: number;
  updateAlertStatus: (id: number, status: AlertItem["status"]) => void;
  triggerSimulationAlert: () => void;

  // System status
  satLinkOnline: boolean;
  observationActive: boolean;
  lastUpdatedTime: string;
  utcTime: string;
}

const ClimateGuardContext = createContext<ClimateGuardContextType | null>(null);

const pad = (n: number) => String(n).padStart(2, "0");

export function ClimateGuardProvider({ children }: { children: React.ReactNode }) {
  // Location State
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("INITIALIZING");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [cityName, setCityName] = useState<string>("Locating Perimeter...");
  const [locality, setLocality] = useState<string>("Atmospheric Sensor");
  const [displayName, setDisplayName] = useState<string>("Resolving live satellite coordinates...");

  // Operator State
  const [operatorName, setOperatorName] = useState<string>(() => {
    return typeof window !== "undefined" ? localStorage.getItem("cg_name") || "" : "";
  });
  const [operatorPhone, setOperatorPhone] = useState<string>(() => {
    return typeof window !== "undefined" ? localStorage.getItem("cg_phone") || "" : "";
  });
  const [operatorAddress, setOperatorAddress] = useState<string>(() => {
    return typeof window !== "undefined" ? localStorage.getItem("cg_address") || "" : "";
  });
  const [operatorId, setOperatorId] = useState<number | null>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("cg_id") : null;
    return saved ? parseInt(saved, 10) : null;
  });
  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    return typeof window !== "undefined" ? localStorage.getItem("cg_registered") === "true" : false;
  });

  // Weather State
  const [weatherStatus, setWeatherStatus] = useState<WeatherSyncStatus>("IDLE");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [hourly, setHourly] = useState<HourlyForecast[]>([]);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("— — —");

  // Alerts State
  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    return [
      {
        id: 101,
        alert_type: "Perimeter Alert",
        severity: "MODERATE",
        message: "Atmospheric thermal anomalies detected in regional perimeter. Keep monitoring active.",
        sent_at: new Date(Date.now() - 3600000).toISOString(),
        status: "SENT",
      },
    ];
  });

  // Clock
  const [clockMs, setClockMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setClockMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const d = new Date(clockMs);
  const utcTime = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;

  // Dynamic Readiness Calculation
  const readiness = useMemo(() => {
    let score = 0;
    if (operatorName.trim().length >= 2) score += 30;
    if (operatorPhone.trim().replace(/\D/g, "").length >= 7) score += 30;
    if (operatorAddress.trim().length >= 3) score += 20;
    if (locationStatus === "LOCATION_LOCKED") score += 20;
    return Math.min(100, score);
  }, [operatorName, operatorPhone, operatorAddress, locationStatus]);

  // Load weather when coordinates become available
  const loadWeatherForCoords = useCallback(async (lat: number, lon: number) => {
    setWeatherStatus("SYNCING");
    try {
      const res = await fetchLiveWeather(lat, lon);
      setWeather(res.current);
      setForecast(res.forecast);
      setHourly(res.hourly);
      setWeatherStatus("SYNCED");

      const now = new Date();
      setLastUpdatedTime(
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      );

      // Check if alert needed for high or severe risk
      if (res.current.risk === "HIGH" || res.current.risk === "SEVERE") {
        setAlerts((prev) => {
          const exists = prev.some((a) => a.severity === res.current.risk && a.alert_type === "Heatwave");
          if (!exists) {
            return [
              {
                id: Date.now(),
                alert_type: "Heatwave",
                severity: res.current.risk,
                message: `${res.current.risk} heatwave risk detected in your area (${res.current.temperature}°C). Stay hydrated and avoid unshaded activity.`,
                sent_at: new Date().toISOString(),
                status: "PENDING",
              },
              ...prev,
            ];
          }
          return prev;
        });
      }
    } catch (err) {
      console.warn("Weather fetch failed:", err);
      setWeatherStatus("UNAVAILABLE");
    }
  }, []);

  // Set Manual Location (via geocoded address or direct choice)
  const setManualLocation = useCallback(
    async (lat: number, lon: number, name?: string) => {
      setLatitude(lat);
      setLongitude(lon);
      setLocationStatus("LOCATION_LOCKED");

      if (name) {
        setCityName(name);
        setLocality("Manual Sector");
        setDisplayName(name);
      } else {
        const geo = await reverseGeocode(lat, lon);
        setCityName(geo.city);
        setLocality(geo.locality);
        setDisplayName(geo.displayName);
      }

      // Fly Earth camera to location
      earthBus.startRadar({
        name: name || "Selected Sector",
        lat,
        lon,
        approximate: false,
      });

      await loadWeatherForCoords(lat, lon);
    },
    [loadWeatherForCoords]
  );

  // Request Live Browser Geolocation (Navigator API)
  const requestLiveLocation = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("geolocation" in navigator)) {
        setLocationStatus("LOCATION_UNAVAILABLE");
        setCityName("Location Unavailable");
        setLocality("Browser Unsupported");
        resolve(false);
        return;
      }

      setLocationStatus("REQUESTING_LOCATION");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);
          setLocationStatus("LOCATION_LOCKED");

          try {
            const geo = await reverseGeocode(lat, lon);
            setCityName(geo.city);
            setLocality(geo.locality);
            setDisplayName(geo.displayName);

            // Orient 3D Earth
            earthBus.startRadar({
              name: geo.city,
              lat,
              lon,
              approximate: false,
            });
          } catch {
            setCityName("Local Grid");
            setLocality("Live Sector");
          }

          await loadWeatherForCoords(lat, lon);
          resolve(true);
        },
        (error) => {
          console.warn("Geolocation permission or timeout error:", error.message);
          setLocationStatus("LOCATION_UNAVAILABLE");
          setCityName("Location Access Denied");
          setLocality("Manual Input Required");
          setDisplayName("Enable location permissions or enter address");
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  }, [loadWeatherForCoords]);

  // Request browser location on initial mount
  useEffect(() => {
    requestLiveLocation();
  }, [requestLiveLocation]);

  // Operator Profile Handling
  const setProfileField = (field: "name" | "phone" | "address", val: string) => {
    if (field === "name") {
      setOperatorName(val);
      localStorage.setItem("cg_name", val);
    } else if (field === "phone") {
      setOperatorPhone(val);
      localStorage.setItem("cg_phone", val);
    } else if (field === "address") {
      setOperatorAddress(val);
      localStorage.setItem("cg_address", val);
    }
  };

  const registerOperator = async (customAddress?: string): Promise<boolean> => {
    const targetAddress = customAddress || operatorAddress;
    if (!operatorName || !operatorPhone || !targetAddress) {
      return false;
    }

    try {
      // 1. Resolve address geocoding
      const geoResult = await geocodeAddress(targetAddress);
      if (geoResult) {
        setLatitude(geoResult.lat);
        setLongitude(geoResult.lon);
        setLocationStatus("LOCATION_LOCKED");
        setCityName(geoResult.name.split(",")[0] || "Custom Sector");
        setDisplayName(geoResult.name);

        earthBus.startRadar({
          name: geoResult.name.split(",")[0],
          lat: geoResult.lat,
          lon: geoResult.lon,
          approximate: false,
        });

        await loadWeatherForCoords(geoResult.lat, geoResult.lon);
      }

      // 2. Submit to backend API
      const userRes = await registerUser({
        name: operatorName,
        phone: operatorPhone,
        address: targetAddress,
      });

      if (userRes.id) {
        setOperatorId(userRes.id);
        localStorage.setItem("cg_id", userRes.id.toString());
      }
      setIsRegistered(true);
      localStorage.setItem("cg_registered", "true");

      return true;
    } catch (err) {
      console.error("Operator initialization failed:", err);
      return false;
    }
  };

  const updateAlertStatus = (id: number, status: AlertItem["status"]) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const triggerSimulationAlert = () => {
    const alertTypes = ["Heatwave", "Flash Flood", "High Wind Storm", "Severe Humidity Surge"];
    const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const newAlert: AlertItem = {
      id: Date.now(),
      alert_type: type,
      severity: "SEVERE",
      message: `Emergency Alert: Immediate ${type} alert in effect for ${cityName}. Take preventive safety precautions now.`,
      sent_at: new Date().toISOString(),
      status: "PENDING",
    };
    setAlerts((prev) => [newAlert, ...prev]);
    navigator.vibrate?.([50, 100, 50, 100]);
  };

  const unreadAlertsCount = alerts.filter((a) => a.status === "PENDING" || a.status === "SENT").length;

  // Composite Risk Calculations
  const heatRisk = weather ? calculateHeatRisk(weather.temperature, weather.humidity) : "LOW";
  const rainRisk = weather ? calculateRainRisk(weather.rainfall) : "LOW";
  const riskLevel = weather ? determineCompositeRisk(heatRisk, rainRisk) : "LOW";

  return (
    <ClimateGuardContext.Provider
      value={{
        locationStatus,
        latitude,
        longitude,
        cityName,
        locality,
        displayName,
        requestLiveLocation,
        setManualLocation,

        weatherStatus,
        weather,
        forecast,
        hourly,
        refreshWeather: () =>
          latitude !== null && longitude !== null
            ? loadWeatherForCoords(latitude, longitude)
            : Promise.resolve(),

        riskLevel,
        heatRisk,
        rainRisk,

        operatorName,
        operatorPhone,
        operatorAddress,
        operatorId,
        isRegistered,
        readiness,
        setProfileField,
        registerOperator,

        alerts,
        unreadAlertsCount,
        updateAlertStatus,
        triggerSimulationAlert,

        satLinkOnline: weatherStatus === "SYNCED" || locationStatus === "LOCATION_LOCKED",
        observationActive: true,
        lastUpdatedTime,
        utcTime,
      }}
    >
      {children}
    </ClimateGuardContext.Provider>
  );
}

export function useClimateGuard() {
  const ctx = useContext(ClimateGuardContext);
  if (!ctx) {
    throw new Error("useClimateGuard must be used within ClimateGuardProvider");
  }
  return ctx;
}
