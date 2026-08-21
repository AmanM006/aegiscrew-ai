"""
AegisCrew AI — Clinical RAG (Retrieval-Augmented Generation)
Provides protocol retrieval grounded in NASA SP-2010-3407 data.
Used as a context injector for the Granite flight surgeon agent.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List

from backend.core.telemetry_schema import RiskFactor
from backend.data.nasa_loader import load_flight_surgeon_protocols, load_biometrics_reference

logger = logging.getLogger(__name__)


def retrieve_protocols_for_anomalies(anomalies: List[RiskFactor]) -> List[Dict[str, Any]]:
    """
    Retrieve relevant clinical protocols from the NASA flight surgeon database
    for a list of detected anomalies.  Exact protocol_id match first, then
    category fuzzy match.
    """
    all_protocols = load_flight_surgeon_protocols()
    if not all_protocols:
        return []

    protocol_ids = {a.protocol_id for a in anomalies if a.protocol_id}
    categories   = {a.category.lower() for a in anomalies}

    results: List[Dict[str, Any]] = []
    seen: set = set()

    for p in all_protocols:
        pid = p.get("id", "")
        if pid in protocol_ids and pid not in seen:
            results.append(p)
            seen.add(pid)

    # fallback category match
    for p in all_protocols:
        pid = p.get("id", "")
        if pid in seen:
            continue
        cat = p.get("category", "").lower()
        for a_cat in categories:
            if any(word in cat for word in a_cat.split(" / ")):
                results.append(p)
                seen.add(pid)
                break

    return results


def build_rag_context(
    anomalies: List[RiskFactor],
    extra_crew_context: str = "",
) -> str:
    """
    Assemble a compact RAG context string to prepend to the Granite prompt.
    Includes matching clinical protocols and NASA standard thresholds.
    """
    protocols = retrieve_protocols_for_anomalies(anomalies)
    thresholds = load_biometrics_reference().get("thresholds", {})

    lines: List[str] = [
        "=== NASA SP-2010-3407 RELEVANT CLINICAL PROTOCOLS ===",
    ]
    for p in protocols:
        lines.append(
            f"\n[{p['id']}] {p['title']}\n"
            f"  Condition: {p['condition']}\n"
            f"  Action: {p['clinical_action']}\n"
            f"  Operational Impact: {p['operational_impact']}\n"
            f"  Citations: {', '.join(p.get('citations', []))}"
        )

    if thresholds:
        lines.append("\n=== NASA-STD-3001 CLINICAL THRESHOLDS ===")
        lines.append(json.dumps(thresholds, indent=2))

    if extra_crew_context:
        lines.append(f"\n=== CURRENT CREW STATUS ===\n{extra_crew_context}")

    return "\n".join(lines)


def format_anomaly_summary(anomalies: List[RiskFactor]) -> str:
    """Format anomaly list as a concise clinical briefing string."""
    if not anomalies:
        return "No active anomalies detected. All crew within nominal parameters."
    lines = ["ACTIVE CLINICAL ANOMALIES:"]
    for a in anomalies:
        lines.append(
            f"  [{a.severity}] {a.category}: {a.description} "
            f"(Value={a.value:.2f}, Threshold={a.threshold:.2f})"
        )
    return "\n".join(lines)
