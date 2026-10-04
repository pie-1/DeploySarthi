"""
Cross-service incident correlation.

Takes anomaly signals from multiple services (AWS, Vercel, Supabase)
and builds a single timeline showing causal chain.
"""

from datetime import datetime, timedelta


def build_timeline(events: list, window_minutes: int = 10) -> dict:
    if not events:
        return {
            "start": None,
            "end": None,
            "timeline": [],
            "root_cause_service": None,
            "affected_services": [],
        }

    sorted_events = sorted(events, key=lambda e: e["timestamp"])

    start = datetime.fromisoformat(sorted_events[0]["timestamp"])
    end = start + timedelta(minutes=window_minutes)

    windowed = [
        e for e in sorted_events
        if datetime.fromisoformat(e["timestamp"]) <= end
    ]

    for event in windowed:
        baseline = event.get("baseline", 1)
        event["change_pct"] = (
            round((event["value"] - baseline) / baseline * 100, 1)
            if baseline else 0
        )

    services_in_order = []
    for e in windowed:
        if e["service"] not in services_in_order:
            services_in_order.append(e["service"])

    root_cause = services_in_order[0] if services_in_order else None

    return {
        "start": sorted_events[0]["timestamp"],
        "end": windowed[-1]["timestamp"],
        "timeline": windowed,
        "root_cause_service": root_cause,
        "affected_services": services_in_order,
    }