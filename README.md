# DeploySarthi

> **AI-assisted deployment, monitoring, and incident investigation for developers and small startups.**

DeploySarthi is a unified developer platform that takes your code from GitHub to production and keeps it running. It combines deployment readiness analysis, automated Vercel deployment, 24/7 monitoring, cross-service incident correlation, and AI-powered incident investigation — all in one place, all on free-tier services.

![DeploySarthi](docs/assets/banner.png)

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Evaluation](#evaluation)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Team](#team)
- [License](#license)

---

## The Problem

Modern developers often use **5–6 separate dashboards** to ship and operate a single application:

- **GitHub** — code, commits, pull requests
- **Vercel** — frontend deployments
- **AWS Console** — backend infrastructure
- **MongoDB Atlas** — database
- **CloudWatch / Datadog** — monitoring and metrics
- **Cost Explorer** — infrastructure billing

When something breaks, developers have to manually move between these tools and correlate deployments, commits, metrics, logs, and infrastructure changes.

For small teams without a dedicated DevOps engineer, this becomes especially painful. Incident investigation can consume a large portion of the developer's time because the information needed to identify the cause is spread across multiple services.

Enterprise AIOps platforms can solve much of this problem, but their pricing and complexity are often inappropriate for a two-person startup, student project, freelancer, or small development team.

---

## The Solution

DeploySarthi is a **free-tier-friendly developer operations platform** for teams that deploy applications but do not have a dedicated DevOps team.

### What it does

1. **Readiness Check** — analyzes your GitHub repository before deployment for framework, environment variables, build configuration, security risks, and potential cost risks.
2. **Guided Deployment** — deploys projects to Vercel with automatic framework and monorepo root-directory detection.
3. **24/7 Monitoring** — continuously collects latency, errors, CPU, memory, database connections, and estimated cost/hour.
4. **Anomaly Detection** — combines fast rule-based thresholds with Isolation Forest machine learning.
5. **Cross-Service Correlation** — creates a unified incident timeline across GitHub, Vercel, and monitoring metrics.
6. **AI Investigation** — uses Groq-powered LLM analysis to explain incidents in plain English using available evidence.
7. **Guided Investigation** — suggests what the developer should investigate next instead of only reporting that something is broken.
8. **Multi-Channel Alerts** — sends critical incident notifications through Telegram, with email support planned.
9. **Public Gallery** — lets developers publish projects and browse, like, comment on, and preview community projects.

### Key differentiator

> **DeploySarthi tells you what to investigate next — not just what's broken.**

---

## Architecture

DeploySarthi uses a three-service architecture:

```text
┌─────────────────────────────────────────────────────────────┐
│                     React + Vite Frontend                   │
│  Dashboard · Projects · Deploy · Incidents · AI Chat · Docs│
└──────────────────────────┬──────────────────────────────────┘
                           │ REST + WebSocket
┌──────────────────────────┴──────────────────────────────────┐
│                    Node.js + Express Backend                 │
│  Auth · Projects · Incidents · AI Proxy · GitHub · Vercel  │
│  Telegram · Readiness · Dashboard · Public Gallery         │
│                                                              │
│  Background: Monitoring loop (30s) · Anomaly detection     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
┌──────────────────────────┴──────────────────────────────────┐
│                    Python FastAPI AI Service                 │
│  Isolation Forest · Rule Engine · Groq LLM · Correlator    │
│  Circuit Breaker · Rate Limiting · Daily Token Budget      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                    ┌──────┴──────┐
                    │   Groq LLM   │
                    └─────────────┘
```

### Infrastructure

- **Persistence:** MongoDB Atlas for users, projects, incidents, comments, and related application data.
- **Real-time communication:** WebSocket for live metrics and incident updates.
- **External APIs:** GitHub, Vercel, Telegram, and Groq.
- **AI service:** Python FastAPI service responsible for anomaly detection, correlation, and LLM investigation.
- **Application backend:** Node.js + Express handles authentication, integrations, project management, monitoring orchestration, and AI proxying.

---

## Features

### 🔍 Deployment Readiness

Before deployment, DeploySarthi scans the repository for common deployment and configuration issues:

- Framework detection for Next.js, Vite, React, Vue, and related projects
- Missing `.env.example`
- Build script presence
- Node.js version declared through `engines`
- Basic hardcoded-secret heuristics
- Potential cost risks such as AWS SDK usage and cron jobs
- Monorepo layout detection
- Framework-specific deployment configuration

The readiness checker returns a **score from 0–100** together with individual findings and remediation advice.

---

### 🚀 Guided Deployment

DeploySarthi simplifies the path from GitHub repository to production:

- Select a GitHub repository
- Detect the project's framework
- Configure project name and deployment settings
- Deploy to Vercel through the Deploy Button or API
- Automatically detect common monorepo directories such as `client/` or `frontend/`
- View deployment status
- Redeploy existing projects
- Support auto-deployment for configured Vercel projects

---

### 📊 Real-Time Monitoring

The monitoring pipeline tracks six core metrics every **30 seconds**:

| Metric | Description |
|---|---|
| **Latency** | Request response time in milliseconds |
| **Error Rate** | Percentage of failed requests |
| **CPU** | CPU utilization |
| **Memory** | Memory utilization |
| **DB Connections** | Active database connections |
| **Cost / Hour** | Estimated infrastructure cost per hour |

Metrics are streamed to the dashboard through WebSocket connections so developers can observe changes without manually refreshing the page.

---

### 🔬 Two-Layer Anomaly Detection

DeploySarthi combines two complementary detection mechanisms.

#### Layer 1 — Rule Engine

Fast, explainable threshold-based detection identifies obvious failures and abnormal values.

#### Layer 2 — Isolation Forest

An unsupervised machine-learning model analyzes multiple monitoring features together and detects multivariate anomalies that may not trigger a single threshold.

The combined decision is:

```text
Rule violation OR Isolation Forest anomaly
                    ↓
               Incident
```

This gives the platform both **explainability** and **ML-based anomaly detection**.

---

### 🤖 AI Investigation

Every critical incident can be analyzed by the Groq LLM using structured context such as:

- Project information
- Current symptoms
- Metric baselines
- Incident timeline
- Recent Vercel deployments
- Recent GitHub commits
- Previous investigation conversation

The AI returns structured investigation data such as:

```json
{
  "summary": "The error spike correlates with deploy dpl_abc...",
  "evidence": [
    "Deploy at 02:58",
    "Error rate +4821% at 03:00"
  ],
  "likelyCause": "Recent deployment introduced a regression",
  "confidence": "medium",
  "confidenceReason": "Strong temporal correlation",
  "recommendedNext": "Check commit a1b2c3d",
  "suggestedQuestions": [
    "What changed in the latest deployment?",
    "Did the error rate increase immediately after deployment?",
    "Which metrics changed at the same time?"
  ]
}
```

The objective is not to make the AI appear certain. Instead, DeploySarthi exposes **evidence, likely cause, confidence, and the next investigation step**.

---

### 💬 Guided Investigation

Instead of giving developers a single AI-generated answer, DeploySarthi generates **3–5 specific follow-up questions** for each incident.

Examples:

- "Did a recent deployment cause this?"
- "Which metrics spiked together?"
- "What changed in commit a1b2c3d?"
- "Was the database connection count abnormal before the errors?"
- "Did the incident begin immediately after a deployment?"

Users can click suggested questions or ask their own questions. Conversation history is preserved so the investigation can continue across multiple turns.

---

### 🔔 Multi-Channel Alerts

DeploySarthi supports incident notifications through:

- **Telegram** — instant and free
- **Email** — planned fallback channel
- User preference for **all incidents** or **critical incidents only**

The target alert path is designed to notify users within approximately **30 seconds** of critical incident creation.

---

### 🌐 Public Gallery

Developers can optionally publish projects to a public gallery.

Gallery capabilities include:

- Publish a project
- Add a custom public description
- Add project tags
- Browse community projects
- Filter projects by category
- Like projects
- Comment on projects
- View project statistics
- Preview projects through an iframe
- View author/project information

Example categories include:

- AI
- Web Apps
- APIs
- Developer Tools
- Mobile
- Other

---

### 🔒 Security & Resilience

DeploySarthi includes several safeguards around integrations and AI usage.

#### Encrypted tokens

GitHub and Vercel tokens are encrypted at rest using **AES-256-CBC**.

#### Circuit breaker

If the Groq service repeatedly fails, the AI circuit breaker can open for approximately five minutes and allow the application to fall back to rule-based incident information.

#### Rate limiting

Groq requests are rate-limited to **25 requests per minute**.

#### Daily token budget

The AI service maintains a **180K daily soft token budget** to stay below the configured Groq hard limit.

#### WebSocket authentication

WebSocket connections require JWT authentication.

#### Atomic database writes

MongoDB operations use atomic operators such as `$set` and `$push` where appropriate to reduce race conditions during concurrent updates.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion, Recharts, Sonner |
| **Backend** | Node.js 20, Express, MongoDB + Mongoose, WebSocket (`ws`), Axios |
| **AI Service** | Python 3.12, FastAPI, scikit-learn, Groq SDK, joblib |
| **Deployment** | Vercel, Deploy Button + API |
| **AI/ML** | Isolation Forest, Groq LLM (`gpt-oss-20b`) |
| **Authentication** | JWT, bcrypt, GitHub OAuth 2.0 |
| **Alerts** | Telegram Bot API |
| **Code/VCS** | GitHub API v3 |
| **Database** | MongoDB Atlas |

The architecture is designed around **free-tier services** wherever practical.

---

## Quick Start

### Prerequisites

Install or create the following before starting:

- Node.js 20+
- Python 3.12+
- MongoDB Atlas account or local MongoDB
- GitHub OAuth application
- Groq API key
- Telegram bot (optional, for alerts)
- Vercel account and token (optional for multi-user deployment features)

For the Groq API key, create an account at [Groq Console](https://console.groq.com/).

---

### 1. Clone the Repository

```bash
git clone https://github.com/pie-1/DeploySarthi.git
cd DeploySarthi
```

---

### 2. Set Up the Python AI Service

```bash
cd python

python -m venv venv
```

#### Linux / macOS

```bash
source venv/bin/activate
```

#### Windows

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create the environment file:

```bash
cp .env.example .env
```

Add your Groq credentials:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b
```

Generate training/evaluation data and train the anomaly-detection model:

```bash
python -m src.evaluate
```

Start the AI service:

```bash
python -m uvicorn src.main:app --reload --port 8001
```

The Python service will be available at:

```text
http://localhost:8001
```

---

### 3. Set Up the Node.js Backend

Open another terminal:

```bash
cd server
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Configure the required values in `server/.env`, including MongoDB, JWT, GitHub, Vercel, and AI-service settings.

Start the development server:

```bash
npm run dev
```

---

### 4. Set Up the React Frontend

Open another terminal:

```bash
cd client
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Set the API and WebSocket URLs:

```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

### 5. Generate the Encryption Key

DeploySarthi encrypts third-party integration tokens before storing them.

Generate a 32-byte encryption key with Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated value into the corresponding encryption-key environment variable in the server configuration.

> **Important:** Never commit production secrets, API keys, OAuth secrets, encryption keys, or private tokens to Git.

---

## Environment Variables

The exact variables are documented in the `.env.example` file inside each service.

### Server

Typical backend configuration includes:

```env
MONGODB_URI=
JWT_SECRET=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_PERSONAL_ACCESS_TOKEN=

VERCEL_TOKEN=

AI_SERVICE_URL=

ENCRYPTION_KEY=

TELEGRAM_BOT_TOKEN=
```

### Python AI Service

```env
GROQ_API_KEY=
GROQ_MODEL=
```

### Client

```env
VITE_API_URL=
VITE_WS_URL=
```

Do not copy production credentials into the repository. Use local `.env` files for development and secure environment-variable storage for deployment.

---

## Project Structure

```text
deploySarthi/
├── client/                         # React + Vite frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/                         # Node.js + Express backend
│   ├── src/
│   ├── package.json
│   └── .env.example
│
├── python/                         # Python AI/ML service
│   ├── src/
│   ├── requirements.txt
│   └── .env.example
│
├── docs/
│   └── assets/
│       └── banner.png
│
└── README.md
```

---

## Evaluation

The anomaly-detection pipeline was evaluated against a **7-day synthetic monitoring dataset** containing six fault scenarios.

| Evaluation Metric | Result |
| :--- | :--- |
| **Detection Rate** | **70% (6/6 fault types)** |
| **False Positive Rate** | **2.98%** |
| **Target False Positive Rate** | **< 5%** |
| **Median MTTD** | **30 seconds** |
| **Maximum MTTD** | **2.2 hours** |
| **Fault Scenarios Detected** | **6/6** |

### Interpretation

The evaluation demonstrates that the combined rule-based and Isolation Forest pipeline can detect the tested synthetic fault scenarios while keeping the false-positive rate below the target threshold.

The evaluation is based on synthetic data and should not be interpreted as production-level reliability benchmarking.

---

## Testing

### Backend

```bash
cd server
npm run test
```

### Frontend

```bash
cd client
npm run test
```

### Python AI Service

```bash
cd python
python -m pytest
```

---

## Documentation

More detailed documentation is maintained inside the individual services:

- [Client Documentation](client/README.md)
- [Server Documentation](server/README.md)
- [Python AI Service Documentation](python/README.md)

Additional project documentation and assets are available in the `docs/` directory.

---

## Roadmap

### Phase 1 — Core Platform

- [x] GitHub repository integration
- [x] Vercel deployment integration
- [x] Project dashboard
- [x] Real-time monitoring
- [x] Rule-based anomaly detection
- [x] Isolation Forest anomaly detection
- [x] Incident creation
- [x] Cross-service incident correlation
- [x] AI-powered incident investigation
- [x] Guided investigation prompts
- [x] Telegram alerts
- [x] Public project gallery

### Phase 2 — Developer Experience

- [ ] Email incident alerts
- [ ] More framework-specific readiness checks
- [ ] Better deployment log analysis
- [ ] More cloud-provider integrations
- [ ] Improved incident timeline visualization
- [ ] Custom monitoring thresholds
- [ ] Saved investigation reports

### Phase 3 — Advanced Operations

- [ ] GitHub Actions integration
- [ ] Pull-request deployment checks
- [ ] Automatic regression detection
- [ ] More advanced root-cause correlation
- [ ] Infrastructure cost forecasting
- [ ] Additional notification channels
- [ ] Team workspaces and collaboration

---

## Team

DeploySarthi is built as a developer-focused platform combining full-stack engineering, cloud deployment, monitoring, machine learning, and AI-assisted incident investigation.

The project is designed around a simple goal:

> **Make production operations easier for developers who do not have a dedicated DevOps team.**

---

## Contributing

Contributions are welcome.

### Development workflow

1. Fork the repository.
2. Clone your fork.
3. Create a feature branch.

```bash
git checkout -b feature/amazing-feature
```

4. Make your changes.
5. Run the relevant tests.
6. Commit your changes.

```bash
git commit -m "Add amazing feature"
```

7. Push your branch.

```bash
git push origin feature/amazing-feature
```

8. Open a Pull Request.

When contributing, keep changes focused and document any new environment variables, API integrations, or architecture changes.

---

## Security

If you discover a security issue, do not publish sensitive credentials, tokens, or exploit details in a public issue.

Instead, report the issue privately to the project maintainers.

Never commit:

- API keys
- OAuth client secrets
- JWT secrets
- Encryption keys
- Database credentials
- Telegram bot tokens
- Vercel tokens
- GitHub personal access tokens

---

## License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for the full license text.

---

<p align="center">
  Built for developers who want to ship faster and debug smarter.
</p>
