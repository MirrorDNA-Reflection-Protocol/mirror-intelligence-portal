"""
⟡ Mirror Intelligence — Truth Engine Server v4.0
Live deliberation streaming, multi-model debate, real-time activity.

Endpoints:
- /api/live — SSE stream of all activity
- /api/deliberate — Trigger new deliberation
- /api/session/{id} — Get deliberation session
- /api/status — Engine status with phase indicators
"""

import asyncio
import json
from datetime import datetime
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional, List
from collections import deque

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

from data_schema import PortalData, Meta, LivingMind, LiveEvent
from ingest import IngestEngine, IngestEvent
from council import CouncilEngine, CouncilEvent
from deliberation import DeliberationEngine, DeliberationSession
from agents import get_agent_status, get_available_agents, AgentRole

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

DATA_PATH = Path(__file__).parent.parent / "public" / "data.json"
ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
SESSIONS_DIR = Path(__file__).parent / "sessions"

# Global state
EVENT_QUEUE = asyncio.Queue()
ACTIVITY_LOG = deque(maxlen=100)  # Last 100 events
ENGINE_STATE = {
    "phase": "idle",
    "last_activity": None,
    "active_models": [],
    "sessions_today": 0,
    "sources_ingested": 0
}

# ═══════════════════════════════════════════════════════════════
# LIFESPAN
# ═══════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("⟡ Truth Engine v4.0 (Live Deliberation) starting...")
    ARTIFACTS_DIR.mkdir(exist_ok=True)
    SESSIONS_DIR.mkdir(exist_ok=True)
    
    # Initialize deliberation engine to check available models
    engine = DeliberationEngine()
    ENGINE_STATE["active_models"] = engine.get_available_models()
    
    yield
    print("⟡ Truth Engine shutting down...")


