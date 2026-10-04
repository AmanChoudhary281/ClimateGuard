import requests


def get_weather(latitude, longitude):

    url = "https://api.open-meteo.com/v1/forecast"

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation"
    }

    try:
        response = requests.get(
            url,
            params=params,
            timeout=10
        )

        response.raise_for_status()

        data = response.json()
        current = data["current"]

        temperature = current["temperature_2m"]
        humidity = current["relative_humidity_2m"]
        wind_speed = current["wind_speed_10m"]
        rainfall = current["precipitation"]

        return temperature, humidity, rainfall, wind_speed

    except (requests.RequestException, KeyError, TypeError, ValueError) as e:
        print("Weather API Error:", e)
        return None

def get_forecast(latitude, longitude, days=3):

    url = "https://api.open-meteo.com/v1/forecast"

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
        "forecast_days": days,
        "timezone": "auto"
    }

    try:
        response = requests.get(
            url,
            params=params,
            timeout=10
        )

        response.raise_for_status()

        data = response.json()
        daily = data["daily"]

        forecast = []

        for i in range(len(daily["time"])):

            forecast.append({
                "date": daily["time"][i],
                "max_temperature": daily["temperature_2m_max"][i],
                "min_temperature": daily["temperature_2m_min"][i],
                "rainfall": daily["precipitation_sum"][i],
                "rain_probability": daily["precipitation_probability_max"][i]
            })

        return forecast

    except (requests.RequestException, KeyError, TypeError, ValueError) as e:
        print("Forecast API Error:", e)
        return None