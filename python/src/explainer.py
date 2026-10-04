"""
LLM-powered incident explanation.

Uses Groq for real LLM calls; falls back to rule-based text if API fails.
"""

import json
import logging
from groq import Groq
from .config import GROQ_API_KEY, GROQ_MODEL

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are an expert site reliability engineer analyzing a cloud infrastructure incident.

You will receive a structured incident summary. Your job is to analyze the evidence and provide:
1. A 2-sentence summary of what happened
2. The likely root cause
3. Supporting evidence (as a list)
4. A specific investigation step
5. A confidence level (low/medium/high) with justification

IMPORTANT RULES:
- Only use evidence provided. Do not invent metrics.
- Distinguish between correlation and causation. Say "appears to have started after" not "was caused by".
- If evidence is weak, say so. Set confidence to "low".
- Be concise. No fluff.

Respond ONLY with valid JSON matching this schema:
{
  "summary": "string",
  "likelyCause": "string",
  "evidence": ["string"],
  "suggestedInvestigation": "string",
  "confidence": "low" | "medium" | "high",
  "confidenceReason": "string"
}"""


def _offline_fallback(incident: dict) -> dict:
    """Rule-based explanation when Groq is unavailable."""
    symptoms = incident.get("symptoms", [])
    deployment = incident.get("relatedDeployment", {})

    if not symptoms:
        return {
            "summary": "Anomaly detected but insufficient context to explain.",
            "likelyCause": "Unknown",
            "evidence": [],
            "suggestedInvestigation": "Check service logs and recent changes manually.",
            "confidence": "low",
            "confidenceReason": "No symptoms provided.",
        }

    top = max(symptoms, key=lambda s: abs(s.get("changePercent", 0)))
    metric = top.get("metric", "unknown metric")
    change = top.get("changePercent", 0)

    cause = f"Significant increase in {metric} ({change:+.1f}%)"
    if deployment.get("commitId"):
        cause += f" shortly after deployment {deployment['commitId']}"

    return {
        "summary": f"Anomaly detected in {metric} with {change:+.1f}% change from baseline.",
        "likelyCause": cause,
        "evidence": [
            f"{s['metric']}: {s.get('value', '?')} (baseline {s.get('baseline', '?')}, {s.get('changePercent', 0):+.1f}%)"
            for s in symptoms[:5]
        ],
        "suggestedInvestigation": f"Review recent changes to {metric} and check service logs.",
        "confidence": "medium",
        "confidenceReason": "Rule-based analysis without LLM validation.",
    }


def _build_user_prompt(incident: dict) -> str:
    """Construct the incident summary sent to the LLM."""
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
    if deployment:
        lines.append("\nRecent deployment:")
        lines.append(f"  Commit: {deployment.get('commitId', 'N/A')}")
        lines.append(f" Branch: {deployment.get('branch', 'N/A')}")
        lines.append(f" Files changed: {', '.join(deployment.get('filesChanged', [])[:5])}")

    return "\n".join(lines)


def explain_incident(incident: dict) -> dict:
    """Generate explanation using Groq, with offline fallback."""
    if not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not set — using offline fallback")
        return _offline_fallback(incident)

    try:
        client = Groq(api_key=GROQ_API_KEY)
        user_prompt = _build_user_prompt(incident)

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=800,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        return json.loads(content)

    except Exception as e:
        logger.error(f"Groq failed: {e}. Falling back to rule-based.")
        return _offline_fallback(incident)