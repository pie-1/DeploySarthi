"""
Realistic synthetic data generator.

Generates:
- healthy_train.csv  (70% of healthy) — used to train Isolation Forest
- healthy_val.csv    (15% of healthy) — used to tune contamination
- healthy_test.csv   (15% of healthy) — used for false positive measurement
- 6 fault CSVs — each with fault_started_at and fault_ended_at timestamps
"""

import numpy as np
import pandas as pd
from pathlib import Path
from .config import BASELINE, DATA_DAYS, INTERVAL_SECONDS, TOTAL_POINTS

RNG = np.random.default_rng(seed=42)
DATA_DIR = Path(__file__).parent.parent / "data"
FAULTS_DIR = DATA_DIR / "faults"

MEMORY_LEAK_THRESHOLD_PCT = 75.0

# Train/val/test split ratios for healthy data
SPLIT_TRAIN = 0.70
SPLIT_VAL = 0.15
SPLIT_TEST = 0.15


def _daily_pattern(hour_of_day: float, amplitude: float, peak_hour: float = 14.0) -> float:
    return amplitude * np.sin(2 * np.pi * (hour_of_day - peak_hour + 6) / 24)


def _micro_events(n_points: int, probability: float, magnitude: float) -> np.ndarray:
    events = np.zeros(n_points)
    mask = RNG.random(n_points) < probability
    events[mask] = RNG.normal(magnitude, magnitude * 0.3, size=mask.sum())
    return events


def generate_healthy(n_points: int = TOTAL_POINTS) -> pd.DataFrame:
    timestamps = pd.date_range(
        end=pd.Timestamp.now(),
        periods=n_points,
        freq=f"{INTERVAL_SECONDS}s",
    )
    hours = timestamps.hour + timestamps.minute / 60

    latency = (
        BASELINE["latency_ms"]
        + RNG.normal(0, 8, n_points)
        + _daily_pattern(hours, amplitude=25)
        + _micro_events(n_points, probability=0.01, magnitude=40)
    )
    error_rate = (
        BASELINE["error_rate_pct"]
        + np.abs(RNG.normal(0, 0.1, n_points))
        + _micro_events(n_points, probability=0.005, magnitude=1.5)
    )
    cpu = (
        BASELINE["cpu_pct"]
        + RNG.normal(0, 3, n_points)
        + _daily_pattern(hours, amplitude=8)
        + _micro_events(n_points, probability=0.01, magnitude=12)
    )
    memory = (
        BASELINE["memory_pct"]
        + RNG.normal(0, 2, n_points)
        + _daily_pattern(hours, amplitude=5)
    )
    db_conn = (
        BASELINE["db_connections"]
        + RNG.normal(0, 2, n_points)
        + _daily_pattern(hours, amplitude=4)
    )

    return pd.DataFrame({
        "timestamp": timestamps,
        "latency_ms": np.clip(latency, 50, None),
        "error_rate_pct": np.clip(error_rate, 0, 100),
        "cpu_pct": np.clip(cpu, 0, 100),
        "memory_pct": np.clip(memory, 0, 100),
        "db_connections": np.clip(db_conn, 0, 100),
        "is_anomaly": 0,
        "fault_type": "healthy",
    })

def _inject_n_plus_1(df: pd.DataFrame, start: int) -> pd.DataFrame:
    end = min(start + 40, len(df))
    n = end - start
    idx = df.index[start:end]
    df.loc[idx, "latency_ms"] += RNG.normal(500, 50, n)
    df.loc[idx, "db_connections"] += RNG.normal(35, 5, n)
    df.loc[idx, "cpu_pct"] += RNG.normal(15, 3, n)
    df.loc[idx, "is_anomaly"] = 1
    df.loc[idx, "fault_type"] = "n_plus_1"
    # Spike fault: observable immediately
    df.loc[idx, "fault_started_at"] = df.loc[idx[0], "timestamp"]
    df.loc[idx, "fault_ended_at"] = df.loc[idx[-1], "timestamp"]
    df.loc[idx, "actionable_at"] = df.loc[idx[0], "timestamp"]
    return df


