import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Baseline metrics for healthy infrastructure
BASELINE = {
    "latency_ms": 180,
    "error_rate_pct": 0.2,
    "cpu_pct": 22,
    "memory_pct": 40,
    "db_connections": 20,
}

# Rule-based detection thresholds
THRESHOLDS = {
    "latency_ms": {"warning": 500, "critical": 1000},
    "error_rate_pct": {"warning": 5, "critical": 15},
    "cpu_pct": {"warning": 75, "critical": 90},
    "memory_pct": {"warning": 80, "critical": 90},
    "db_connections": {"warning": 70, "critical": 85},
}

# Isolation Forest settings
IF_CONTAMINATION = 0.05
IF_N_ESTIMATORS = 100
IF_RANDOM_STATE = 42

# Data generation: 7 days at 30s intervals
DATA_DAYS = 7
INTERVAL_SECONDS = 30
POINTS_PER_DAY = 24 * 60 * 60 // INTERVAL_SECONDS  # 2880
TOTAL_POINTS = DATA_DAYS * POINTS_PER_DAY  # 20160

# Cold-start settings (for future use when training per-user models)
COLD_START_DAYS = 3       # Days before user gets personal model
FULL_TRAINING_DAYS = 7    # Days for full accuracy