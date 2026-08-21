"""
AegisCrew AI — Pydantic v2 Telemetry & Response Schemas
All wire-types used between the data pipeline, ML engine, agents, and FastAPI.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Physiological stream models
# ---------------------------------------------------------------------------

class AstronautVitals(BaseModel):
    heart_rate_bpm: float = Field(..., ge=20, le=250)
    hrv_rmssd_ms: float   = Field(..., ge=0)
    spo2_percent: float   = Field(..., ge=50, le=100)
    core_temp_c: float    = Field(..., ge=34.0, le=42.0)
    blood_pressure: Optional[str] = None   # e.g. "115/75"


class CircadianMetrics(BaseModel):
    sleep_hours_last_night: float  = Field(..., ge=0, le=24)
    sleep_debt_72h_hrs: float      = Field(..., ge=0)
    target_sleep_hours: float      = Field(default=8.0)
    pvt_reaction_time_ms: float    = Field(..., ge=100)
    circadian_phase_shift_hrs: float = Field(default=0.0)


class RadiationDosimetry(BaseModel):
    daily_radiation_mgy: float       = Field(..., ge=0)
    cumulative_radiation_msv: float  = Field(..., ge=0)
    spe_alert_status: Literal["NOMINAL", "WATCH", "WARNING", "EMERGENCY"] = "NOMINAL"


class CabinAtmosphere(BaseModel):
    cabin_co2_ppm: float      = Field(..., ge=0)
    cabin_o2_percent: float   = Field(..., ge=0, le=100)
    cabin_pressure_kpa: float = Field(..., ge=0)


class CognitiveAcuity(BaseModel):
    pvt_reaction_time_ms: float = Field(..., ge=100)
    fatigue_index: float        = Field(default=0.0, ge=0.0, le=1.0)
    cognitive_load_score: float = Field(default=50.0, ge=0.0, le=100.0)


# ---------------------------------------------------------------------------
# Unified per-sample telemetry frame
# ---------------------------------------------------------------------------

class TelemetryFrame(BaseModel):
    mission_day: int
    timestamp_utc: datetime
    crew_id: str
    vitals: AstronautVitals
    circadian: CircadianMetrics
    radiation: RadiationDosimetry
    atmosphere: CabinAtmosphere
    cognitive: CognitiveAcuity
    composite_readiness_score: float = Field(default=100.0, ge=0, le=100)
    status_traffic_light: Literal["GREEN", "AMBER", "RED"] = "GREEN"


# ---------------------------------------------------------------------------
# Risk assessment models
# ---------------------------------------------------------------------------

class RiskFactor(BaseModel):
    category: str
    severity: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]
    value: float
    threshold: float
    description: str
    protocol_id: Optional[str] = None


class RiskAssessment(BaseModel):
    crew_id: str
    timestamp_utc: datetime
    fatigue_risk_score: float          = Field(..., ge=0, le=100)
    cardiovascular_risk_score: float   = Field(..., ge=0, le=100)
    radiation_risk_score: float        = Field(..., ge=0, le=100)
    mission_readiness_score: float     = Field(..., ge=0, le=100)
    status: Literal["GREEN", "AMBER", "RED"] = "GREEN"
    anomalies: List[RiskFactor] = []


# ---------------------------------------------------------------------------
# Clinical countermeasures
# ---------------------------------------------------------------------------

class Countermeasure(BaseModel):
    protocol_id: str
    title: str
    category: str
    clinical_action: str
    operational_impact: str
    urgency: Literal["ROUTINE", "PRIORITY", "URGENT", "IMMEDIATE"]
    citations: List[str] = []


# ---------------------------------------------------------------------------
# Crew member static profile
# ---------------------------------------------------------------------------

class CrewProfile(BaseModel):
    id: str
    name: str
    role: str
    age: int
    gender: str
    baseline_hr: float
    baseline_hrv: float
    baseline_spo2: float
    baseline_pvt_ms: float
    target_sleep_hours: float


# ---------------------------------------------------------------------------
# Aggregated crew state (API response)
# ---------------------------------------------------------------------------

class AstronautStateResponse(BaseModel):
    profile: CrewProfile
    latest_frame: TelemetryFrame
    risk: RiskAssessment
    active_countermeasures: List[Countermeasure] = []
    history_24h: List[TelemetryFrame] = []


class CrewStateResponse(BaseModel):
    mission_name: str
    mission_elapsed_day: int
    comms_delay_seconds: float
    autonomous_mode: bool
    crew: List[AstronautStateResponse]
    fleet_readiness: float       # average readiness across all crew
    fleet_status: Literal["GREEN", "AMBER", "RED"] = "GREEN"
    active_scenario: str = "nominal"


# ---------------------------------------------------------------------------
# Agent request / response schemas
# ---------------------------------------------------------------------------

class AgentBriefingRequest(BaseModel):
    mission_elapsed_day: int = 142
    active_scenario: str = "nominal"


class AgentBriefingResponse(BaseModel):
    briefing: str
    generated_at: datetime
    model_used: str
    mock_mode: bool = False


class AgentPrescribeRequest(BaseModel):
    crew_id: str
    anomaly_description: str


class AgentPrescribeResponse(BaseModel):
    crew_id: str
    prescription: str
    countermeasures: List[Countermeasure]
    model_used: str
    mock_mode: bool = False


class AgentChatRequest(BaseModel):
    user_message: str
    active_scenario: str = "nominal"


class AgentChatResponse(BaseModel):
    reply: str
    model_used: str
    mock_mode: bool = False


class ScenarioRequest(BaseModel):
    scenario: Literal["nominal", "spe", "co2_spike", "sleep_deprivation"]
