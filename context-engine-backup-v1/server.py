"""
⟡ Mirror Intelligence — Context Engine Server
FastAPI server with SSE streaming for live updates.
"""

import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

from data_schema import PortalData, Meta, Briefing, Prediction, LiveEvent
from ingest import IngestEngine, IngestEvent
from council import CouncilEngine, CouncilEvent

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

DATA_PATH = Path(__file__).parent.parent / "public" / "data.json"
EVENT_QUEUE: asyncio.Queue = None


# ═══════════════════════════════════════════════════════════════
# LIFESPAN
# ═══════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    global EVENT_QUEUE
    EVENT_QUEUE = asyncio.Queue()
    print("⟡ Context Engine starting...")
    yield
    print("⟡ Context Engine shutting down...")


app = FastAPI(
    title="Mirror Intelligence Context Engine",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to actual domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════
# EVENT BROADCASTING
# ═══════════════════════════════════════════════════════════════

async def broadcast_event(event: LiveEvent):
    """Add event to the queue for SSE broadcasting."""
    if EVENT_QUEUE:
        await EVENT_QUEUE.put(event)


async def ingest_event_adapter(event: IngestEvent):
    """Convert IngestEvent to LiveEvent and broadcast."""
    await broadcast_event(LiveEvent(
        type="ingest",
        agent=None,
        message=f"[{event.source}] {event.message}",
        timestamp=event.timestamp
    ))


async def council_event_adapter(event: CouncilEvent):
    """Convert CouncilEvent to LiveEvent and broadcast."""
    await broadcast_event(LiveEvent(
        type="inference",
        agent=event.agent,
        message=event.message,
        timestamp=event.timestamp
    ))


# ═══════════════════════════════════════════════════════════════
# GENERATION LOGIC
# ═══════════════════════════════════════════════════════════════

async def generate_daily_briefing() -> PortalData:
    """Full pipeline: ingest → council → output."""
    
    # Step 1: Ingest
    await broadcast_event(LiveEvent(
        type="ingest",
        message="Starting ingestion pipeline..."
    ))
    
    ingest = IngestEngine(event_callback=ingest_event_adapter)
    articles = await ingest.ingest_all()
    context = ingest.get_context_text(max_articles=15)
    
    # Step 2: Council analysis
    await broadcast_event(LiveEvent(
        type="synthesis",
        message="Convening the Council..."
    ))
    
    council = CouncilEngine(event_callback=council_event_adapter)
    today = datetime.now().strftime("%B %d, %Y")
    briefing = await council.generate_briefing(context, today)
    
    # Step 3: Build output
    await broadcast_event(LiveEvent(
        type="synthesis",
        message="Synthesizing final briefing..."
    ))
    
    # Load existing predictions or create defaults
    predictions = []
    if DATA_PATH.exists():
        try:
            existing = PortalData.from_json_file(str(DATA_PATH))
            predictions = existing.predictions
        except Exception:
            pass
    
    data = PortalData(
        meta=Meta(
            date=datetime.now().strftime("%A, %B %d, %Y"),
            generated=datetime.utcnow().isoformat() + "Z"
        ),
        briefing=briefing,
        predictions=predictions
    )
    
    # Save to file
    data.to_json_file(str(DATA_PATH))
    
    await broadcast_event(LiveEvent(
        type="publish",
        message=f"Briefing published: {len(briefing.sections.changed)} changes, {len(briefing.sections.risks)} risks"
    ))
    
    return data


# ═══════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    """Health check."""
    return {
        "service": "Mirror Intelligence Context Engine",
        "status": "online",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@app.get("/api/briefing")
async def get_briefing():
    """Get the current briefing data."""
    if DATA_PATH.exists():
        try:
            data = PortalData.from_json_file(str(DATA_PATH))
            return data.model_dump()
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"error": f"Failed to load data: {str(e)}"}
            )
    return JSONResponse(
        status_code=404,
        content={"error": "No briefing data available"}
    )


@app.get("/api/predictions")
async def get_predictions():
    """Get active predictions."""
    if DATA_PATH.exists():
        try:
            data = PortalData.from_json_file(str(DATA_PATH))
            return {"predictions": [p.model_dump() for p in data.predictions]}
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"error": str(e)}
            )
    return {"predictions": []}


@app.post("/api/refresh")
async def refresh_briefing(background_tasks: BackgroundTasks):
    """Trigger a manual refresh of the briefing."""
    background_tasks.add_task(generate_daily_briefing)
    return {"status": "refresh_started", "message": "Briefing generation started in background"}


@app.get("/api/live")
async def live_stream():
    """SSE stream of live events."""
    
    async def event_generator():
        # Send initial connection event
        event = LiveEvent(
            type="ingest",
            message="Connected to Context Engine"
        )
        yield f"data: {event.model_dump_json()}\n\n"
        
        while True:
            try:
                # Wait for events with timeout
                event = await asyncio.wait_for(
                    EVENT_QUEUE.get(),
                    timeout=30.0
                )
                yield f"data: {event.model_dump_json()}\n\n"
            except asyncio.TimeoutError:
                # Send heartbeat
                heartbeat = LiveEvent(
                    type="ingest",
                    message="heartbeat"
                )
                yield f"data: {heartbeat.model_dump_json()}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


# ═══════════════════════════════════════════════════════════════
# CLI MODE
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    import uvicorn
    
    if "--generate-daily" in sys.argv:
        # Run generation once and exit
        async def run_generation():
            global EVENT_QUEUE
            EVENT_QUEUE = asyncio.Queue()
            
            async def print_event(event: LiveEvent):
                print(f"[{event.type}] {event.message}")
            
            # Patch broadcast to print
            original_broadcast = broadcast_event
            
            print("⟡ Generating daily briefing...")
            data = await generate_daily_briefing()
            print(f"⟡ Complete: {data.briefing.headline}")
        
        asyncio.run(run_generation())
    else:
        # Run server
        uvicorn.run(
            "server:app",
            host="0.0.0.0",
            port=8083,
            reload=True
        )