app = FastAPI(
    title="Mirror Intelligence — Truth Engine",
    version="4.0",
    description="Multi-model deliberation with live streaming",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════════
# EVENT SYSTEM
# ═══════════════════════════════════════════════════════════════

async def broadcast_event(event: dict):
    """Broadcast event to all listeners and log."""
    event["timestamp"] = datetime.utcnow().isoformat() + "Z"
    ACTIVITY_LOG.append(event)
    ENGINE_STATE["last_activity"] = event["timestamp"]
    await EVENT_QUEUE.put(event)

async def emit_live_event(event_type: str, message: str, **kwargs):
    """Helper to emit standard live events."""
    await broadcast_event({
        "type": event_type,
        "message": message,
        **kwargs
    })

# Adapters for sub-engines
async def ingest_adapter(e: IngestEvent):
    await broadcast_event({
        "type": "ingest",
        "source": e.source,
        "status": e.status,
        "message": e.message
    })

async def council_adapter(e: CouncilEvent):
    await broadcast_event({
        "type": "council",
        "agent": e.agent,
        "status": e.status,
        "message": e.message
    })

async def deliberation_adapter(event: dict):
    """Adapter for deliberation engine events."""
    await broadcast_event(event)

# ═══════════════════════════════════════════════════════════════
# CORE PIPELINE
# ═══════════════════════════════════════════════════════════════

async def run_full_pipeline() -> PortalData:
    """Run complete: Ingest → Deliberate → Synthesize → Store"""
    
    ENGINE_STATE["phase"] = "ingesting"
    await emit_live_event("phase_change", "Starting ingestion...", phase="ingesting")
    
    # 1. INGEST
    ingest = IngestEngine(event_callback=ingest_adapter)
    ingest_result = await ingest.ingest_all()
    sources = ingest_result["sources"]
    ENGINE_STATE["sources_ingested"] = len(sources)
    
    context = ingest.get_context_text(max_items=20)
    
    await emit_live_event("ingest_complete", f"Ingested {len(sources)} sources", count=len(sources))
    
    # 2. DELIBERATE (Multi-model)
    ENGINE_STATE["phase"] = "deliberating"
    await emit_live_event("phase_change", "Starting multi-model deliberation...", phase="deliberating")
    
    delib_engine = DeliberationEngine(event_callback=deliberation_adapter)
    session = await delib_engine.deliberate(
        topic=f"Daily Intelligence - {datetime.now().strftime('%Y-%m-%d')}",
        context=context
    )
    
    # Save session
    session_file = SESSIONS_DIR / f"session_{session.session_id}.json"
    with open(session_file, "w") as f:
        json.dump({
            "session_id": session.session_id,
            "topic": session.topic,
            "phase": session.phase,
            "started_at": session.started_at,
            "completed_at": session.completed_at,
            "initial_takes": [
                {
                    "model_id": t.model_id,
                    "model_name": t.model_name,
                    "take": t.take,
                    "confidence": t.confidence,
                    "key_risks": t.key_risks,
                    "latency_ms": t.latency_ms
                }
                for t in session.initial_takes
            ],
            "responses": [
                {
                    "model_id": r.model_id,
                    "responding_to": r.responding_to,
                    "agreement_level": r.agreement_level,
                    "response": r.response,
                    "updated_confidence": r.updated_confidence
                }
                for r in session.responses
            ],
            "synthesis": {
                "consensus": session.synthesis.consensus,
                "disagreements": session.synthesis.disagreements,
                "confidence_shifts": session.synthesis.confidence_shifts,
                "open_questions": session.synthesis.open_questions,
                "final_probability": session.synthesis.final_probability
            } if session.synthesis else None,
            "events": session.events
        }, f, indent=2, default=str)
    
    ENGINE_STATE["sessions_today"] += 1
    
    # 3. BUILD MIND (using council for beliefs/risks/forecasts)
    ENGINE_STATE["phase"] = "synthesizing"
    await emit_live_event("phase_change", "Building mental model...", phase="synthesizing")
    
    council = CouncilEngine(event_callback=council_adapter)
    
    prev_mind = None
    if DATA_PATH.exists():
        try:
            prev_data = PortalData.from_json_file(str(DATA_PATH))
            prev_mind = prev_data.mind
        except:
            pass
    
    mind = await council.generate_mind(
        context,
        datetime.now().strftime("%Y-%m-%d"),
        previous_state=prev_mind
    )
    
    # Merge sources
    for s in sources:
        mind.add_source(s)
    
    # Add deliberation insights to mind
    if session.synthesis:
        # Update mental model with deliberation consensus
        if mind.update:
            mind.update.matters = session.synthesis.consensus[:500]
            if session.synthesis.open_questions:
                mind.update.unresolved = session.synthesis.open_questions[0]
    
    # Stats
    mind.stats["total_fetched"] = ingest_result["total_fetched"]
    mind.stats["unique_sources"] = ingest_result["unique_sources"]
    mind.stats["failed_feeds"] = ingest_result["failed_feeds"]
    mind.stats["sources_scanned_24h"] = ingest_result["unique_sources"]
    mind.stats["sources_scanned_today"] = ingest_result["unique_sources"]
    mind.stats["last_updated"] = datetime.now().astimezone().isoformat()
    mind.stats["active_forecasts"] = len([f for f in mind.forecasts if f.status == "open"])
    mind.stats["last_deliberation"] = session.session_id
    mind.stats["models_participated"] = len(session.initial_takes)
    
    # 4. SAVE
    ENGINE_STATE["phase"] = "complete"
    await emit_live_event("phase_change", "Pipeline complete", phase="complete")
    
    data = PortalData(
        meta=Meta(date=datetime.now().strftime("%A, %B %d, %Y"), version="4.0-truth-engine"),
        mind=mind
    )
    data.to_json_file(str(DATA_PATH))
    
    await emit_live_event("pipeline_complete", "Truth Engine cycle complete", 
                          sources=len(sources),
                          models=len(session.initial_takes))
    
    # Reset to idle after short delay
    await asyncio.sleep(2)
    ENGINE_STATE["phase"] = "idle"
    
    return data

# ═══════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {
        "name": "Mirror Intelligence — Truth Engine",
        "version": "4.0",
        "status": ENGINE_STATE["phase"],
        "endpoints": {
            "live_stream": "/api/live",
            "status": "/api/status",
            "briefing": "/api/briefing",
            "refresh": "/api/refresh",
            "deliberate": "/api/deliberate",
            "sessions": "/api/sessions",
            "how_it_works": "/api/how-it-works",
            "pulse": "/api/pulse/{index}",
            "forecast": "/api/forecast/{id}",
            "ledger": "/api/ledger"
        }
    }

