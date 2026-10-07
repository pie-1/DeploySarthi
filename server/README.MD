# DeploySarthi — Server

Node.js and Express backend for DeploySarthi.

## Tech Stack

- Node.js 20+
- Express
- MongoDB
- Mongoose
- WebSocket
- JWT
- Axios

## Requirements

- Node.js 20+
- MongoDB
- GitHub OAuth
- Vercel account
- Telegram Bot

## Environment

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb+srv://...

JWT_SECRET=your-secret
ENCRYPTION_KEY=your-key

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

VERCEL_TOKEN=...

TELEGRAM_BOT_TOKEN=...

AI_SERVICE_URL=http://127.0.0.1:8001
```


## Main Features

- User authentication
- Project management
- Incident detection
- AI service integration
- GitHub integration
- Vercel integration
- Telegram alerts
- Readiness checking
- WebSocket updates

## Structure

```text
src/
├── config/
├── middleware/
├── models/
├── routes/
├── services/
└── utils/
```

## API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/projects` | Projects |
| GET | `/api/incidents` | Incidents |
| POST | `/api/ai/investigate` | AI investigation |
| GET | `/api/github/repos` | GitHub repositories |
| GET | `/api/vercel/projects` | Vercel projects |
| GET | `/api/dashboard/summary` | Dashboard data |

##  Getting Started

### Install

```bash
npm install

### .env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/deploysarthi
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5173
AI_SERVICE_URL=http://127.0.0.1:8001

# GitHub
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_OAUTH_REDIRECT_URI=http://localhost:5000/api/github/oauth/callback
GITHUB_PERSONAL_ACCESS_TOKEN=

# Vercel
VERCEL_TOKEN=

# Monitoring
MONITORING_INTERVAL_MS=30000
ANOMALY_EVERY_TICKS=20
USE_SIMULATED_METRICS=true

## run 

npm run dev


ngrok http 5000

URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok-free[^"]*')
echo "Ngrok URL: $URL"

curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" -d "url=${URL}/api/telegram/webhook"
echo ""
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
echo ""