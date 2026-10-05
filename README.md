# DeploySarthi

**AI-Assisted Deployment, Monitoring & Incident Investigation Platform for Full-Stack Developers**

> DeploySarthi connects your GitHub repo, deploys it to Vercel, monitors it 24/7, detects anomalies, and explains what went wrong — in plain English using AI.

---

## 🎯 What It Does

| Capability | Description |
|-----------|-------------|
| **Deploy** | Auto-deploy GitHub repos to Vercel with one click |
| **Monitor** | Real-time metrics, cost tracking, uptime |
| **Detect** | Isolation Forest + rules detect anomalies |
| **Investigate** | AI-powered root cause analysis with Groq |
| **Guide** | Contextual prompt suggestions for investigation |
| **Showcase** | Public gallery of community projects |

---

## 📁 Project Structure
deploySarthi/
├── client/ # React frontend
├── server/ # Node.js backend
├── python/ # Python AI service
├── README.md # This file

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- Python 3.10+
- MongoDB (local or Atlas)
- Docker (optional)

### 1. Clone

```bash
git clone https://github.com/pie-1/DeploySarthi
cd deploySarthi
2. Start all services
Terminal 1 — MongoDB

bash
mongod --dbpath ~/data/db
Terminal 2 — Python AI Service

bash
cd python
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add GROQ_API_KEY to .env
uvicorn src.main:app --reload --port 8001
Terminal 3 — Node Backend

bash
cd server
npm install
cp .env.example .env
# Add keys to .env
npm run dev
Terminal 4 — React Client

bash
cd client
npm install
npm run dev
3. Open
Visit http://localhost:5173

🔑 Required Environment Variables
Service	Variables
Server	MONGODB_URI, JWT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_PERSONAL_ACCESS_TOKEN, VERCEL_TOKEN, AI_SERVICE_URL
Python	GROQ_API_KEY, GROQ_MODEL
Client	VITE_API_URL, VITE_WS_URL
See individual .env.example files in each folder.

📊 Tech Stack
Layer	Technology
Frontend	React 19, Vite, Tailwind CSS, Framer Motion, Recharts
Backend	Node.js, Express, MongoDB, Mongoose, WebSocket
AI Service	Python, FastAPI, Scikit-learn, Groq LLM
Auth	JWT + GitHub OAuth
Integrations	GitHub API, Vercel API
Monitoring	Isolation Forest (anomaly detection)
🎯 Core Features
🔐 Authentication
Email/password signup & login

GitHub OAuth

JWT session management

📦 Projects
Create projects with GitHub repo + Vercel link

Auto-deploy to Vercel

Rich project cards with integration badges

Public gallery for sharing

🚀 Deploy
View all Vercel deployments

Real-time status (Ready / Building / Error)

Redeploy button

Build log viewing

🚨 Incidents
Automatic detection every 30s

Cross-service timeline correlation

AI-powered root cause analysis

Acknowledge + resolve workflow

🤖 AI Investigation
Contextual prompt suggestions

Structured AI responses (Summary / Evidence / Confidence)

Follow-up question generation

Multi-turn guided investigation

🌐 Public Gallery
Browse community projects

Like, comment, view counts

Live preview via iframe

Author profiles

📈 Evaluation
The AI detection pipeline was evaluated on synthetic data:

Detection Rate: 6/6 fault scenarios (100%)

False Positive Rate: 2.98% (target: <5%)

Mean MTTD: 30s

Max MTTD: 240s (memory leak)

🧪 Testing
bash
# Backend
cd server && npm run test

# Frontend
cd client && npm run test

# Python
cd python && python -m pytest
📚 Documentation
Client README

Server README

Python README

🤝 Contributing
Fork the repo

Create a feature branch (git checkout -b feature/amazing)

Commit changes (git commit -m 'Add amazing feature')

Push to branch (git push origin feature/amazing)

Open a Pull Request