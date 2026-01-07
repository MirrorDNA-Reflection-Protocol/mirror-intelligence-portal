"""
⟡ Mirror Intelligence — Living Mind Schema
Data models for the Cognitive Primitive (Reality Deltas, Living Beliefs).
"""

from datetime import datetime
from typing import List, Optional, Dict, Literal, Union
from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════════
# CORE PRIMITIVES
# ═══════════════════════════════════════════════════════════════

class Source(BaseModel):
    """A cited source."""
    n: int
    name: str
    url: Optional[str] = None
    tier: int = 1


class RealityDelta(BaseModel):
    """
    A single unit of change in reality. 
    Displayed in the 'Reality Delta Strip' (Ticker).
    """
    type: Literal["probability_shift", "new_risk", "belief_flip", "signal_noise"]
    text: str
    magnitude: Optional[int] = None  # e.g., +15, -10
    sentiment: Literal["positive", "negative", "neutral", "alert"]
    

class MentalModelUpdate(BaseModel):
    """
    The 'Executive Summary' replacement.
    Three bullet points that update the user's internal model.
    """
    matters: str      # "What matters today"
    confidence: str   # "What changed our confidence"
    unresolved: str   # "What remains unresolved"


class TimePoint(BaseModel):
    """A single point in a sparkline history."""
    date: str
    value: int        # 0-100 probability or confidence
    context: Optional[str] = None


class LivingBelief(BaseModel):
    """
    A persistent belief that evolves over time.
    """
    id: str           # Unique stable ID
    statement: str    # "We believe X..."
    status: Literal["active", "questioned", "strengthening", "weakening", "shattered"]
    confidence: int   # 0-100
    last_challenged: str  # Date
    evidence_for: str
    evidence_against: str
    history: List[TimePoint] = Field(default_factory=list)


class Risk(BaseModel):
    """
    A systemic risk that can compound.
    """
    id: str
    text: str
    status: Literal["dormant", "developing", "escalating", "critical", "resolved"]
    compounding_factor: str  # "If this continues, X breaks"
    severity: Literal["low", "medium", "high"]


# ═══════════════════════════════════════════════════════════════
# COUNCIL & REASONING
# ═══════════════════════════════════════════════════════════════

class CouncilDialogue(BaseModel):
    """Explicit disagreement between models."""
    topic: str
    architect: str   # GPT-4o (Synthesis)
    skeptic: str     # Mistral (Risk/Dissent)
    historian: str   # DeepSeek (Context/Drift)
    conclusion: str


# ═══════════════════════════════════════════════════════════════
# TOP-LEVEL DATA
# ═══════════════════════════════════════════════════════════════

class BriefingStats(BaseModel):
    sources: int = 0
    models: int = 3  # Architect, Skeptic, Historian


class LivingMind(BaseModel):
    """The complete state of the Living Mind."""
    deltas: List[RealityDelta] = Field(default_factory=list)
    update: MentalModelUpdate
    beliefs: List[LivingBelief] = Field(default_factory=list)
    risks: List[Risk] = Field(default_factory=list)
    council: Optional[CouncilDialogue] = None
    stats: BriefingStats = Field(default_factory=BriefingStats)


class Meta(BaseModel):
    date: str
    generated: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    version: str = "2.0-living-mind"


class PortalData(BaseModel):
    """The JSON root."""
    meta: Meta
    mind: LivingMind
    
    def to_json_file(self, path: str) -> None:
        import json
        with open(path, "w") as f:
            json.dump(self.model_dump(), f, indent=4)
    
    @classmethod
    def from_json_file(cls, path: str) -> "PortalData":
        import json
        with open(path) as f:
            return cls.model_validate(json.load(f))


# ═══════════════════════════════════════════════════════════════
# LIVE EVENTS
# ═══════════════════════════════════════════════════════════════

class LiveEvent(BaseModel):
    type: Literal["ingest", "inference", "delta", "publish", "error"]
    agent: Optional[str] = None
    message: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
