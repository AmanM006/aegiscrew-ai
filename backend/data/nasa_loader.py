"""
AegisCrew AI — NASA Data Loader
Reads the three pre-existing NASA datasets from data/ and exposes typed
Python objects used by the rest of the backend.
"""
from __future__ import annotations

import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd

from backend.core.config import (
    NASA_BIOMETRICS_PATH,
    NASA_PROTOCOLS_PATH,
    NASA_TIMESERIES_PATH,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Raw JSON loaders (cached for the process lifetime)
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def load_biometrics_reference() -> Dict[str, Any]:
    """Return parsed NASA-STD-3001 crew biometrics reference JSON."""
    path = NASA_BIOMETRICS_PATH
    if not path.exists():
        logger.warning("Biometrics reference file not found at %s — using empty dict", path)
        return {}
    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    logger.info("Loaded biometrics reference: %d crew members", len(data.get("crew_members", [])))
    return data


@lru_cache(maxsize=1)
def load_flight_surgeon_protocols() -> List[Dict[str, Any]]:
    """Return list of NASA SP-2010-3407 clinical intervention protocols."""
    path = NASA_PROTOCOLS_PATH
    if not path.exists():
        logger.warning("Flight surgeon protocols file not found at %s — using empty list", path)
        return []
    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    protocols = data.get("protocols", [])
    logger.info("Loaded %d flight surgeon protocols", len(protocols))
    return protocols


@lru_cache(maxsize=1)
def load_timeseries_dataframe() -> pd.DataFrame:
    """Return the full 1,440-row ISS telemetry CSV as a tidy DataFrame."""
    path = NASA_TIMESERIES_PATH
    if not path.exists():
        logger.warning("Timeseries CSV not found at %s — returning empty DataFrame", path)
        return pd.DataFrame()
    df = pd.read_csv(path, parse_dates=["timestamp_utc"])
    df.sort_values(["crew_id", "timestamp_utc"], inplace=True)
    df.reset_index(drop=True, inplace=True)
    logger.info("Loaded timeseries: %d rows × %d columns", len(df), len(df.columns))
    return df


# ---------------------------------------------------------------------------
# Derived helpers
# ---------------------------------------------------------------------------

def get_crew_profiles() -> List[Dict[str, Any]]:
    """Return list of static crew member profiles from biometrics reference."""
    ref = load_biometrics_reference()
    return ref.get("crew_members", [])


def get_thresholds() -> Dict[str, Any]:
    """Return NASA-STD-3001 clinical warning thresholds."""
    ref = load_biometrics_reference()
    return ref.get("thresholds", {})


def get_crew_baseline(crew_id: str) -> Dict[str, Any]:
    """Return baseline vitals dict for a given crew_id, or empty dict."""
    for member in get_crew_profiles():
        if member["id"] == crew_id:
            return member["baseline"]
    return {}


def get_protocol_by_id(protocol_id: str) -> Dict[str, Any]:
    """Retrieve a specific protocol by its id field."""
    for p in load_flight_surgeon_protocols():
        if p.get("id") == protocol_id:
            return p
    return {}


def get_latest_telemetry_by_crew(crew_id: str) -> Dict[str, Any]:
    """Return the most recent telemetry row for a given crew_id."""
    df = load_timeseries_dataframe()
    if df.empty:
        return {}
    subset = df[df["crew_id"] == crew_id]
    if subset.empty:
        return {}
    row = subset.sort_values("timestamp_utc").iloc[-1]
    return row.to_dict()


def get_history_24h(crew_id: str, mission_day: int | None = None) -> pd.DataFrame:
    """
    Return last-24-hours telemetry rows for a given crew_id.
    If mission_day is provided, filter to that day; otherwise use the last day
    present in the dataset.
    """
    df = load_timeseries_dataframe()
    if df.empty:
        return df
    subset = df[df["crew_id"] == crew_id].copy()
    if mission_day is None:
        mission_day = int(subset["mission_day"].max())
    return subset[subset["mission_day"] == mission_day].reset_index(drop=True)
