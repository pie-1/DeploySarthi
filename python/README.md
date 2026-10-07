# DeploySarthi — AI Service

FastAPI-based AI service for anomaly detection and incident investigation.

## Tech Stack

- Python 3.12
- FastAPI
- scikit-learn
- Pandas
- NumPy
- Groq
- Joblib

## Requirements

- Python 3.12+
- Groq API key


## Main Features

- Anomaly detection
- Rule-based detection
- Isolation Forest ML model
- Incident investigation
- AI explanations
- Context-aware suggestions
- Fault simulation
- Model evaluation

## API

| Method | Endpoint           | Purpose            |
| ------ | ------------------ | ------------------ |
| GET    | `/health`          | Service status     |
| POST   | `/detect`          | Detect anomaly     |
| POST   | `/investigate`     | Analyze incident   |
| POST   | `/suggest-prompts` | Generate questions |

## Detection Metrics

- Detection Rate: **70%**
- False Positive Rate: **2.98%**
- Median MTTD: **30 seconds**
- Tested Faults: **6**




## Quick Start

```bash
cd python
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env              # Add your GROQ_API_KEY
python -m src.evaluate            # Generates data, trains model
python -m pytest -q               # Run tests
uvicorn src.main:app --reload --port 8001