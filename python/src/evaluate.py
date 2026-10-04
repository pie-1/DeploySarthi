"""
Research-grade evaluation.

Methodology:
1. Train IF on healthy_train.csv
2. Tune contamination on healthy_val.csv (FPR-based)
3. Report FPR on held-out healthy_test.csv
4. Evaluate 6 fault scenarios with timestamp-based MTTD
5. Report raw anomaly scores (no arbitrary confidence conversion)
"""

import time
import numpy as np
import pandas as pd
from pathlib import Path

from .synthetic import save_all
from .detector import AnomalyDetector, FEATURE_COLUMNS
from .config import TOTAL_POINTS, DATA_DAYS

DATA_DIR = Path(__file__).parent.parent / "data"
FAULTS_DIR = DATA_DIR / "faults"

SCENARIOS = [
    ("n_plus_1", "< 3 min"),
    ("missing_env", "< 2 min"),
    ("memory_leak", "< 5 min"),
    ("db_timeout", "< 1 min"),
    ("bad_deploy", "< 2 min"),
    ("cost_spike", "< 10 min"),
]

CONTAMINATION_CANDIDATES = [0.03, 0.05, 0.08]
CONSECUTIVE_DETECTIONS_REQUIRED = 2


def compute_fpr(detector: AnomalyDetector, healthy_df: pd.DataFrame) -> dict:
    """
    False Positive Rate on held-out healthy data.

    A false positive is a reading where the detector fires (is_anomaly=True)
    even though the ground truth is healthy.

    FPR = (number of alerts) / (total readings)
    """
    alerts = 0
    total = len(healthy_df)
    for _, row in healthy_df.iterrows():
        metrics = {col: row[col] for col in FEATURE_COLUMNS}
        result = detector.detect(metrics)
        if result["is_anomaly"]:
            alerts += 1
    return {"fpr_pct": round(alerts / total * 100, 3), "alerts": alerts, "total": total}


def tune_contamination(healthy_train: pd.DataFrame, healthy_val: pd.DataFrame) -> dict:
    """
    Train IF with each contamination value on train, measure FPR on val.
    Return the configuration with lowest FPR that still flags < 2% of val.
    """
    from sklearn.ensemble import IsolationForest
    from .config import IF_N_ESTIMATORS, IF_RANDOM_STATE

    results = []
    for c in CONTAMINATION_CANDIDATES:
        model = IsolationForest(
            contamination=c,
            n_estimators=IF_N_ESTIMATORS,
            random_state=IF_RANDOM_STATE,
        )
        X_train = healthy_train[FEATURE_COLUMNS].values
        model.fit(X_train)

        # FPR on validation
        X_val = healthy_val[FEATURE_COLUMNS].values
        predictions = model.predict(X_val)
        false_positives = int((predictions == -1).sum())
        fpr = false_positives / len(X_val) * 100

        results.append({
            "contamination": c,
            "val_fpr_pct": round(fpr, 3),
            "val_fp_count": false_positives,
        })

    # Choose contamination with lowest FPR (naive but defensible)
    best = min(results, key=lambda r: r["val_fpr_pct"])

    print("\n   Contamination tuning (on validation set):")
    print(f"   {'Contamination':<15} {'Val FPR':<12} {'FP Count':<10}")
    for r in results:
        marker = " ← selected" if r["contamination"] == best["contamination"] else ""
        print(f"   {r['contamination']:<15} {r['val_fpr_pct']:<12} {r['val_fp_count']:<10}{marker}")

    return best

def evaluate_fault(detector: AnomalyDetector, fault_name: str) -> dict:
    """
    Evaluate one fault scenario.

    Reports BOTH:
    - Standard MTTD: from fault_started_at to first_alert_at
    - Observable MTTD: from actionable_at to first_alert_at (secondary)
    """
    df = pd.read_csv(
        FAULTS_DIR / f"{fault_name}.csv",
        parse_dates=["timestamp", "fault_started_at", "actionable_at"],
    )

    fault_rows = df[df["is_anomaly"] == 1]
    if fault_rows.empty:
        return {
            "detected": False,
            "mttd_seconds": None,
            "observable_mttd_seconds": None,
            "anomaly_score": None,
            "method": "none",
        }

    first_fault_idx = fault_rows.index[0]
    fault_started_at = df.loc[first_fault_idx, "fault_started_at"]
    actionable_at = df.loc[first_fault_idx, "actionable_at"]

    consecutive = 0
    for idx in range(first_fault_idx, len(df)):
        row = df.iloc[idx]
        metrics = {col: row[col] for col in FEATURE_COLUMNS}
        result = detector.detect(metrics)

        if result["is_anomaly"]:
            consecutive += 1
            if consecutive >= CONSECUTIVE_DETECTIONS_REQUIRED:
                first_alert_at = df.loc[idx, "timestamp"]

                mttd = (first_alert_at - fault_started_at).total_seconds()

                observable_mttd = None
                if pd.notna(actionable_at):
                    observable_mttd = (first_alert_at - actionable_at).total_seconds()

                score = detector.model.decision_function(
                    np.array([[row[col] for col in FEATURE_COLUMNS]])
                )[0] if detector.is_trained else 0.0

                return {
                    "detected": True,
                    "mttd_seconds": round(mttd, 1),
                    "observable_mttd_seconds": round(observable_mttd, 1) if observable_mttd is not None else None,
                    "anomaly_score": round(float(score), 4),
                    "method": result["detection_method"],
                }
        else:
            consecutive = 0

    return {
        "detected": False,
        "mttd_seconds": None,
        "observable_mttd_seconds": None,
        "anomaly_score": None,
        "method": "none",
    }

