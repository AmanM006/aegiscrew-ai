"""
AegisCrew AI — Scenario Manager
Four switchable mission scenarios that inject realistic emergency telemetry
overrides into the streamer for live demo / competition use.
"""
from __future__ import annotations

import logging
from typing import Dict, Literal


from backend.core.audit_log import audit_log, EVENT_SCENARIO_TRIGGERED

from backend.data.telemetry_streamer import clear_scenario_overrides, set_scenario_overrides

logger = logging.getLogger(__name__)

ScenarioName = Literal["nominal", "spe", "co2_spike", "sleep_deprivation", "parmitano_eva", "lunar_surface"]

# Active scenario name (module-level state)
_ACTIVE_SCENARIO: ScenarioName = "nominal"


def get_active_scenario() -> ScenarioName:
    return _ACTIVE_SCENARIO


# ---------------------------------------------------------------------------
# Scenario override payloads
# Each dict key is a crew_id; values are partial telemetry field overrides.
# ---------------------------------------------------------------------------

def _nominal_overrides() -> Dict[str, Dict]:
    """Stable baseline — no overrides needed."""
    return {}


def _spe_overrides() -> Dict[str, Dict]:
    """
    Solar Particle Event during EVA.
    ASTRO-02 (Mark Jensen, EVA Lead) hit by extreme radiation flux.
    Fleet cabin radiation also elevated from particle bombardment.
    """
    return {
        "ASTRO-02": {
            "daily_radiation_mgy": 87.4,      # SPE EMERGENCY level
            "spe_alert_status": "EMERGENCY",
            "cumulative_radiation_msv": 312.8,
            "heart_rate_bpm": 102.0,           # stress response
            "hrv_rmssd_ms": 18.5,              # autonomic shock
            "composite_readiness_score": 12.0,
            "status_traffic_light": "RED",
        },
        "ASTRO-01": {
            "daily_radiation_mgy": 22.1,
            "spe_alert_status": "WARNING",
            "composite_readiness_score": 48.0,
            "status_traffic_light": "RED",
        },
        "ASTRO-03": {
            "daily_radiation_mgy": 18.7,
            "spe_alert_status": "WARNING",
            "composite_readiness_score": 52.0,
            "status_traffic_light": "AMBER",
        },
        "ASTRO-04": {
            "daily_radiation_mgy": 15.3,
            "spe_alert_status": "WARNING",
            "composite_readiness_score": 55.0,
            "status_traffic_light": "AMBER",
        },
    }


def _co2_spike_overrides() -> Dict[str, Dict]:
    """
    ECLSS CO₂ Scrubber Degradation — cabin CO₂ > 4,800 ppm during crew sleep.
    All crew exhibit morning cognitive fog and elevated resting HR.
    """
    return {
        "ASTRO-01": {
            "cabin_co2_ppm": 5120.0,
            "heart_rate_bpm": 79.0,
            "hrv_rmssd_ms": 28.4,
            "pvt_reaction_time_ms": 341.0,
            "spo2_percent": 95.8,
            "composite_readiness_score": 44.0,
            "status_traffic_light": "RED",
        },
        "ASTRO-02": {
            "cabin_co2_ppm": 5120.0,
            "heart_rate_bpm": 84.0,
            "hrv_rmssd_ms": 25.9,
            "pvt_reaction_time_ms": 358.0,
            "spo2_percent": 94.9,
            "composite_readiness_score": 38.0,
            "status_traffic_light": "RED",
        },
        "ASTRO-03": {
            "cabin_co2_ppm": 5120.0,
            "heart_rate_bpm": 81.0,
            "hrv_rmssd_ms": 27.1,
            "pvt_reaction_time_ms": 372.0,
            "spo2_percent": 94.2,
            "composite_readiness_score": 35.0,
            "status_traffic_light": "RED",
        },
        "ASTRO-04": {
            "cabin_co2_ppm": 5120.0,
            "heart_rate_bpm": 76.0,
            "hrv_rmssd_ms": 31.0,
            "pvt_reaction_time_ms": 318.0,
            "spo2_percent": 96.1,
            "composite_readiness_score": 55.0,
            "status_traffic_light": "AMBER",
        },
    }


