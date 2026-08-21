"""
AegisCrew AI — IBM Granite 3.0 Flight Surgeon Agent
Integrates with ibm-watsonx-ai SDK; falls back to deterministic mock
responses when credentials are absent (demo / offline mode).
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

from backend.core.config import (
    GRANITE_MODEL_ID,
    WATSONX_API_KEY,
    WATSONX_MOCK_MODE,
    WATSONX_PROJECT_ID,
    WATSONX_URL,
)
from backend.core.telemetry_schema import (
    AgentBriefingResponse,
    AgentChatResponse,
    AgentPrescribeResponse,
    Countermeasure,
    CrewStateResponse,
    RiskFactor,
)
from backend.agents.clinical_rag import build_rag_context, format_anomaly_summary

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy-initialise watsonx client
# ---------------------------------------------------------------------------
_wx_model = None


def _get_watsonx_model():
    global _wx_model
    if _wx_model is not None:
        return _wx_model
    if WATSONX_MOCK_MODE:
        return None
    try:
        from ibm_watsonx_ai import Credentials
        from ibm_watsonx_ai.foundation_models import ModelInference
        from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams

        creds = Credentials(url=WATSONX_URL, api_key=WATSONX_API_KEY)
        _wx_model = ModelInference(
            model_id=GRANITE_MODEL_ID,
            credentials=creds,
            project_id=WATSONX_PROJECT_ID,
            params={
                GenParams.MAX_NEW_TOKENS: 800,
                GenParams.TEMPERATURE: 0.2,
                GenParams.REPETITION_PENALTY: 1.1,
            },
        )
        logger.info("IBM watsonx.ai Granite model initialised: %s", GRANITE_MODEL_ID)
    except Exception as exc:
        logger.warning("watsonx init failed (%s) — falling back to mock mode", exc)
        _wx_model = None
    return _wx_model


# ---------------------------------------------------------------------------
# Prompt builder helpers
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = (
    "You are AegisCrew AI — the autonomous Chief Medical Officer and Flight Surgeon "
    "aboard the Artemis Mars Transit deep-space habitat. You have no real-time ground "
    "support (22-minute comms delay). You reason from NASA-STD-3001 physiological "
    "standards and NASA SP-2010-3407 clinical protocols. Be concise, clinically precise, "
    "and always cite the protocol ID and data values that drive your recommendations. "
    "Format responses in clear sections. Avoid speculation beyond the provided data."
)


def _call_granite(prompt: str) -> tuple[str, bool]:
    """
    Send prompt to IBM Granite 3.0.
    Returns (response_text, mock_mode_bool).
    """
    model = _get_watsonx_model()
    if model is None:
        return None, True   # signal mock fallback
    try:
        full_prompt = f"<|system|>\n{_SYSTEM_PROMPT}\n<|user|>\n{prompt}\n<|assistant|>\n"
        result = model.generate_text(prompt=full_prompt)
        return result, False
    except Exception as exc:
        logger.error("Granite generation error: %s", exc)
        return None, True


# ---------------------------------------------------------------------------
# Mock response library
# ---------------------------------------------------------------------------

def _mock_briefing(crew_state: CrewStateResponse) -> str:
    crew_lines = []
    for astro in crew_state.crew:
        p = astro.profile
        r = astro.risk
        crew_lines.append(
            f"  • {p.name} ({p.id}): Readiness {r.mission_readiness_score:.0f}% [{r.status}] — "
            f"Fatigue {r.fatigue_risk_score:.0f} | Cardio {r.cardiovascular_risk_score:.0f} | "
            f"Rad {r.radiation_risk_score:.0f}"
        )
    crew_summary = "\n".join(crew_lines)

    critical = [
        a for astro in crew_state.crew
        for a in astro.risk.anomalies
        if a.severity in ("CRITICAL", "HIGH")
    ]
    anomaly_text = (
        "\n".join(f"  ⚠ [{a.severity}] {a.category}: {a.description}" for a in critical)
        if critical else "  All crew within nominal operating parameters."
    )

    return f"""AEGISCREW AI — DAILY EXECUTIVE BRIEFING
Mission: {crew_state.mission_name}
MET Day: {crew_state.mission_elapsed_day} | Comms: {crew_state.comms_delay_seconds:.0f}s delay
Autonomous AI Mode: {'ACTIVE' if crew_state.autonomous_mode else 'STANDBY'}
Fleet Readiness: {crew_state.fleet_readiness:.1f}% [{crew_state.fleet_status}]

CREW MISSION READINESS SUMMARY:
{crew_summary}

ACTIVE CLINICAL ALERTS:
{anomaly_text}

