import re
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "Backend"
sys.path.append(str(BACKEND_DIR))

from weather import get_weather, get_forecast
from geocode import get_coordinates


def handle_weather_query(query):

    query = query.lower().strip()

    location = None

    for word in ["in ", "at ", "near "]:

        if word in query:
            location = query.split(word, 1)[1].strip()
            location = re.sub(r"[?.!,]+$", "", location).strip()
            break

    if not location:
        return {
            "message": "Please specify a location."
        }

    location = re.sub(
        r"\b(today|tomorrow|tonight|forecast|next 3 days|next three days)\b",
        "",
        location
    ).strip()

    location = re.sub(
        r"^(in|at|near)\s+",
        "",
        location
    ).strip()

    latitude, longitude = get_coordinates(location)

    if latitude is None or longitude is None:
        return {
            "message": "Could not find the specified location."
        }

    forecast_words = [
        "forecast",
        "tomorrow",
        "next 3 days",
        "next three days",
        "will it rain",
        "will it be"
    ]

    is_forecast = any(
        word in query
        for word in forecast_words
    )

    if is_forecast:

        forecast = get_forecast(
            latitude,
            longitude,
            days=3
        )

        if forecast is None:
            return {
                "message": "Forecast service is currently unavailable. Please try again later."
            }

        return {
            "location": location,
            "forecast": forecast
        }

    weather = get_weather(
        latitude,
        longitude
    )

    if weather is None:
        return {
            "message": "Weather service is currently unavailable. Please try again later."
        }

    temperature, humidity, rainfall, wind_speed = weather

    return {
        "location": location,
        "temperature": temperature,
        "humidity": humidity,
        "rainfall": rainfall,
        "wind_speed": wind_speed
    }