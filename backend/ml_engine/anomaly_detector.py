"""
AegisCrew AI — ML Anomaly Detector
Trains one scikit-learn IsolationForest per astronaut on the historical NASA
OSDR telemetry CSV at application startup.  Scores live frames against that
per-astronaut distribution and identifies the top deviating features.

Gracefully degrades to threshold-only scoring if sklearn is unavailable or
the CSV has insufficient data.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

# Import the canonical Pydantic AnomalyResult — do NOT redefine it here
from backend.core.telemetry_schema import AnomalyResult, TelemetryFrame
from backend.data.nasa_loader import load_timeseries_dataframe

logger = logging.getLogger(__name__)

# Features used for model training (must map 1-to-1 to _frame_to_vector())
FEATURE_COLS = [
    "heart_rate_bpm",
    "hrv_rmssd_ms",
    "spo2_percent",
    "sleep_debt_72h_hrs",
    "daily_radiation_mgy",
    "cabin_co2_ppm",
    "pvt_reaction_time_ms",
    "core_temp_c",
]

FEATURE_LABELS = {
    "heart_rate_bpm":      "Elevated Heart Rate",
    "hrv_rmssd_ms":        "Low HRV (autonomic stress)",
    "spo2_percent":        "Reduced SpO₂",
    "sleep_debt_72h_hrs":  "Sleep Debt Accumulation",
    "daily_radiation_mgy": "Radiation Flux Spike",
    "cabin_co2_ppm":       "Elevated Cabin CO₂",
    "pvt_reaction_time_ms":"PVT Reaction Time Degradation",
    "core_temp_c":         "Core Temperature Deviation",
}


@dataclass
class _AstroModel:
    """Per-astronaut fitted model + per-feature statistics."""
    crew_id: str
    model: object                  # IsolationForest instance
    feature_means: np.ndarray
    feature_stds: np.ndarray
    n_samples: int


# Module-level cache of fitted models keyed by crew_id
_MODELS: Dict[str, _AstroModel] = {}
_SKLEARN_AVAILABLE = False


def _try_import_sklearn():
    global _SKLEARN_AVAILABLE
    try:
        from sklearn.ensemble import IsolationForest  # noqa: F401
        _SKLEARN_AVAILABLE = True
    except ImportError:
        logger.warning("scikit-learn not installed — anomaly detector will use threshold-only mode.")
        _SKLEARN_AVAILABLE = False
    return _SKLEARN_AVAILABLE


def _frame_to_vector(frame: TelemetryFrame) -> np.ndarray:
    """Convert a TelemetryFrame to the 8-feature numpy vector used by the model."""
    return np.array([
        frame.vitals.heart_rate_bpm,
        frame.vitals.hrv_rmssd_ms,
        frame.vitals.spo2_percent,
        frame.circadian.sleep_debt_72h_hrs,
        frame.radiation.daily_radiation_mgy,
        frame.atmosphere.cabin_co2_ppm,
        frame.circadian.pvt_reaction_time_ms,
        frame.vitals.core_temp_c,
    ], dtype=float)


def fit_models() -> None:
    """
    Fit one IsolationForest per astronaut on historical NASA telemetry.
    Called once at application startup.
    """
    if not _try_import_sklearn():
        return

    from sklearn.ensemble import IsolationForest

    df = load_timeseries_dataframe()
    if df.empty:
        logger.warning("Timeseries CSV empty — skipping IsolationForest training.")
        return

    # Keep only NOMINAL rows for baseline training (exclude injected emergencies)
    nominal_df = df[df["spe_alert_status"] == "NOMINAL"].copy()

    crew_ids = nominal_df["crew_id"].unique()
    total_trained = 0

    for cid in crew_ids:
        crew_df = nominal_df[nominal_df["crew_id"] == cid]
        # Only train on columns that exist in the dataframe
        available = [c for c in FEATURE_COLS if c in crew_df.columns]
        X = crew_df[available].dropna().values

        if len(X) < 10:
            logger.warning("Insufficient samples for %s (%d rows) — skipping.", cid, len(X))
            continue

        means = X.mean(axis=0)
        stds  = X.std(axis=0)
        stds[stds == 0] = 1.0   # avoid division by zero for constant features

        clf = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42,
            n_jobs=-1,
        )
        clf.fit(X)

        _MODELS[cid] = _AstroModel(
            crew_id=cid,
            model=clf,
            feature_means=means,
            feature_stds=stds,
            n_samples=len(X),
        )
        total_trained += len(X)
        logger.info("IsolationForest trained for %s on %d samples.", cid, len(X))

    logger.info(
        "AegisCrew anomaly detector ready: %d crew models, %d total training samples.",
        len(_MODELS), total_trained,
    )


def detect_anomaly(crew_id: str, frame: TelemetryFrame) -> AnomalyResult:
    """
    Score a live TelemetryFrame against the astronaut's historical baseline.
    Returns an AnomalyResult with score, flag, contributing features, and
    confidence string.  Falls back gracefully if model unavailable.
    """
    model_data = _MODELS.get(crew_id)

    if model_data is None or not _SKLEARN_AVAILABLE:
        # Graceful degradation — return a neutral result
        return AnomalyResult(
            crew_id=crew_id,
            anomaly_score=0.0,
            is_anomaly=False,
            contributing_features=[],
            confidence_str="threshold-only mode",
            training_samples=0,
        )

    vec = _frame_to_vector(frame).reshape(1, -1)
    # decision_function: negative = more anomalous; map to 0-100 (higher = worse)
    raw_score = float(model_data.model.decision_function(vec)[0])
    # IsolationForest decision_function typically ranges roughly -0.5 to +0.5
    # Normalise: anomaly_score=100 when raw_score=-0.5, anomaly_score=0 when raw_score=0.5
    anomaly_score = float(np.clip((0.5 - raw_score) / 1.0 * 100, 0, 100))

    is_anomaly = bool(model_data.model.predict(vec)[0] == -1)

    # Per-feature z-scores → top deviating features
    z_scores = np.abs((vec[0] - model_data.feature_means) / model_data.feature_stds)
    top_indices = np.argsort(z_scores)[::-1][:3]
    contributing = []
    for idx in top_indices:
        if idx < len(FEATURE_COLS) and z_scores[idx] > 1.5:
            col_name = FEATURE_COLS[idx]
            label = FEATURE_LABELS.get(col_name, col_name)
            contributing.append(f"{label} (z={z_scores[idx]:.1f}σ)")

    # Confidence: based on training sample count and distance from training distribution
    # Closer to decision boundary = lower confidence in flag
    dist_from_boundary = abs(raw_score)
    conf_pct = min(int(50 + dist_from_boundary * 100), 99)
    confidence_str = f"{conf_pct}% confidence · {model_data.n_samples:,} samples"

    return AnomalyResult(
        crew_id=crew_id,
        anomaly_score=round(anomaly_score, 1),
        is_anomaly=is_anomaly,
        contributing_features=contributing,
        confidence_str=confidence_str,
        training_samples=model_data.n_samples,
    )
