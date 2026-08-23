"""
AegisCrew AI — Telemetry Streamer
Converts raw NASA CSV rows + scenario overrides into typed TelemetryFrame
objects consumed by the ML engine and FastAPI endpoints.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional

import pandas as pd

from backend.core.telemetry_schema import (
    AstronautVitals,
    CabinAtmosphere,
    CircadianMetrics,
    CognitiveAcuity,
    RadiationDosimetry,
    TelemetryFrame,
)
from backend.data.nasa_loader import (
    get_crew_baseline,
    get_crew_profiles,
    get_history_24h,
    get_latest_telemetry_by_crew,
    load_timeseries_dataframe,
)

logger = logging.getLogger(__name__)

# Active scenario state (mutated by scenario_manager)
_ACTIVE_OVERRIDES: Dict[str, Dict] = {}


def set_scenario_overrides(overrides: Dict[str, Dict]) -> None:
    """Replace active per-crew telemetry overrides from the scenario manager."""
    global _ACTIVE_OVERRIDES
    _ACTIVE_OVERRIDES = overrides
    logger.info("Scenario overrides applied for crew: %s", list(overrides.keys()))


def clear_scenario_overrides() -> None:
    global _ACTIVE_OVERRIDES
    _ACTIVE_OVERRIDES = {}


def _row_to_frame(row: pd.Series, overrides: Dict | None = None) -> TelemetryFrame:
    """
    Convert a single telemetry CSV row (or dict) to a TelemetryFrame.
    Optional ``overrides`` dict is shallow-merged on top of the row values.
    """
    d: dict = row.to_dict() if isinstance(row, pd.Series) else dict(row)
    if overrides:
        d.update(overrides)

    # Normalise timestamp
    ts = d.get("timestamp_utc")
    if isinstance(ts, str):
        ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
    elif not isinstance(ts, datetime):
        ts = datetime.now(tz=timezone.utc)

    # SPE alert
    spe_raw = str(d.get("spe_alert_status", "NOMINAL")).upper()
    spe_map = {"NOMINAL": "NOMINAL", "WATCH": "WATCH", "WARNING": "WARNING", "EMERGENCY": "EMERGENCY"}
    spe_status = spe_map.get(spe_raw, "NOMINAL")

    # Traffic light
    tl_raw = str(d.get("status_traffic_light", "GREEN")).upper()
    tl_map = {"GREEN": "GREEN", "AMBER": "AMBER", "RED": "RED"}
    tl_status = tl_map.get(tl_raw, "GREEN")

    pvt = float(d.get("pvt_reaction_time_ms", 220))
    sleep_debt = float(d.get("sleep_debt_72h_hrs", 0))

    return TelemetryFrame(
        mission_day=int(d.get("mission_day", 1)),
        timestamp_utc=ts,
        crew_id=str(d.get("crew_id", "UNKNOWN")),
        vitals=AstronautVitals(
            heart_rate_bpm=float(d.get("heart_rate_bpm", 65)),
            hrv_rmssd_ms=float(d.get("hrv_rmssd_ms", 50)),
            spo2_percent=float(d.get("spo2_percent", 98)),
            core_temp_c=float(d.get("core_temp_c", 36.8)),
        ),
        circadian=CircadianMetrics(
            sleep_hours_last_night=float(d.get("sleep_hours_last_night", 7)),
            sleep_debt_72h_hrs=sleep_debt,
            pvt_reaction_time_ms=pvt,
        ),
        radiation=RadiationDosimetry(
            daily_radiation_mgy=float(d.get("daily_radiation_mgy", 1.0)),
            cumulative_radiation_msv=float(d.get("cumulative_radiation_msv", 120)),
            spe_alert_status=spe_status,  # type: ignore[arg-type]
        ),
        atmosphere=CabinAtmosphere(
            cabin_co2_ppm=float(d.get("cabin_co2_ppm", 2600)) + {"ASTRO-01": 75.0, "ASTRO-02": -45.0, "ASTRO-03": 110.0, "ASTRO-04": -80.0}.get(str(d.get("crew_id", "")), 0.0),
            cabin_o2_percent=float(d.get("cabin_o2_percent", 20.9)),
            cabin_pressure_kpa=float(d.get("cabin_pressure_kpa", 101.3)),
        ),
        cognitive=CognitiveAcuity(
            pvt_reaction_time_ms=pvt,
            fatigue_index=min(sleep_debt / 8.0, 1.0),
        ),
        composite_readiness_score=float(d.get("composite_readiness_score", 95)),
        status_traffic_light=tl_status,  # type: ignore[arg-type]
    )


def get_latest_frame(crew_id: str) -> TelemetryFrame:
    """Return the most recent TelemetryFrame for a crew member, with overrides applied."""
    raw = get_latest_telemetry_by_crew(crew_id)
    if not raw:
        # Synthesize a baseline frame if CSV lookup fails
        baseline = get_crew_baseline(crew_id)
        raw = {
            "mission_day": 142,
            "timestamp_utc": datetime.now(tz=timezone.utc),
            "crew_id": crew_id,
            "heart_rate_bpm": baseline.get("resting_heart_rate", 65),
            "hrv_rmssd_ms": baseline.get("hrv_rmssd", 55),
            "spo2_percent": baseline.get("spo2_percent", 98),
            "core_temp_c": baseline.get("core_temp_c", 36.8),
            "sleep_hours_last_night": 7.0,
            "sleep_debt_72h_hrs": 0.5,
            "pvt_reaction_time_ms": baseline.get("pvt_reaction_time_ms", 220),
            "daily_radiation_mgy": 1.2,
            "cumulative_radiation_msv": 142.0,
            "cabin_co2_ppm": 2600.0,
            "cabin_o2_percent": 20.9,
            "cabin_pressure_kpa": 101.3,
            "spe_alert_status": "NOMINAL",
            "composite_readiness_score": 95.0,
            "status_traffic_light": "GREEN",
        }
    overrides = _ACTIVE_OVERRIDES.get(crew_id, {})
    return _row_to_frame(pd.Series(raw), overrides if overrides else None)


def get_frames_24h(crew_id: str, mission_day: Optional[int] = None) -> List[TelemetryFrame]:
    """Return all TelemetryFrames for a crew member over the last 24 hours."""
    df = get_history_24h(crew_id, mission_day)
    overrides = _ACTIVE_OVERRIDES.get(crew_id, {})
    frames: List[TelemetryFrame] = []
    for _, row in df.iterrows():
        frames.append(_row_to_frame(row, overrides if overrides else None))
    return frames


def get_all_crew_ids() -> List[str]:
    return [p["id"] for p in get_crew_profiles()]
