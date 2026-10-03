from apscheduler.schedulers.blocking import BlockingScheduler
from weather import get_weather
from risk import calculate_heat_risk , calculate_rain_risk
from sms import send_sms
import psycopg2

from dotenv import load_dotenv
import os

load_dotenv()

TEST_MODE = False

conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)

def create_monitor_alert(user_id, phone, alert_type, risk):

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
        AND status IN ('PENDING', 'SENT')
        LIMIT 1
        """,
        (user_id, alert_type, risk)
    )

    existing_alert = cursor.fetchone()

    if existing_alert:
        print(
            "Alert already exists for user:",
            user_id,
            alert_type,
            risk
        )
        return

    if alert_type == "Heatwave":

        message = (
            f"{risk} heatwave risk detected in your area. "
            "Stay hydrated and avoid direct sunlight."
        )

    elif alert_type == "Heavy Rain":

        message = (
            f"{risk} heavy rain risk detected in your area. "
            "Avoid flooded areas and stay indoors if possible."
        )

    cursor.execute(
        """
        INSERT INTO alerts
        (user_id, alert_type, severity, message, status)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            user_id,
            alert_type,
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

        print(
            "Alert sent successfully:",
            user_id,
            alert_type,
            risk
        )

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

        print(
            "Alert failed:",
            user_id,
            alert_type,
            risk
        )

def monitor_users():

    print("Monitoring started")

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, phone, latitude, longitude, last_risk, last_rain_risk
        FROM users
        """
    )

    users = cursor.fetchall()

    for user in users:

        user_id = user[0]
        phone = user[1]
        latitude = user[2]
        longitude = user[3]
        last_risk = user[4]
        last_rain_risk = user[5]

        if latitude is None or longitude is None:
            print(
                "Skipping user:",
                user_id,
                "Location not available"
            )
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

        heat_risk = calculate_heat_risk(
            temperature,
            humidity
        )

        rain_risk = calculate_rain_risk(
            rainfall
        )


        if heat_risk != last_risk:

            print(
                "Heat risk changed:",
                last_risk,
                "->",
                heat_risk
            )

            create_monitor_alert(
                user_id,
                phone,
                "Heatwave",
                heat_risk
            )

            cursor.execute(
                """
                UPDATE users
                SET last_risk = %s
                WHERE id = %s
                """,
                (heat_risk, user_id)
            )

            conn.commit()

        else:

            print(
                "Heat risk unchanged:",
                heat_risk
            )

        if rain_risk != last_rain_risk:

            print(
                "Rain risk changed:",
                last_rain_risk,
                "->",
                rain_risk
            )

            create_monitor_alert(
                user_id,
                phone,
                "Heavy Rain",
                rain_risk
            )

            cursor.execute(
                """
                UPDATE users
                SET last_rain_risk = %s
                WHERE id = %s
                """,
                (rain_risk, user_id)
            )

            conn.commit()

        else:

            print(
                "Rain risk unchanged:",
                rain_risk
            )

        print(
            "Monitoring result:",
            user_id
        )

        print(
            "Temperature:", temperature,
            "Humidity:", humidity,
            "Rainfall:", rainfall,
            "Heat Risk:", heat_risk,
            "Rain Risk:", rain_risk
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