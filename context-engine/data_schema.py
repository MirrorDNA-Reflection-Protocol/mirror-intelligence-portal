from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime
import hashlib
import json

# ═══════════════════════════════════════════════════════════════
# TRUTH LEDGER PRIMITIVES
# ═══════════════════════════════════════════════════════════════

class Meta(BaseModel):
    date: str
    version: str = "3.0-truth-engine"

class LiveEvent(BaseModel):
    type: str
    message: str
    agent: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class Source(BaseModel):
    """A raw data source ingested by the engine."""
    id: str  # Hash of url
    url: str
    title: str
    text: str  # Full extracted text
    timestamp: datetime
    domain: str
    source: str = "Unknown"

    @classmethod
    def from_feed_entry(cls, entry: Any, source_name: str = "Unknown") -> "Source":
        url = entry.get("link", "")
        # Hash URL for unique ID
        source_id = hashlib.sha256(url.encode()).hexdigest()[:12]
        return cls(
            id=source_id,
            url=url,
            title=entry.get("title", "Unknown Title"),
            text=entry.get("summary", "") or entry.get("content", [{"value": ""}])[0]["value"],
            timestamp=datetime.utcnow(),
            domain=url.split("/")[2] if "//" in url else "unknown",
            source=source_name
        )

class Evidence(BaseModel):
    """A specific excerpt from a source that supports a claim."""
    source_id: str
    excerpt: str
    relevance_score: float  # 0.0 to 1.0 (Assigned by Council)
    context: str # "Why it matters"

class Forecast(BaseModel):
    """A falsifiable prediction with resolution criteria."""
    id: str
    question: str
    created_at: datetime
    resolution_date: datetime
    resolution_criteria: str
    probability: float = Field(..., ge=0, le=1)  # 0.0 to 1.0
    status: Literal["open", "resolved", "expired"] = "open"
    outcome: Optional[bool] = None  # True (Happened), False (Did not)
    brier_score: Optional[float] = None # Calculated upon resolution
    evidence_ids: List[str] = []

    def resolve(self, outcome: bool):
        self.outcome = outcome
        self.status = "resolved"
        # Brier score: (outcome - probability)^2
        # If outcome is True (1.0), score = (1.0 - prob)^2
        # If outcome is False (0.0), score = (0.0 - prob)^2
        outcome_val = 1.0 if outcome else 0.0
        self.brier_score = round((outcome_val - self.probability) ** 2, 4)

class LedgerEntry(BaseModel):
    """An immutable record in the append-only Truth Ledger."""
    id: str # Hash of content + timestamp
    timestamp: datetime
    type: Literal["INGEST", "FORECAST_OPEN", "FORECAST_RESOLVE", "CLAIM", "SYSTEM_UPDATE"]
    payload: Dict[str, Any]
    prev_hash: Optional[str] = None

    @classmethod
    def create(cls, type: str, payload: Any, prev_hash: str = None) -> "LedgerEntry":
        payload_dict = payload.model_dump() if hasattr(payload, "model_dump") else payload
        ts = datetime.utcnow()
        content = f"{ts.isoformat()}{type}{json.dumps(payload_dict, sort_keys=True, default=str)}{prev_hash}"
        entry_id = hashlib.sha256(content.encode()).hexdigest()
        return cls(
            id=entry_id,
            timestamp=ts,
            type=type,
            payload=payload_dict,
            prev_hash=prev_hash
        )

# ═══════════════════════════════════════════════════════════════
# CORE STATE (THE MIND)
# ═══════════════════════════════════════════════════════════════



class RealityDelta(BaseModel):
    type: str  # probability_shift, signal_noise, new_risk, observation
    text: str
    magnitude: Optional[int] = None
    sentiment: Literal["positive", "negative", "neutral", "alert"] = "neutral"

class MentalModelUpdate(BaseModel):
    matters: str
    confidence: str
    unresolved: str

class TimePoint(BaseModel):
    date: str
    value: int

class LivingBelief(BaseModel):
    id: str
    statement: str
    status: Literal["active", "strengthening", "weakening", "questioned"]
    confidence: int  # 0-100
    last_challenged: str
    evidence_for: str
    evidence_against: str
    history: List[TimePoint] = []

class Risk(BaseModel):
    id: str
    text: str
    status: Literal["developing", "escalating", "critical", "mitigated"]
    compounding_factor: str
    severity: Literal["low", "medium", "high"]

class LivingMind(BaseModel):
    """The current state of the engine, derived from the Ledger."""
    sources: List[Source] = []
    forecasts: List[Forecast] = []
    ledger: List[LedgerEntry] = []
    
    # Restored fields for frontend/council compatibility
    deltas: List[RealityDelta] = []
    update: Optional[MentalModelUpdate] = None
    beliefs: List[LivingBelief] = []
    risks: List[Risk] = []
    
    # Metacognition
    stats: Dict[str, Any] = {
        "sources_scanned_today": 0,
        "sources_scanned_24h": 0,
        "unique_sources": 0,
        "total_fetched": 0,
        "failed_feeds": 0,
        "last_updated": None,
        "active_forecasts": 0,
        "mean_brier_score": None
    }

    def add_source(self, source: Source):
        # Deduplicate
        if any(s.id == source.id for s in self.sources):
            return
        self.sources.append(source)
        # Add to ledger
        self._append_ledger("INGEST", {"url": source.url, "title": source.title})
        self.stats["sources_scanned_today"] += 1

    def add_forecast(self, forecast: Forecast):
        self.forecasts.append(forecast)
        self._append_ledger("FORECAST_OPEN", forecast)
        self.stats["active_forecasts"] += 1

    def resolve_forecast(self, forecast_id: str, outcome: bool):
        for f in self.forecasts:
            if f.id == forecast_id and f.status == "open":
                f.resolve(outcome)
                self._append_ledger("FORECAST_RESOLVE", f)
                self._recalc_score()
                break

    def _append_ledger(self, type: str, payload: Any):
        prev = self.ledger[-1].id if self.ledger else "0000000000000000"
        entry = LedgerEntry.create(type, payload, prev)
        self.ledger.append(entry)
        self.stats["last_updated"] = datetime.utcnow().isoformat()

    def _recalc_score(self):
        resolved = [f for f in self.forecasts if f.status == "resolved"]
        if not resolved:
            self.stats["mean_brier_score"] = None
            return
        total = sum(f.brier_score for f in resolved)
        self.stats["mean_brier_score"] = round(total / len(resolved), 4)

# ═══════════════════════════════════════════════════════════════
# LEGACY / SOFT SCHEMA (RETAINED FOR CONTINUITY)
# ═══════════════════════════════════════════════════════════════


class CouncilDialogue(BaseModel):
    topic: str
    architect: str
    skeptic: str
    historian: str
    conclusion: str

class BriefingStats(BaseModel):
    sources: int = 0
    models: int = 3

class PortalData(BaseModel):
    """The root object served to the frontend."""
    meta: Meta
    mind: LivingMind

    def to_json_file(self, path: str) -> None:
        with open(path, "w") as f:
            json.dump(self.model_dump(), f, indent=4, default=str)

    @classmethod
    def from_json_file(cls, path: str) -> "PortalData":
        try:
            with open(path) as f:
                return cls.model_validate(json.load(f))
        except FileNotFoundError:
            return cls(
                meta=Meta(date=datetime.now().strftime("%A, %B %d, %Y")),
                mind=LivingMind()
            )
