"""
FastAPI service for DeploySarthi AI.
"""

import logging
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import LOG_LEVEL
from .detector import AnomalyDetector, FEATURE_COLUMNS
from .correlator import build_timeline
from .explainer import explain_incident, suggest_prompts

logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

detector = AnomalyDetector()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern FastAPI lifespan handler — replaces deprecated on_event."""
    try:
        detector.load()
        logger.info("✓ Isolation Forest model loaded")
    except FileNotFoundError as e:
        logger.warning(f"⚠ Model not loaded: {e}")
    yield
    logger.info("Shutting down AI service")


app = FastAPI(
    title="DeploySarthi AI Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MetricsPayload(BaseModel):
    metrics: dict


class IncidentPayload(BaseModel):
    """Permissive payload — accepts nulls and empty values from frontend."""
    incidentId: Optional[str] = ""
    title: Optional[str] = ""
    severity: Optional[str] = "warning"
    startedAt: Optional[str] = ""
    symptoms: Optional[list] = None
    timeline: Optional[list] = None
    relatedDeployment: Optional[dict] = None
    context: Optional[dict] = None
    userQuestion: Optional[str] = ""
    conversationHistory: Optional[list] = None

    model_config = {"extra": "allow"}


class PromptContextPayload(BaseModel):
    incidents: Optional[list] = None
    projects: Optional[list] = None
    recentDeployments: Optional[list] = None
    userQuestion: Optional[str] = ""

    model_config = {"extra": "allow"}


def _normalize_incident(incident: dict) -> dict:
    """Normalize nulls to safe defaults so downstream code never crashes."""
    if not isinstance(incident, dict):
        return {}
    if not isinstance(incident.get("symptoms"), list):
        incident["symptoms"] = []
    if not isinstance(incident.get("timeline"), list):
        incident["timeline"] = []
    if not isinstance(incident.get("context"), dict):
        incident["context"] = {}
    if not isinstance(incident.get("relatedDeployment"), dict):
        incident["relatedDeployment"] = {}
    if not isinstance(incident.get("conversationHistory"), list):
        incident["conversationHistory"] = []
    if not isinstance(incident.get("userQuestion"), str):
        incident["userQuestion"] = ""
    if not isinstance(incident.get("title"), str):
        incident["title"] = ""
    if not isinstance(incident.get("severity"), str):
        incident["severity"] = "warning"
    if not isinstance(incident.get("startedAt"), str):
        incident["startedAt"] = ""
    return incident


def _has_valid_started_at(incident: dict) -> bool:
    """Check startedAt is a parseable ISO timestamp."""
    ts = incident.get("startedAt", "")
    if not ts or not isinstance(ts, str):
        return False
    try:
        from datetime import datetime
        datetime.fromisoformat(ts.replace('Z', '+00:00'))
        return True
    except Exception:
        return False


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
        incident = _normalize_incident(payload.model_dump())

        # Build correlation events — only if we have a valid timestamp
        events = []
        has_valid_ts = _has_valid_started_at(incident)

        if has_valid_ts:
            for s in incident["symptoms"]:
                if not isinstance(s, dict):
                    continue
                events.append({
                    "timestamp": incident["startedAt"],
                    "service": s.get("service") or "unknown",
                    "metric": s.get("metric") or "",
                    "value": s.get("value") or 0,
                    "baseline": s.get("baseline") or 0,
                })

        # Build timeline or return empty (safe)
        if events:
            try:
                timeline = build_timeline(events)
            except Exception as e:
                logger.warning(f"[investigate] build_timeline failed: {e}")
                timeline = {
                    "timeline": [],
                    "root_cause_service": None,
                    "affected_services": [],
                }
        else:
            timeline = {
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
        context = {
            "incidents": payload.incidents if isinstance(payload.incidents, list) else [],
            "projects": payload.projects if isinstance(payload.projects, list) else [],
            "recentDeployments": payload.recentDeployments if isinstance(payload.recentDeployments, list) else [],
            "userQuestion": payload.userQuestion or "",
        }
        result = suggest_prompts(context)
        return result
    except Exception as e:
        logger.exception("Error in /suggest-prompts")
        raise HTTPException(status_code=500, detail=str(e))