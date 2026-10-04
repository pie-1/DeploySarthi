from src.correlator import build_timeline


def test_empty_events_returns_empty_timeline():
    result = build_timeline([])
    assert result["timeline"] == []
    assert result["root_cause_service"] is None


def test_correlator_sorts_and_identifies_root_cause():
    events = [
        {"timestamp": "2026-10-04T14:13:00", "service": "vercel", "metric": "latency_ms", "value": 820, "baseline": 180},
        {"timestamp": "2026-10-04T14:10:00", "service": "github", "metric": "deploy", "value": 1, "baseline": 0},
        {"timestamp": "2026-10-04T14:14:00", "service": "aws", "metric": "cpu_pct", "value": 78, "baseline": 22},
    ]
    result = build_timeline(events)
    assert result["root_cause_service"] == "github"
    assert len(result["timeline"]) == 3
    assert result["timeline"][0]["service"] == "github"


def test_correlator_calculates_change_percentage():
    events = [
        {"timestamp": "2026-10-04T14:10:00", "service": "aws", "metric": "cpu_pct", "value": 44, "baseline": 22},
    ]
    result = build_timeline(events)
    assert result["timeline"][0]["change_pct"] == 100.0