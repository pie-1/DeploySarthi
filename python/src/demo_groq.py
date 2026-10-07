"""
Live demo: Incident #47 through Groq.

Run:  python -m src.demo_groq
"""

import json
from .explainer import explain_incident

INCIDENT_47 = {
    "title": "API degradation after deployment abc123",
    "severity": "critical",
    "startedAt": "2026-10-04T14:10:00Z",
    "symptoms": [
        {"service": "vercel", "metric": "latency_ms", "value": 820, "baseline": 180, "changePercent": 355.6},
        {"service": "aws", "metric": "cpu_pct", "value": 78, "baseline": 22, "changePercent": 254.5},
        {"service": "supabase", "metric": "db_connections", "value": 72, "baseline": 20, "changePercent": 260.0},
        {"service": "vercel", "metric": "error_rate_pct", "value": 14.7, "baseline": 0.2, "changePercent": 7250.0},
    ],
    "timeline": [
        {"timestamp": "14:10", "service": "github", "event": "Deployment abc123 pushed"},
        {"timestamp": "14:13", "service": "vercel", "event": "Latency increased"},
        {"timestamp": "14:14", "service": "aws", "event": "CPU spiked"},
        {"timestamp": "14:15", "service": "supabase", "event": "DB latency increased"},
        {"timestamp": "14:16", "service": "vercel", "event": "Error rate spiked"},
    ],
    "relatedDeployment": {
        "commitId": "abc123",
        "branch": "feature/orders",
        "filesChanged": ["orderController.js", "orders.js"],
    },
}

if __name__ == "__main__":
    print("=" * 70)
    print("DeploySarthi — Incident #47 Investigation via Groq")
    print("=" * 70)

    result = explain_incident(INCIDENT_47)

    print("\n AI Analysis:\n")
    print(json.dumps(result, indent=2))
    print("\n" + "=" * 70)