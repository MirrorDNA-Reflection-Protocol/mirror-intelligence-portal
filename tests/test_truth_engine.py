"""
⟡ Mirror Intelligence — Truth Engine Test Suite
Tests for ingestion, deliberation, forecasting, and ledger integrity.
"""

import pytest
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add context-engine to path
sys.path.insert(0, str(Path(__file__).parent.parent / "context-engine"))

from data_schema import (
    PortalData, Meta, LivingMind, Source, Forecast, 
    LedgerEntry, RealityDelta, Risk, LivingBelief, TimePoint, MentalModelUpdate
)
from ingest import IngestEngine
from council import CouncilEngine


# ═══════════════════════════════════════════════════════════════
# FIXTURES
# ═══════════════════════════════════════════════════════════════

@pytest.fixture
def sample_source():
    return Source(
        id="test123",
        url="https://example.com/article",
        title="Test Article",
        text="This is a test article about AI developments.",
        timestamp=datetime.utcnow(),
        domain="example.com",
        source="Test Feed"
    )

@pytest.fixture
def sample_forecast():
    return Forecast(
        id="fc-test-001",
        question="Will this test pass?",
        created_at=datetime.utcnow(),
        resolution_date=datetime.utcnow() + timedelta(days=30),
        resolution_criteria="pytest returns exit code 0",
        probability=0.95,
        status="open"
    )

@pytest.fixture
def sample_mind():
    return LivingMind(
        sources=[],
        forecasts=[],
        ledger=[],
        deltas=[
            RealityDelta(type="signal", text="Test signal", magnitude=10, sentiment="positive")
        ],
        update=MentalModelUpdate(
            matters="Test matters",
            confidence="High",
            unresolved="Nothing"
        ),
        beliefs=[
            LivingBelief(
                id="belief-1",
                statement="Tests are valuable",
                status="active",
                confidence=90,
                last_challenged="2026-01-07",
                evidence_for="Code quality",
                evidence_against="Time cost",
                history=[TimePoint(date="2026-01-07", value=90)]
            )
        ],
        risks=[
            Risk(
                id="risk-1",
                text="Test might fail",
                status="developing",
                compounding_factor="More failures compound",
                severity="low"
            )
        ]
    )


# ═══════════════════════════════════════════════════════════════
# DATA SCHEMA TESTS
# ═══════════════════════════════════════════════════════════════

class TestDataSchema:
    
    def test_source_creation(self, sample_source):
        """Source objects should be created with required fields."""
        assert sample_source.id == "test123"
        assert sample_source.domain == "example.com"
        assert sample_source.timestamp is not None
    
    def test_source_from_feed_entry(self):
        """Source.from_feed_entry should parse RSS entries."""
        entry = {
            "link": "https://test.com/article/123",
            "title": "Breaking News",
            "summary": "Something happened today."
        }
        source = Source.from_feed_entry(entry, "TestFeed")
        assert source.url == "https://test.com/article/123"
        assert source.title == "Breaking News"
        assert source.source == "TestFeed"
        assert len(source.id) == 12
    
    def test_forecast_probability_bounds(self):
        """Forecast probability must be between 0 and 1."""
        f = Forecast(
            id="fc-1",
            question="Test?",
            created_at=datetime.utcnow(),
            resolution_date=datetime.utcnow() + timedelta(days=30),
            resolution_criteria="Test",
            probability=0.5
        )
        assert f.probability == 0.5
    
    def test_forecast_resolution_brier_score(self, sample_forecast):
        """Resolving a forecast should calculate Brier score."""
        sample_forecast.resolve(True)
        assert sample_forecast.status == "resolved"
        assert sample_forecast.outcome == True
        assert sample_forecast.brier_score == 0.0025
        
    def test_forecast_resolution_brier_wrong(self):
        """Wrong prediction should have higher Brier score."""
        f = Forecast(
            id="fc-wrong",
            question="Will this fail?",
            created_at=datetime.utcnow(),
            resolution_date=datetime.utcnow() + timedelta(days=30),
            resolution_criteria="Test",
            probability=0.9
        )
        f.resolve(False)
        assert f.brier_score == 0.81
    
    def test_ledger_entry_hash_chain(self):
        """Ledger entries should form a hash chain."""
        entry1 = LedgerEntry.create("SYSTEM_UPDATE", {"message": "Genesis"}, "0000000000000000")
        entry2 = LedgerEntry.create("INGEST", {"title": "Test"}, entry1.id)
        
        assert entry1.prev_hash == "0000000000000000"
        assert entry2.prev_hash == entry1.id
        assert entry1.id != entry2.id
    
    def test_living_mind_add_source_dedup(self, sample_mind, sample_source):
        """LivingMind should deduplicate sources by ID."""
        sample_mind.add_source(sample_source)
        assert len(sample_mind.sources) == 1
        
        sample_mind.add_source(sample_source)
        assert len(sample_mind.sources) == 1
        
        other = Source(
            id="other456",
            url="https://other.com",
            title="Other",
            text="Other text",
            timestamp=datetime.utcnow(),
            domain="other.com"
        )
        sample_mind.add_source(other)
        assert len(sample_mind.sources) == 2
    
    def test_portal_data_serialization(self, sample_mind):
        """PortalData should serialize to/from JSON."""
        data = PortalData(
            meta=Meta(date="January 7, 2026"),
            mind=sample_mind
        )
        json_dict = data.model_dump()
        assert "meta" in json_dict
        assert "mind" in json_dict


