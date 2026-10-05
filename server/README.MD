
---

## 3️⃣ Server `server/README.md`

```markdown
# DeploySarthi Server

Node.js + Express backend for DeploySarthi.

---

## 🎯 Overview

The server handles:
- Authentication (JWT)
- Project & incident CRUD
- GitHub API proxy (OAuth + repos + commits)
- Vercel API proxy (projects + deployments + auto-deploy)
- Python AI service proxy
- WebSocket for real-time updates
- Background monitoring loop

---


---

## 🚀 Getting Started

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