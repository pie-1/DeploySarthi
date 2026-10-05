# DeploySarthi AI Service

Python FastAPI service for anomaly detection and incident investigation.

## Quick Start

```bash
cd python
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # Add your GROQ_API_KEY
python -m src.evaluate            # Generates data, trains model, prints paper table
python -m pytest -q               # Run tests
uvicorn src.main:app --reload --port 8001