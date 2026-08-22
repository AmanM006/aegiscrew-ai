"""
AegisCrew AI — Predictive Risk Layer
Linear extrapolation on the last N telemetry readings to estimate when a
crew member will cross a critical threshold.

"At current accumulation rate, Commander Vance hits RED in 6.2 hours."
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List, Optional

from backend.core.telemetry_schema import TelemetryFrame


@dataclass
class PredictionResult:
    crew_id: str
    current_readiness: float
    trend_per_hour: float          # negative = degrading, positive = improving
    hours_to_red: Optional[float]  # None if already RED or improving
    hours_to_amber: Optional[float]
    predicted_status_in_6h: str    # "GREEN" | "AMBER" | "RED" | "STABLE"
    prediction_basis: str          # human-readable explanation
    confidence: str                # "HIGH (12 readings)" etc.


def _linear_slope(values: List[float], interval_hours: float = 2.0) -> float:
    """
    Compute linear regression slope (units per hour) over a list of values
    assumed to be evenly spaced at `interval_hours` apart.
    Returns 0.0 if insufficient data.
    """
    n = len(values)
    if n < 2:
        return 0.0
    # x = time in hours (0, 2, 4, ...)
    xs = [i * interval_hours for i in range(n)]
    mean_x = sum(xs) / n
    mean_y = sum(values) / n
    num = sum((xs[i] - mean_x) * (values[i] - mean_y) for i in range(n))
    den = sum((xs[i] - mean_x) ** 2 for i in range(n))
    return num / den if den != 0 else 0.0


def extrapolate_hours_to_threshold(
    current: float,
    slope_per_hour: float,
    threshold: float,
    is_higher_worse: bool = False,
) -> Optional[float]:
    """
    Given current value and hourly slope, estimate hours until the value
    crosses `threshold`.  Returns None if already past threshold, already
    safe, or slope not moving toward threshold.
    """
    if is_higher_worse:
        # e.g. sleep debt — worse when higher
        if current >= threshold:
            return None      # already breached
        if slope_per_hour <= 0:
            return None      # improving or flat
        return max((threshold - current) / slope_per_hour, 0.0)
    else:
        # e.g. readiness score — worse when lower
        if current <= threshold:
            return None      # already breached
        if slope_per_hour >= 0:
            return None      # improving or flat
        return max((current - threshold) / abs(slope_per_hour), 0.0)


def predict_crew_trajectory(
    frames_24h: List[TelemetryFrame],
    current_readiness: float,
) -> PredictionResult:
    """
    Extrapolate crew member risk trajectory from 24-hr readiness history.

    Uses last 6 frames (12 hrs) for responsiveness, falls back to all frames.
    """
    crew_id = frames_24h[0].crew_id if frames_24h else "UNKNOWN"

    # Build readiness time-series from frames
    readiness_series = [f.composite_readiness_score for f in frames_24h]

    # Use last 6 readings (~12 hours) for recent trend
    window = readiness_series[-6:] if len(readiness_series) >= 6 else readiness_series

    slope = _linear_slope(window, interval_hours=2.0)   # 2-hr sampling interval

    # Hours to reach RED (< 50) or AMBER (<80) from current
    hours_to_red   = extrapolate_hours_to_threshold(current_readiness, slope, 50.0, False)
    hours_to_amber = extrapolate_hours_to_threshold(current_readiness, slope, 80.0, False)

    # Predicted status in 6 hours
    predicted_6h = current_readiness + slope * 6.0
    predicted_6h = max(0.0, min(100.0, predicted_6h))
    if predicted_6h >= 80:
        predicted_status_6h = "GREEN"
    elif predicted_6h >= 50:
        predicted_status_6h = "AMBER"
    else:
        predicted_status_6h = "RED"

    # Basis string
    n_readings = len(window)
    if abs(slope) < 0.5:
        basis = f"Stable trajectory over last {n_readings * 2}h"
        predicted_status_6h = "STABLE"
    elif slope < 0:
        rate = abs(slope)
        basis = f"Degrading at {rate:.1f} pts/hr over last {n_readings * 2}h"
    else:
        basis = f"Recovering at {slope:.1f} pts/hr over last {n_readings * 2}h"

    conf_str = f"HIGH ({n_readings} readings)" if n_readings >= 6 else f"LOW ({n_readings} readings)"

    return PredictionResult(
        crew_id=crew_id,
        current_readiness=round(current_readiness, 1),
        trend_per_hour=round(slope, 2),
        hours_to_red=round(hours_to_red, 1) if hours_to_red is not None else None,
        hours_to_amber=round(hours_to_amber, 1) if hours_to_amber is not None else None,
        predicted_status_in_6h=predicted_status_6h,
        prediction_basis=basis,
        confidence=conf_str,
    )