@app.get("/api/status")
def get_status():
    """Real-time engine status."""
    return {
        "phase": ENGINE_STATE["phase"],
        "last_activity": ENGINE_STATE["last_activity"],
        "active_models": ENGINE_STATE["active_models"],
        "agents": get_agent_status(),
        "agents_available": len(get_available_agents()),
        "sessions_today": ENGINE_STATE["sessions_today"],
        "sources_ingested": ENGINE_STATE["sources_ingested"],
        "recent_events": list(ACTIVITY_LOG)[-10:]
    }

@app.get("/api/agents")
def get_agents():
    """Return agent roster with availability status."""
    return {
        "total": 9,
        "available": len(get_available_agents()),
        "agents": get_agent_status()
    }

@app.get("/api/live")
async def live_stream():
    """Server-Sent Events stream for real-time updates."""
    async def generator():
        # Send initial status
        yield f"data: {json.dumps({'type': 'connected', 'message': 'Connected to Truth Engine', 'phase': ENGINE_STATE['phase']})}\n\n"
        
        while True:
            try:
                event = await asyncio.wait_for(EVENT_QUEUE.get(), timeout=5.0)
                yield f"data: {json.dumps(event, default=str)}\n\n"
            except asyncio.TimeoutError:
                # Send heartbeat with current phase
                yield f"data: {json.dumps({'type': 'heartbeat', 'phase': ENGINE_STATE['phase']})}\n\n"

    return StreamingResponse(generator(), media_type="text/event-stream")

@app.get("/api/activity")
def get_activity(limit: int = 50):
    """Get recent activity log."""
    events = list(ACTIVITY_LOG)
    return {
        "count": len(events),
        "events": events[-limit:]
    }

@app.post("/api/refresh")
async def refresh(bg: BackgroundTasks):
    """Trigger full pipeline."""
    if ENGINE_STATE["phase"] != "idle":
        return {"status": "busy", "current_phase": ENGINE_STATE["phase"]}
    
    bg.add_task(run_full_pipeline)
    return {"status": "started", "message": "Full pipeline initiated"}

@app.post("/api/deliberate")
async def deliberate_only(bg: BackgroundTasks, topic: str = "Ad-hoc deliberation"):
    """Trigger deliberation without ingestion."""
    if ENGINE_STATE["phase"] != "idle":
        return {"status": "busy", "current_phase": ENGINE_STATE["phase"]}
    
    async def run_deliberation():
        ENGINE_STATE["phase"] = "deliberating"
        
        # Get context from existing data
        context = ""
        if DATA_PATH.exists():
            try:
                data = PortalData.from_json_file(str(DATA_PATH))
                context = "\n".join([f"{s.title}: {s.text[:200]}" for s in data.mind.sources[:10]])
            except:
                pass
        
        if not context:
            context = "No recent context available."
        
        engine = DeliberationEngine(event_callback=deliberation_adapter)
        await engine.deliberate(topic, context)
        
        ENGINE_STATE["phase"] = "idle"
    
    bg.add_task(run_deliberation)
    return {"status": "started", "topic": topic}