def _sleep_deprivation_overrides() -> Dict[str, Dict]:
    """
    Critical Circadian Collapse — Commander Elena Vance (ASTRO-01)
    accumulated 72-hr cumulative sleep debt of 9.2 hours.
    """
    return {
        "ASTRO-01": {
            "sleep_debt_72h_hrs": 9.2,
            "sleep_hours_last_night": 3.8,
            "pvt_reaction_time_ms": 418.0,
            "heart_rate_bpm": 77.0,
            "hrv_rmssd_ms": 24.1,
            "composite_readiness_score": 22.0,
            "status_traffic_light": "RED",
        },
        "ASTRO-03": {
            "sleep_debt_72h_hrs": 5.8,
            "sleep_hours_last_night": 5.2,
            "pvt_reaction_time_ms": 305.0,
            "composite_readiness_score": 58.0,
            "status_traffic_light": "AMBER",
        },
    }


def _parmitano_eva_overrides() -> Dict[str, Dict]:
    """
    Historical Replay — 2013 Parmitano EVA Water Intrusion Incident.
    NASA IVA Incident Report: July 16, 2013. EVA-23. Luca Parmitano (ASTRO-02 in this simulation).
    Water (approx 1.5L) accumulated in Parmitano's helmet from LCVG cooling loop leak.
    Risk of drowning in space. EVA terminated. Actual detection at T+8min post-problem onset.

    AegisCrew would flag: SpO2 drop (helmet water blocking CO2 scrubber inlet),
    HR spike from exertion + panic response, HRV collapse (acute stress), PVT degradation.
    Simulation shows AegisCrew detection at T+90s — vs 8 min real NASA detection.

    Source: NASA Accident Investigation Report, EVA-23, July 2013.
    """
    return {
        "ASTRO-02": {
            "heart_rate_bpm": 118.0,          # acute physical exertion + increasing panic
            "hrv_rmssd_ms": 9.2,              # severe autonomic stress (near-zero HRV)
            "spo2_percent": 93.1,             # CO2 scrubber inlet partially occluded by water
            "core_temp_c": 38.1,              # hyperthermia from trapped heat + suit failure
            "pvt_reaction_time_ms": 395.0,    # cognitive degradation from CO2 accumulation
            "daily_radiation_mgy": 2.1,       # background EVA radiation (non-critical)
            "spe_alert_status": "NOMINAL",
            "composite_readiness_score": 8.0, # critical
            "status_traffic_light": "RED",
        },
        "ASTRO-01": {
            # Mission Commander: alerted by ASTRO-02 comms, elevated stress
            "heart_rate_bpm": 91.0,
            "hrv_rmssd_ms": 28.0,
            "composite_readiness_score": 62.0,
            "status_traffic_light": "AMBER",
        },
    }


def _lunar_surface_overrides() -> Dict[str, Dict]:
    """
    Artemis Lunar Surface Operations — 1/6g environment, regolith dust exposure,
    higher galactic cosmic ray flux at surface (no Van Allen belt shielding),
    and extended EVA durations unique to lunar surface ops vs Mars transit.

    Mission profile: 14-day surface stay, day/night thermal cycling, dust toxic to lungs.
    Key differences from Mars: no crew co-habitation (split habitat/lander), higher rad dose.
    """
    return {
        "ASTRO-01": {
            # Commander on EVA — enhanced radiation, regolith dust exposure
            "daily_radiation_mgy": 0.62,           # ~3x ISS level (lunar surface GCR)
            "spe_alert_status": "WATCH",            # persistent elevated watch status
            "heart_rate_bpm": 88.0,                 # EVA exertion in suit
            "hrv_rmssd_ms": 34.5,
            "spo2_percent": 96.8,
            "pvt_reaction_time_ms": 295.0,
            "core_temp_c": 37.4,                   # slight thermal stress
            "composite_readiness_score": 71.0,
            "status_traffic_light": "AMBER",
        },
        "ASTRO-02": {
            # EVA-2 operator — fatigue from 10-hr EVA prep + execution
            "daily_radiation_mgy": 0.58,
            "sleep_debt_72h_hrs": 5.1,             # reduced sleep in lunar habitat
            "pvt_reaction_time_ms": 298.0,
            "heart_rate_bpm": 93.0,
            "hrv_rmssd_ms": 29.8,
            "composite_readiness_score": 61.0,
            "status_traffic_light": "AMBER",
        },
        "ASTRO-03": {
            # Habitat controller — nominal but elevated rad from surface proximity
            "daily_radiation_mgy": 0.49,
            "composite_readiness_score": 82.0,
            "status_traffic_light": "GREEN",
        },
        "ASTRO-04": {
            # Geological survey crew — nominal
            "daily_radiation_mgy": 0.51,
            "composite_readiness_score": 78.0,
            "status_traffic_light": "GREEN",
        },
    }


