"""
AegisCrew AI — FastAPI Application Entry Point
All REST API endpoints for the Mission Control frontend.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import (
    ALLOWED_ORIGINS,
    COMMS_DELAY_PRESETS,
    MISSION_ELAPSED_DAY,
    MISSION_NAME,
    WATSONX_MOCK_MODE,
)
from backend.core.telemetry_schema import (
    AgentBriefingRequest,
    AgentBriefingResponse,
    AgentChatRequest,
    AgentChatResponse,
    AgentPrescribeRequest,
    AgentPrescribeResponse,
    AstronautStateResponse,
    CrewProfile,
    CrewStateResponse,
    ScenarioRequest,
)
from backend.data.telemetry_streamer import get_all_crew_ids, get_frames_24h, get_latest_frame
from backend.data.nasa_loader import get_crew_profiles
from backend.ml_engine.risk_scorer import assess_crew_member
from backend.simulator.scenario_manager import (
    activate_scenario,
    get_active_scenario,
    get_scenario_descriptions,
)
from backend.agents.flight_surgeon_granite import (
    chat_flight_surgeon,
    generate_executive_briefing,
    prescribe_countermeasures as _prescribe_countermeasures,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    """Train IsolationForest models on NASA telemetry at startup."""
    logger.info("AegisCrew AI startup — training ML anomaly detection models...")
    try:
        from backend.ml_engine.anomaly_detector import fit_models
        fit_models()
    except Exception as exc:
        logger.warning("ML model training failed (will use threshold-only mode): %s", exc)
    yield
    logger.info("AegisCrew AI shutdown.")


app = FastAPI(
    title="AegisCrew AI",
    description="Autonomous Deep-Space Chief Medical Officer & Bio-Telemetry Intelligence Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Utility: build a full CrewStateResponse
# ---------------------------------------------------------------------------

def _build_crew_state(scenario: str = "nominal") -> CrewStateResponse:
    crew_ids  = get_all_crew_ids()
    profiles  = {p["id"]: p for p in get_crew_profiles()}
    crew_out: List[AstronautStateResponse] = []

    for cid in crew_ids:
        frame    = get_latest_frame(cid)
        risk     = assess_crew_member(frame)
        history  = get_frames_24h(cid)
        prof_raw = profiles.get(cid, {})

        profile = CrewProfile(
            id=prof_raw.get("id", cid),
            name=prof_raw.get("name", cid),
            role=prof_raw.get("role", "Crew Member"),
            age=prof_raw.get("age", 35),
            gender=prof_raw.get("gender", "Unknown"),
            baseline_hr=prof_raw.get("baseline", {}).get("resting_heart_rate", 65),
            baseline_hrv=prof_raw.get("baseline", {}).get("hrv_rmssd", 55),
            baseline_spo2=prof_raw.get("baseline", {}).get("spo2_percent", 98),
            baseline_pvt_ms=prof_raw.get("baseline", {}).get("pvt_reaction_time_ms", 220),
            target_sleep_hours=prof_raw.get("baseline", {}).get("target_sleep_hours", 8.0),
        )

        # Auto-prescribe for active anomalies
        from backend.agents.flight_surgeon_granite import prescribe_countermeasures as prescribe
        countermeasures = []
        if risk.anomalies:
            try:
                resp = prescribe(cid, risk.anomalies)
                countermeasures = resp.countermeasures
            except Exception:
                pass

        crew_out.append(AstronautStateResponse(
            profile=profile,
            latest_frame=frame,
            risk=risk,
            active_countermeasures=countermeasures,
            history_24h=history[:12],   # cap at 12 frames for API response size
        ))

    # Fleet readiness = mean of all individual readiness scores
    readiness_scores = [a.risk.mission_readiness_score for a in crew_out]
    fleet_readiness  = sum(readiness_scores) / max(len(readiness_scores), 1)

    from backend.ml_engine.risk_scorer import classify_status
    fleet_status = classify_status(fleet_readiness)

    # Cross-crew correlation check
    from backend.ml_engine.correlation_engine import detect_crew_wide_pattern
    latest_frames = [a.latest_frame for a in crew_out]
    crew_names    = {a.profile.id: a.profile.name for a in crew_out}
    crew_wide_alert = None
    try:
        pattern = detect_crew_wide_pattern(latest_frames, crew_names)
        if pattern is not None:
            # Convert dataclass → Pydantic model
            from backend.core.telemetry_schema import CrewPatternAlert as _CPAlert
            crew_wide_alert = _CPAlert(
                pattern_type=pattern.pattern_type,
                affected_crew=pattern.affected_crew,
                affected_names=pattern.affected_names,
                shared_features=pattern.shared_features,
                likely_root_cause=pattern.likely_root_cause,
                severity=pattern.severity,
                recommendation=pattern.recommendation,
            )
    except Exception as exc:
        logger.warning("Correlation engine error (non-fatal): %s", exc)

    comms_delay = COMMS_DELAY_PRESETS.get("Mars Transit", 1200.0)

    return CrewStateResponse(
        mission_name=MISSION_NAME,
        mission_elapsed_day=MISSION_ELAPSED_DAY,
        comms_delay_seconds=comms_delay,
        autonomous_mode=True,
        crew=crew_out,
        fleet_readiness=round(fleet_readiness, 1),
        fleet_status=fleet_status,
        active_scenario=scenario,
        crew_wide_alert=crew_wide_alert,
    )


from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", tags=["hero"])
def serve_hero():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {
        "service": "AegisCrew AI",
        "status": "operational",
        "mock_mode": WATSONX_MOCK_MODE,
        "active_scenario": get_active_scenario(),
    }

@app.get("/dashboard", tags=["dashboard"])
def serve_dashboard():
    dash_file = os.path.join(STATIC_DIR, "dashboard.html")
    if os.path.exists(dash_file):
        return FileResponse(dash_file)
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {
        "service": "AegisCrew AI",
        "status": "operational",
        "mock_mode": WATSONX_MOCK_MODE,
        "active_scenario": get_active_scenario(),
    }




@app.get("/api/crew/status", response_model=CrewStateResponse, tags=["crew"])
def get_crew_status():
    """Return current mission state for all 4 crew members."""
    return _build_crew_state(get_active_scenario())


@app.get("/api/crew/{crew_id}/history", tags=["crew"])
def get_crew_history(crew_id: str, mission_day: int | None = None):
    """Return 24-hour telemetry history for a specific crew member."""
    crew_ids = get_all_crew_ids()
    if crew_id not in crew_ids:
        raise HTTPException(404, detail=f"Crew ID '{crew_id}' not found. Valid: {crew_ids}")
    frames = get_frames_24h(crew_id, mission_day)
    return {"crew_id": crew_id, "mission_day": mission_day, "frames": [f.model_dump() for f in frames]}


@app.post("/api/simulator/scenario", tags=["simulator"])
def set_scenario(req: ScenarioRequest):
    """Activate a named emergency scenario and update live telemetry overrides."""
    description = activate_scenario(req.scenario)
    return {
        "active_scenario": req.scenario,
        "description": description,
        "scenarios": get_scenario_descriptions(),
    }


@app.get("/api/simulator/scenarios", tags=["simulator"])
def list_scenarios():
    """List all available scenarios with descriptions."""
    return {
        "active": get_active_scenario(),
        "scenarios": get_scenario_descriptions(),
    }


@app.post("/api/agent/briefing", response_model=AgentBriefingResponse, tags=["agent"])
def get_briefing(req: AgentBriefingRequest):
    """
    Generate IBM Granite 3.0 daily executive briefing for Mission Commander.
    """
    crew_state = _build_crew_state(get_active_scenario())
    return generate_executive_briefing(crew_state)


@app.post("/api/agent/prescribe", response_model=AgentPrescribeResponse, tags=["agent"])
def get_prescription(req: AgentPrescribeRequest):
    """
    Generate targeted clinical countermeasures for a specific crew member.
    """
    crew_ids = get_all_crew_ids()
    if req.crew_id not in crew_ids:
        raise HTTPException(404, detail=f"Crew ID '{req.crew_id}' not found.")
    frame     = get_latest_frame(req.crew_id)
    risk      = assess_crew_member(frame)
    anomalies = risk.anomalies
    if not anomalies:
        # Add a descriptive anomaly if the request explicitly asks for one
        from backend.core.telemetry_schema import RiskFactor
        anomalies = [RiskFactor(
            category="General",
            severity="LOW",
            value=0.0,
            threshold=0.0,
            description=req.anomaly_description or "Routine wellness check requested.",
        )]
    return _prescribe_countermeasures(req.crew_id, anomalies)


@app.post("/api/agent/chat", response_model=AgentChatResponse, tags=["agent"])
def agent_chat(req: AgentChatRequest):
    """
    Interactive Q&A with the AegisCrew AI IBM Granite flight surgeon.
    """
    crew_state = _build_crew_state(get_active_scenario())
    return chat_flight_surgeon(req.user_message, crew_state, req.active_scenario)
