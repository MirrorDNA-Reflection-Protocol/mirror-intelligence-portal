"""
⟡ Mirror Intelligence — Data Schema
Pydantic models defining the data structure for briefings and predictions.
"""

from datetime import datetime
from typing import List, Optional, Dict, Literal
from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════════
# SOURCE & EVIDENCE
# ═══════════════════════════════════════════════════════════════

class Source(BaseModel):
    """A cited source for a briefing item."""
    n: int
    name: str
    url: Optional[str] = None
    tier: int = 1  # 1 = primary, 2 = secondary


class Evidence(BaseModel):
    """Evidence supporting a prediction."""
    type: Literal["primary", "quant", "analog"]
    text: str


# ═══════════════════════════════════════════════════════════════
# BRIEFING ITEMS
# ═══════════════════════════════════════════════════════════════

class BriefingItem(BaseModel):
    """A single item in a briefing section."""
    text: str
    detail: Optional[str] = None
    source: Optional[Source] = None
    voice: Optional[str] = None  # gpt, deepseek, groq, mistral
    severity: Optional[Literal["low", "medium", "high", "risk"]] = None
    priority: Optional[Literal["low", "medium", "high"]] = None


class BriefingSections(BaseModel):
    """All sections of a daily briefing."""
    changed: List[BriefingItem] = Field(default_factory=list)
    matters: List[BriefingItem] = Field(default_factory=list)
    risks: List[BriefingItem] = Field(default_factory=list)
    actions: List[BriefingItem] = Field(default_factory=list)
    ignore: List[BriefingItem] = Field(default_factory=list)


class BriefingStats(BaseModel):
    """Metadata about briefing generation."""
    sources: int = 0
    models: int = 4


class Briefing(BaseModel):
    """The daily intelligence briefing."""
    headline: str
    subline: str
    summary: str
    stats: BriefingStats = Field(default_factory=BriefingStats)
    sections: BriefingSections = Field(default_factory=BriefingSections)


# ═══════════════════════════════════════════════════════════════
# PREDICTIONS
# ═══════════════════════════════════════════════════════════════

class ModelReasoning(BaseModel):
    """A single model's reasoning on a prediction."""
    position: Literal["supports", "neutral", "skeptical"]
    argument: str
    would_change: str


class ProbabilityData(BaseModel):
    """Probabilistic assessment of a prediction."""
    base_rate: int  # Historical base rate %
    updated: int    # Updated probability after evidence %
    range: List[int] = Field(default_factory=lambda: [0, 100])  # Confidence interval
    decay: str      # Time horizon (e.g., "Q2 2026")


class Prediction(BaseModel):
    """A living prediction with multi-model analysis."""
    id: str
    text: str
    state: Literal["strengthening", "neutral", "weakening"]
    timeframe: str
    confidence: Optional[str] = None
    probability: Optional[ProbabilityData] = None
    reasoning: Optional[Dict[str, ModelReasoning]] = None
    evidence: List[Evidence] = Field(default_factory=list)


# ═══════════════════════════════════════════════════════════════
# TOP-LEVEL DATA
# ═══════════════════════════════════════════════════════════════

class Meta(BaseModel):
    """Metadata for the data file."""
    date: str  # Human-readable date
    generated: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


class PortalData(BaseModel):
    """The complete data structure for the portal."""
    meta: Meta
    briefing: Briefing
    predictions: List[Prediction] = Field(default_factory=list)
    
    def to_json_file(self, path: str) -> None:
        """Write data to JSON file."""
        import json
        with open(path, "w") as f:
            json.dump(self.model_dump(), f, indent=4)
    
    @classmethod
    def from_json_file(cls, path: str) -> "PortalData":
        """Load data from JSON file."""
        import json
        with open(path) as f:
            return cls.model_validate(json.load(f))


# ═══════════════════════════════════════════════════════════════
# LIVE EVENTS (for SSE stream)
# ═══════════════════════════════════════════════════════════════

class LiveEvent(BaseModel):
    """An event for the live SSE stream."""
    type: Literal["ingest", "inference", "synthesis", "publish", "error"]
    agent: Optional[str] = None  # gpt, deepseek, groq, mistral, swarm
    message: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    data: Optional[Dict] = None
