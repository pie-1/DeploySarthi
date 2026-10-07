"""
LLM-powered incident explanation with rate limiting, caching, circuit breaker,
and daily token budget tracking.
"""

import json
import logging
import time
from groq import Groq
from .config import GROQ_API_KEY, GROQ_MODEL
from .prompts import INVESTIGATOR_PROMPT, PROMPT_GENERATOR_PROMPT

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# Rate limiting
# ─────────────────────────────────────────────────────────────
_request_times = []
MAX_REQUESTS_PER_MINUTE = 25


def _check_rate_limit():
    global _request_times
    now = time.time()
    _request_times = [t for t in _request_times if now - t < 60]
    if len(_request_times) >= MAX_REQUESTS_PER_MINUTE:
        wait_time = 60 - (now - _request_times[0]) + 1
        logger.warning(f"Rate limit reached. Waiting {wait_time:.1f}s")
        time.sleep(wait_time)
        _request_times = []
    _request_times.append(time.time())


# ─────────────────────────────────────────────────────────────
# Daily token budget
# ─────────────────────────────────────────────────────────────
_daily = {
    "tokens_used": 0,
    "reset_at": 0.0,
    "requests": 0,
}
DAILY_TOKEN_BUDGET = 180_000


def _reset_daily_if_needed():
    now = time.time()
    if now >= _daily["reset_at"]:
        if _daily["tokens_used"] > 0:
            logger.info(
                f"[budget] Daily reset. Previous day used "
                f"{_daily['tokens_used']} tokens across {_daily['requests']} calls"
            )
        _daily["tokens_used"] = 0
        _daily["requests"] = 0
        _daily["reset_at"] = now + 86400


def _daily_budget_available() -> bool:
    _reset_daily_if_needed()
    return _daily["tokens_used"] < DAILY_TOKEN_BUDGET


def _record_usage(prompt_tokens: int, completion_tokens: int):
    _reset_daily_if_needed()
    _daily["tokens_used"] += prompt_tokens + completion_tokens
    _daily["requests"] += 1


# ─────────────────────────────────────────────────────────────
# Circuit breaker
# ─────────────────────────────────────────────────────────────
_circuit = {"failures": 0, "open_until": 0.0}
CIRCUIT_FAILURE_THRESHOLD = 3
CIRCUIT_COOLDOWN_SECONDS = 300


def _circuit_is_open() -> bool:
    return time.time() < _circuit["open_until"]


def _record_failure():
    _circuit["failures"] += 1
    if _circuit["failures"] >= CIRCUIT_FAILURE_THRESHOLD:
        _circuit["open_until"] = time.time() + CIRCUIT_COOLDOWN_SECONDS
        logger.warning(
            f"Circuit OPEN for {CIRCUIT_COOLDOWN_SECONDS}s "
            f"after {_circuit['failures']} consecutive failures"
        )


def _record_success():
    _circuit["failures"] = 0
    _circuit["open_until"] = 0.0


# ─────────────────────────────────────────────────────────────
# Shared Groq client
# ─────────────────────────────────────────────────────────────
_groq_client = None


def _get_client():
    global _groq_client
    if _groq_client is None and GROQ_API_KEY:
        _groq_client = Groq(api_key=GROQ_API_KEY, max_retries=1, timeout=25.0)
    return _groq_client


# ─────────────────────────────────────────────────────────────
# Suggestions cache (5 min TTL)
# ─────────────────────────────────────────────────────────────
_suggestions_cache = {}
SUGGESTIONS_CACHE_TTL = 300