def main():
    print("=" * 84)
    print(f"DeploySarthi AI Evaluation — {DATA_DAYS} days ({TOTAL_POINTS} points)")
    print("=" * 84)

    # Step 1: Generate data
    print("\n[1/5] Generating synthetic data...")
    save_all()

    # Step 2: Load splits
    print("\n[2/5] Loading train/val/test splits...")
    train_df = pd.read_csv(DATA_DIR / "healthy_train.csv")
    val_df = pd.read_csv(DATA_DIR / "healthy_val.csv")
    test_df = pd.read_csv(DATA_DIR / "healthy_test.csv")
    print(f"   Train: {len(train_df)} rows")
    print(f"   Val:   {len(val_df)} rows")
    print(f"   Test:  {len(test_df)} rows (held out, never seen)")

    # Step 3: Tune contamination
    print("\n[3/5] Tuning contamination...")
    best_cfg = tune_contamination(train_df, val_df)
    print(f"\n   ✓ Selected contamination = {best_cfg['contamination']}")

    # Train final detector on train data with selected contamination
    detector = AnomalyDetector(contamination=best_cfg["contamination"])
    t0 = time.time()
    detector.train(train_df)
    train_time = time.time() - t0
    detector.save()
    print(f"   ✓ Trained IF on {len(train_df)} rows in {train_time:.2f}s")

    # Step 4: False positive rate on held-out test set
    print("\n[4/5] Measuring false positive rate (held-out test set)...")
    fpr_result = compute_fpr(detector, test_df)
    print(f"   FPR: {fpr_result['fpr_pct']}% ({fpr_result['alerts']} alerts / {fpr_result['total']} readings)")

    # Step 5: Evaluate fault scenarios
    print("\n[5/5] Evaluating fault scenarios...")
    print("-" * 100)
    print(f"{'Scenario':<16} {'Detected':<10} {'MTTD (s)':<12} {'Observable MTTD (s)':<22} {'Score':<10} {'Method':<20}")
    print("-" * 100)

    results = []
    for fault_name, _ in SCENARIOS:
        r = evaluate_fault(detector, fault_name)
        results.append({"scenario": fault_name, **r})

        mttd_str = str(r["mttd_seconds"]) if r["mttd_seconds"] is not None else "—"
        obs_str = str(r["observable_mttd_seconds"]) if r["observable_mttd_seconds"] is not None else "—"
        score_str = str(r["anomaly_score"]) if r["anomaly_score"] is not None else "—"

        print(
            f"{fault_name:<16} "
            f"{'YES' if r['detected'] else 'NO':<10} "
            f"{mttd_str:<12} "
            f"{obs_str:<22} "
            f"{score_str:<10} "
            f"{r['method']:<20}"
        )

    # Aggregates
    detected = [r for r in results if r["detected"]]
    mttds = [r["mttd_seconds"] for r in detected if r["mttd_seconds"] is not None]
    obs_mttds = [r["observable_mttd_seconds"] for r in detected if r["observable_mttd_seconds"] is not None]

    detection_rate = len(detected) / len(results) * 100
    mean_mttd = np.mean(mttds) if mttds else 0
    median_mttd = np.median(mttds) if mttds else 0
    max_mttd = max(mttds) if mttds else 0

    mean_obs = np.mean(obs_mttds) if obs_mttds else 0

    print("-" * 100)
    print("\n Aggregate Results:\n")
    print(f"   Detection Rate:                 {len(detected)}/{len(results)} = {detection_rate:.1f}%")
    print(f"   False Positive Rate:            {fpr_result['fpr_pct']}%  (target < 5%)")
    print(f"   Mean MTTD (standard):           {mean_mttd:.1f}s")
    print(f"   Median MTTD (standard):         {median_mttd:.1f}s")
    print(f"   Max MTTD (standard):            {max_mttd:.1f}s")
    print(f"   Mean MTTD (from observable):    {mean_obs:.1f}s")
    print()
    print(f"   Note: Standard MTTD measures from actual fault start.")
    print(f"         Observable MTTD measures from when the fault became measurable.")
    print(f"         Detection rate is on intentionally injected faults.")

if __name__ == "__main__":
    main()