@app.get("/api/sessions")
def list_sessions(limit: int = 10):
    """List recent deliberation sessions."""
    sessions = []
    for f in sorted(SESSIONS_DIR.glob("session_*.json"), reverse=True)[:limit]:
        try:
            with open(f) as file:
                data = json.load(file)
                sessions.append({
                    "session_id": data["session_id"],
                    "topic": data["topic"],
                    "started_at": data["started_at"],
                    "models": len(data.get("initial_takes", []))
                })
        except:
            pass
    return {"sessions": sessions}

@app.get("/api/session/{session_id}")
def get_session(session_id: str):
    """Get full deliberation session."""
    session_file = SESSIONS_DIR / f"session_{session_id}.json"
    if not session_file.exists():
        raise HTTPException(404, f"Session {session_id} not found")
    
    with open(session_file) as f:
        return json.load(f)

@app.get("/api/how-it-works")
def how_it_works():
    """Explain the system architecture."""
    return {
        "title": "How Mirror Intelligence Works",
        "overview": "A multi-model deliberation system that synthesizes intelligence through structured debate.",
        "pipeline": [
            {
                "phase": "Ingestion",
                "description": "RSS feeds from 25+ sources across tech, markets, policy, security are fetched and deduplicated.",
                "duration": "~30 seconds"
            },
            {
                "phase": "Initial Takes",
                "description": "Each AI model independently analyzes the context, forming initial positions with confidence levels.",
                "duration": "~60 seconds"
            },
            {
                "phase": "Cross-Response",
                "description": "Models respond to each other's takes, agreeing or disagreeing with reasoning.",
                "duration": "~60 seconds"
            },
            {
                "phase": "Synthesis",
                "description": "A final synthesis extracts consensus, disagreements, and open questions.",
                "duration": "~30 seconds"
            }
        ],
        "models": ENGINE_STATE["active_models"],
        "why_multiple_models": [
            "Single models have blind spots and biases",
            "Disagreement reveals uncertainty more honestly than false confidence",
            "Cross-validation catches hallucinations",
            "Different model architectures see different patterns"
        ],
        "why_disagreement_matters": [
            "Consensus without challenge is intellectual laziness",
            "The best forecasters actively seek disconfirming evidence",
            "Forced dissent prevents groupthink",
            "Unresolved disagreements become open questions for future resolution"
        ],
        "truth_ledger": {
            "description": "An append-only log of all events. No edits, no deletions. Corrections are new entries.",
            "types": ["INGEST", "FORECAST_OPEN", "FORECAST_RESOLVE", "BELIEF_UPDATE", "SYSTEM_UPDATE"]
        },
        "forecasts": {
            "description": "Falsifiable predictions with explicit resolution criteria and Brier scoring.",
            "scoring": "Brier score = (predicted probability - actual outcome)². Lower is better."
        }
    }

@app.get("/api/briefing")
def get_briefing():
    """Returns complete Living Mind state."""
    if DATA_PATH.exists():
        try:
            return PortalData.from_json_file(str(DATA_PATH)).model_dump()
        except Exception as e:
            return JSONResponse(500, {"error": str(e)})
    return JSONResponse(404, {"error": "No mind state found. Run /api/refresh first."})

@app.get("/api/health")
def health_check():
    """Component health status."""
    return {
        "overall": "OK" if ENGINE_STATE["phase"] in ["idle", "complete"] else "BUSY",
        "phase": ENGINE_STATE["phase"],
        "components": {
            "ingestion": "OK",
            "deliberation": "OK" if ENGINE_STATE["active_models"] else "DEGRADED",
            "forecasts": "OK",
            "ledger": "OK"
        },
        "models_available": len(ENGINE_STATE["active_models"])
    }

