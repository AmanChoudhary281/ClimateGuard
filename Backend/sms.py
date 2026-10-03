import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("TEXTBEE_API_KEY")

def send_sms(phone, message):

    url = "https://api.textbee.dev/api/v1/gateway/send-sms"

    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json"
    }

    data = {
        "recipients": [phone],
        "message": message
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json=data
        )

        print("SMS Status:", response.status_code)
        print("SMS Response:", response.json())

        if response.status_code == 200:
            return True

        return False

    except Exception as e:
        print("SMS Error:", e)
        return False