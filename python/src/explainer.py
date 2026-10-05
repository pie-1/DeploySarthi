"""
LLM-powered incident explanation with rate limiting and caching.
"""

import json
import logging
import time
from groq import Groq
from .config import GROQ_API_KEY, GROQ_MODEL
from .prompts import INVESTIGATOR_PROMPT, PROMPT_GENERATOR_PROMPT

logger = logging.getLogger(__name__)

_request_times = []
MAX_REQUESTS_PER_MINUTE = 25

# Suggestions cache
_suggestions_cache = {}
SUGGESTIONS_CACHE_TTL = 60  # seconds


def _check_rate_limit():
    """Ensure we stay under Groq's rate limit."""
    global _request_times
    now = time.time()
    _request_times = [t for t in _request_times if now - t < 60]

    if len(_request_times) >= MAX_REQUESTS_PER_MINUTE:
        wait_time = 60 - (now - _request_times[0]) + 1
        logger.warning(f"Rate limit reached. Waiting {wait_time:.1f}s")
        time.sleep(wait_time)
        _request_times = []

    _request_times.append(time.time())


def _offline_fallback(incident: dict) -> dict:
    symptoms = incident.get("symptoms", [])

    if not symptoms:
        return {
            "summary": "Anomaly detected but insufficient context to explain.",
            "evidence": [],
            "likelyCause": "Unknown",
            "confidence": "low",
            "confidenceReason": "No symptoms provided.",
            "recommendedNext": "Check service logs and recent changes manually.",
            "suggestedQuestions": [],
        }

    top = max(symptoms, key=lambda s: abs(s.get("changePercent", 0)))
    metric = top.get("metric", "unknown metric")
    change = top.get("changePercent", 0)

    return {
        "summary": f"Anomaly detected in {metric} with {change:+.1f}% change from baseline.",
        "evidence": [
            f"{s['metric']}: {s.get('value', '?')} (baseline {s.get('baseline', '?')}, {s.get('changePercent', 0):+.1f}%)"
            for s in symptoms[:5]
        ],
        "likelyCause": f"Significant increase in {metric}",
        "confidence": "medium",
        "confidenceReason": "Rule-based analysis without LLM validation.",
        "recommendedNext": f"Review recent changes to {metric}",
        "suggestedQuestions": [],
    }


def _build_context(incident: dict) -> str:
    lines = [
        f"Incident: {incident.get('title', 'Unknown')}",
        f"Severity: {incident.get('severity', 'unknown')}",
        f"Started: {incident.get('startedAt', 'unknown')}",
    ]

    symptoms = incident.get("symptoms", [])
    if symptoms:
        lines.append("\nSymptoms:")
        for s in symptoms[:8]:
            lines.append(
                f"  - {s.get('service', '?')} {s.get('metric', '?')}: "
                f"{s.get('value', '?')} (baseline {s.get('baseline', '?')}, "
                f"{s.get('changePercent', 0):+.1f}%)"
            )

    timeline = incident.get("timeline", [])
    if timeline:
        lines.append("\nTimeline:")
        for event in timeline[:10]:
            lines.append(f"  - {event.get('timestamp')} {event.get('service')}: {event.get('event')}")

    deployment = incident.get("relatedDeployment", {})
    if deployment and deployment.get("commitId"):
        lines.append("\nRecent deployment:")
        lines.append(f"  Commit: {deployment.get('commitId', 'N/A')}")
        lines.append(f"  Branch: {deployment.get('branch', 'N/A')}")
        files = deployment.get("filesChanged", [])
        if files:
            lines.append(f"  Files changed: {', '.join(files[:5])}")

    user_q = incident.get("userQuestion", "")
    if user_q:
        lines.append(f"\nUser's question: {user_q}")

    return "\n".join(lines)


def explain_incident(incident: dict) -> dict:
    """Generate explanation using Groq, with offline fallback."""
    if not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not set — using offline fallback")
        return _offline_fallback(incident)

    _check_rate_limit()

    try:
        client = Groq(api_key=GROQ_API_KEY, max_retries=1, timeout=15.0)
        context = _build_context(incident)

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": INVESTIGATOR_PROMPT},
                {"role": "user", "content": context},
            ],
            temperature=0.2,
            max_tokens=1000,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        return json.loads(content)

    except Exception as e:
        logger.error(f"Groq failed: {e}. Falling back to rule-based.")
        return _offline_fallback(incident)


def suggest_prompts(context: dict) -> dict:
    """Generate contextual investigation questions with caching."""
    cache_key = str(sorted([i.get("title", "") for i in context.get("incidents", [])]))[:200]
    now = time.time()

    if cache_key in _suggestions_cache:
        cached_at, cached_result = _suggestions_cache[cache_key]
        if now - cached_at < SUGGESTIONS_CACHE_TTL:
            logger.info("Using cached suggestions")
            return cached_result

    if not GROQ_API_KEY:
        return {"suggestions": []}

    _check_rate_limit()

    try:
        client = Groq(api_key=GROQ_API_KEY, max_retries=1, timeout=15.0)
        context_text = json.dumps(context, indent=2)

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": PROMPT_GENERATOR_PROMPT},
                {"role": "user", "content": context_text},
            ],
            temperature=0.3,
            max_tokens=800,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        result = json.loads(content)

        _suggestions_cache[cache_key] = (now, result)
        return result

    except Exception as e:
        logger.error(f"Prompt generation failed: {e}")
        return {"suggestions": []}