# Drill-down endpoints (kept from v3)
@app.get("/api/pulse/{delta_index}")
def get_pulse_detail(delta_index: int):
    """Evidence for pulse item."""
    if not DATA_PATH.exists():
        raise HTTPException(404, "No data")
    
    data = PortalData.from_json_file(str(DATA_PATH))
    deltas = data.mind.deltas or []
    
    if delta_index < 0 or delta_index >= len(deltas):
        raise HTTPException(404, f"Delta {delta_index} not found")
    
    delta = deltas[delta_index]
    
    # Find related sources
    keywords = delta.text.lower().split()[:5]
    related = []
    for src in (data.mind.sources or [])[:50]:
        if any(kw in (src.title + " " + src.text).lower() for kw in keywords if len(kw) > 3):
            related.append({
                "id": src.id,
                "title": src.title,
                "url": src.url,
                "domain": src.domain,
                "excerpt": src.text[:300] + "..."
            })
            if len(related) >= 7:
                break
    
    return {
        "index": delta_index,
        "summary": delta.text,
        "type": delta.type,
        "magnitude": delta.magnitude,
        "sentiment": delta.sentiment,
        "what_changed": f"Signal with {abs(delta.magnitude or 0)}% magnitude",
        "why_it_matters": "Structural shift indicator",
        "citations": related,
        "citation_count": len(related)
    }

@app.get("/api/forecast/{forecast_id}")
def get_forecast_detail(forecast_id: str):
    """Forecast detail with history."""
    if not DATA_PATH.exists():
        raise HTTPException(404, "No data")
    
    data = PortalData.from_json_file(str(DATA_PATH))
    forecast = next((f for f in data.mind.forecasts if f.id == forecast_id), None)
    
    if not forecast:
        raise HTTPException(404, f"Forecast {forecast_id} not found")
    
    return {
        "id": forecast.id,
        "question": forecast.question,
        "probability": forecast.probability,
        "probability_pct": f"{forecast.probability * 100:.0f}%",
        "resolution_date": forecast.resolution_date.isoformat() if hasattr(forecast.resolution_date, 'isoformat') else str(forecast.resolution_date),
        "resolution_criteria": forecast.resolution_criteria,
        "status": forecast.status,
        "outcome": forecast.outcome,
        "brier_score": forecast.brier_score,
        "created_at": forecast.created_at.isoformat() if hasattr(forecast.created_at, 'isoformat') else str(forecast.created_at)
    }

@app.get("/api/ledger")
def get_ledger(limit: int = 50, offset: int = 0):
    """Paginated truth ledger."""
    if not DATA_PATH.exists():
        raise HTTPException(404, "No data")
    
    data = PortalData.from_json_file(str(DATA_PATH))
    ledger = data.mind.ledger or []
    
    return {
        "total": len(ledger),
        "offset": offset,
        "limit": limit,
        "entries": [
            {
                "id": e.id,
                "timestamp": e.timestamp.isoformat() if hasattr(e.timestamp, 'isoformat') else str(e.timestamp),
                "type": e.type,
                "payload": e.payload,
                "prev_hash": e.prev_hash
            }
            for e in reversed(ledger[offset:offset + limit])
        ]
    }

@app.get("/api/sources")
def get_sources(limit: int = 50, domain: Optional[str] = None):
    """Paginated sources."""
    if not DATA_PATH.exists():
        raise HTTPException(404, "No data")
    
    data = PortalData.from_json_file(str(DATA_PATH))
    sources = data.mind.sources or []
    
    if domain:
        sources = [s for s in sources if domain.lower() in s.domain.lower()]
    
    return {
        "total": len(sources),
        "sources": [
            {
                "id": s.id,
                "title": s.title,
                "url": s.url,
                "domain": s.domain,
                "excerpt": s.text[:200] + "..."
            }
            for s in sources[:limit]
        ]
    }


# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    import uvicorn
    
    if "--generate" in sys.argv:
        asyncio.run(run_full_pipeline())
    else:
        uvicorn.run("server:app", host="0.0.0.0", port=8083, reload=True)
