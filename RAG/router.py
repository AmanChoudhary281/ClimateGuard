def classify_query(query):

    query = query.lower().strip()

    personalized_keywords = [
        "my area",
        "my location",
        "my city",
        "near me",
        "where i live",
        "my weather",
        "my current weather",
        "my current conditions",
        "should i go outside",
        "is it safe for me",
        "for me",
        "in my area"
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
        "cold",
        "climate today",
        "weather today",
        "temperature today",
        "will it rain"
    ]

    knowledge_keywords = [
        "what is",
        "what are",
        "how does",
        "how to",
        "why",
        "precautions",
        "safety",
        "symptoms",
        "causes",
        "guidelines",
        "heatwave",
        "heat wave",
        "disaster",
        "emergency",
        "protect",
        "prevention"
    ]

    for keyword in personalized_keywords:
        if keyword in query:
            return "PERSONALIZED"

    for keyword in weather_keywords:
        if keyword in query:
            return "WEATHER"

    for keyword in knowledge_keywords:
        if keyword in query:
            return "KNOWLEDGE"

    return "KNOWLEDGE"