# ─────────────────────────────────────────────────────────────
# Offline fallback
# ─────────────────────────────────────────────────────────────
def _offline_fallback(incident: dict, reason: str = "unknown") -> dict:
    symptoms = incident.get("symptoms") or []

    if not symptoms:
        return {
            "summary": "Anomaly detected but insufficient context to explain.",
            "evidence": [],
            "likelyCause": "Unknown",
            "confidence": "low",
            "confidenceReason": "No symptoms provided.",
            "recommendedNext": "Check service logs and recent changes manually.",
            "suggestedQuestions": [],
            "analysisSource": "fallback",
            "fallbackReason": reason,
        }

    top = max(symptoms, key=lambda s: abs(s.get("changePercent", 0) or 0))
    metric = top.get("metric", "unknown metric")
    change = top.get("changePercent", 0) or 0

    return {
        "summary": f"Anomaly detected in {metric} with {change:+.1f}% change from baseline.",
        "evidence": [
            f"{s.get('metric', '?')}: {s.get('value', '?')} "
            f"(baseline {s.get('baseline', '?')}, {s.get('changePercent', 0) or 0:+.1f}%)"
            for s in symptoms[:5]
        ],
        "likelyCause": f"Significant increase in {metric}",
        "confidence": "medium",
        "confidenceReason": "Rule-based analysis without LLM validation.",
        "recommendedNext": f"Review recent changes to {metric}",
        "suggestedQuestions": [],
        "analysisSource": "fallback",
        "fallbackReason": reason,
    }


# ─────────────────────────────────────────────────────────────
# Context builder
# ─────────────────────────────────────────────────────────────
def _build_context(incident: dict) -> str:
    lines = []
    lines.append("# Incident")
    lines.append(f"Title: {incident.get('title', 'Unknown')}")
    lines.append(f"Severity: {incident.get('severity', 'unknown')}")
    lines.append(f"Started: {incident.get('startedAt', 'unknown')}")

    ctx = incident.get("context") or {}
    if not isinstance(ctx, dict):
        ctx = {}

    project = ctx.get("project") or {}
    if project:
        lines.append("\n# Project")
        lines.append(f"Name: {project.get('name', 'N/A')}")
        lines.append(f"Env: {project.get('environment', 'N/A')} | Target: {project.get('deploymentTarget', 'N/A')}")
        if project.get("githubRepo"):
            lines.append(f"GitHub: {project['githubRepo']}")
        if project.get("vercelProjectName"):
            lines.append(f"Vercel: {project['vercelProjectName']}")

    symptoms = incident.get("symptoms") or []
    if symptoms:
        lines.append("\n# Symptoms")
        for s in symptoms[:6]:
            if not isinstance(s, dict):
                continue
            change = s.get("changePercent", 0) or 0
            lines.append(
                f"- {s.get('service', '?')} {s.get('metric', '?')}: "
                f"{s.get('value', '?')} (base {s.get('baseline', '?')}, "
                f"{change:+.1f}%)"
            )

    timeline = incident.get("timeline") or []
    if timeline:
        lines.append("\n# Timeline")
        for t in timeline[:5]:
            if not isinstance(t, dict):
                continue
            lines.append(f"- {t.get('timestamp')} [{t.get('service')}] {t.get('event')}")

    deployments = ctx.get("recentDeployments") or []
    if deployments:
        lines.append("\n# Recent Deploys")
        for d in deployments[:3]:
            if not isinstance(d, dict):
                continue
            lines.append(
                f"- {d.get('createdAt')} {d.get('state')} ({d.get('target')}) "
                f"commit {d.get('commitSha')}: \"{d.get('commitMessage')}\" by {d.get('commitAuthor')}"
            )

    commits = ctx.get("recentCommits") or []
    if commits:
        lines.append("\n# Recent Commits")
        for c in commits[:3]:
            if not isinstance(c, dict):
                continue
            lines.append(
                f"- {c.get('date')} {c.get('sha')} by {c.get('author')}: \"{c.get('message')}\""
            )

    history = incident.get("conversationHistory") or []
    if history:
        lines.append("\n# Prior Chat")
        for msg in history[-4:]:
            if not isinstance(msg, dict):
                continue
            role = msg.get("role", "user")
            content = msg.get("content", "")[:300]
            lines.append(f"{role.capitalize()}: {content}")

    user_q = incident.get("userQuestion") or ""
    if user_q:
        lines.append("\n# Question")
        lines.append(user_q[:500])

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────
# Public API — explain
# ─────────────────────────────────────────────────────────────
def explain_incident(incident: dict) -> dict:
    if not GROQ_API_KEY:
        return _offline_fallback(incident, reason="no_api_key")

    if not _daily_budget_available():
        logger.warning("[budget] Daily token budget exhausted")
        return _offline_fallback(incident, reason="daily_budget_exhausted")

    if _circuit_is_open():
        logger.info("Circuit open — serving fallback")
        return _offline_fallback(incident, reason="circuit_open")

    _check_rate_limit()

    client = _get_client()
    if not client:
        return _offline_fallback(incident, reason="no_client")

    try:
        context = _build_context(incident)
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": INVESTIGATOR_PROMPT},
                {"role": "user", "content": context},
            ],
            temperature=0.2,
            max_tokens=800,
            response_format={"type": "json_object"},
        )

        usage = getattr(response, "usage", None)
        if usage:
            _record_usage(usage.prompt_tokens, usage.completion_tokens)

        raw = response.choices[0].message.content
        if not raw or not raw.strip():
            logger.warning("[explain] Groq returned empty content")
            _record_failure()
            return _offline_fallback(incident, reason="empty_response")

        result = json.loads(raw)
        result["analysisSource"] = "groq"
        _record_success()
        return result
    except Exception as e:
        logger.error(f"Groq failed: {e}")
        _record_failure()
        return _offline_fallback(incident, reason="groq_error")


