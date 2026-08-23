"""
AegisCrew AI — IBM Granite 4 Flight Surgeon Agent
Integrates with ibm-watsonx-ai SDK; falls back to deterministic mock
responses when credentials are absent (demo / offline mode).
"""
from __future__ import annotations

import json
import threading

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import backend.core.config as _cfg
# NOTE: all credential/flag reads use _cfg.<NAME> at call-time, NOT frozen import-time
# copies, so that .env loaded by config._load_dotenv() is always honoured.
from backend.core.telemetry_schema import (
    AgentBriefingResponse,
    AgentChatResponse,
    AgentPrescribeResponse,
    Countermeasure,
    CrewStateResponse,
    RiskFactor,
)
from backend.agents.clinical_rag import build_rag_context, format_anomaly_summary
from backend.core.audit_log import (
    audit_log,
    EVENT_BRIEFING_GENERATED,
    EVENT_COUNTERMEASURE,
    EVENT_TIMEOUT_FALLBACK,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy-initialise watsonx client
# ---------------------------------------------------------------------------
_wx_model = None


def _get_watsonx_model():
    """
    Lazy-init IBM watsonx ModelInference.
    Reads _cfg.WATSONX_MOCK_MODE at *call time* so that credentials loaded from
    .env by config._load_dotenv() are always honoured regardless of import order.
    """
    global _wx_model
    if _wx_model is not None:
        return _wx_model
    # Re-evaluate mock flag from the live module attribute, not a frozen import copy
    if _cfg.WATSONX_MOCK_MODE:
        return None
    try:
        from ibm_watsonx_ai import Credentials
        from ibm_watsonx_ai.foundation_models import ModelInference

        creds = Credentials(url=_cfg.WATSONX_URL, api_key=_cfg.WATSONX_API_KEY)
        _wx_model = ModelInference(
            model_id=_cfg.GRANITE_MODEL_ID,
            credentials=creds,
            project_id=_cfg.WATSONX_PROJECT_ID,
        )
        logger.info("IBM watsonx.ai Granite model initialised: %s", _cfg.GRANITE_MODEL_ID)
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


# Hard timeout for each Granite API call (seconds).  Prevents the briefing
# from hanging indefinitely when watsonx is slow or network-congested.
_GRANITE_TIMEOUT_S = 12


def _call_granite(prompt: str) -> tuple[str, bool]:
    """
    Send prompt to IBM Granite via the chat API (non-deprecated).
    Returns (response_text, mock_mode_bool).

    Wraps the synchronous SDK call in a daemon thread with a hard timeout
    so the frontend always resolves within ~12s even if watsonx is slow.
    On timeout, logs the event and returns (None, True) to trigger mock fallback.
    """
    model = _get_watsonx_model()
    if model is None:
        return None, True   # signal mock fallback

    result_container: list = [None]
    error_container: list = [None]

    def _do_call():
        try:
            messages = [
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user",   "content": prompt},
            ]
            res = model.chat(messages=messages, params={"max_tokens": 800, "temperature": 0.2})
            result_container[0] = res["choices"][0]["message"]["content"]
        except Exception as exc:
            error_container[0] = exc

    t = threading.Thread(target=_do_call, daemon=True)
    t.start()
    t.join(timeout=_GRANITE_TIMEOUT_S)

    if t.is_alive():
        # Thread still blocked after timeout — fall back to mock immediately
        logger.warning(
            "TIMEOUT: Granite API call exceeded %ss — falling back to mock briefing "
            "(watsonx may be slow; background thread discarded).",
            _GRANITE_TIMEOUT_S,
        )
        audit_log.append(
            event_type=EVENT_TIMEOUT_FALLBACK,
            astronaut_id="FLEET",
            summary=f"Granite API timed out after {_GRANITE_TIMEOUT_S}s — serving cached mock briefing",
            data_snapshot={"timeout_s": _GRANITE_TIMEOUT_S},
        )
        return None, True

    if error_container[0] is not None:
        logger.error("Granite chat API error: %s", error_container[0])
        return None, True

    return result_container[0], False


# ---------------------------------------------------------------------------
# Mock response library
# ---------------------------------------------------------------------------

def _mock_briefing(crew_state: CrewStateResponse) -> str:
    crew_lines = []
    for astro in crew_state.crew:
        p = astro.profile
        r = astro.risk
        ml_note = f" · ML {r.confidence}" if r.confidence and r.confidence != "threshold-only mode" else ""
        crew_lines.append(
            f"  • {p.name} ({p.id}): Readiness {r.mission_readiness_score:.0f}% [{r.status}]{ml_note} — "
            f"FAT {r.fatigue_risk_score:.0f} | CVX {r.cardiovascular_risk_score:.0f} | "
            f"RAD {r.radiation_risk_score:.0f} | ML {r.ml_anomaly_score:.0f}"
        )
    crew_summary = "\n".join(crew_lines)

    # Systems-level alert block
    systems_block = ""
    if crew_state.crew_wide_alert:
        cwa = crew_state.crew_wide_alert
        systems_block = f"""
╔══════════════════════════════════════════════════════════════╗
║  ⚠ SYSTEMS-LEVEL [{cwa.severity}] — {cwa.pattern_type} ROOT CAUSE IDENTIFIED   ║
╚══════════════════════════════════════════════════════════════╝
  Affected Crew : {', '.join(cwa.affected_names or cwa.affected_crew)}
  Shared Signal : {', '.join(cwa.shared_features)}
  Root Cause    : {cwa.likely_root_cause}
  Action        : {cwa.recommendation}

  ▶ This is NOT an isolated individual health event.
    Anomalies across multiple crew members share a common environmental trigger.
"""

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
{systems_block}
CREW MISSION READINESS SUMMARY (Hybrid Rule+ML Scoring):
{crew_summary}

ACTIVE CLINICAL ALERTS:
{anomaly_text}

FLIGHT SURGEON DIRECTIVE:
All crew health parameters are under continuous autonomous monitoring. IBM Granite 4
AI Medical Officer is processing bio-telemetry streams using hybrid rule-based + IsolationForest
ML anomaly detection (trained on 1,440 NASA OSDR historical samples). Cross-crew correlation
engine is monitoring for shared environmental root causes. No ground flight surgeon uplink
required for current operational cycle.

[IBM Granite 4 (granite-4-h-small) | AegisCrew AI | NASA SP-2010-3407 | Mock Mode — Set WATSONX_API_KEY for live inference]"""


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

[IBM Granite 4 (granite-4-h-small) | Mock Mode]"""


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

[IBM Granite 4 (granite-4-h-small) | AegisCrew AI | Mock Mode — Configure WATSONX_API_KEY for live AI responses]"""


# ---------------------------------------------------------------------------
# Multi-agent specialist architecture
# Radiation, Cardio, and Circadian specialist agents run in parallel; their
# outputs are synthesized by the Orchestrator agent into the final briefing.
# This mirrors the agentic AI pattern: domain specialists → supervisor synthesis.
# ---------------------------------------------------------------------------

_SPECIALIST_PROMPTS = {
    "radiation": (
        "You are the AegisCrew Radiation Specialist. Analyze ONLY radiation dosimetry data. "
        "Summarise in 3 concise bullets: current dose rate, cumulative risk, and recommended action. "
        "Reference NASA NSCR-2020 / Cucinotta protocols. Be terse."
    ),
    "cardio": (
        "You are the AegisCrew Cardiovascular Specialist. Analyze ONLY heart rate, HRV, SpO2, and blood pressure data. "
        "Summarise in 3 concise bullets: autonomic status, cardiovascular risk flag, and recommended action. "
        "Reference NASA-STD-3001 cardiovascular thresholds. Be terse."
    ),
    "circadian": (
        "You are the AegisCrew Circadian/Sleep Specialist. Analyze ONLY sleep debt, PVT reaction time, and circadian data. "
        "Summarise in 3 concise bullets: cognitive readiness, fatigue risk, and recommended action. "
        "Reference NASA SP-2010-3407 sleep/cognitive standards. Be terse."
    ),
}


def _call_specialist(specialist_role: str, crew_data_text: str) -> str | None:
    """
    Run a single specialist agent call with a focused domain prompt.
    Returns text or None on failure/timeout (orchestrator handles gracefully).
    """
    model = _get_watsonx_model()
    if model is None:
        return None

    system = _SPECIALIST_PROMPTS[specialist_role]
    result_container: list = [None]
    error_container: list = [None]

    def _do_call():
        try:
            res = model.chat(
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user",   "content": crew_data_text},
                ],
                params={"max_tokens": 250, "temperature": 0.15},
            )
            result_container[0] = res["choices"][0]["message"]["content"]
        except Exception as exc:
            error_container[0] = exc

    t = threading.Thread(target=_do_call, daemon=True)
    t.start()
    t.join(timeout=_GRANITE_TIMEOUT_S)

    if t.is_alive() or error_container[0] is not None:
        return None

    return result_container[0]


def _run_specialist_agents(crew_state: CrewStateResponse) -> dict[str, str] | None:
    """
    Run 3 specialist agents in parallel threads and return {role: analysis} dict.
    Falls back to None if live Granite is unavailable (triggers standard mock briefing).
    Only used when Granite is live (not in mock mode).
    """
    if _get_watsonx_model() is None:
        return None

    # Build focused data summary for each specialist
    crew_lines = []
    for a in crew_state.crew:
        f = a.latest_frame
        crew_lines.append(
            f"{a.profile.id} ({a.profile.name}) — "
            f"HR={f.vitals.heart_rate_bpm:.0f}bpm HRV={f.vitals.hrv_rmssd_ms:.0f}ms "
            f"SpO2={f.vitals.spo2_percent:.1f}% "
            f"Rad={f.radiation.daily_radiation_mgy:.2f}mGy/d SPE={f.radiation.spe_alert_status} "
            f"CO2={f.atmosphere.cabin_co2_ppm:.0f}ppm "
            f"SleepDebt={f.circadian.sleep_debt_72h_hrs:.1f}h "
            f"PVT={f.circadian.pvt_reaction_time_ms:.0f}ms "
            f"Readiness={a.risk.mission_readiness_score:.1f}%"
        )
    crew_data = "\n".join(crew_lines)

    specialists = {}
    threads: dict[str, threading.Thread] = {}
    results: dict[str, list] = {r: [None] for r in _SPECIALIST_PROMPTS}

    def _run(role: str):
        results[role][0] = _call_specialist(role, crew_data)

    for role in _SPECIALIST_PROMPTS:
        t = threading.Thread(target=_run, args=(role,), daemon=True)
        t.start()
        threads[role] = t

    for role, t in threads.items():
        t.join(timeout=_GRANITE_TIMEOUT_S)
        if results[role][0]:
            specialists[role] = results[role][0]

    if not specialists:
        return None   # all specialists failed — fall back to single-call mode

    logger.info(
        "Multi-agent specialists completed: %s / %d domain analyses",
        list(specialists.keys()), len(_SPECIALIST_PROMPTS),
    )
    return specialists


# ---------------------------------------------------------------------------
# Public API functions
# ---------------------------------------------------------------------------

def generate_executive_briefing(crew_state: CrewStateResponse) -> AgentBriefingResponse:
    """
    Generate a daily executive briefing for the Mission Commander.
    Uses multi-agent specialist architecture when live Granite is available:
      Radiation Specialist → Cardio Specialist → Circadian Specialist (parallel)
      → Orchestrator Agent synthesizes final briefing from specialist inputs.
    Falls back to single-call mode if specialists fail, then mock if all Granite fails.
    """
    # Build RAG context from all active anomalies
    all_anomalies: List[RiskFactor] = []
    crew_status_lines = []
    for astro in crew_state.crew:
        all_anomalies.extend(astro.risk.anomalies)
        ml_conf = astro.risk.confidence if astro.risk.confidence else "—"
        crew_status_lines.append(
            f"{astro.profile.id} ({astro.profile.name}): "
            f"Readiness={astro.risk.mission_readiness_score:.1f}% [{astro.risk.status}] "
            f"[ML: {ml_conf}], "
            f"HR={astro.latest_frame.vitals.heart_rate_bpm:.0f} bpm, "
            f"HRV={astro.latest_frame.vitals.hrv_rmssd_ms:.0f} ms, "
            f"SpO2={astro.latest_frame.vitals.spo2_percent:.1f}%, "
            f"SleepDebt={astro.latest_frame.circadian.sleep_debt_72h_hrs:.1f} hrs, "
            f"CO2={astro.latest_frame.atmosphere.cabin_co2_ppm:.0f} ppm, "
            f"Rad={astro.latest_frame.radiation.daily_radiation_mgy:.2f} mGy/day"
        )

    # Systems alert section
    systems_alert_text = ""
    if crew_state.crew_wide_alert:
        cwa = crew_state.crew_wide_alert
        systems_alert_text = (
            f"\n⚠ SYSTEMS-LEVEL ALERT [{cwa.severity}] — {cwa.pattern_type} PATTERN DETECTED\n"
            f"  Affected Crew: {', '.join(cwa.affected_names or cwa.affected_crew)}\n"
            f"  Shared Anomalies: {', '.join(cwa.shared_features)}\n"
            f"  Root Cause Analysis: {cwa.likely_root_cause}\n"
            f"  Recommended Action: {cwa.recommendation}\n"
        )

    rag_ctx = build_rag_context(all_anomalies, "\n".join(crew_status_lines))
    anomaly_summary = format_anomaly_summary(all_anomalies)

    # Comms delay → operational authority context injected into every prompt
    comms_s = crew_state.comms_delay_seconds
    if comms_s == 0:
        comms_context = (
            "COMMS STATUS: Houston Mission Control ONLINE (0s latency). "
            "Real-time telemetry streaming to Johnson Space Center Flight Surgeon. "
            "AI is operating in PASSIVE SURVEILLANCE mode — ground medical team has primary clinical authority. "
            "Frame recommendations as advisory inputs for the ground flight surgeon, not autonomous orders."
        )
    elif comms_s <= 5:
        comms_context = (
            f"COMMS STATUS: Near-space relay active ({comms_s:.1f}s latency, Lunar Gateway). "
            "Ground advisory mode — collaborative edge-ground clinical verification. "
            "AI provides real-time risk analysis; ground confirms high-impact interventions."
        )
    else:
        comms_context = (
            f"COMMS STATUS: DEEP SPACE — {comms_s:.0f}s one-way delay (20-min Earth reply blackout). "
            "AI operating with FULL AUTONOMOUS MEDICAL COMMAND under NASA SP-2010-3407 Sec 4.3.1. "
            "No ground physician consultation possible. All countermeasures are AI-autonomous orders."
        )

    # Reframe prompt tone based on systems alert presence
    if crew_state.crew_wide_alert:
        briefing_instruction = (
            "SYSTEMS ALERT MODE: Lead with the systemic fleet-wide root cause before discussing "
            "individual crew members. Reframe individual anomalies as symptoms of the shared "
            "environmental root cause, not isolated health events."
        )
    else:
        briefing_instruction = "Generate a professional daily executive briefing for Mission Commander Elena Vance."

    # ── Multi-agent pathway: try specialist agents first ──────────────────────
    specialist_section = ""
    specialist_analyses = _run_specialist_agents(crew_state)
    if specialist_analyses:
        parts = []
        labels = {"radiation": "Radiation Specialist", "cardio": "Cardiovascular Specialist", "circadian": "Circadian/Sleep Specialist"}
        for role, text in specialist_analyses.items():
            parts.append(f"[{labels.get(role, role.upper())} ANALYSIS]\n{text}")
        specialist_section = "\n\n".join(parts)
        logger.info("Multi-agent specialist inputs ready — feeding to Orchestrator")

    # ── Build Orchestrator prompt (enriched with specialist context if available) ──
    agent_header = (
        "SPECIALIST AGENT REPORTS (pre-synthesised):\n" + specialist_section + "\n\n"
        if specialist_section else ""
    )

    prompt = f"""You are the autonomous AegisCrew AI Orchestrator — synthesize the specialist reports below into a unified executive briefing.
{briefing_instruction}
{comms_context}
{systems_alert_text}
{agent_header}{rag_ctx}

{anomaly_summary}

Mission Day: {crew_state.mission_elapsed_day}
Active Scenario: {crew_state.active_scenario}
Fleet Readiness: {crew_state.fleet_readiness:.1f}% [{crew_state.fleet_status}]

Format the briefing with: 1) Fleet Status Overview 2) Per-Crew Risk Summary (reference specialist reports) 3) Active Protocols 4) Recommended Actions."""

    response_text, is_mock = _call_granite(prompt)

    if is_mock or response_text is None:
        response_text = _mock_briefing(crew_state)
        is_mock = True

    # Audit log: every briefing generation is a traceable autonomous AI action
    audit_log.append(
        event_type=EVENT_BRIEFING_GENERATED,
        astronaut_id="FLEET",
        summary=(
            f"Executive briefing generated [{'mock' if is_mock else 'live Granite'}] — "
            f"Fleet readiness {crew_state.fleet_readiness:.1f}% [{crew_state.fleet_status}] "
            f"scenario={crew_state.active_scenario}"
        ),
        data_snapshot={
            "fleet_readiness": crew_state.fleet_readiness,
            "fleet_status": crew_state.fleet_status,
            "active_scenario": crew_state.active_scenario,
            "mock_mode": is_mock,
            "crew_wide_alert": crew_state.crew_wide_alert.pattern_type
                if crew_state.crew_wide_alert else None,
        },
    )

    return AgentBriefingResponse(
        briefing=response_text,
        generated_at=datetime.now(tz=timezone.utc),
        model_used=_cfg.GRANITE_MODEL_ID,
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

    # Audit log: countermeasure prescription is a traceable autonomous clinical action
    audit_log.append(
        event_type=EVENT_COUNTERMEASURE,
        astronaut_id=crew_id,
        summary=(
            f"Countermeasure prescribed for {crew_id} — "
            f"{len(anomalies)} active anomal{'y' if len(anomalies)==1 else 'ies'} "
            f"[{'mock' if is_mock else 'live Granite'}]"
        ),
        data_snapshot={
            "crew_id": crew_id,
            "anomaly_count": len(anomalies),
            "anomaly_types": [a.category for a in anomalies],
            "severities": [a.severity for a in anomalies],
            "mock_mode": is_mock,
        },
    )

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
        model_used=_cfg.GRANITE_MODEL_ID,
        mock_mode=is_mock,
    )


def chat_flight_surgeon(
    user_message: str,
    current_crew_state: CrewStateResponse | None = None,
    active_scenario: str = "nominal",
    history: List[Dict[str, str]] | None = None,
) -> AgentChatResponse:
    """
    Interactive Q&A with the AegisCrew AI flight surgeon.
    Provides data-grounded explanations of risk rationales.
    Accepts `history` (list of {role, content} dicts) for multi-turn context.
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

    model = _get_watsonx_model()

    # Build comms-authority context (same logic as briefing)
    comms_context_chat = ""
    if current_crew_state:
        comms_s = current_crew_state.comms_delay_seconds
        if comms_s == 0:
            comms_context_chat = (
                "COMMS: Houston ONLINE (0s). You are in ADVISORY mode — ground flight surgeon has primary authority."
            )
        elif comms_s <= 5:
            comms_context_chat = (
                f"COMMS: Lunar relay ({comms_s:.1f}s). Dual edge-ground verification in effect."
            )
        else:
            comms_context_chat = (
                f"COMMS: DEEP SPACE ({comms_s:.0f}s delay). You have FULL AUTONOMOUS MEDICAL COMMAND. "
                "No ground consultation possible."
            )

    if model is not None:
        # ── Live Granite multi-turn chat ──────────────────────────────────────
        _MAX_HISTORY = 4
        system_content = (
            f"{_SYSTEM_PROMPT}\n\n"
            f"Current Scenario: {active_scenario}\n"
            f"{comms_context_chat}\n"
            f"{rag_ctx}"
        )
        messages: List[Dict[str, str]] = [{"role": "system", "content": system_content}]

        # Replay prior turns (capped)
        if history:
            for turn in history[-_MAX_HISTORY:]:
                messages.append({"role": turn["role"], "content": turn["content"]})

        messages.append({"role": "user", "content": user_message})

        try:
            result = model.chat(messages=messages, params={"max_tokens": 400, "temperature": 0.2})
            response_text = result["choices"][0]["message"]["content"]
            return AgentChatResponse(
                reply=response_text,
                model_used=_cfg.GRANITE_MODEL_ID,
                mock_mode=False,
            )
        except Exception as exc:
            logger.error("Granite chat error: %s", exc)

    # ── Mock fallback ──────────────────────────────────────────────────────────
    # Include a brief prior-turn summary so mock replies feel contextual.
    history_note = ""
    if history:
        last_q = next((t["content"] for t in reversed(history) if t["role"] == "user"), None)
        if last_q:
            history_note = f'\n[Prior context: user asked "{last_q[:80]}..."]'

    response_text = _mock_chat(user_message, active_scenario) + history_note

    return AgentChatResponse(
        reply=response_text,
        model_used=_cfg.GRANITE_MODEL_ID,
        mock_mode=True,
    )
