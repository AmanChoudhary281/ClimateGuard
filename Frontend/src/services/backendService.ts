import {
  AlertItem,
  ClimateConditions,
  Coordinates,
  ForecastDay,
  OperatorForm,
  RiskLevel
} from '../types/climate';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 60000);

  try {

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,

      signal: controller.signal,

      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {

      const text = await response.text().catch(() => '');

      throw new Error(
        `Backend ${response.status}${
          text ? `: ${text.slice(0, 180)}` : ''
        }`
      );
    }

    const contentType =
      response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return (await response.text()) as T;

  } catch (error: any) {

    if (error?.name === 'AbortError') {
      throw new Error(
        'Backend request timed out. Please try again.'
      );
    }

    throw error;

  } finally {

    clearTimeout(timeout);

  }
}


function asNumber(
  value: unknown,
  fallback = 0
): number {

  const n =
    typeof value === 'number'
      ? value
      : Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
}


function normalizeRisk(
  value: unknown
): RiskLevel {

  const v = String(value || '').toUpperCase();

  if (
    v === 'SEVERE' ||
    v === 'HIGH' ||
    v === 'MODERATE' ||
    v === 'LOW'
  ) {
    return v;
  }

  return 'LOW';
}


function weatherCodeToCondition(
  code: number
): string {

  if (code === 0) return 'Clear Sky';

  if (code === 1 || code === 2)
    return 'Partly Cloudy';

  if (code === 3)
    return 'Overcast';

  if (code >= 45 && code <= 48)
    return 'Foggy Atmosphere';

  if (code >= 51 && code <= 55)
    return 'Light Drizzle';

  if (code >= 61 && code <= 65)
    return 'Rain';

  if (code >= 71 && code <= 77)
    return 'Snow';

  if (code >= 80 && code <= 82)
    return 'Rain Showers';

  if (code >= 95)
    return 'Thunderstorm';

  return 'Stable Atmosphere';
}


function normalizeForecast(
  raw: any,
  temperature: number
): ForecastDay[] {

  const source =
    raw?.daily ||
    raw?.forecast ||
    raw?.data?.daily ||
    raw?.data?.forecast;

  if (Array.isArray(source)) {

    return source
      .slice(0, 6)
      .map((item: any, index: number) => ({

        date:
          item.date ||
          item.time ||
          `+${index}d`,

        dayName:
          item.dayName ||
          (
            index === 0
              ? 'Today'
              : index === 1
                ? 'Tomorrow'
                : new Date(
                    item.date ||
                    item.time ||
                    Date.now()
                  ).toLocaleDateString(
                    [],
                    { weekday: 'short' }
                  )
          ),

        maxTemp: Math.round(
          asNumber(
            item.maxTemp ??
            item.temperature_2m_max,
            temperature + 2
          )
        ),

        minTemp: Math.round(
          asNumber(
            item.minTemp ??
            item.temperature_2m_min,
            temperature - 5
          )
        ),

        weatherCode: Math.round(
          asNumber(
            item.weatherCode ??
            item.weather_code,
            0
          )
        ),

        condition:
          item.condition ||
          weatherCodeToCondition(
            asNumber(
              item.weatherCode ??
              item.weather_code,
              0
            )
          ),

        precipProb: Math.round(
          asNumber(
            item.precipProb ??
            item.precipitation_probability_max,
            0
          )
        ),

      }));

  }


  if (
    source?.time &&
    Array.isArray(source.time)
  ) {

    return source.time
      .slice(0, 6)
      .map(
        (
          date: string,
          index: number
        ) => {

          const code = asNumber(
            source.weather_code?.[index],
            0
          );

          return {

            date,

            dayName:
              index === 0
                ? 'Today'
                : index === 1
                  ? 'Tomorrow'
                  : new Date(date).toLocaleDateString(
                      [],
                      { weekday: 'short' }
                    ),

            maxTemp: Math.round(
              asNumber(
                source.temperature_2m_max?.[index],
                temperature + 2
              )
            ),

            minTemp: Math.round(
              asNumber(
                source.temperature_2m_min?.[index],
                temperature - 5
              )
            ),

            weatherCode:
              Math.round(code),

            condition:
              weatherCodeToCondition(code),

            precipProb: Math.round(
              asNumber(
                source.precipitation_probability_max?.[index],
                0
              )
            ),

          };

        }
      );
  }


  return [];
}


export async function registerUserWithBackend(
  form: OperatorForm
): Promise<{
  userId: number | string | null;
  raw: any;
}> {

  const raw = await apiFetch<any>(
    '/users',
    {
      method: 'POST',

      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        address: form.address,
      }),
    }
  );


  if (
    raw?.message ===
    'Phone number already registered.'
  ) {

    throw new Error(
      'Phone number already registered.'
    );

  }


  const userId =
    raw?.id ??
    raw?.user_id ??
    raw?.user?.id ??
    raw?.data?.id ??
    raw?.data?.user_id ??
    null;


  if (userId == null) {

    throw new Error(
      'User registration failed.'
    );

  }


  return {

    userId: String(userId),

    raw

  };

}


