# AI Receptionist Bridge

This service connects Twilio phone calls to ElevenLabs realtime voice using WebSockets.
Deployed on Railway.

## Setup
1. Copy `.env.example` → `.env` and fill values.
2. `npm install`
3. `npm start`

## Deploy to Railway
- Push this repo to GitHub.
- Create a new Railway project → Deploy from GitHub.
- Add environment variables in Railway dashboard:
  - PUBLIC_URL
  - ELEVEN_API_KEY
  - ELEVEN_REALTIME_URL