def _inject_missing_env(df: pd.DataFrame, start: int) -> pd.DataFrame:
    end = min(start + 30, len(df))
    n = end - start
    idx = df.index[start:end]
    df.loc[idx, "error_rate_pct"] = RNG.uniform(80, 100, n)
    df.loc[idx, "latency_ms"] = RNG.uniform(10, 50, n)
    df.loc[idx, "cpu_pct"] = RNG.uniform(1, 5, n)
    df.loc[idx, "db_connections"] = 0
    df.loc[idx, "is_anomaly"] = 1
    df.loc[idx, "fault_type"] = "missing_env"
    df.loc[idx, "fault_started_at"] = df.loc[idx[0], "timestamp"]
    df.loc[idx, "fault_ended_at"] = df.loc[idx[-1], "timestamp"]
    df.loc[idx, "actionable_at"] = df.loc[idx[0], "timestamp"]
    return df


def _inject_memory_leak(df: pd.DataFrame, start: int, duration: int = 400) -> pd.DataFrame:
    """
    Memory leak: memory grows gradually over `duration` rows.

    Two timestamps are tracked:
    - fault_started_at: when leak injection begins
    - actionable_at:    when memory crosses MEMORY_LEAK_THRESHOLD_PCT
                        (this is when a human operator would consider it an incident)
    """
    end = min(start + duration, len(df))
    n = end - start
    idx = df.index[start:end]

    leak = np.linspace(0, 50, n)
    df.loc[idx, "memory_pct"] += leak
    df.loc[idx, "cpu_pct"] += np.linspace(0, 15, n)
    df.loc[idx, "fault_type"] = "memory_leak"

    # Fault injection starts here — this is the TRUE fault start
    df.loc[idx, "fault_started_at"] = df.loc[idx[0], "timestamp"]
    df.loc[idx, "fault_ended_at"] = df.loc[idx[-1], "timestamp"]

    # Find when memory crosses threshold
    memory_values = df.loc[idx, "memory_pct"].values
    threshold_offset = None
    for i, val in enumerate(memory_values):
        if val > MEMORY_LEAK_THRESHOLD_PCT:
            threshold_offset = i
            break

    if threshold_offset is not None:
        actionable_start = idx[threshold_offset]
        df.loc[idx, "actionable_at"] = df.loc[actionable_start, "timestamp"]
        # Mark ground truth as actionable for evaluation purposes
        df.loc[idx[threshold_offset:], "is_anomaly"] = 1
    else:
        # Threshold never crossed — no actionable anomaly
        df.loc[idx, "actionable_at"] = pd.NaT

    return df


def _inject_db_timeout(df: pd.DataFrame, start: int) -> pd.DataFrame:
    end = min(start + 50, len(df))
    n = end - start
    idx = df.index[start:end]
    df.loc[idx, "db_connections"] = RNG.uniform(90, 100, n)
    df.loc[idx, "latency_ms"] = RNG.uniform(1500, 3000, n)
    df.loc[idx, "error_rate_pct"] = RNG.uniform(20, 40, n)
    df.loc[idx, "is_anomaly"] = 1
    df.loc[idx, "fault_type"] = "db_timeout"
    df.loc[idx, "fault_started_at"] = df.loc[idx[0], "timestamp"]
    df.loc[idx, "fault_ended_at"] = df.loc[idx[-1], "timestamp"]
    df.loc[idx, "actionable_at"] = df.loc[idx[0], "timestamp"]
    return df


