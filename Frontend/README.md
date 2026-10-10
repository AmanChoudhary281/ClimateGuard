<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/2be2a4e0-70f4-4641-9919-c4f63a90948c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Local ClimateGuard integration

The frontend is designed to run with the existing ClimateGuard FastAPI backend on `http://127.0.0.1:8000`. Vite proxies `/api/*` requests to that backend during development.

Start the backend first, then run `npm install --legacy-peer-deps` and `npm run dev`. The application uses the backend for registration and chat, and prefers backend weather data with a live Open-Meteo fallback when the backend weather response cannot be interpreted.
