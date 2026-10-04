import re
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "Backend"
sys.path.append(str(BACKEND_DIR))

from weather import get_weather
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

    latitude, longitude = get_coordinates(location)

    if latitude is None or longitude is None:
        return {
            "message": "Could not find the specified location."
        }

    temperature, humidity, rainfall, wind_speed = get_weather(
        latitude,
        longitude
    )

    return {
        "location": location,
        "temperature": temperature,
        "humidity": humidity,
        "rainfall": rainfall,
        "wind_speed": wind_speed
    }