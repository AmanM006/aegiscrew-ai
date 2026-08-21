"""
AegisCrew AI — Composite Risk Scorer
Aggregates fatigue, cardiovascular, and radiation sub-scores into a
Mission Readiness Score (0–100) with NASA-STD-3001 traffic-light status.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import List, Literal

from backend.core.telemetry_schema import (
    RiskAssessment,
    RiskFactor,
    TelemetryFrame,
)
from backend.data.nasa_loader import get_crew_baseline, get_thresholds

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Individual risk calculators
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
    sleep_warn  = thresholds.get("sleep_debt_72h_hours", {}).get("warning_above", 4.5)
    sleep_crit  = thresholds.get("sleep_debt_72h_hours", {}).get("critical_above", 7.0)
    sleep_score = min(sleep_debt / sleep_crit, 1.0) * 40

    # 2. PVT degradation component (0–40 pts)
    pvt_now      = frame.circadian.pvt_reaction_time_ms
    pvt_baseline = baseline.get("pvt_reaction_time_ms", 220)
    pvt_warn     = thresholds.get("pvt_reaction_time_ms", {}).get("warning_above", 320)
    pvt_crit     = thresholds.get("pvt_reaction_time_ms", {}).get("critical_above", 400)
    pvt_excess   = max(pvt_now - pvt_baseline, 0)
    pvt_range    = max(pvt_crit - pvt_baseline, 1)
    pvt_score    = min(pvt_excess / pvt_range, 1.0) * 40

    # 3. Circadian phase shift proxy (0–20 pts) — approximated from SpO2 & sleep hours delta
    sleep_target = frame.circadian.target_sleep_hours
    sleep_last   = frame.circadian.sleep_hours_last_night
    sleep_delta  = abs(sleep_target - sleep_last)
    circadian_score = min(sleep_delta / 4.0, 1.0) * 20

    total = sleep_score + pvt_score + circadian_score
    logger.debug("Fatigue risk %s: sleep=%.1f pvt=%.1f circ=%.1f total=%.1f",
                 frame.crew_id, sleep_score, pvt_score, circadian_score, total)
    return round(min(total, 100.0), 1)


def calculate_cardiovascular_risk(frame: TelemetryFrame) -> float:
    """
    Compute a 0–100 cardiovascular risk score based on:
    • HRV RMSSD autonomic tone decay (primary)
    • Resting HR elevation above baseline
    • Ambient CO2 stress co-factor
    """
    thresholds = get_thresholds()
    baseline = get_crew_baseline(frame.crew_id)

    # 1. HRV RMSSD decay (0–50 pts)
    hrv_now  = frame.vitals.hrv_rmssd_ms
    hrv_warn = thresholds.get("hrv_rmssd", {}).get("warning_below", 30)
    hrv_crit = thresholds.get("hrv_rmssd", {}).get("critical_below", 20)
    hrv_baseline = baseline.get("hrv_rmssd", 55)
    hrv_floor = max(hrv_crit, 1)
    hrv_risk = max(0.0, (hrv_baseline - hrv_now) / max(hrv_baseline - hrv_floor, 1)) * 50
    hrv_risk = min(hrv_risk, 50.0)

    # 2. Resting HR elevation (0–30 pts)
    hr_now      = frame.vitals.heart_rate_bpm
    hr_baseline = baseline.get("resting_heart_rate", 62)
    hr_excess   = max(hr_now - hr_baseline, 0)
    hr_score    = min(hr_excess / max(hr_baseline * 0.25, 1), 1.0) * 30

    # 3. CO2 stress co-factor (0–20 pts)
    co2     = frame.atmosphere.cabin_co2_ppm
    co2_nom = thresholds.get("ambient_co2_ppm", {}).get("nominal_max", 3000)
    co2_crit = thresholds.get("ambient_co2_ppm", {}).get("critical_above", 7000)
    co2_score = min(max(co2 - co2_nom, 0) / max(co2_crit - co2_nom, 1), 1.0) * 20

    total = hrv_risk + hr_score + co2_score
    logger.debug("Cardio risk %s: hrv=%.1f hr=%.1f co2=%.1f total=%.1f",
                 frame.crew_id, hrv_risk, hr_score, co2_score, total)
    return round(min(total, 100.0), 1)


def calculate_radiation_risk(frame: TelemetryFrame) -> float:
    """
    Compute a 0–100 radiation risk score based on:
    • Daily mGy flux vs NASA-STD-3001 daily limit
    • Cumulative career dose progress vs 600 mSv limit
    • SPE alert status multiplier
    """
    thresholds = get_thresholds()

    # 1. Daily flux (0–60 pts)
    daily = frame.radiation.daily_radiation_mgy
    daily_warn = thresholds.get("daily_radiation_mgy", {}).get("warning_above", 5.0)
    daily_crit = thresholds.get("daily_radiation_mgy", {}).get("critical_above", 50.0)
    daily_score = min(daily / daily_crit, 1.0) * 60

    # 2. Cumulative career dose (0–25 pts)
    cum_dose     = frame.radiation.cumulative_radiation_msv
    career_limit = thresholds.get("cumulative_radiation_msv", {}).get("safe_mission_limit", 600.0)
    cum_score    = min(cum_dose / career_limit, 1.0) * 25

    # 3. SPE multiplier (0–15 pts)
    spe_map = {"NOMINAL": 0, "WATCH": 5, "WARNING": 10, "EMERGENCY": 15}
    spe_score = float(spe_map.get(frame.radiation.spe_alert_status, 0))

    total = daily_score + cum_score + spe_score
    logger.debug("Radiation risk %s: daily=%.1f cum=%.1f spe=%.1f total=%.1f",
                 frame.crew_id, daily_score, cum_score, spe_score, total)
    return round(min(total, 100.0), 1)


# ---------------------------------------------------------------------------
# Mission Readiness Score
# ---------------------------------------------------------------------------

def compute_mission_readiness_score(
    fatigue: float,
    cardiovascular: float,
    radiation: float,
) -> float:
    """
    Composite Mission Readiness Score (0–100, higher = better).
    Weighted inverse of the three risk sub-scores:
      • Fatigue:         35%
      • Cardiovascular:  35%
      • Radiation:       30%
    GREEN ≥ 80 | AMBER 50–79 | RED < 50
    """
    raw_risk = fatigue * 0.35 + cardiovascular * 0.35 + radiation * 0.30
    readiness = max(0.0, 100.0 - raw_risk)
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
    baseline   = get_crew_baseline(frame.crew_id)

    # Sleep debt
    sd = frame.circadian.sleep_debt_72h_hrs
    sd_warn = thresholds.get("sleep_debt_72h_hours", {}).get("warning_above", 4.5)
    sd_crit = thresholds.get("sleep_debt_72h_hours", {}).get("critical_above", 7.0)
    if sd >= sd_crit:
        anomalies.append(RiskFactor(
            category="Circadian / Sleep",
            severity="CRITICAL",
            value=sd, threshold=sd_crit,
            description=f"72-hr sleep debt {sd:.1f} hrs exceeds critical threshold {sd_crit} hrs.",
            protocol_id="PROT-CIRCADIAN-01",
        ))
    elif sd >= sd_warn:
        anomalies.append(RiskFactor(
            category="Circadian / Sleep",
            severity="HIGH",
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
            category="Cardiovascular",
            severity="CRITICAL",
            value=hrv, threshold=hrv_crit,
            description=f"HRV RMSSD {hrv:.1f} ms critically low (threshold {hrv_crit} ms). Severe autonomic stress.",
            protocol_id="PROT-CARDIO-STRESS-04",
        ))
    elif hrv <= hrv_warn:
        anomalies.append(RiskFactor(
            category="Cardiovascular",
            severity="HIGH",
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
            category="Environmental / Hypercapnia",
            severity="CRITICAL",
            value=co2, threshold=co2_crit,
            description=f"Cabin CO₂ {co2:.0f} ppm critically elevated. Immediate ECLSS override required.",
            protocol_id="PROT-CO2-HYPERCAPNIA-02",
        ))
    elif co2 >= co2_warn:
        anomalies.append(RiskFactor(
            category="Environmental / Hypercapnia",
            severity="HIGH",
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
            category="Radiation / SPE",
            severity="CRITICAL",
            value=rad, threshold=rad_crit,
            description=f"Solar Particle Event ACTIVE. Daily flux {rad:.1f} mGy/day. Immediate shelter ingress required.",
            protocol_id="PROT-RAD-SPE-03",
        ))
    elif rad >= rad_warn:
        anomalies.append(RiskFactor(
            category="Radiation / SPE",
            severity="HIGH",
            value=rad, threshold=rad_warn,
            description=f"Daily radiation {rad:.1f} mGy/day above warning threshold {rad_warn} mGy/day.",
            protocol_id="PROT-RAD-SPE-03",
        ))

    return anomalies


# ---------------------------------------------------------------------------
# Main entry point: assess a full TelemetryFrame
# ---------------------------------------------------------------------------

def assess_crew_member(frame: TelemetryFrame) -> RiskAssessment:
    """Run the complete risk pipeline for a single crew member frame."""
    fatigue_score = calculate_fatigue_risk(frame)
    cardio_score  = calculate_cardiovascular_risk(frame)
    rad_score     = calculate_radiation_risk(frame)
    readiness     = compute_mission_readiness_score(fatigue_score, cardio_score, rad_score)
    status        = classify_status(readiness)
    anomalies     = detect_anomalies(frame)

    return RiskAssessment(
        crew_id=frame.crew_id,
        timestamp_utc=frame.timestamp_utc,
        fatigue_risk_score=fatigue_score,
        cardiovascular_risk_score=cardio_score,
        radiation_risk_score=rad_score,
        mission_readiness_score=readiness,
        status=status,
        anomalies=anomalies,
    )
