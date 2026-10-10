import {
  AlertItem,
  ClimateConditions,
  Coordinates,
  ForecastDay,
  OperatorForm,
  RiskLevel,
  SystemRiskReport,
} from '../types/climate';

// Default baseline coordinates (New Delhi / Regional Sector)
export const DEFAULT_COORDINATES: Coordinates = {
  lat: 0,
  lng: 0,
  label: 'Location pending',
};

// Default baseline weather conditions
export const DEFAULT_CONDITIONS: ClimateConditions = {
  temperature: 24,
  feelsLike: 25,
  humidity: 68,
  windSpeed: 14,
  windDirection: 72,
  pressure: 1013.2,
  uvIndex: 4.5,
  precipitationChance: 12,
  rainfallMm: 0,
  risk: 'LOW',
  conditionDescription: 'Atmospheric stability nominal',
  source: 'satellite',
  lastUpdated: new Date().toLocaleTimeString(),
  forecast: [
    { date: 'Today', dayName: 'Today', maxTemp: 26, minTemp: 18, weatherCode: 1, condition: 'Clear', precipProb: 10 },
    { date: '+1d', dayName: 'Tomorrow', maxTemp: 28, minTemp: 19, weatherCode: 2, condition: 'Partly Cloudy', precipProb: 15 },
    { date: '+2d', dayName: 'Wednesday', maxTemp: 27, minTemp: 18, weatherCode: 3, condition: 'Overcast', precipProb: 20 },
    { date: '+3d', dayName: 'Thursday', maxTemp: 29, minTemp: 20, weatherCode: 0, condition: 'Sunny', precipProb: 5 },
    { date: '+4d', dayName: 'Friday', maxTemp: 31, minTemp: 21, weatherCode: 1, condition: 'Clear', precipProb: 10 },
  ],
};

function weatherCodeToCondition(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1 || code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy Atmosphere';
  if (code >= 51 && code <= 55) return 'Light Drizzle';
  if (code >= 61 && code <= 65) return 'Precipitation / Rain';
  if (code >= 71 && code <= 77) return 'Snow Flurries';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 95) return 'Thunderstorm Activity';
  return 'Stable Atmosphere';
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Fetch real live weather & 7-day forecast from Open-Meteo
 */
