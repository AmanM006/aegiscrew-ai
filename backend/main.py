"""
AegisCrew AI — FastAPI Application Entry Point
All REST API endpoints for the Mission Control frontend.
"""
from __future__ import annotations

import logging
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

app = FastAPI(
    title="AegisCrew AI",
    description="Autonomous Deep-Space Chief Medical Officer & Bio-Telemetry Intelligence Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
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
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/", tags=["health"])
def root():
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
