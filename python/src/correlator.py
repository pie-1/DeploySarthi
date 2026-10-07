"""
Cross-service incident correlation.

Takes anomaly signals from multiple services (AWS, Vercel, Supabase)
and builds a single timeline showing causal chain.
"""

from datetime import datetime, timedelta


def _safe_parse(ts):
    """Parse ISO timestamp; return None if invalid/empty."""
    if not ts or not isinstance(ts, str):
        return None
    try:
        return datetime.fromisoformat(ts.replace('Z', '+00:00'))
    except Exception:
        return None


def build_timeline(events: list, window_minutes: int = 10) -> dict:
    if not events:
        return {
            "start": None,
            "end": None,
            "timeline": [],
            "root_cause_service": None,
            "affected_services": [],
        }

    # Filter out events with unparseable timestamps
    valid_events = []
    for e in events:
        if not isinstance(e, dict):
            continue
        ts = _safe_parse(e.get("timestamp"))
        if ts is None:
            continue
        valid_events.append({**e, "_ts": ts})

    if not valid_events:
        return {
            "start": None,
            "end": None,
            "timeline": [],
            "root_cause_service": None,
            "affected_services": [],
        }

    sorted_events = sorted(valid_events, key=lambda e: e["_ts"])

    start = sorted_events[0]["_ts"]
    end = start + timedelta(minutes=window_minutes)

    windowed = [e for e in sorted_events if e["_ts"] <= end]

    for event in windowed:
        baseline = event.get("baseline", 1) or 1
        value = event.get("value", 0) or 0
        event["change_pct"] = (
            round((value - baseline) / baseline * 100, 1) if baseline else 0
        )

    services_in_order = []
    for e in windowed:
        svc = e.get("service", "unknown")
        if svc not in services_in_order:
            services_in_order.append(svc)

    root_cause = services_in_order[0] if services_in_order else None

    # Strip helper field before returning
    clean_timeline = []
    for e in windowed:
        e_copy = {k: v for k, v in e.items() if k != "_ts"}
        clean_timeline.append(e_copy)

    return {
        "start": sorted_events[0]["timestamp"],
        "end": windowed[-1]["timestamp"],
        "timeline": clean_timeline,
        "root_cause_service": root_cause,
        "affected_services": services_in_order,
    }