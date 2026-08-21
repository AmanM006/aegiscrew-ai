"""
AegisCrew AI — Radiation Monitor
Real-time Solar Particle Event (SPE) detection and career dose tracking
against NASA-STD-3001 NSCR-2020 limits.
"""
from __future__ import annotations

import logging
from typing import Literal

from backend.core.telemetry_schema import RadiationDosimetry, TelemetryFrame
from backend.data.nasa_loader import get_thresholds

logger = logging.getLogger(__name__)

# NASA-STD-3001 Rev C career effective dose limits (mSv)
CAREER_LIMIT_MSV = 600.0

# SPE classification thresholds (mGy/day)
SPE_WATCH_MGY     = 3.0
SPE_WARNING_MGY   = 10.0
SPE_EMERGENCY_MGY = 50.0


def classify_spe_alert(daily_mgy: float) -> Literal["NOMINAL", "WATCH", "WARNING", "EMERGENCY"]:
    """
    Classify Solar Particle Event severity from daily radiation flux.
    Based on NASA Space Radiation Cancer Risk Model (NSCR-2020).
    """
    if daily_mgy >= SPE_EMERGENCY_MGY:
        return "EMERGENCY"
    if daily_mgy >= SPE_WARNING_MGY:
        return "WARNING"
    if daily_mgy >= SPE_WATCH_MGY:
        return "WATCH"
    return "NOMINAL"


def career_dose_percentage(cumulative_msv: float) -> float:
    """Return percentage of career dose limit consumed (0–100+)."""
    return round((cumulative_msv / CAREER_LIMIT_MSV) * 100, 2)


def eva_radiation_clearance(frame: TelemetryFrame) -> bool:
    """
    Return True if conditions are safe for Extra-Vehicular Activity.
    EVA is blocked if:
    - Daily flux > SPE_WATCH threshold
    - SPE alert is WARNING or EMERGENCY
    - Career dose > 80% of limit
    """
    rad = frame.radiation
    if rad.spe_alert_status in ("WARNING", "EMERGENCY"):
        logger.warning("EVA blocked for %s: SPE status=%s", frame.crew_id, rad.spe_alert_status)
        return False
    if rad.daily_radiation_mgy >= SPE_WATCH_MGY:
        logger.warning("EVA blocked for %s: daily flux=%.2f mGy/day", frame.crew_id, rad.daily_radiation_mgy)
        return False
    if career_dose_percentage(rad.cumulative_radiation_msv) >= 80.0:
        logger.warning("EVA blocked for %s: career dose at %.1f%%", frame.crew_id,
                       career_dose_percentage(rad.cumulative_radiation_msv))
        return False
    return True


def estimated_days_to_career_limit(
    cumulative_msv: float,
    daily_mgy: float,
    daily_mgy_to_msv_factor: float = 0.1,
) -> float:
    """
    Estimate remaining mission days before career dose limit is reached,
    assuming current daily flux continues.
    daily_mgy_to_msv_factor ≈ 0.1 (tissue-weighting approximation for GCR).
    Returns math.inf if daily dose is zero.
    """
    import math
    daily_msv = daily_mgy * daily_mgy_to_msv_factor
    if daily_msv <= 0:
        return math.inf
    remaining = max(CAREER_LIMIT_MSV - cumulative_msv, 0.0)
    return round(remaining / daily_msv, 1)


def analyze_radiation(frame: TelemetryFrame) -> dict:
    """
    Full radiation summary for a single TelemetryFrame.
    Returns a dict suitable for logging / API embedding.
    """
    rad   = frame.radiation
    alert = classify_spe_alert(rad.daily_radiation_mgy)
    pct   = career_dose_percentage(rad.cumulative_radiation_msv)
    eva_ok = eva_radiation_clearance(frame)

    return {
        "crew_id": frame.crew_id,
        "spe_alert": alert,
        "daily_flux_mgy": rad.daily_radiation_mgy,
        "cumulative_msv": rad.cumulative_radiation_msv,
        "career_dose_pct": pct,
        "eva_cleared": eva_ok,
        "est_days_to_limit": estimated_days_to_career_limit(
            rad.cumulative_radiation_msv, rad.daily_radiation_mgy
        ),
    }
