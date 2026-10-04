import os
from dotenv import load_dotenv
from mistralai.client import Mistral
load_dotenv(r"D:\Project\ClimateGuard\Backend\.env")

api_key = os.getenv("MISTRAL_API_KEY")

client = Mistral(api_key=api_key)

response = client.chat.complete(
    model="mistral-small-2603",
    messages=[
        {
            "role": "user",
            "content": "Say hello in one sentence."
        }
    ]
)

print(response.choices[0].message.content)