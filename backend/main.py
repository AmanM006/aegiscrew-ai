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
from backend.data.nasa_loader import get_protocol_by_id

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
    version="4.0.0",
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

        # Map anomalies → structured Countermeasures via fast in-memory protocol lookup
        # (NO live LLM call here — keeps GET /api/crew/status at <10ms)
        # Full IBM Granite synthesis runs only in POST /api/agent/prescribe (on-demand).
        from backend.core.telemetry_schema import Countermeasure
        _urgency_map = {"CRITICAL": "IMMEDIATE", "HIGH": "URGENT", "MODERATE": "PRIORITY", "LOW": "ROUTINE"}
        countermeasures = []
        seen_pids: set = set()
        for anomaly in risk.anomalies:
            pid = anomaly.protocol_id
            if pid and pid not in seen_pids:
                prot = get_protocol_by_id(pid)
                if prot:
                    countermeasures.append(Countermeasure(
                        protocol_id=prot.get("id", pid),
                        title=prot.get("title", "Clinical Intervention"),
                        category=prot.get("category", anomaly.category),
                        clinical_action=prot.get("clinical_action", ""),
                        operational_impact=prot.get("operational_impact", ""),
                        urgency=_urgency_map.get(anomaly.severity, "PRIORITY"),
                        citations=prot.get("citations", []),
                    ))
                    seen_pids.add(pid)

        # Predictive trajectory
        from backend.ml_engine.prediction_engine import predict_crew_trajectory
        from backend.core.telemetry_schema import PredictionResult as _PR
        prediction = None
        try:
            if len(history) >= 2:
                pred = predict_crew_trajectory(history, risk.mission_readiness_score)
                prediction = _PR(
                    crew_id=pred.crew_id,
                    current_readiness=pred.current_readiness,
                    trend_per_hour=pred.trend_per_hour,
                    hours_to_red=pred.hours_to_red,
                    hours_to_amber=pred.hours_to_amber,
                    predicted_status_in_6h=pred.predicted_status_in_6h,
                    prediction_basis=pred.prediction_basis,
                    confidence=pred.confidence,
                )
        except Exception as exc:
            logger.debug("Prediction engine error (non-fatal): %s", exc)

        crew_out.append(AstronautStateResponse(
            profile=profile,
            latest_frame=frame,
            risk=risk,
            active_countermeasures=countermeasures,
            history_24h=history[:48],   # 48 × 30-min samples = full 24-hr window
            prediction=prediction,
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


# ---------------------------------------------------------------------------
# Health-check root endpoint (JSON only — frontend is Next.js on port 3000)
# ---------------------------------------------------------------------------

@app.get("/", tags=["health"])
def health_check():
    """API health check. Mission Control UI: http://localhost:3000"""
    return {
        "status": "online",
        "service": "AegisCrew AI API",
        "version": "4.0.0",
        "model": "ibm/granite-4-h-small",
        "mock_mode": WATSONX_MOCK_MODE,
        "active_scenario": get_active_scenario(),
        "docs": "/docs",
        "frontend": "http://localhost:3000",
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
    Generate IBM Granite 4 daily executive briefing for Mission Commander.
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
    Interactive Q&A with the AegisCrew AI IBM Granite 4 flight surgeon.
    Accepts optional `history` list for multi-turn conversation context.
    """
    crew_state = _build_crew_state(get_active_scenario())
    history = [{"role": t.role, "content": t.content} for t in req.history] if req.history else None
    return chat_flight_surgeon(req.user_message, crew_state, req.active_scenario, history)


@app.get("/api/debug/correlation", tags=["debug"])
def debug_correlation():
    """
    Debug endpoint — returns raw correlation engine output for current scenario.
    Use this to verify crew_wide_alert is populating when CO2/SPE scenarios are active.
    """
    from backend.data.telemetry_streamer import get_all_crew_ids, get_latest_frame
    from backend.data.nasa_loader import get_crew_profiles
    from backend.ml_engine.correlation_engine import detect_crew_wide_pattern, _flag_deviating_features

    crew_ids = get_all_crew_ids()
    profiles = {p["id"]: p["name"] for p in get_crew_profiles()}
    frames   = [get_latest_frame(cid) for cid in crew_ids]

    per_crew_flags = {
        f.crew_id: {
            "flags": _flag_deviating_features(f),
            "cabin_co2_ppm": f.atmosphere.cabin_co2_ppm,
            "daily_radiation_mgy": f.radiation.daily_radiation_mgy,
            "hrv_rmssd_ms": f.vitals.hrv_rmssd_ms,
            "sleep_debt_72h_hrs": f.circadian.sleep_debt_72h_hrs,
        }
        for f in frames
    }

    pattern = detect_crew_wide_pattern(frames, profiles)
    return {
        "active_scenario": get_active_scenario(),
        "per_crew_flags": per_crew_flags,
        "crew_wide_alert": pattern.__dict__ if pattern else None,
    }
