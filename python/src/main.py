"""
FastAPI service for DeploySarthi AI.
"""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import LOG_LEVEL
from .detector import AnomalyDetector, FEATURE_COLUMNS
from .correlator import build_timeline
from .explainer import explain_incident, suggest_prompts

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


class MetricsPayload(BaseModel):
    metrics: dict


class IncidentPayload(BaseModel):
    title: str = ""
    severity: str = "warning"
    startedAt: str = ""
    symptoms: list = []
    timeline: list = []
    relatedDeployment: dict = {}


class PromptContextPayload(BaseModel):
    incidents: list = []
    projects: list = []
    recentDeployments: list = []
    userQuestion: str = ""


@app.get("/health")
async def health():
    return {
        "status": "OK",
        "service": "DeploySarthi AI",
        "model_loaded": detector.is_trained,
    }


@app.post("/detect")
async def detect(payload: MetricsPayload):
    try:
        if not payload.metrics:
            raise HTTPException(status_code=400, detail="metrics field is required")
        result = detector.detect(payload.metrics)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error in /detect")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/investigate")
async def investigate(payload: IncidentPayload):
    try:
        incident = payload.model_dump()

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

        analysis = explain_incident(incident)

        return {
            "timeline": timeline,
            "analysis": analysis,
        }
    except Exception as e:
        logger.exception("Error in /investigate")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/suggest-prompts")
async def suggest_prompts_endpoint(payload: PromptContextPayload):
    try:
        context = payload.model_dump()
        result = suggest_prompts(context)
        return result
    except Exception as e:
        logger.exception("Error in /suggest-prompts")
        raise HTTPException(status_code=500, detail=str(e))