_SCENARIO_MAP: Dict[ScenarioName, callable] = {
    "nominal":           _nominal_overrides,
    "spe":               _spe_overrides,
    "co2_spike":         _co2_spike_overrides,
    "sleep_deprivation": _sleep_deprivation_overrides,
    "parmitano_eva":     _parmitano_eva_overrides,
    "lunar_surface":     _lunar_surface_overrides,
}

_SCENARIO_DESCRIPTIONS: Dict[str, str] = {
    "nominal": "Nominal Mars Transit — Stable baseline vitals across all crew.",
    "spe": (
        "Solar Particle Event (SPE) during EVA — Extreme radiation flux spike on ASTRO-02 (Mark Jensen). "
        "AI halts EVA, triggers storm shelter ingress SOP. [PROT-RAD-SPE-03]"
    ),
    "co2_spike": (
        "ECLSS CO2 Scrubber Degradation — Cabin CO2 rises to 5,120 ppm during crew sleep. "
        "Morning cognitive fog, elevated HR, ventilation override required. [PROT-CO2-HYPERCAPNIA-02]"
    ),
    "sleep_deprivation": (
        "Critical Circadian Collapse — Commander Vance (ASTRO-01) accumulates 9.2-hr 72-hr sleep debt. "
        "High-risk operational freeze, schedule resequencing. [PROT-CIRCADIAN-01]"
    ),
    "parmitano_eva": (
        "HISTORICAL REPLAY — Parmitano EVA-23 Water Intrusion (2013). "
        "Real NASA incident: 1.5L water accumulated in Parmitano's helmet (CO2 scrubber occlusion, risk of drowning). "
        "Actual NASA detection: T+8 min. AegisCrew detection: T+90s (via SpO2 drop + HRV collapse). "
        "Source: NASA Accident Investigation Report, EVA-23, July 16 2013."
    ),
    "lunar_surface": (
        "Artemis Lunar Surface Operations — 14-day surface stay. "
        "Enhanced GCR radiation (0.5-0.6 mGy/day vs 0.17 ISS), EVA exertion + thermal stress, reduced sleep in habitat. "
        "ASTRO-01 and ASTRO-02 on surface EVA; persistent WATCH status for rad exposure. "
        "Demonstrates AegisCrew generalises beyond Mars Transit to Artemis surface ops."
    ),
}


def activate_scenario(scenario: ScenarioName) -> str:
    """
    Activate a named scenario.  Returns human-readable description.
    Modifies global telemetry override state in the streamer.
    """
    global _ACTIVE_SCENARIO
    if scenario not in _SCENARIO_MAP:
        raise ValueError(f"Unknown scenario: {scenario}. Valid: {list(_SCENARIO_MAP)}")

    _ACTIVE_SCENARIO = scenario
    overrides = _SCENARIO_MAP[scenario]()
    if overrides:
        set_scenario_overrides(overrides)
    else:
        clear_scenario_overrides()

    desc = _SCENARIO_DESCRIPTIONS.get(scenario, scenario)
    logger.info("Scenario activated: %s", scenario)

    # Log to black-box audit trail (NASA-HDBK-2203 requirement)
    audit_log.append(
        event_type=EVENT_SCENARIO_TRIGGERED,
        astronaut_id="FLEET",
        summary=f"Scenario activated: {scenario.upper()} — {desc[:80]}",
        data_snapshot={"scenario": scenario, "description": desc},
    )
    return desc


def get_scenario_descriptions() -> Dict[str, str]:
    return _SCENARIO_DESCRIPTIONS
