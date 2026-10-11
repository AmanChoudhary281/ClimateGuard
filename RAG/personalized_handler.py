import sys
from pathlib import Path

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_genai.chat_models import GoogleRateLimitError

RAG_DIR = Path(__file__).resolve().parent
BACKEND_DIR = RAG_DIR.parent / "Backend"

sys.path.append(str(BACKEND_DIR))

load_dotenv()

from weather import get_weather
from risk import calculate_heat_risk, calculate_rain_risk
from retriever import search

llm = ChatGoogleGenerativeAI(
    model="gemini-3.8-flash",
    temperature=0,
    request_timeout=20,
    max_retries=0,
)


def handle_personalized_query(query, user_id, conn):
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT name, address, latitude, longitude
            FROM users
            WHERE id = %s
            """,
            (user_id,),
        )

        user = cursor.fetchone()

        if not user:
            return {
                "message": "User not found.",
                "error": "USER_NOT_FOUND",
            }

        name, address, latitude, longitude = user

        try:
            weather_data = get_weather(latitude, longitude)
        except Exception as e:
            print(
                f"Personalized weather error: {type(e).__name__}: {e}",
                flush=True,
            )
            weather_data = None

        if not weather_data:
            return {
                "message": (
                    "Current weather is temporarily unavailable "
                    "for your location. Please try again later."
                ),
                "error": "WEATHER_UNAVAILABLE",
            }

        temperature, humidity, rainfall, wind_speed = weather_data

        heat_risk = calculate_heat_risk(temperature, humidity)
        rain_risk = calculate_rain_risk(rainfall)

        try:
            results = search(query, retrieve_k=5, final_k=3)
        except Exception as e:
            print(
                f"Personalized retrieval error: {type(e).__name__}: {e}",
                flush=True,
            )
            results = []

        context_parts = []

        for document, score in results:
            context_parts.append(
                f"Source: {document.metadata.get('source', 'Unknown')}\n"
                f"Page: {document.metadata.get('page', 'Unknown')}\n"
                f"Content:\n{document.page_content}"
            )

        context = "\n\n---\n\n".join(context_parts)

        prompt = f"""
You are the ClimateGuard AI Assistant.

User: {name}
Location: {address}

Current Weather:
Temperature: {temperature}°C
Humidity: {humidity}%
Rainfall: {rainfall} mm
Wind Speed: {wind_speed} km/h

ClimateGuard Calculated Risks:
Heat Risk: {heat_risk}
Rain Risk: {rain_risk}

Safety Guidance:
{context}

User Question:
{query}

Rules:
- Do not invent facts.
- Do not provide a medical diagnosis.
- Clearly report the calculated risks.
- Give practical precautions based on the supplied safety guidance.
- Do not claim that the user is completely safe or unsafe.
- If the context is insufficient, say so clearly.
"""

        try:
            response = llm.invoke(prompt)
            content = response.content

            if isinstance(content, str):
                answer = content
            elif isinstance(content, list):
                answer = "\n".join(
                    item.get("text", "")
                    for item in content
                    if isinstance(item, dict)
                )
            else:
                answer = str(content)

            if not answer.strip():
                raise ValueError("Gemini returned an empty response")

        except GoogleRateLimitError as e:
            print(f"Personalized Gemini rate limit: {e}", flush=True)
            answer = (
                "AI service quota is temporarily unavailable. "
                "Please try again later."
            )

        except Exception as e:
            print(
                f"Personalized Gemini error: {type(e).__name__}: {e}",
                flush=True,
            )

            answer = (
                "The AI service is temporarily unavailable. "
                "Current calculated risks: "
                f"Heat Risk: {heat_risk}; Rain Risk: {rain_risk}."
            )

        return {
            "answer": answer,
            "location": address,
            "temperature": temperature,
            "humidity": humidity,
            "rainfall": rainfall,
            "wind_speed": wind_speed,
            "heat_risk": heat_risk,
            "rain_risk": rain_risk,
            "sources": [
                {
                    "source": document.metadata.get("source", "Unknown"),
                    "page": document.metadata.get("page", "Unknown"),
                    "score": float(score),
                }
                for document, score in results
            ],
        }

    finally:
        cursor.close()