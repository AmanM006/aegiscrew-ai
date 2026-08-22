"""
AegisCrew AI — Composite Risk Scorer
Aggregates fatigue, cardiovascular, and radiation sub-scores into a
Mission Readiness Score (0–100) with NASA-STD-3001 traffic-light status.

v2: Hybrid scoring — 60% rule-based thresholds + 40% IsolationForest ML score.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import List, Literal, Optional

from backend.core.telemetry_schema import (
    AnomalyResult,
    RiskAssessment,
    RiskFactor,
    TelemetryFrame,
)
from backend.data.nasa_loader import get_crew_baseline, get_thresholds

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Individual risk calculators (rule-based)
# ---------------------------------------------------------------------------

def calculate_fatigue_risk(frame: TelemetryFrame) -> float:
    """
    Compute a 0–100 fatigue risk score based on:
    • 72-hour sleep debt accumulation
    • Circadian phase shift (encoded in PVT degradation proxy)
    • PVT reaction time degradation vs baseline
    Returns 0 = no risk, 100 = maximum risk.
    """
    thresholds = get_thresholds()
    baseline = get_crew_baseline(frame.crew_id)

    # 1. Sleep debt component (0–40 pts)
    sleep_debt = frame.circadian.sleep_debt_72h_hrs
    sleep_crit  = thresholds.get("sleep_debt_72h_hours", {}).get("critical_above", 7.0)
    sleep_score = min(sleep_debt / sleep_crit, 1.0) * 40

    # 2. PVT degradation component (0–40 pts)
    pvt_now      = frame.circadian.pvt_reaction_time_ms
    pvt_baseline = baseline.get("pvt_reaction_time_ms", 220)
    pvt_crit     = thresholds.get("pvt_reaction_time_ms", {}).get("critical_above", 400)
    pvt_excess   = max(pvt_now - pvt_baseline, 0)
    pvt_range    = max(pvt_crit - pvt_baseline, 1)
    pvt_score    = min(pvt_excess / pvt_range, 1.0) * 40

    # 3. Circadian phase shift proxy (0–20 pts)
    sleep_target = frame.circadian.target_sleep_hours
    sleep_last   = frame.circadian.sleep_hours_last_night
    sleep_delta  = abs(sleep_target - sleep_last)
    circadian_score = min(sleep_delta / 4.0, 1.0) * 20

    total = sleep_score + pvt_score + circadian_score
    return round(min(total, 100.0), 1)


def calculate_cardiovascular_risk(frame: TelemetryFrame) -> float:
    """
    Compute a 0–100 cardiovascular risk score based on:
    • HRV RMSSD autonomic tone decay
    • Resting HR elevation above baseline
    • Ambient CO2 stress co-factor
    """
    thresholds = get_thresholds()
    baseline = get_crew_baseline(frame.crew_id)

    hrv_now      = frame.vitals.hrv_rmssd_ms
    hrv_floor    = max(thresholds.get("hrv_rmssd", {}).get("critical_below", 20), 1)
    hrv_baseline = baseline.get("hrv_rmssd", 55)
    hrv_risk = max(0.0, (hrv_baseline - hrv_now) / max(hrv_baseline - hrv_floor, 1)) * 50
    hrv_risk = min(hrv_risk, 50.0)

    hr_now      = frame.vitals.heart_rate_bpm
    hr_baseline = baseline.get("resting_heart_rate", 62)
    hr_excess   = max(hr_now - hr_baseline, 0)
    hr_score    = min(hr_excess / max(hr_baseline * 0.25, 1), 1.0) * 30

    co2      = frame.atmosphere.cabin_co2_ppm
    co2_nom  = thresholds.get("ambient_co2_ppm", {}).get("nominal_max", 3000)
    co2_crit = thresholds.get("ambient_co2_ppm", {}).get("critical_above", 7000)
    co2_score = min(max(co2 - co2_nom, 0) / max(co2_crit - co2_nom, 1), 1.0) * 20

    return round(min(hrv_risk + hr_score + co2_score, 100.0), 1)


def calculate_radiation_risk(frame: TelemetryFrame) -> float:
    """
    Compute a 0–100 radiation risk score based on:
    • Daily mGy flux vs NASA-STD-3001 daily limit
    • Cumulative career dose progress vs 600 mSv limit
    • SPE alert status multiplier
    """
    thresholds = get_thresholds()

    daily       = frame.radiation.daily_radiation_mgy
    daily_crit  = thresholds.get("daily_radiation_mgy", {}).get("critical_above", 50.0)
    daily_score = min(daily / daily_crit, 1.0) * 60

    cum_dose     = frame.radiation.cumulative_radiation_msv
    career_limit = thresholds.get("cumulative_radiation_msv", {}).get("safe_mission_limit", 600.0)
    cum_score    = min(cum_dose / career_limit, 1.0) * 25

    spe_map   = {"NOMINAL": 0, "WATCH": 5, "WARNING": 10, "EMERGENCY": 15}
    spe_score = float(spe_map.get(frame.radiation.spe_alert_status, 0))

    return round(min(daily_score + cum_score + spe_score, 100.0), 1)


# ---------------------------------------------------------------------------
# Hybrid Mission Readiness Score (rule-based + ML)
# ---------------------------------------------------------------------------

def compute_mission_readiness_score(
    fatigue: float,
    cardiovascular: float,
    radiation: float,
    ml_anomaly_score: float = 0.0,
) -> float:
    """
    Hybrid composite Mission Readiness Score (0–100, higher = better).

    Weighting (v2):
      Rule-based sub-scores (60% total):
        • Fatigue:          21%
        • Cardiovascular:   21%
        • Radiation:        18%
      ML IsolationForest anomaly score (40%):
        • Provides data-driven holistic anomaly detection complementing
          the threshold rules.

    GREEN ≥ 80 | AMBER 50–79 | RED < 50
    """
    rule_risk = fatigue * 0.21 + cardiovascular * 0.21 + radiation * 0.18
    ml_risk   = ml_anomaly_score * 0.40
    total_risk = rule_risk + ml_risk
    readiness = max(0.0, 100.0 - total_risk)
    return round(readiness, 1)


def classify_status(score: float) -> Literal["GREEN", "AMBER", "RED"]:
    if score >= 80:
        return "GREEN"
    if score >= 50:
        return "AMBER"
    return "RED"


# ---------------------------------------------------------------------------
# Anomaly detector
# ---------------------------------------------------------------------------

def detect_anomalies(frame: TelemetryFrame) -> List[RiskFactor]:
    """Return a list of active clinical anomalies for a given telemetry frame."""
    anomalies: List[RiskFactor] = []
    thresholds = get_thresholds()

    # Sleep debt
    sd = frame.circadian.sleep_debt_72h_hrs
    sd_warn = thresholds.get("sleep_debt_72h_hours", {}).get("warning_above", 4.5)
    sd_crit = thresholds.get("sleep_debt_72h_hours", {}).get("critical_above", 7.0)
    if sd >= sd_crit:
        anomalies.append(RiskFactor(
            category="Circadian / Sleep", severity="CRITICAL",
            value=sd, threshold=sd_crit,
            description=f"72-hr sleep debt {sd:.1f} hrs exceeds critical threshold {sd_crit} hrs.",
            protocol_id="PROT-CIRCADIAN-01",
        ))
    elif sd >= sd_warn:
        anomalies.append(RiskFactor(
            category="Circadian / Sleep", severity="HIGH",
            value=sd, threshold=sd_warn,
            description=f"72-hr sleep debt {sd:.1f} hrs above warning threshold {sd_warn} hrs.",
            protocol_id="PROT-CIRCADIAN-01",
        ))

    # HRV
    hrv = frame.vitals.hrv_rmssd_ms
    hrv_warn = thresholds.get("hrv_rmssd", {}).get("warning_below", 30)
    hrv_crit = thresholds.get("hrv_rmssd", {}).get("critical_below", 20)
    if hrv <= hrv_crit:
        anomalies.append(RiskFactor(
            category="Cardiovascular", severity="CRITICAL",
            value=hrv, threshold=hrv_crit,
            description=f"HRV RMSSD {hrv:.1f} ms critically low. Severe autonomic stress.",
            protocol_id="PROT-CARDIO-STRESS-04",
        ))
    elif hrv <= hrv_warn:
        anomalies.append(RiskFactor(
            category="Cardiovascular", severity="HIGH",
            value=hrv, threshold=hrv_warn,
            description=f"HRV RMSSD {hrv:.1f} ms below warning threshold {hrv_warn} ms.",
            protocol_id="PROT-CARDIO-STRESS-04",
        ))

    # CO2
    co2 = frame.atmosphere.cabin_co2_ppm
    co2_warn = thresholds.get("ambient_co2_ppm", {}).get("warning_above", 4500)
    co2_crit = thresholds.get("ambient_co2_ppm", {}).get("critical_above", 7000)
    if co2 >= co2_crit:
        anomalies.append(RiskFactor(
            category="Environmental / Hypercapnia", severity="CRITICAL",
            value=co2, threshold=co2_crit,
            description=f"Cabin CO₂ {co2:.0f} ppm critically elevated. Immediate ECLSS override required.",
            protocol_id="PROT-CO2-HYPERCAPNIA-02",
        ))
    elif co2 >= co2_warn:
        anomalies.append(RiskFactor(
            category="Environmental / Hypercapnia", severity="HIGH",
            value=co2, threshold=co2_warn,
            description=f"Cabin CO₂ {co2:.0f} ppm above warning threshold {co2_warn} ppm.",
            protocol_id="PROT-CO2-HYPERCAPNIA-02",
        ))

    # Radiation
    rad = frame.radiation.daily_radiation_mgy
    rad_warn = thresholds.get("daily_radiation_mgy", {}).get("warning_above", 5.0)
    rad_crit = thresholds.get("daily_radiation_mgy", {}).get("critical_above", 50.0)
    if frame.radiation.spe_alert_status in ("WARNING", "EMERGENCY") or rad >= rad_crit:
        anomalies.append(RiskFactor(
            category="Radiation / SPE", severity="CRITICAL",
            value=rad, threshold=rad_crit,
            description=f"SPE ACTIVE. Daily flux {rad:.1f} mGy/day. Immediate shelter ingress required.",
            protocol_id="PROT-RAD-SPE-03",
        ))
    elif rad >= rad_warn:
        anomalies.append(RiskFactor(
            category="Radiation / SPE", severity="HIGH",
            value=rad, threshold=rad_warn,
            description=f"Daily radiation {rad:.1f} mGy/day above warning threshold {rad_warn} mGy/day.",
            protocol_id="PROT-RAD-SPE-03",
        ))

    return anomalies


# ---------------------------------------------------------------------------
# Main entry point: assess a full TelemetryFrame (hybrid rule + ML)
# ---------------------------------------------------------------------------

def assess_crew_member(
    frame: TelemetryFrame,
    ml_result: Optional[AnomalyResult] = None,
) -> RiskAssessment:
    """
    Run the complete hybrid risk pipeline for a single crew member frame.
    Accepts an optional pre-computed AnomalyResult from the ML engine.
    """
    fatigue_score = calculate_fatigue_risk(frame)
    cardio_score  = calculate_cardiovascular_risk(frame)
    rad_score     = calculate_radiation_risk(frame)

    # If ML result not provided, attempt to compute it now
    if ml_result is None:
        try:
            from backend.ml_engine.anomaly_detector import detect_anomaly
            ml_result = detect_anomaly(frame.crew_id, frame)
        except Exception as exc:
            logger.debug("ML anomaly detection skipped: %s", exc)
            ml_result = None

    ml_score = ml_result.anomaly_score if ml_result else 0.0
    confidence = ml_result.confidence_str if ml_result else "threshold-only mode"

    readiness = compute_mission_readiness_score(fatigue_score, cardio_score, rad_score, ml_score)
    status    = classify_status(readiness)
    anomalies = detect_anomalies(frame)

    return RiskAssessment(
        crew_id=frame.crew_id,
        timestamp_utc=frame.timestamp_utc,
        fatigue_risk_score=fatigue_score,
        cardiovascular_risk_score=cardio_score,
        radiation_risk_score=rad_score,
        ml_anomaly_score=round(ml_score, 1),
        mission_readiness_score=readiness,
        status=status,
        anomalies=anomalies,
        ml_result=ml_result,
        confidence=confidence,
    )