# ─────────────────────────────────────────────────────────────
# Public API — suggest prompts
# ─────────────────────────────────────────────────────────────
def suggest_prompts(context: dict) -> dict:
    incidents = context.get("incidents") or []

    if not incidents:
        cache_key = None
    else:
        cache_key = str(sorted([
            i.get("title", "") for i in incidents if isinstance(i, dict)
        ]))[:200]

    now = time.time()

    if cache_key and cache_key in _suggestions_cache:
        cached_at, cached_result = _suggestions_cache[cache_key]
        if now - cached_at < SUGGESTIONS_CACHE_TTL:
            logger.info("Using cached suggestions")
            return cached_result

    if not GROQ_API_KEY:
        return {"suggestions": []}

    if not _daily_budget_available():
        logger.warning("[budget] Daily budget exhausted — no suggestions")
        return {"suggestions": []}

    if _circuit_is_open():
        logger.info("Circuit open — no suggestions")
        return {"suggestions": []}

    _check_rate_limit()

    client = _get_client()
    if not client:
        return {"suggestions": []}

    try:
        trimmed = {
            "incidents": [
                {
                    "title": i.get("title", ""),
                    "severity": i.get("severity", ""),
                    "startedAt": i.get("startedAt", ""),
                }
                for i in incidents[:3] if isinstance(i, dict)
            ],
        }

        context_text = json.dumps(trimmed, indent=2, default=str)
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": PROMPT_GENERATOR_PROMPT},
                {"role": "user", "content": context_text},
            ],
            temperature=0.3,
            max_tokens=500,
            response_format={"type": "json_object"},
        )

        usage = getattr(response, "usage", None)
        if usage:
            _record_usage(usage.prompt_tokens, usage.completion_tokens)

        raw = response.choices[0].message.content
        if not raw or not raw.strip():
            logger.warning("[suggest] Groq returned empty content")
            return {"suggestions": []}

        try:
            result = json.loads(raw)
        except json.JSONDecodeError as e:
            logger.warning(f"[suggest] Invalid JSON: {e}. Raw: {raw[:200]}")
            return {"suggestions": []}

        if not isinstance(result, dict) or "suggestions" not in result:
            logger.warning("[suggest] Unexpected shape — returning empty")
            return {"suggestions": []}

        if cache_key:
            _suggestions_cache[cache_key] = (now, result)

        _record_success()
        return result
    except Exception as e:
        logger.error(f"Prompt generation failed: {e}")
        _record_failure()
        return {"suggestions": []}