FLIGHT SURGEON DIRECTIVE:
All crew health parameters are under continuous autonomous monitoring. IBM Granite 3.0
AI Medical Officer is processing bio-telemetry streams and cross-referencing NASA-STD-3001
clinical thresholds. Countermeasures have been auto-prescribed for flagged anomalies.
No ground flight surgeon uplink required for current operational cycle.

[IBM Granite 3-8B-Instruct | AegisCrew AI | NASA SP-2010-3407 | Mock Mode — Set WATSONX_API_KEY for live inference]"""


def _mock_prescribe(crew_id: str, anomaly_desc: str) -> str:
    return f"""COUNTERMEASURE PRESCRIPTION — {crew_id}
Clinical Basis: {anomaly_desc}

PROTOCOL PROT-CIRCADIAN-01 (if sleep debt anomaly):
  → 10,000-lux blue-enriched phototherapy at 460-480nm for 45 minutes upon waking
  → Restrict caffeine 6 hours pre-sleep. Enforce 60-min blackout sanctuary.
  → Defer high-risk EVA 24 hours. Delegate manual robotics to secondary crew member.
  Citation: NASA SP-2010-3407 Sec 5.2

PROTOCOL PROT-CO2-HYPERCAPNIA-02 (if CO₂ elevated):
  → Initiate Amine Swing Bed scrubber cycling to 120% nominal throughput
  → Supplemental 28% O₂ via nasal cannula 30 min if headache reported
  → Hold resistive exercise until CO₂ < 3,000 ppm
  Citation: NASA-STD-3001 Vol 2 Sec 6.2.2

PROTOCOL PROT-RAD-SPE-03 (if SPE active):
  → IMMEDIATE EVA TERMINATION. All crew ingress to water-wall storm shelter.
  → Oral antioxidant regimen: alpha-tocopherol 400 IU, selenium 200 mcg, NAC 600 mg
  → Continuous active dosimeter monitoring until SPE ALL-CLEAR
  Citation: NASA NSCR-2020; Cucinotta et al. 2017

[IBM Granite 3-8B-Instruct | Mock Mode]"""


def _mock_chat(message: str, scenario: str) -> str:
    return f"""AEGISCREW AI RESPONSE (Scenario: {scenario.upper()})

Query: "{message}"

Based on current crew bio-telemetry and NASA-STD-3001 clinical reference standards, the
AegisCrew AI flight surgeon provides the following assessment:

The multi-modal physiological monitoring system is continuously ingesting 8 concurrent
bio-telemetry streams: heart rate, HRV RMSSD, SpO₂, core temperature, PVT reaction
time, sleep accumulation, radiation dosimetry, and cabin atmospheric chemistry.

Risk algorithms are grounded in:
  • NASA-STD-3001 (Spaceflight Human-System Standard)
  • NASA SP-2010-3407 (Flight Surgeon Medical Operations)
  • NASA NSCR-2020 (Space Radiation Cancer Risk Model)

For specific crew member analysis, trigger a scenario via the Emergency Simulator or
query individual crew risk assessments via /api/crew/status.

[IBM Granite 3-8B-Instruct | AegisCrew AI | Mock Mode — Configure WATSONX_API_KEY for live AI responses]"""


# ---------------------------------------------------------------------------
# Public API functions
# ---------------------------------------------------------------------------

def generate_executive_briefing(crew_state: CrewStateResponse) -> AgentBriefingResponse:
    """
    Generate a daily executive briefing for the Mission Commander.
    Attempts IBM Granite 3.0; falls back to structured mock.
    """
    # Build RAG context from all active anomalies
    all_anomalies: List[RiskFactor] = []
    crew_status_lines = []
    for astro in crew_state.crew:
        all_anomalies.extend(astro.risk.anomalies)
        crew_status_lines.append(
            f"{astro.profile.id} ({astro.profile.name}): "
            f"Readiness={astro.risk.mission_readiness_score:.1f}% [{astro.risk.status}], "
            f"HR={astro.latest_frame.vitals.heart_rate_bpm:.0f} bpm, "
            f"HRV={astro.latest_frame.vitals.hrv_rmssd_ms:.0f} ms, "
            f"SpO2={astro.latest_frame.vitals.spo2_percent:.1f}%, "
            f"SleepDebt={astro.latest_frame.circadian.sleep_debt_72h_hrs:.1f} hrs, "
            f"CO2={astro.latest_frame.atmosphere.cabin_co2_ppm:.0f} ppm, "
            f"Rad={astro.latest_frame.radiation.daily_radiation_mgy:.2f} mGy/day"
        )

    rag_ctx = build_rag_context(all_anomalies, "\n".join(crew_status_lines))
    anomaly_summary = format_anomaly_summary(all_anomalies)

    prompt = f"""You are the autonomous AegisCrew AI Flight Surgeon.
