from apscheduler.schedulers.blocking import BlockingScheduler
from weather import get_weather
from risk import calculate_heat_risk
from sms import send_sms
import psycopg2

from dotenv import load_dotenv
import os

load_dotenv()

conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)

def create_monitor_alert(user_id, phone, risk):

    if risk not in ["HIGH", "SEVERE"]:
        return

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id
        FROM alerts
        WHERE user_id = %s
        AND alert_type = %s
        AND severity = %s
        AND status IN ('PENDING' , 'SENT')
        LIMIT 1
        """,
        (user_id, "Heatwave", risk)
    )

    existing_alert = cursor.fetchone()

    if existing_alert:
        print("Alert already exists for user:", user_id)
        return

    message = f"{risk} heatwave risk detected in your area. Stay hydrated and avoid direct sunlight."

    cursor.execute(
        """
        INSERT INTO alerts
        (user_id, alert_type, severity, message, status)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            user_id,
            "Heatwave",
            risk,
            message,
            "PENDING"
        )
    )

    alert_id = cursor.fetchone()[0]

    conn.commit()

    sms_sent = send_sms(phone, message)

    if sms_sent:

        cursor.execute(
            """
            UPDATE alerts
            SET status = 'SENT'
            WHERE id = %s
            """,
            (alert_id,)
        )

        conn.commit()

        print("Alert sent successfully for user:", user_id)

    else:

        cursor.execute(
            """
            UPDATE alerts
            SET status = 'FAILED'
            WHERE id = %s
            """,
            (alert_id,)
        )

        conn.commit()

        print("Alert failed for user:", user_id)

def monitor_users():

    print("Monitoring started")

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id,phone, latitude, longitude
        FROM users
        """
    )

    users = cursor.fetchall()

    for user in users:

        user_id = user[0]
        phone = user[1]
        latitude = user[2]
        longitude = user[3]

        if latitude is None or longitude is None:
            print("Skipping user:", user_id, "Location not available")
            continue

        print(
            "Checking user:",
            user_id,
            latitude,
            longitude
        )

        temperature, humidity, rainfall, wind_speed = get_weather(
            latitude,
            longitude
        )

        risk = calculate_heat_risk(
            temperature,
            humidity
        )
        
        create_monitor_alert(user_id, phone , risk)

        print(
            "Temperature:", temperature,
            "Humidity:", humidity,
            "Risk:", risk
        )


scheduler = BlockingScheduler()

scheduler.add_job(
    monitor_users,
    "interval",
    minutes=10
)

print("Automatic monitoring started")

monitor_users()

scheduler.start()