"""
Anomaly detector.

Two layers:
1. Rule-based thresholds (fast, explainable)
2. Isolation Forest (unsupervised ML)
"""

import joblib
import numpy as np
from pathlib import Path
from sklearn.ensemble import IsolationForest
from .config import (
    THRESHOLDS,
    IF_CONTAMINATION,
    IF_N_ESTIMATORS,
    IF_RANDOM_STATE,
)

MODEL_PATH = Path(__file__).parent.parent / "models" / "isolation_forest.joblib"

FEATURE_COLUMNS = [
    "latency_ms",
    "error_rate_pct",
    "cpu_pct",
    "memory_pct",
    "db_connections",
]


class AnomalyDetector:
    def __init__(self, contamination: float | None = None):
        self.model = None
        self.is_trained = False
        self.contamination = contamination if contamination is not None else IF_CONTAMINATION

    def train(self, healthy_df) -> None:
        X = healthy_df[FEATURE_COLUMNS].values
        self.model = IsolationForest(
            contamination=self.contamination,
            n_estimators=IF_N_ESTIMATORS,
            random_state=IF_RANDOM_STATE,
        )
        self.model.fit(X)
        self.is_trained = True

    def save(self) -> None:
        if not self.is_trained:
            raise RuntimeError("Cannot save untrained model")
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, MODEL_PATH)

    def load(self) -> None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. Run `python -m src.evaluate` first."
            )
        self.model = joblib.load(MODEL_PATH)
        self.is_trained = True

    def _check_rules(self, metrics: dict) -> list:
        flagged = []
        for metric, value in metrics.items():
            if metric not in THRESHOLDS:
                continue
            thresholds = THRESHOLDS[metric]
            if value >= thresholds["critical"]:
                flagged.append({
                    "metric": metric,
                    "value": float(value),
                    "level": "critical",
                })
            elif value >= thresholds["warning"]:
                flagged.append({
                    "metric": metric,
                    "value": float(value),
                    "level": "warning",
                })
        return flagged

    def _check_isolation_forest(self, metrics: dict):
        if not self.is_trained:
            return False, 0.0

        vector = np.array([[float(metrics.get(col, 0.0)) for col in FEATURE_COLUMNS]])
        prediction = self.model.predict(vector)[0]
        score = self.model.decision_function(vector)[0]

        # Cast numpy types to Python natives
        is_anomaly = bool(prediction == -1)
        confidence = float(np.clip((0.3 - float(score)) / 0.8, 0.0, 1.0))

        return is_anomaly, confidence

    def detect(self, metrics: dict) -> dict:
        flagged = self._check_rules(metrics)
        if_anomaly, if_confidence = self._check_isolation_forest(metrics)

        # Ensure Python bool
        is_anomaly = bool(flagged) or bool(if_anomaly)

        if flagged and if_anomaly:
            method = "rules + isolation_forest"
            has_critical = any(f["level"] == "critical" for f in flagged)
            confidence = max(float(if_confidence), 0.9 if has_critical else 0.7)
        elif flagged:
            method = "rules"
            has_critical = any(f["level"] == "critical" for f in flagged)
            confidence = 0.9 if has_critical else 0.7
        elif if_anomaly:
            method = "isolation_forest"
            confidence = float(if_confidence)
        else:
            method = "none"
            confidence = 0.0

        return {
            "is_anomaly": bool(is_anomaly),
            "confidence": round(float(confidence), 3),
            "flagged_metrics": flagged,
            "detection_method": str(method),
        }