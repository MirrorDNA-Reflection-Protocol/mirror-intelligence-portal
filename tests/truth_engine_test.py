import sys
import os
import asyncio
import pytest
from datetime import datetime, timedelta

# Add context-engine to path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "context-engine"))

from data_schema import Source, LivingMind, Forecast, LedgerEntry
from ingest import IngestEngine

@pytest.mark.asyncio
async def test_ingest_deduplication():
    """Verify that multiple ingests of same ID are deduplicated."""
    engine = IngestEngine()
    
    # Mock data
    s1 = Source(id="test-1", title="Test 1", domain="test.com", url="http://test.com/1", text="Text...", timestamp=datetime.utcnow().isoformat())
    s2 = Source(id="test-1", title="Test 1 (Updated)", domain="test.com", url="http://test.com/1", text="Update...", timestamp=datetime.utcnow().isoformat())
    
    mind = LivingMind()
    mind.add_source(s1)
    mind.add_source(s2) # Should be ignored because of ID collision
    
    assert len(mind.ledger) == 1
    assert mind.ledger[0].payload["title"] == "Test 1"

@pytest.mark.asyncio
async def test_ledger_immutability():
    """Verify ledger cannot be easily tampered (logic check)."""
    mind = LivingMind()
    mind.add_ledger_entry("TEST", {"msg": "First"})
    
    first_hash = mind.ledger[0].id
    
    # We don't have a check inside the class yet for modification, 
    # but we can verify the append-only nature of the add method.
    mind.add_ledger_entry("TEST", {"msg": "Second"})
    
    assert len(mind.ledger) == 2
    assert mind.ledger[0].id == first_hash

def test_forecast_scoring():
    """Verify Brier Score calculation."""
    mind = LivingMind()
    f = Forecast(
        id="fc-test",
        question="Will it rain?",
        created_at=datetime.utcnow().isoformat(),
        resolution_date=(datetime.now() + timedelta(days=1)).isoformat(),
        resolution_criteria="Rain falls.",
        probability=0.8
    )
    mind.forecasts.append(f)
    
    # Resolve as TRUE (p=1.0)
    # Brier Score = (0.8 - 1.0)^2 = 0.04
    f.resolve(True)
    
    assert f.status == "resolved"
    assert f.brier_score == 0.04
    
    mind._recalc_score()
    assert mind.stats["mean_brier_score"] == 0.04

if __name__ == "__main__":
    # Simple manual run if no pytest
    asyncio.run(test_ingest_deduplication())
    print("Test Ingest Dedup: OK")
    test_forecast_scoring()
    print("Test Forecast Scoring: OK")
