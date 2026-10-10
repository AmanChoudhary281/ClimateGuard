from langchain_google_genai.chat_models import GoogleRateLimitError

import sys
from pathlib import Path

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

RAG_DIR = Path(__file__).resolve().parent
BACKEND_DIR = RAG_DIR.parent / "Backend"

sys.path.append(str(BACKEND_DIR))

from weather import get_weather
from risk import calculate_heat_risk, calculate_rain_risk
from retriever import search

load_dotenv(r"D:\Project\ClimateGuard\Backend\.env")


llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash",
    temperature=0,
    request_timeout=20,
    max_retries=0
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
            (user_id,)
        )

        user = cursor.fetchone()

        if not user:
            cursor.close()

            return {
                "message": "User not found.",
                "error": "USER_NOT_FOUND"
            }

        name, address, latitude, longitude = user

        temperature, humidity, rainfall, wind_speed = get_weather(
            latitude,
            longitude
        )

        heat_risk = calculate_heat_risk(
            temperature,
            humidity
        )

        rain_risk = calculate_rain_risk(
            rainfall
        )

        results = search(
            query,
            retrieve_k=5,
            final_k=3
        )

        context_parts = []

        for document, score in results:

            context_parts.append(
                f"Source: {document.metadata['source']}\n"
                f"Page: {document.metadata['page']}\n"
                f"Content:\n{document.page_content}"
            )

        context = "\n\n---\n\n".join(context_parts)

        prompt = f"""
You are the ClimateGuard AI Assistant.

Answer the user's question using the live weather information
and the provided safety guidance.

User:
{name}

Location:
{address}

Current Weather:
Temperature: {temperature}°C
Humidity: {humidity}%
Rainfall: {rainfall} mm
Wind Speed: {wind_speed} km/h

Calculated Risk:
Heat Risk: {heat_risk}
Rain Risk: {rain_risk}

Safety Guidance:

{context}

User Question:

{query}

Rules:
- Do not make absolute claims that the user is completely safe or unsafe.
- Do not provide medical diagnosis or medical advice.
- Report the ClimateGuard calculated risks clearly.
- Use phrases such as "ClimateGuard currently assesses..." when describing risk.
- Give practical precautions based only on the provided safety guidance.
- If the risk is LOW, explain that no significant heat or rainfall risk is detected by ClimateGuard at the moment.
- If the risk is MODERATE, HIGH, or SEVERE, clearly explain the detected risk and relevant precautions.
- Do not invent facts.
- Do not assume information that is not provided.
"""

        try:

            response = llm.invoke(prompt)

        except GoogleRateLimitError:

            return {
                "message": "AI service quota is temporarily unavailable. Please try again later.",
                "error": "AI_QUOTA_EXCEEDED"
            }

        except Exception as e:

            return {
                "message": "AI service is temporarily unavailable.",
                "error": str(e)
            }

        if isinstance(response.content, list):

            answer = "".join(
                item.get("text", "")
                for item in response.content
                if isinstance(item, dict)
            )

        else:

            answer = response.content

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
                    "source": document.metadata["source"],
                    "page": document.metadata["page"],
                    "score": float(score)
                }
                for document, score in results
            ]
        }

    finally:

        cursor.close()