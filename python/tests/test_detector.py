import pandas as pd
from src.detector import AnomalyDetector, FEATURE_COLUMNS
from src.synthetic import generate_healthy


def test_detector_trains_on_healthy_data():
    df = generate_healthy(n_points=500)
    detector = AnomalyDetector()
    detector.train(df)
    assert detector.is_trained


def test_healthy_metrics_not_flagged():
    df = generate_healthy(n_points=500)
    detector = AnomalyDetector()
    detector.train(df)

    healthy = {
        "latency_ms": 180,
        "error_rate_pct": 0.2,
        "cpu_pct": 22,
        "memory_pct": 40,
        "db_connections": 20,
    }
    result = detector.detect(healthy)
    assert result["is_anomaly"] is False


def test_critical_metrics_flagged_by_rules():
    df = generate_healthy(n_points=500)
    detector = AnomalyDetector()
    detector.train(df)

    critical = {
        "latency_ms": 2000,
        "error_rate_pct": 25,
        "cpu_pct": 95,
        "memory_pct": 92,
        "db_connections": 95,
    }
    result = detector.detect(critical)
    assert result["is_anomaly"] is True
    assert result["detection_method"] in ("rules", "rules + isolation_forest")