export async function fetchBackendWeather(
  coords: Coordinates
): Promise<ClimateConditions> {

  const raw = await apiFetch<any>(
    `/weather?latitude=${encodeURIComponent(
      coords.lat
    )}&longitude=${encodeURIComponent(
      coords.lng
    )}`
  );


  const source =
    raw?.data ??
    raw?.weather ??
    raw?.result ??
    raw;


  const current =
    source?.current ??
    source;


  const temperature = Math.round(
    asNumber(
      current?.temperature ??
      current?.temperature_2m
    )
  );


  const humidity = Math.round(
    asNumber(
      current?.humidity ??
      current?.relative_humidity_2m
    )
  );


  const windSpeed = Math.round(
    asNumber(
      current?.wind_speed ??
      current?.wind_speed_10m
    )
  );


  const rainfallMm = asNumber(
    current?.rainfall ??
    current?.rain ??
    current?.precipitation,
    0
  );


  const feelsLike = Math.round(
    asNumber(
      current?.feels_like ??
      current?.apparent_temperature,
      temperature
    )
  );


  const windDirection = Math.round(
    asNumber(
      current?.wind_direction ??
      current?.wind_direction_10m,
      0
    )
  );


  const pressure = Math.round(
    asNumber(
      current?.pressure ??
      current?.surface_pressure,
      1013
    )
  );


  const precipitationChance =
    Math.round(
      asNumber(
        current?.precipitationChance ??
        current?.precipitation_probability,
        asNumber(
          source?.daily
            ?.precipitation_probability_max?.[0],
          0
        )
      )
    );


  const weatherCode = Math.round(
    asNumber(
      current?.weather_code,
      0
    )
  );


  const risk = normalizeRisk(
    source?.risk ??
    source?.heat_risk ??
    source?.severity
  );


  if (
    !Number.isFinite(temperature) ||
    !Number.isFinite(humidity)
  ) {

    throw new Error(
      'Backend weather response could not be interpreted'
    );

  }


  return {

    temperature,

    feelsLike,

    humidity,

    windSpeed,

    windDirection,

    pressure,

    uvIndex:
      (
        current?.uv_index ??
        current?.uvIndex
      ) == null
        ? undefined
        : asNumber(
            current?.uv_index ??
            current?.uvIndex
          ),

    precipitationChance,

    rainfallMm,

    risk,

    conditionDescription:
      source?.conditionDescription ||
      source?.condition ||
      weatherCodeToCondition(
        weatherCode
      ),

    source: 'live',

    lastUpdated:
      new Date().toLocaleTimeString(),

    forecast:
      normalizeForecast(
        source,
        temperature
      ),

  };

}


export async function chatWithBackend(
  query: string,
  userId?: number | string | null
): Promise<string> {
  const raw = await apiFetch<any>(
    '/chat',
    {
      method: 'POST',
      body: JSON.stringify({
        query,
        ...(userId != null
          ? {
              user_id: Number.isFinite(Number(userId))
                ? Number(userId)
                : userId,
            }
          : {}),
      }),
    }
  );

  if (typeof raw === 'string') {
    return raw;
  }

  const answer =
    raw?.response ??
    raw?.answer ??
    raw?.message ??
    raw?.result;

  if (typeof answer === 'string' && answer.trim()) {
    return answer;
  }

  if (answer && typeof answer === 'object') {
    const nestedAnswer =
      answer?.answer ??
      answer?.response ??
      answer?.message ??
      answer?.result;

    if (typeof nestedAnswer === 'string' && nestedAnswer.trim()) {
      return nestedAnswer;
    }

    if (
      raw?.type === 'WEATHER' ||
      (answer?.temperature != null && answer?.humidity != null)
    ) {
      const location = answer?.location || 'your area';
      const temperature = answer?.temperature ?? 'Unavailable';
      const humidity = answer?.humidity ?? 'Unavailable';
      const rainfall = answer?.rainfall ?? 0;
      const windSpeed = answer?.wind_speed ?? answer?.windSpeed ?? 0;

      return [
        `Current weather in ${location}:`,
        `Temperature: ${temperature}°C`,
        `Humidity: ${humidity}%`,
        `Rainfall: ${rainfall} mm`,
        `Wind speed: ${windSpeed} km/h`,
      ].join('\n');
    }

    if (answer?.error) {
      return String(answer.error);
    }
  }

  throw new Error(
    'Backend returned no assistant response'
  );
}

export async function fetchBackendAlerts(
  userId?: number | string | null
): Promise<AlertItem[]> {

  if (userId == null) {
    return [];
  }


  const raw = await apiFetch<any>(
    `/alerts?user_id=${encodeURIComponent(
      userId
    )}`
  );


  const rows =
    Array.isArray(raw)
      ? raw
      : raw?.alerts ??
        raw?.data ??
        raw?.results ??
        [];


  if (!Array.isArray(rows)) {
    return [];
  }


  return rows.map(
    (
      item: any,
      index: number
    ) => ({

      id: String(
        item.id ??
        `BACKEND-${index}`
      ),

      type:
        String(
          item.alert_type ??
          item.type ??
          'HEATWAVE'
        )
          .toUpperCase()
          .replace(
            / /g,
            '_'
          ) as AlertItem['type'],

      severity:
        normalizeRisk(
          item.severity
        ),

      title:
        item.title ??
        `${String(
          item.alert_type ??
          item.type ??
          'CLIMATE ALERT'
        ).toUpperCase()}`,

      message:
        item.message ??
        'Climate risk detected in your monitored area.',

      time:
        item.time ??
        item.sent_at ??
        new Date().toLocaleTimeString(
          [],
          {
            hour: '2-digit',
            minute: '2-digit'
          }
        ),

      status:
        String(
          item.status ??
          'ACTIVE'
        ).toUpperCase() as AlertItem['status'],

      advisory:
        item.advisory ??
        'Follow local authority guidance and monitor ClimateGuard updates.',

    })
  );

}