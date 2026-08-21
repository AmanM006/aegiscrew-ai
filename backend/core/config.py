"""
AegisCrew AI — Central Configuration
Reads from environment variables; falls back to sensible defaults so the
application starts even without a .env file (mock / demo mode).
"""
from __future__ import annotations

import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Base paths
# ---------------------------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parent.parent   # aegiscrew-ai/backend/
REPO_ROOT   = BACKEND_DIR.parent                       # aegiscrew-ai/

# Real NASA data lives in data/ inside repository (or workspace parent)
if (REPO_ROOT / "data").exists():
    DATA_DIR = REPO_ROOT / "data"
elif (WORKSPACE_ROOT / "data").exists():
    DATA_DIR = WORKSPACE_ROOT / "data"
else:
    DATA_DIR = BACKEND_DIR / "data"

NASA_BIOMETRICS_PATH = DATA_DIR / "nasa_osdr" / "nasa_crew_biometrics_reference.json"
NASA_PROTOCOLS_PATH  = DATA_DIR / "clinical_protocols" / "nasa_flight_surgeon_protocols.json"
NASA_TIMESERIES_PATH = DATA_DIR / "nasa_osdr" / "nasa_iss_timeseries_dataset.csv"


# ---------------------------------------------------------------------------
# IBM watsonx.ai credentials  (optional — falls back to mock mode)
# ---------------------------------------------------------------------------
WATSONX_API_KEY    = os.getenv("WATSONX_API_KEY", "")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID", "")
WATSONX_URL        = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
GRANITE_MODEL_ID   = os.getenv("GRANITE_MODEL_ID", "ibm/granite-3-8b-instruct")

# If credentials are missing, the agent falls back to deterministic mock responses
WATSONX_MOCK_MODE: bool = not (WATSONX_API_KEY and WATSONX_PROJECT_ID)

# ---------------------------------------------------------------------------
# FastAPI / CORS
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
]

# ---------------------------------------------------------------------------
# Mission parameters
# ---------------------------------------------------------------------------
MISSION_NAME        = "Artemis Mars Transit (Deep Space Habitat)"
MISSION_ELAPSED_DAY = int(os.getenv("MISSION_ELAPSED_DAY", "142"))

# Communication delay presets (seconds)
COMMS_DELAY_PRESETS = {
    "ISS":           0,
    "Lunar Gateway": 1.3,
    "Mars Transit":  1200,   # 20 minutes
}

# ---------------------------------------------------------------------------
# Risk thresholds (mirrors NASA-STD-3001 data in biometrics JSON)
# ---------------------------------------------------------------------------
READINESS_GREEN  = 80
READINESS_AMBER  = 50
RADIATION_SPE_THRESHOLD_MGY   = 10.0
CO2_WARNING_PPM               = 4500
CO2_CRITICAL_PPM              = 7000
SLEEP_DEBT_WARNING_HOURS      = 4.5
SLEEP_DEBT_CRITICAL_HOURS     = 7.0
