
import requests
import time
from threading import Lock

_weather_cache = {}
_weather_cache_lock = Lock()
CACHE_SECONDS = 300


def get_weather(latitude, longitude):
    key = (round(latitude, 3), round(longitude, 3))
    now = time.monotonic()

    with _weather_cache_lock:
        cached = _weather_cache.get(key)
        if cached and now - cached["time"] < CACHE_SECONDS:
            return cached["data"]

    url = "https://api.open-meteo.com/v1/forecast"

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": (
            "temperature_2m,relative_humidity_2m,"
            "wind_speed_10m,precipitation"
        ),
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()

        current = response.json()["current"]

        result = (
            current["temperature_2m"],
            current["relative_humidity_2m"],
            current["precipitation"],
            current["wind_speed_10m"],
        )

        with _weather_cache_lock:
            _weather_cache[key] = {
                "time": time.monotonic(),
                "data": result,
            }

        return result

    except (
        requests.RequestException,
        KeyError,
        TypeError,
        ValueError,
    ) as e:
        print("Weather API Error:", e, flush=True)
        return None


def get_forecast(latitude, longitude, days=3):
    url = "https://api.open-meteo.com/v1/forecast"

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": (
            "temperature_2m_max,temperature_2m_min,"
            "precipitation_sum,precipitation_probability_max"
        ),
        "forecast_days": days,
        "timezone": "auto",
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()

        daily = response.json()["daily"]
        forecast = []

        for i in range(len(daily["time"])):
            forecast.append({
                "date": daily["time"][i],
                "max_temperature": daily["temperature_2m_max"][i],
                "min_temperature": daily["temperature_2m_min"][i],
                "rainfall": daily["precipitation_sum"][i],
                "rain_probability": (
                    daily["precipitation_probability_max"][i]
                ),
            })

        return forecast

    except (
        requests.RequestException,
        KeyError,
        TypeError,
        ValueError,
    ) as e:
        print("Forecast API Error:", e, flush=True)
        return None
