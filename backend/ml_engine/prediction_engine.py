"""
AegisCrew AI — Predictive Risk Layer
Robust rolling-average + capped slope extrapolation to estimate when a crew
member will cross a critical threshold.

"At current accumulation rate, Commander Vance hits RED in 6.2 hours."

Design decisions vs naive single-frame delta:
- Uses EWM (exponentially-weighted moving average) smoothing over the last 8
  readings to suppress single-sample scenario-injection artifacts.
- Caps the absolute slope at ±8 pts/hr to avoid projecting RED in 0.4 hrs
  from a 1-step drop that has already stabilised at a new floor.
- Requires the slope to be consistent across TWO consecutive half-windows
  before reporting hours_to_red / hours_to_amber — single-step drops are
  flagged as "Scenario transition — monitoring for sustained trend".
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

from backend.core.telemetry_schema import TelemetryFrame

# Maximum believable physiological decay rate for readiness score (pts / hr).
# A legitimate multi-hour crisis rarely degrades faster than this.
_MAX_SLOPE_PTS_PER_HR = 8.0

# Minimum window size to produce a meaningful trend
_MIN_WINDOW = 3


@dataclass
class PredictionResult:
    crew_id: str
    current_readiness: float
    trend_per_hour: float          # negative = degrading, positive = improving
    hours_to_red: Optional[float]  # None if already RED or improving
    hours_to_amber: Optional[float]
    predicted_status_in_6h: str    # "GREEN" | "AMBER" | "RED" | "STABLE"
    prediction_basis: str          # human-readable explanation
    confidence: str                # "HIGH (N readings)" etc.


def _ewm_slope(values: List[float], interval_hours: float, alpha: float = 0.4) -> float:
    """
    Exponentially-weighted linear slope (pts / hr).
    Recent readings are weighted more heavily (alpha controls decay).
    Returns 0.0 when there are fewer than 2 samples.
    """
    n = len(values)
    if n < 2:
        return 0.0

    # Apply EWM smoothing first
    smoothed = [values[0]]
    for v in values[1:]:
        smoothed.append(alpha * v + (1 - alpha) * smoothed[-1])

    # Weighted linear regression — weight by recency (later = higher weight)
    weights = [alpha * (1 - alpha) ** (n - 1 - i) for i in range(n)]
    xs = [i * interval_hours for i in range(n)]
    sw   = sum(weights)
    mx   = sum(w * x for w, x in zip(weights, xs))   / sw
    my   = sum(w * y for w, y in zip(weights, smoothed)) / sw
    num  = sum(weights[i] * (xs[i] - mx) * (smoothed[i] - my) for i in range(n))
    den  = sum(weights[i] * (xs[i] - mx) ** 2 for i in range(n))
    raw  = num / den if den != 0 else 0.0

    # Cap slope to suppress single-step injection artifacts
    return max(-_MAX_SLOPE_PTS_PER_HR, min(_MAX_SLOPE_PTS_PER_HR, raw))


def _is_consistent_trend(values: List[float], interval_hours: float) -> bool:
    """
    Returns True only when the deviation is sustained across the window.
    Specifically: if the LAST value is the SOLE outlier (all other values
    are ≥ their mean) the trend is flagged as a transient scenario injection.
    Also checks that both halves of the window agree in slope direction.
    """
    n = len(values)
    if n < _MIN_WINDOW * 2:
        return True   # too small to split — trust the slope

    # Single last-point outlier guard: if all but the final value are within
    # ±1 std-dev of the pre-last mean, treat the final point as a transient.
    if n >= 4:
        pre_mean = sum(values[:-1]) / (n - 1)
        pre_std  = (sum((v - pre_mean) ** 2 for v in values[:-1]) / (n - 1)) ** 0.5
        if pre_std < 0.5:   # very tight cluster before last point
            pre_std = 0.5    # avoid div-by-zero
        z_last = abs(values[-1] - pre_mean) / pre_std
        if z_last > 3.0:    # last point is >3σ from prior distribution
            return False     # flag as scenario injection transient

    mid   = n // 2
    s_old = _ewm_slope(values[:mid], interval_hours)
    s_new = _ewm_slope(values[mid:], interval_hours)
    # Both must agree in sign (with a tiny dead-band of ±0.1)
    return (s_old * s_new >= 0) or (abs(s_old) < 0.1 and abs(s_new) < 0.1)


def extrapolate_hours_to_threshold(
    current: float,
    slope_per_hour: float,
    threshold: float,
    is_higher_worse: bool = False,
) -> Optional[float]:
    """
    Estimate hours until value crosses threshold.
    Returns None if already past threshold, flat/improving, or result > 72 h.
    """
    if is_higher_worse:
        if current >= threshold or slope_per_hour <= 0:
            return None
        h = (threshold - current) / slope_per_hour
    else:
        if current <= threshold or slope_per_hour >= 0:
            return None
        h = (current - threshold) / abs(slope_per_hour)
    # Suppress implausibly short or implausibly long projections
    return round(h, 1) if 0.5 <= h <= 72.0 else None


def predict_crew_trajectory(
    frames_24h: List[TelemetryFrame],
    current_readiness: float,
) -> PredictionResult:
    """
    Robust trajectory prediction using EWM-smoothed slope estimation.
    Window: last 8 frames (~16 hrs at 2-hr intervals) for sustained trends;
            last 4 frames (~8 hrs) when full window is unavailable.
    """
    crew_id = frames_24h[0].crew_id if frames_24h else "UNKNOWN"
    readiness_series = [f.composite_readiness_score for f in frames_24h]

    # Prefer 8-frame window; fall back to whatever is available
    window_size = min(8, len(readiness_series))
    window = readiness_series[-window_size:] if window_size > 0 else readiness_series

    interval = 2.0   # hours between telemetry frames (30-min interval × 4 → re-sample)
    slope    = _ewm_slope(window, interval_hours=interval)
    stable   = abs(slope) < 0.5

    # Consistency guard: transient scenario spikes get a different label
    consistent = _is_consistent_trend(window, interval)

    hours_to_red   = None
    hours_to_amber = None
    if consistent and not stable:
        hours_to_red   = extrapolate_hours_to_threshold(current_readiness, slope, 50.0)
        hours_to_amber = extrapolate_hours_to_threshold(current_readiness, slope, 80.0)

    # Predicted status at +6h
    predicted_6h = max(0.0, min(100.0, current_readiness + slope * 6.0))
    if stable:
        predicted_status_6h = "STABLE"
    elif predicted_6h >= 80:
        predicted_status_6h = "GREEN"
    elif predicted_6h >= 50:
        predicted_status_6h = "AMBER"
    else:
        predicted_status_6h = "RED"

    # Human-readable basis
    n = len(window)
    if not consistent:
        basis = f"Scenario transition — monitoring for sustained trend ({n} readings)"
        predicted_status_6h = "STABLE"   # don't alarm on transient
    elif stable:
        basis = f"Stable trajectory over last {n * 2}h"
    elif slope < 0:
        basis = f"Degrading {abs(slope):.1f} pts/hr over last {n * 2}h (EWM smoothed)"
    else:
        basis = f"Recovering {slope:.1f} pts/hr over last {n * 2}h (EWM smoothed)"

    conf_str = (
        f"HIGH ({n} readings)" if n >= 6
        else f"MODERATE ({n} readings)" if n >= _MIN_WINDOW
        else f"LOW ({n} readings)"
    )

    return PredictionResult(
        crew_id=crew_id,
        current_readiness=round(current_readiness, 1),
        trend_per_hour=round(slope, 2),
        hours_to_red=hours_to_red,
        hours_to_amber=hours_to_amber,
        predicted_status_in_6h=predicted_status_6h,
        prediction_basis=basis,
        confidence=conf_str,
    )