def _inject_bad_deploy(df: pd.DataFrame, start: int) -> pd.DataFrame:
    end = min(start + 35, len(df))
    n = end - start
    idx = df.index[start:end]
    df.loc[idx, "error_rate_pct"] = RNG.uniform(30, 60, n)
    df.loc[idx, "cpu_pct"] += RNG.normal(40, 5, n)
    df.loc[idx, "latency_ms"] += RNG.normal(300, 50, n)
    df.loc[idx, "is_anomaly"] = 1
    df.loc[idx, "fault_type"] = "bad_deploy"
    df.loc[idx, "fault_started_at"] = df.loc[idx[0], "timestamp"]
    df.loc[idx, "fault_ended_at"] = df.loc[idx[-1], "timestamp"]
    df.loc[idx, "actionable_at"] = df.loc[idx[0], "timestamp"]
    return df


def _inject_cost_spike(df: pd.DataFrame, start: int) -> pd.DataFrame:
    end = min(start + 60, len(df))
    n = end - start
    idx = df.index[start:end]
    df.loc[idx, "cpu_pct"] = RNG.uniform(85, 95, n)
    df.loc[idx, "memory_pct"] += RNG.normal(25, 3, n)
    df.loc[idx, "latency_ms"] += RNG.normal(200, 30, n)
    df.loc[idx, "is_anomaly"] = 1
    df.loc[idx, "fault_type"] = "cost_spike"
    df.loc[idx, "fault_started_at"] = df.loc[idx[0], "timestamp"]
    df.loc[idx, "fault_ended_at"] = df.loc[idx[-1], "timestamp"]
    df.loc[idx, "actionable_at"] = df.loc[idx[0], "timestamp"]
    return df


FAULT_INJECTORS = {
    "n_plus_1": _inject_n_plus_1,
    "missing_env": _inject_missing_env,
    "memory_leak": _inject_memory_leak,
    "db_timeout": _inject_db_timeout,
    "bad_deploy": _inject_bad_deploy,
    "cost_spike": _inject_cost_spike,
}


def generate_all_faults(healthy_df: pd.DataFrame) -> dict:
    faults = {}
    n = len(healthy_df)
    starts = {
        "n_plus_1": int(n * 0.15),
        "missing_env": int(n * 0.30),
        "memory_leak": int(n * 0.45),
        "db_timeout": int(n * 0.65),
        "bad_deploy": int(n * 0.78),
        "cost_spike": int(n * 0.88),
    }

    for fault_name, injector in FAULT_INJECTORS.items():
        df = healthy_df.copy()
        df["fault_started_at"] = pd.NaT
        df["fault_ended_at"] = pd.NaT
        df["actionable_at"] = pd.NaT
        df = injector(df, starts[fault_name])
        faults[fault_name] = df

    return faults


def save_all():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    FAULTS_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Generating {TOTAL_POINTS} points ({DATA_DAYS} days at {INTERVAL_SECONDS}s)...")
    healthy = generate_healthy()

    # Split: train / val / test
    n = len(healthy)
    n_train = int(n * SPLIT_TRAIN)
    n_val = int(n * SPLIT_VAL)

    train = healthy.iloc[:n_train].copy()
    val = healthy.iloc[n_train:n_train + n_val].copy()
    test = healthy.iloc[n_train + n_val:].copy()

    train.to_csv(DATA_DIR / "healthy_train.csv", index=False)
    val.to_csv(DATA_DIR / "healthy_val.csv", index=False)
    test.to_csv(DATA_DIR / "healthy_test.csv", index=False)

    print(f"✓ Saved healthy_train.csv ({len(train)} rows)")
    print(f"✓ Saved healthy_val.csv   ({len(val)} rows)")
    print(f"✓ Saved healthy_test.csv  ({len(test)} rows)")

    # Faults use the full healthy series as base
    faults = generate_all_faults(healthy)
    for name, df in faults.items():
        df.to_csv(FAULTS_DIR / f"{name}.csv", index=False)
        anomaly_count = (df["is_anomaly"] == 1).sum()
        print(f"✓ Saved faults/{name}.csv ({anomaly_count} anomaly rows)")

    print(f"\n All data generated in {DATA_DIR}")


if __name__ == "__main__":
    save_all()