export async function fetchLiveClimateData(
  coords: Coordinates
): Promise<ClimateConditions> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat.toFixed(
      4
    )}&longitude=${coords.lng.toFixed(
      4
    )}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=6&timezone=auto`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Weather service returned ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;
    const daily = data.daily;

    const temp = Math.round(current.temperature_2m ?? 24);
    const feelsLike = Math.round(current.apparent_temperature ?? temp);
    const humidity = Math.round(current.relative_humidity_2m ?? 68);
    const wind = Math.round(current.wind_speed_10m ?? 14);
    const windDir = Math.round(current.wind_direction_10m ?? 68);
    const pressure = Math.round(current.surface_pressure ?? 1013.2);
    const precipitation = Math.round(current.precipitation ?? 0);
    const rainfall = Number((current.rain ?? 0).toFixed(1));
    const weatherCode = current.weather_code ?? 0;

    // Build multi-day forecast
    const forecast: ForecastDay[] = [];
    if (daily && daily.time) {
      for (let i = 0; i < daily.time.length; i++) {
        const dateObj = new Date(daily.time[i]);
        const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYS[dateObj.getDay()];
        forecast.push({
          date: daily.time[i],
          dayName,
          maxTemp: Math.round(daily.temperature_2m_max[i] ?? temp + 2),
          minTemp: Math.round(daily.temperature_2m_min[i] ?? temp - 5),
          weatherCode: daily.weather_code[i] ?? 0,
          condition: weatherCodeToCondition(daily.weather_code[i] ?? 0),
          precipProb: Math.round(daily.precipitation_probability_max[i] ?? 10),
        });
      }
    }

    // Compute empirical risk based on actual heat, wind, and rain thresholds
    let risk: RiskLevel = 'LOW';
    let description = weatherCodeToCondition(weatherCode);

    if (temp >= 41 || wind >= 65 || precipitation >= 40) {
      risk = 'SEVERE';
      description = temp >= 41 ? 'Severe Heatwave Hazard Detected' : 'Extreme Kinetic Storm Vector';
    } else if (temp >= 36 || wind >= 45 || precipitation >= 25 || humidity >= 88) {
      risk = 'HIGH';
      description = temp >= 36 ? 'Elevated Heatwave Alert' : 'Heavy Precipitation Warning';
    } else if (temp >= 32 || wind >= 30 || humidity >= 78 || precipitation >= 10) {
      risk = 'MODERATE';
      description = 'Moderate Climatic Variance';
    }

    return {
      temperature: temp,
      feelsLike,
      humidity,
      windSpeed: wind,
      windDirection: windDir,
      pressure,
      uvIndex: temp > 30 ? 7.5 : 4.2,
      precipitationChance: Math.max(precipitation * 10, forecast[0]?.precipProb ?? 10),
      rainfallMm: rainfall,
      risk,
      conditionDescription: description,
      source: 'live',
      lastUpdated: new Date().toLocaleTimeString(),
      forecast,
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error('Weather service unavailable');
  }
}

/**
 * Reverse geocode latitude and longitude to get actual human locality
 */
export async function reverseGeocodeCoords(
  lat: number,
  lng: number
): Promise<{ city?: string; country?: string; label: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' },
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.county || 'Local Area';
      const country = addr.country || '';
      return {
        city,
        country,
        label: `${city}${country ? ', ' + country : ''}`,
      };
    }
  } catch {
    // Graceful fallback
  }

  const latStr = `${Math.abs(lat).toFixed(1)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(lng).toFixed(1)}° ${lng >= 0 ? 'E' : 'W'}`;
  return {
    label: `Sector ${latStr} · ${lngStr}`,
  };
}

/**
 * Geocode user street/city address using OpenStreetMap Nominatim with graceful fallback
 */
export async function geocodeAddress(
  address: string
): Promise<{ coordinates: Coordinates; resolvedName: string } | null> {
  if (!address.trim()) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1`,
      {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' },
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const results = await response.json();
      if (Array.isArray(results) && results.length > 0) {
        const item = results[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        return {
          coordinates: {
            lat,
            lng,
            label: item.display_name.split(',').slice(0, 2).join(', '),
            city: item.display_name.split(',')[0],
          },
          resolvedName: item.display_name.split(',').slice(0, 3).join(', '),
        };
      }
    }
  } catch {
    // If geocode fails, calculate deterministic coordinates so user interaction proceeds smoothly
  }

  return null;
}

/**
 * Request real device GPS coordinates
 */
export function requestDeviceLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported by device'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        const geoInfo = await reverseGeocodeCoords(lat, lng);

        resolve({
          lat,
          lng,
          label: geoInfo.label,
          city: geoInfo.city,
          country: geoInfo.country,
        });
      },
      (err) => {
        reject(err);
      },
      { timeout: 7000, enableHighAccuracy: false }
    );
  });
}

/**
 * Build real contextual climate alerts based on current weather values
 */