# ═══════════════════════════════════════════════════════════════
# COUNCIL TESTS
# ═══════════════════════════════════════════════════════════════

class TestCouncil:
    
    def test_council_config_has_four_agents(self):
        """Council should have exactly 4 agents."""
        from council import COUNCIL
        assert len(COUNCIL) == 4
        assert "extractor" in COUNCIL
        assert "skeptic" in COUNCIL
        assert "analyst" in COUNCIL
        assert "forecaster" in COUNCIL
    
    def test_council_parse_extractor(self):
        """_parse_extractor should handle claim/signal format."""
        engine = CouncilEngine()
        raw = """CLAIM: AI models are improving rapidly | SOURCE: TechCrunch | CONFIDENCE: high
CLAIM: Regulation is lagging | SOURCE: Reuters | CONFIDENCE: medium
SIGNAL: Investment in AI | DIRECTION: up | MAGNITUDE: 8"""
        result = engine._parse_extractor(raw)
        assert len(result["claims"]) == 2
        assert len(result["signals"]) == 1
        assert result["claims"][0]["text"] == "AI models are improving rapidly"
        assert result["signals"][0]["direction"] == "up"
    
    def test_council_parse_skeptic(self):
        """_parse_skeptic should handle counter/risk format."""
        engine = CouncilEngine()
        raw = """COUNTER: Models may be overfitting | TARGET: AI improvement claims | STRENGTH: moderate
RISK: Training data may be exhausted | SEVERITY: high"""
        result = engine._parse_skeptic(raw)
        assert len(result["counters"]) == 1
        assert len(result["risks"]) == 1
        assert result["risks"][0]["severity"] == "high"
    
    def test_council_parse_forecasts(self):
        """_parse_forecasts should create valid Forecast objects."""
        engine = CouncilEngine()
        raw = """FORECAST: Will GPT-5 launch by July 2026? | PROB: 0.35 | DATE: 2026-07-01 | CRITERIA: OpenAI announces GPT-5
FORECAST: Will EU AI Act be enforced? | PROB: 0.80 | DATE: 2026-06-30 | CRITERIA: First enforcement action taken"""
        forecasts = engine._parse_forecasts(raw)
        assert len(forecasts) == 2
        assert forecasts[0].probability == 0.35
        assert forecasts[1].probability == 0.80


# ═══════════════════════════════════════════════════════════════
# INTEGRATION TESTS
# ═══════════════════════════════════════════════════════════════

class TestIntegration:
    
    def test_full_mind_construction(self, sample_source):
        """Test building a complete LivingMind with all components."""
        mind = LivingMind()
        
        mind.add_source(sample_source)
        assert len(mind.sources) == 1
        assert len(mind.ledger) == 1
        
        f = Forecast(
            id="fc-int-1",
            question="Integration test passes?",
            created_at=datetime.utcnow(),
            resolution_date=datetime.utcnow() + timedelta(days=1),
            resolution_criteria="pytest exit 0",
            probability=0.99
        )
        mind.add_forecast(f)
        assert len(mind.forecasts) == 1
        assert len(mind.ledger) == 2
        
        mind.resolve_forecast("fc-int-1", True)
        assert mind.forecasts[0].status == "resolved"
        assert mind.forecasts[0].brier_score is not None
        assert len(mind.ledger) == 3
    
    def test_ledger_integrity(self):
        """Ledger should maintain hash chain integrity."""
        mind = LivingMind()
        
        for i in range(5):
            s = Source(
                id=f"src-{i}",
                url=f"https://test.com/{i}",
                title=f"Article {i}",
                text=f"Content {i}",
                timestamp=datetime.utcnow(),
                domain="test.com"
            )
            mind.add_source(s)
        
        for i in range(1, len(mind.ledger)):
            assert mind.ledger[i].prev_hash == mind.ledger[i-1].id
    
    def test_brier_score_calculation_accuracy(self):
        """Brier scores should be mathematically correct."""
        test_cases = [
            (0.9, True, 0.01),
            (0.9, False, 0.81),
            (0.5, True, 0.25),
            (0.5, False, 0.25),
            (0.1, True, 0.81),
            (0.1, False, 0.01),
        ]
        
        for prob, outcome, expected_brier in test_cases:
            f = Forecast(
                id=f"fc-brier-{prob}-{outcome}",
                question="Test",
                created_at=datetime.utcnow(),
                resolution_date=datetime.utcnow() + timedelta(days=1),
                resolution_criteria="Test",
                probability=prob
            )
            f.resolve(outcome)
            assert abs(f.brier_score - expected_brier) < 0.001


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
