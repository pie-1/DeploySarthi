"""
FastAPI service for DeploySarthi AI.

Endpoints:
- GET  /health       → liveness check
- POST /detect       → score a single metric snapshot
- POST /investigate  → full incident analysis with LLM
"""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import LOG_LEVEL
from .detector import AnomalyDetector, FEATURE_COLUMNS
from .correlator import build_timeline
from .explainer import explain_incident

logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

app = FastAPI(title="DeploySarthi AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = AnomalyDetector()


@app.on_event("startup")
async def load_model():
    try:
        detector.load()
        logger.info("✓ Isolation Forest model loaded")
    except FileNotFoundError as e:
        logger.warning(f"⚠ Model not loaded: {e}")
        logger.warning("Run `python -m src.evaluate` to generate it.")


class MetricsPayload(BaseModel):
    metrics: dict


class IncidentPayload(BaseModel):
    title: str = ""
    severity: str = "warning"
    startedAt: str = ""
    symptoms: list = []
    timeline: list = []
    relatedDeployment: dict = {}


@app.get("/health")
async def health():
    return {
        "status": "OK",
        "service": "DeploySarthi AI",
        "model_loaded": detector.is_trained,
    }


@app.post("/detect")
async def detect(payload: MetricsPayload):
    """Score a single metric snapshot."""
    if not payload.metrics:
        raise HTTPException(status_code=400, detail="metrics field is required")

    result = detector.detect(payload.metrics)
    return result


@app.post("/investigate")
async def investigate(payload: IncidentPayload):
    """Full incident analysis with LLM explanation."""
    incident = payload.model_dump()

    # Build timeline from symptoms
    events = []
    for s in incident.get("symptoms", []):
        events.append({
            "timestamp": incident.get("startedAt", ""),
            "service": s.get("service", "unknown"),
            "metric": s.get("metric", ""),
            "value": s.get("value", 0),
            "baseline": s.get("baseline", 0),
        })

    timeline = build_timeline(events) if events else {
        "timeline": [],
        "root_cause_service": None,
        "affected_services": [],
    }

    # Get LLM explanation
    analysis = explain_incident(incident)

    return {
        "timeline": timeline,
        "analysis": analysis,
    }