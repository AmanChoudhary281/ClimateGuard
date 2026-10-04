def classify_query(query):

    query = query.lower().strip()

    personalized_keywords = [
        "my area",
        "my location",
        "my city",
        "near me",
        "where i live",
        "should i go outside",
        "is it safe for me"
    ]

    weather_keywords = [
        "weather",
        "temperature",
        "temp",
        "rain",
        "rainfall",
        "humidity",
        "wind",
        "forecast",
        "hot",
        "cold"
    ]

    for keyword in personalized_keywords:
        if keyword in query:
            return "PERSONALIZED"

    for keyword in weather_keywords:
        if keyword in query:
            return "WEATHER"

    return "KNOWLEDGE"