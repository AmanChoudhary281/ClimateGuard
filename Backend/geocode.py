import requests

def get_coordinates(address):

    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "q": address,
        "format": "jsonv2",
        "limit": 1
    }

    response = requests.get(
        url,
        params=params,
        headers={"User-Agent": "ClimateGuard"}
    )

    response.raise_for_status()

    data = response.json()

    if not data:
        return None, None

    latitude = float(data[0]["lat"])
    longitude = float(data[0]["lon"])

    return latitude, longitude