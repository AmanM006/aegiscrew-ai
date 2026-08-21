"""
AegisCrew AI — Fatigue Model
Detailed biomathematical sleep/wake/circadian modelling.
Wraps the core fatigue calculation from risk_scorer with additional
PVT trend analysis and circadian phase estimation.
"""
from __future__ import annotations

import math
from typing import List

from backend.core.telemetry_schema import TelemetryFrame
from backend.data.nasa_loader import get_crew_baseline


def circadian_phase_shift_estimate(frames_24h: List[TelemetryFrame]) -> float:
    """
    Estimate circadian phase shift (hours) from 24-hr sleep variability.
    Computes standard deviation of sleep_hours_last_night and maps it to
    an expected phase shift.
    """
    if not frames_24h:
        return 0.0
    sleep_values = [f.circadian.sleep_hours_last_night for f in frames_24h]
    mean_sleep   = sum(sleep_values) / len(sleep_values)
    variance     = sum((x - mean_sleep) ** 2 for x in sleep_values) / max(len(sleep_values), 1)
    std_dev      = math.sqrt(variance)
    # Heuristic: every 1-hr std dev ≈ 0.8-hr phase shift
    phase_shift  = round(std_dev * 0.8, 2)
    return phase_shift


def pvt_trend_slope(frames_24h: List[TelemetryFrame]) -> float:
    """
    Compute linear slope (ms/hour) of PVT reaction time over 24 hrs.
    Positive slope = worsening reaction time = increasing fatigue.
    """
    if len(frames_24h) < 2:
        return 0.0
    xs = list(range(len(frames_24h)))
    ys = [f.circadian.pvt_reaction_time_ms for f in frames_24h]
    n  = len(xs)
    sum_x  = sum(xs)
    sum_y  = sum(ys)
    sum_xy = sum(x * y for x, y in zip(xs, ys))
    sum_xx = sum(x * x for x in xs)
    denom  = n * sum_xx - sum_x ** 2
    if denom == 0:
        return 0.0
    slope = (n * sum_xy - sum_x * sum_y) / denom
    return round(slope, 3)


def three_process_fatigue_index(
    sleep_debt_hrs: float,
    hours_awake: float,
    circadian_phase_rad: float = 0.0,
) -> float:
    """
    Simplified three-process model (Borbély) fatigue index [0–1].
    S (homeostatic sleep pressure) + C (circadian) contribution.
    """
    # Homeostatic pressure (S): rises linearly with wakefulness
    S = min(hours_awake / 20.0, 1.0)
    # Debt amplifier
    debt_amplifier = 1.0 + sleep_debt_hrs / 8.0
    # Circadian (C): cosine with ~24-hr period, minimum around 04:00
    C = 0.5 * (1 - math.cos(circadian_phase_rad + math.pi))
    # Combined index
    fatigue = min((S * debt_amplifier * 0.7 + C * 0.3), 1.0)
    return round(fatigue, 3)


def compute_operational_capacity(frame: TelemetryFrame) -> float:
    """
    Compute operational capacity percentage [0–100] for a crew member.
    Inversely proportional to fatigue index and PVT degradation.
    """
    baseline      = get_crew_baseline(frame.crew_id)
    pvt_baseline  = baseline.get("pvt_reaction_time_ms", 220)
    pvt_now       = frame.circadian.pvt_reaction_time_ms
    pvt_ratio     = min(pvt_baseline / max(pvt_now, 1), 1.0)  # closer to 1 = better
    sleep_debt    = frame.circadian.sleep_debt_72h_hrs
    fatigue_index = min(sleep_debt / 8.0, 1.0)
    capacity      = (pvt_ratio * 0.6 + (1.0 - fatigue_index) * 0.4) * 100
    return round(max(capacity, 0.0), 1)