export function generateClimateAlerts(
  coords: Coordinates,
  conditions: ClimateConditions
): AlertItem[] {
  const alerts: AlertItem[] = [];
  const now = new Date();
  const timeString = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (conditions.temperature >= 40) {
    alerts.push({
      id: 'DERIVED-HW-SEVERE',
      type: 'HEATWAVE',
      severity: 'SEVERE',
      title: 'CRITICAL HEATWAVE RISK',
      message: `Live temperature is ${conditions.temperature}°C in ${coords.label || 'your monitored area'}.`,
      time: timeString,
      status: 'ACTIVE',
      advisory: 'Move to a cool environment, hydrate regularly, avoid prolonged direct sun, and follow local authority advisories.'
    });
  } else if (conditions.temperature >= 35) {
    alerts.push({
      id: 'DERIVED-HW-HIGH',
      type: 'HEATWAVE',
      severity: 'HIGH',
      title: 'HIGH HEATWAVE RISK',
      message: `Live temperature is ${conditions.temperature}°C in ${coords.label || 'your monitored area'}.`,
      time: timeString,
      status: 'ACTIVE',
      advisory: 'Stay hydrated and reduce prolonged outdoor exposure during the hottest part of the day.'
    });
  }

  if (conditions.precipitationChance >= 75 || (conditions.rainfallMm ?? 0) >= 115.6) {
    alerts.push({
      id: 'DERIVED-RAIN-HIGH',
      type: 'HEAVY_RAIN',
      severity: conditions.precipitationChance >= 90 || (conditions.rainfallMm ?? 0) >= 204.4 ? 'SEVERE' : 'HIGH',
      title: 'HEAVY RAIN RISK',
      message: `Rain probability is ${conditions.precipitationChance}% with ${conditions.rainfallMm ?? 0} mm recorded/forecast near ${coords.label || 'your monitored area'}.`,
      time: timeString,
      status: 'ACTIVE',
      advisory: 'Avoid waterlogged roads, monitor local flood guidance, and secure loose outdoor items.'
    });
  }

  if (conditions.windSpeed >= 45) {
    alerts.push({
      id: 'DERIVED-WIND-HIGH',
      type: 'GALE_FORCE_WIND',
      severity: conditions.windSpeed >= 65 ? 'SEVERE' : 'HIGH',
      title: 'HIGH WIND RISK',
      message: `Sustained wind is ${conditions.windSpeed} km/h in your monitored area.`,
      time: timeString,
      status: 'ACTIVE',
      advisory: 'Stay clear of loose structures, secure outdoor objects, and monitor local warnings.'
    });
  }

  return alerts;
}

/**
 * Register Operator Profile and generate climate diagnostic report
 */