Generate a professional daily executive briefing for Mission Commander Elena Vance.

{rag_ctx}

{anomaly_summary}

Mission Day: {crew_state.mission_elapsed_day}
Active Scenario: {crew_state.active_scenario}
Fleet Readiness: {crew_state.fleet_readiness:.1f}% [{crew_state.fleet_status}]

Format the briefing with: 1) Fleet Status Overview 2) Per-Crew Risk Summary 3) Active Protocols 4) Recommended Actions."""

    response_text, is_mock = _call_granite(prompt)

    if is_mock or response_text is None:
        response_text = _mock_briefing(crew_state)
        is_mock = True

    return AgentBriefingResponse(
        briefing=response_text,
        generated_at=datetime.now(tz=timezone.utc),
        model_used=GRANITE_MODEL_ID,
        mock_mode=is_mock,
    )


def prescribe_countermeasures(
    crew_id: str,
    anomalies: List[RiskFactor],
) -> AgentPrescribeResponse:
    """
    Generate targeted countermeasures for a crew member's anomalies.
    Returns both a natural-language prescription and structured Countermeasure objects.
    """
    from backend.data.nasa_loader import load_flight_surgeon_protocols
    anomaly_text = format_anomaly_summary(anomalies)
    rag_ctx = build_rag_context(anomalies)

    prompt = f"""Crew member {crew_id} has the following active clinical anomalies:
{anomaly_text}

{rag_ctx}

Generate precise, actionable clinical countermeasures. For each intervention, cite the
exact NASA protocol ID, the specific dosage/timing, and the operational constraint.
Use numbered steps. Be concise and clinically specific."""

    response_text, is_mock = _call_granite(prompt)
    if is_mock or response_text is None:
        response_text = _mock_prescribe(crew_id, anomaly_text)
        is_mock = True

    # Map anomaly protocol IDs to structured Countermeasure objects
    from backend.data.nasa_loader import get_protocol_by_id
    from backend.ml_engine.risk_scorer import detect_anomalies

    urgency_map = {"CRITICAL": "IMMEDIATE", "HIGH": "URGENT", "MODERATE": "PRIORITY", "LOW": "ROUTINE"}
    countermeasures: List[Countermeasure] = []
    seen_pids: set = set()

    for a in anomalies:
        if a.protocol_id and a.protocol_id not in seen_pids:
            p = get_protocol_by_id(a.protocol_id)
            if p:
                countermeasures.append(Countermeasure(
                    protocol_id=p.get("id", a.protocol_id),
                    title=p.get("title", "Clinical Intervention"),
                    category=p.get("category", a.category),
                    clinical_action=p.get("clinical_action", ""),
                    operational_impact=p.get("operational_impact", ""),
                    urgency=urgency_map.get(a.severity, "PRIORITY"),  # type: ignore
                    citations=p.get("citations", []),
                ))
                seen_pids.add(a.protocol_id)

    return AgentPrescribeResponse(
        crew_id=crew_id,
        prescription=response_text,
        countermeasures=countermeasures,
        model_used=GRANITE_MODEL_ID,
        mock_mode=is_mock,
    )


def chat_flight_surgeon(
    user_message: str,
    current_crew_state: CrewStateResponse | None = None,
    active_scenario: str = "nominal",
) -> AgentChatResponse:
    """
    Interactive Q&A with the AegisCrew AI flight surgeon.
    Provides data-grounded explanations of risk rationales.
    """
    context_lines = []
    all_anomalies: List[RiskFactor] = []
    if current_crew_state:
        for astro in current_crew_state.crew:
            all_anomalies.extend(astro.risk.anomalies)
            context_lines.append(
                f"{astro.profile.id}: Readiness={astro.risk.mission_readiness_score:.0f}% "
                f"[{astro.risk.status}]"
            )

    rag_ctx = build_rag_context(all_anomalies, "\n".join(context_lines))

    prompt = f"""You are the AegisCrew AI autonomous Flight Surgeon.
A crew member or ground operator asks: "{user_message}"

Current Scenario: {active_scenario}
{rag_ctx}

Answer with clinical precision, citing exact values and NASA protocol references.
Keep response under 300 words."""

    response_text, is_mock = _call_granite(prompt)
    if is_mock or response_text is None:
        response_text = _mock_chat(user_message, active_scenario)
        is_mock = True

    return AgentChatResponse(
        reply=response_text,
        model_used=GRANITE_MODEL_ID,
        mock_mode=is_mock,
    )
