from pydantic import BaseModel
from fastapi import FastAPI
import psycopg2
from risk import calculate_heat_risk
from geocode import get_coordinates
from weather import get_weather

import sys
from pathlib import Path

RAG_DIR = Path(__file__).resolve().parent.parent / "RAG"
sys.path.append(str(RAG_DIR))

from rag_answer import generate_answer
from router import classify_query
from weather_handler import handle_weather_query
from personalized_handler import handle_personalized_query

from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()


def create_alert(user_id, risk):

    if risk == "LOW":
        return

    if risk == "MODERATE":
        return

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id
        FROM alerts
        WHERE user_id = %s
        AND alert_type = %s
        AND severity = %s
        AND status = 'PENDING'
        LIMIT 1
        """,
        (user_id, "Heatwave", risk)
    )

    existing_alert = cursor.fetchone()

    if existing_alert:
        return

    message = f"{risk} heatwave risk detected in your area. Stay hydrated and avoid direct sunlight."

    cursor.execute(
        """
        INSERT INTO alerts
        (user_id, alert_type, severity, message)
        VALUES (%s, %s, %s, %s)
        """,
        (
            user_id,
            "Heatwave",
            risk,
            message
        )
    )

    conn.commit()

conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)

print("Database connected successfully!")

@app.get("/")
def home():
    return {"message": "Hello from ClimateGuard API 🚀"}

class User(BaseModel):
    name: str
    phone: str
    address: str


@app.post("/users")
def create_user(user: User):

    latitude, longitude = get_coordinates(user.address)

    if latitude is None or longitude is None:
        return {
            "message": "Invalid address. Please enter a valid address."
    }


    conn.rollback()

    cursor = conn.cursor()

    cursor.execute(
    "INSERT INTO users (name, phone, address, latitude, longitude) VALUES (%s, %s, %s, %s, %s)",
    (user.name, user.phone, user.address, latitude, longitude)
)

    conn.commit()

    return {
        "message": "User saved successfully",
        "name": user.name,
        "phone": user.phone,
        "address": user.address
    }


@app.post("/weather")
def save_weather(latitude: float, longitude: float):

    temperature, humidity, rainfall, wind_speed = get_weather(
        latitude,
        longitude
    )

    risk = calculate_heat_risk(temperature, humidity)

    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id
        FROM users
        WHERE latitude = %s
        AND longitude = %s
        LIMIT 1
        """,
        (latitude, longitude)
    )

    user = cursor.fetchone()
    if user:
        create_alert(user[0], risk)

    cursor.execute(
        """
        INSERT INTO weather_data
        (latitude, longitude, temperature, humidity, rainfall, wind_speed)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            latitude,
            longitude,
            temperature,
            humidity,
            rainfall,
            wind_speed
        )
    )

    cursor.execute(
    """
    SELECT id
    FROM disaster_events
    WHERE event_type = %s
    AND severity = %s
    AND latitude = %s
    AND longitude = %s
    LIMIT 1
    """,
    (
        "Heatwave",
        risk,
        latitude,
        longitude
    )
)

    existing_event = cursor.fetchone()

    if not existing_event:
        cursor.execute(
            """
            INSERT INTO disaster_events
            (event_type, severity, latitude, longitude)
            VALUES (%s, %s, %s, %s)
            """,
            (
                "Heatwave",
                risk,
                latitude,
                longitude
            )
        )

    conn.commit()

    return {
        "message": "Weather fetched successfully",
        "latitude": latitude,
        "longitude": longitude,
        "temperature": temperature,
        "humidity": humidity,
        "rainfall": rainfall,
        "wind_speed": wind_speed,
        "risk": risk
    }

@app.get("/alerts/{user_id}")
def get_alerts(user_id: int):

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, alert_type, severity, message, sent_at, status
        FROM alerts
        WHERE user_id = %s
        ORDER BY sent_at DESC
        """,
        (user_id,)
    )

    alerts = cursor.fetchall()

    return {
        "user_id": user_id,
        "alerts": [
            {
                "id": alert[0],
                "alert_type": alert[1],
                "severity": alert[2],
                "message": alert[3],
                "sent_at": alert[4],
                "status": alert[5]
            }
            for alert in alerts
        ]
    }

@app.put("/alerts/{alert_id}/status")
def update_alert_status(alert_id: int, status: str):

    if status not in ["PENDING", "SENT", "FAILED"]:
        return {
            "message": "Invalid status. Use PENDING, SENT or FAILED."
        }

    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE alerts
        SET status = %s
        WHERE id = %s
        """,
        (status, alert_id)
    )

    conn.commit()

    return {
        "message": "Alert status updated successfully",
        "alert_id": alert_id,
        "status": status
    }

class ChatRequest(BaseModel):
    query: str
    user_id: int | None = None

@app.post("/chat")
def chat(request: ChatRequest):

    query_type = classify_query(request.query)

    if query_type == "WEATHER":

        result = handle_weather_query(request.query)

        return {
            "query": request.query,
            "type": "WEATHER",
            "answer": result
        }

elif query_type == "KNOWLEDGE":

    answer, results = generate_answer(request.query)

    if isinstance(answer, dict) and answer.get("error") == "AI_QUOTA_EXCEEDED":

        return {
            "query": request.query,
            "type": "KNOWLEDGE",
            "answer": answer
        }

    sources = []

    for document, score in results:
        sources.append({
            "source": document.metadata["source"],
            "page": document.metadata["page"],
            "score": float(score)
        })

    return {
        "query": request.query,
        "type": "KNOWLEDGE",
        "answer": answer,
        "sources": sources
    }

    elif query_type == "PERSONALIZED":

        if request.user_id is None:

            return {
                "query": request.query,
                "type": "PERSONALIZED",
                "message": "user_id is required for personalized queries."
            }

            result = handle_personalized_query(
                request.query,
                request.user_id,
                conn
            )

            return {
                "query": request.query,
                "type": "PERSONALIZED",
                "answer": result
            }

    return {
        "query": request.query,
        "type": query_type,
        "message": "Unable to process the query."
    }