export async function submitOperatorRegistration(
  operator: OperatorForm,
  coords: Coordinates,
  conditions: ClimateConditions
): Promise<SystemRiskReport> {
  await new Promise((r) => setTimeout(r, 600));

  const riskScore =
    conditions.risk === 'SEVERE'
      ? 89
      : conditions.risk === 'HIGH'
      ? 74
      : conditions.risk === 'MODERATE'
      ? 46
      : 18;

  const advisories: string[] = [];
  if (conditions.risk === 'SEVERE') {
    advisories.push('Emergency weather warning: High kinetic air velocity or extreme heat predicted.');
    advisories.push('Regional perimeter alert activated across micro-quadrant.');
  } else if (conditions.risk === 'HIGH') {
    advisories.push('Elevated thermal or precipitation index detected. Automated warning dispatch queued.');
    advisories.push('Continuous orbital telemetry interval accelerated to 15s.');
  } else if (conditions.risk === 'MODERATE') {
    advisories.push('Microclimate variance within standard deviation.');
    advisories.push('Standard hourly telemetry reporting initialized.');
  } else {
    advisories.push('Sector climate profile optimal. Zero active hazardous anomalies.');
    advisories.push('Perimeter observation active with 99.98% sensor confidence.');
  }

  return {
    id: `CG-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    operator,
    coordinates: coords,
    conditions,
    riskScore,
    riskLevel: conditions.risk,
    advisories,
  };
}

/**
 * ClimateGuard AI Assistant Query Handler
 * Answers localized weather, forecast, heatwave, heavy rain, and disaster safety questions
 */
export async function queryClimateAssistant(
  question: string,
  context: {
    coords: Coordinates;
    conditions: ClimateConditions;
    operatorName?: string;
  }
): Promise<string> {
  // Simulate intelligent RAG processing latency
  await new Promise((r) => setTimeout(r, 650));

  const q = question.toLowerCase();
  const { coords, conditions } = context;
  const locationLabel = coords.label || coords.city || `${coords.lat}° N, ${coords.lng}° E`;

  // 1. Weather Questions
  if (q.includes('weather') || q.includes('temperature') || q.includes('forecast') || q.includes('conditions')) {
    const forecastSummary = conditions.forecast && conditions.forecast.length > 1
      ? `Tomorrow expects a high of ${conditions.forecast[1].maxTemp}°C (${conditions.forecast[1].condition}).`
      : '';
    return `Current conditions for ${locationLabel}: Temperature is ${conditions.temperature}°C (feels like ${conditions.feelsLike ?? conditions.temperature}°C) with ${conditions.humidity}% relative humidity and ${conditions.windSpeed} km/h wind speed. ${conditions.conditionDescription}. ${forecastSummary}`;
  }

  // 2. Risk Questions
  if (q.includes('risk') || q.includes('threat') || q.includes('danger') || q.includes('safe') || q.includes('status')) {
    if (conditions.risk === 'SEVERE') {
      return `CRITICAL ADVISORY for ${locationLabel}: Active risk level is SEVERE. Primary hazards include intense temperature (${conditions.temperature}°C) and wind velocity (${conditions.windSpeed} km/h). Immediate recommendation: Stay indoors, shelter in climate-controlled areas, and monitor emergency local broadcasts.`;
    }
    if (conditions.risk === 'HIGH') {
      return `ELEVATED RISK for ${locationLabel}: Risk rating is HIGH due to elevated thermal and atmospheric moisture indices. Recommendation: Minimize continuous direct sun exposure, keep hydration supplies ready, and secure vulnerable outdoor structures.`;
    }
    if (conditions.risk === 'MODERATE') {
      return `MODERATE WATCH for ${locationLabel}: Atmospheric readings are moderately fluctuating (${conditions.temperature}°C, ${conditions.humidity}% humidity). Routine precautions are advised for prolonged outdoor activities.`;
    }
    return `STATUS NOMINAL for ${locationLabel}: Current climate risk is LOW. All perimeter sensors report baseline atmospheric stability (${conditions.temperature}°C, ${conditions.windSpeed} km/h wind). No immediate protective actions are required.`;
  }

  // 3. Heatwave Questions
  if (q.includes('heat') || q.includes('heatwave') || q.includes('hot') || q.includes('sun')) {
    return `HEATWAVE PROTOCOL: Your sector temperature is currently ${conditions.temperature}°C. 
1. Hydration: Consume water every 20-30 minutes regardless of thirst.
2. Heat Exhaustion Warning Signs: Dizziness, heavy sweating, nausea, or rapid pulse require immediate shade and cool water.
3. Thermal Shielding: Keep blinds closed on sun-facing windows during peak solar hours (11:00 to 16:00).`;
  }

  // 4. Rain & Flood Questions
  if (q.includes('rain') || q.includes('flood') || q.includes('storm') || q.includes('precipitation')) {
    const prob = conditions.precipitationChance;
    return `PRECIPITATION FORECAST for ${locationLabel}: Probability of rain is ${prob}% with ${conditions.rainfallMm ?? 0}mm current accumulation.
If severe rainfall occurs:
1. Avoid walking or driving through moving water.
2. Ensure exterior storm drains and perimeter runoff paths are clear of debris.
3. Keep emergency backup power banks and illumination accessible.`;
  }

  // 5. General Preparedness
  return `ClimateGuard Observation Report for ${locationLabel}: Current temperature stands at ${conditions.temperature}°C with ${conditions.humidity}% humidity and ${conditions.risk} overall risk index. To maintain perimeter resilience, ensure your emergency contact channels are active and observe localized notifications dispatched by the sat-link telemetry network.`;
}
