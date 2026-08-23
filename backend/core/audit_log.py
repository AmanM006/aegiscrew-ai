"""
AegisCrew AI -- Mission Decision Audit Log
Persistent in-memory black-box recorder for every autonomous AI action.

Modeled on aerospace flight-data-recorder requirements (NASA-HDBK-2203 mandates
auditable decision trails for human-rated autonomous systems). Every scenario
trigger, countermeasure prescription, crew-wide alert, and briefing generation
is logged here so missions can be reviewed post-fact.
"""
from __future__ import annotations

import logging
import threading
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# Event type constants -- used as icon/color keys on the frontend too
EVENT_SCENARIO_TRIGGERED   = "SCENARIO_TRIGGERED"
EVENT_COUNTERMEASURE       = "COUNTERMEASURE_PRESCRIBED"
EVENT_CREW_WIDE_ALERT      = "CREW_WIDE_ALERT"
EVENT_BRIEFING_GENERATED   = "BRIEFING_GENERATED"
EVENT_ANOMALY_DETECTED     = "ANOMALY_DETECTED"
EVENT_TIMEOUT_FALLBACK     = "TIMEOUT_FALLBACK"


@dataclass
class AuditEntry:
    """A single immutable audit record."""
    timestamp: str           # ISO-8601 UTC
    event_type: str          # one of EVENT_* constants above
    astronaut_id: str        # specific crew ID or "FLEET" for crew-wide events
    summary: str             # human-readable one-liner
    data_snapshot: Dict      # key metrics that triggered this entry (for traceability)
    sequence: int = 0        # monotonically increasing insertion counter

    def to_dict(self) -> dict:
        return asdict(self)


class _AuditLog:
    """Thread-safe in-memory audit log with a maximum retention cap."""

    MAX_ENTRIES = 500   # keep last 500 entries in memory (well beyond any demo session)

    def __init__(self):
        self._entries: List[AuditEntry] = []
        self._lock = threading.Lock()
        self._seq = 0

    def append(
        self,
        event_type: str,
        summary: str,
        astronaut_id: str = "FLEET",
        data_snapshot: Optional[Dict] = None,
    ) -> None:
        """Append an entry. Thread-safe."""
        with self._lock:
            self._seq += 1
            entry = AuditEntry(
                timestamp=datetime.now(tz=timezone.utc).isoformat(),
                event_type=event_type,
                astronaut_id=astronaut_id,
                summary=summary,
                data_snapshot=data_snapshot or {},
                sequence=self._seq,
            )
            self._entries.append(entry)
            if len(self._entries) > self.MAX_ENTRIES:
                self._entries = self._entries[-self.MAX_ENTRIES:]
        logger.info("AUDIT [%s] %s: %s", event_type, astronaut_id, summary[:80])

    def get_recent(self, limit: int = 50) -> List[dict]:
        """Return the most recent `limit` entries, newest first."""
        with self._lock:
            return [e.to_dict() for e in reversed(self._entries[-limit:])]

    def get_all(self) -> List[dict]:
        """Return all entries oldest-first (for JSON export)."""
        with self._lock:
            return [e.to_dict() for e in self._entries]

    def clear(self) -> None:
        with self._lock:
            self._entries.clear()
            self._seq = 0


# Module-level singleton -- import and call audit_log.append() from anywhere
audit_log = _AuditLog()
