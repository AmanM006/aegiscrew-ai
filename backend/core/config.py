"""
AegisCrew AI — Central Configuration
Reads from environment variables; falls back to sensible defaults so the
application starts even without a .env file (mock / demo mode).
A .env file at <backend>/.env (or project root/.env) is auto-loaded when
python-dotenv is installed — no manual sourcing required.
"""
from __future__ import annotations

import os
from pathlib import Path

# Auto-load .env if python-dotenv is available
# Searches: backend/.env → project root/.env
def _load_dotenv() -> None:
    try:
        from dotenv import load_dotenv
        _here = Path(__file__).resolve().parent.parent  # backend/
        for candidate in (_here / ".env", _here.parent / ".env"):
            if candidate.exists():
                load_dotenv(candidate, override=False)
                break
    except ImportError:
        pass  # python-dotenv not installed — rely on OS env vars

_load_dotenv()

# ---------------------------------------------------------------------------
# Base paths
# ---------------------------------------------------------------------------
BACKEND_DIR    = Path(__file__).resolve().parent.parent   # aegiscrew-ai/backend/
REPO_ROOT      = BACKEND_DIR.parent                       # aegiscrew-ai/
WORKSPACE_ROOT = REPO_ROOT.parent                         # august-ibm/ (workspace root)

# Real NASA data lives one level above the aegiscrew-ai/ project folder
def _resolve_data_dir() -> Path:
    for candidate in (REPO_ROOT / "data", WORKSPACE_ROOT / "data", BACKEND_DIR / "data"):
        if candidate.exists():
            return candidate
    return WORKSPACE_ROOT / "data"   # best-guess default even if absent

DATA_DIR = _resolve_data_dir()

NASA_BIOMETRICS_PATH = DATA_DIR / "nasa_osdr" / "nasa_crew_biometrics_reference.json"
NASA_PROTOCOLS_PATH  = DATA_DIR / "clinical_protocols" / "nasa_flight_surgeon_protocols.json"
NASA_TIMESERIES_PATH = DATA_DIR / "nasa_osdr" / "nasa_iss_timeseries_dataset.csv"


# ---------------------------------------------------------------------------
# IBM watsonx.ai credentials  (optional — falls back to mock mode)
# ---------------------------------------------------------------------------
WATSONX_API_KEY    = os.getenv("WATSONX_API_KEY", "")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID", "")
WATSONX_URL        = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
# granite-4-h-small is the latest Granite available on this project's watsonx.ai instance.
# Override with GRANITE_MODEL_ID env var if needed.
GRANITE_MODEL_ID   = os.getenv("GRANITE_MODEL_ID", "ibm/granite-4-h-small")

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
