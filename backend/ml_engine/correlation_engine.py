"""
AegisCrew AI — Cross-Crew Correlation Engine
Detects simultaneous anomalies across multiple crew members and classifies
whether the root cause is environmental (shared cabin systems) or individual
physiological.

Runs automatically on every /api/crew/status call.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import List, Optional

from backend.core.telemetry_schema import TelemetryFrame

logger = logging.getLogger(__name__)

# Minimum fraction of crew flagged for a pattern alert (50% = 2 of 4)
MIN_AFFECTED_FRACTION = 0.5

# Environmental features shared across all crew (cabin systems)
ENVIRONMENTAL_FEATURES = {"cabin_co2_ppm", "daily_radiation_mgy", "cabin_o2_percent", "cabin_pressure_kpa"}

# Individual physiological features
INDIVIDUAL_FEATURES = {"hrv_rmssd_ms", "heart_rate_bpm", "sleep_debt_72h_hrs", "pvt_reaction_time_ms"}


@dataclass
class CrewPatternAlert:
    pattern_type: str          # "ENVIRONMENTAL" | "INDIVIDUAL" | "MIXED"
    affected_crew: List[str]   # list of crew IDs
    affected_names: List[str]  # human-readable names
    shared_features: List[str] # feature categories in common
    likely_root_cause: str
    severity: str              # "HIGH" | "CRITICAL"
    recommendation: str


def _flag_deviating_features(frame: TelemetryFrame) -> dict[str, float]:
    """
    Return a dict of {feature_name: raw_value} for metrics that cross
    NASA-STD-3001 warning thresholds in a given frame.
    """
    flags: dict[str, float] = {}

    if frame.atmosphere.cabin_co2_ppm >= 4500:
        flags["cabin_co2_ppm"] = frame.atmosphere.cabin_co2_ppm
    if frame.radiation.daily_radiation_mgy >= 5.0:
        flags["daily_radiation_mgy"] = frame.radiation.daily_radiation_mgy
    if frame.radiation.spe_alert_status in ("WARNING", "EMERGENCY"):
        flags["spe_active"] = 1.0
    if frame.vitals.hrv_rmssd_ms <= 30:
        flags["hrv_rmssd_ms"] = frame.vitals.hrv_rmssd_ms
    if frame.circadian.sleep_debt_72h_hrs >= 4.5:
        flags["sleep_debt_72h_hrs"] = frame.circadian.sleep_debt_72h_hrs
    if frame.vitals.heart_rate_bpm >= 100:
        flags["heart_rate_bpm"] = frame.vitals.heart_rate_bpm
    if frame.vitals.spo2_percent < 95:
        flags["spo2_percent"] = frame.vitals.spo2_percent
    if frame.circadian.pvt_reaction_time_ms >= 320:
        flags["pvt_reaction_time_ms"] = frame.circadian.pvt_reaction_time_ms

    return flags


def detect_crew_wide_pattern(
    all_crew_frames: list[TelemetryFrame],
    crew_names: dict[str, str] | None = None,
) -> Optional[CrewPatternAlert]:
    """
    Check if 2+ crew members show anomalies in the same feature category
    simultaneously.  Returns a CrewPatternAlert if a systemic pattern is
    found, or None if all anomalies appear individual/independent.

    Parameters
    ----------
    all_crew_frames : live TelemetryFrame for each crew member
    crew_names : optional map of crew_id → display name
    """
    if len(all_crew_frames) < 2:
        return None

    crew_flags: dict[str, dict[str, float]] = {}
    for frame in all_crew_frames:
        flags = _flag_deviating_features(frame)
        if flags:
            crew_flags[frame.crew_id] = flags

    if len(crew_flags) < max(2, int(len(all_crew_frames) * MIN_AFFECTED_FRACTION)):
        return None   # fewer than threshold affected

    # Find features shared across all flagged crew
    flagged_ids   = list(crew_flags.keys())
    feature_sets  = [set(crew_flags[cid].keys()) for cid in flagged_ids]
    shared_feats  = feature_sets[0].intersection(*feature_sets[1:])

    if not shared_feats:
        return None   # no common features — individual issues, not systemic

    # Classify environmental vs individual
    env_shared  = shared_feats & (ENVIRONMENTAL_FEATURES | {"spe_active"})
    indiv_shared = shared_feats & INDIVIDUAL_FEATURES

    if env_shared:
        pattern_type = "ENVIRONMENTAL"
        if "spe_active" in env_shared or "daily_radiation_mgy" in env_shared:
            root_cause = (
                "Shared radiation event (SPE or elevated GCR flux). "
                "All crew experiencing simultaneous dosimetry anomaly — "
                "NOT an individual health issue. Root cause: space weather / habitat shielding."
            )
            recommendation = (
                "Initiate PROT-RAD-SPE-03 for all crew. "
                "Ingress storm shelter. Continuous active dosimetry monitoring."
            )
            severity = "CRITICAL"
        elif "cabin_co2_ppm" in env_shared:
            root_cause = (
                "ECLSS CO₂ scrubber degradation causing fleet-wide hypercapnia. "
                "Simultaneous CO₂ elevation across all crew confirms cabin systems failure — "
                "NOT individual physiological event."
            )
            recommendation = (
                "Initiate PROT-CO2-HYPERCAPNIA-02. "
                "Amine Swing Bed scrubber override. Halt physical exercise."
            )
            severity = "CRITICAL"
        else:
            root_cause = (
                "Shared environmental stressor detected across cabin systems. "
                "Multiple crew showing correlated anomaly in shared habitat parameters."
            )
            recommendation = "Inspect ECLSS life support telemetry. Consult habitat systems engineer."
            severity = "HIGH"
    else:
        pattern_type = "INDIVIDUAL"
        root_cause = (
            "Multiple crew showing correlated physiological stress (HRV/sleep/HR) "
            "without shared environmental trigger. Likely cumulative mission fatigue — "
            "individual countermeasures indicated, not a systems fault."
        )
        recommendation = "Apply individual PROT-CIRCADIAN-01 or PROT-CARDIO-STRESS-04 per crew member."
        severity = "HIGH"

    names_map = crew_names or {}
    affected_names = [names_map.get(cid, cid) for cid in flagged_ids]

    shared_labels = []
    label_map = {
        "cabin_co2_ppm":      "Cabin CO₂",
        "daily_radiation_mgy":"Radiation Flux",
        "spe_active":         "SPE Active",
        "hrv_rmssd_ms":       "HRV Autonomic Stress",
        "sleep_debt_72h_hrs": "Sleep Debt",
        "heart_rate_bpm":     "Elevated HR",
        "spo2_percent":       "Low SpO₂",
        "pvt_reaction_time_ms":"PVT Degradation",
    }
    for feat in shared_feats:
        shared_labels.append(label_map.get(feat, feat))

    logger.warning(
        "CREW-WIDE PATTERN DETECTED [%s]: %s affected — %s",
        pattern_type, flagged_ids, root_cause[:80],
    )

    return CrewPatternAlert(
        pattern_type=pattern_type,
        affected_crew=flagged_ids,
        affected_names=affected_names,
        shared_features=shared_labels,
        likely_root_cause=root_cause,
        severity=severity,
        recommendation=recommendation,
    )
