"""
⟡ Mirror Intelligence — Context Engine Server v2 (Living Mind)
FastAPI server with SSE streaming and Living Mind data structure.
"""

import asyncio
import json
from datetime import datetime
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

from data_schema import PortalData, Meta, LivingMind, LiveEvent
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
    print("⟡ Context Engine (Living Mind) starting...")
    global EVENT_QUEUE
    EVENT_QUEUE = asyncio.Queue()
    yield
    print("⟡ Context Engine shutting down...")


app = FastAPI(title="Living Mind Context Engine", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════
# EVENT BROADCASTING
# ═══════════════════════════════════════════════════════════════

async def broadcast_event(event: LiveEvent):
    if EVENT_QUEUE:
        await EVENT_QUEUE.put(event)

async def ingest_adapter(e: IngestEvent):
    await broadcast_event(LiveEvent(type="ingest", message=f"[{e.source}] {e.message}"))

async def council_adapter(e: CouncilEvent):
    await broadcast_event(LiveEvent(type="inference", agent=e.agent, message=e.message))


# ═══════════════════════════════════════════════════════════════
# GENERATION LOGIC
# ═══════════════════════════════════════════════════════════════

async def generate_mind() -> PortalData:
    """Run Living Mind pipeline."""
    
    # 1. Ingest
    await broadcast_event(LiveEvent(type="ingest", message="Observing reality..."))
    ingest = IngestEngine(event_callback=ingest_adapter)
    await ingest.ingest_all()
    context = ingest.get_context_text(max_articles=15)
    
    # 2. Council
    await broadcast_event(LiveEvent(type="delta", message="Calibrating beliefs..."))
    council = CouncilEngine(event_callback=council_adapter)
    
    # Load previous state for continuity
    prev_mind = None
    if DATA_PATH.exists():
        try:
            prev_data = PortalData.from_json_file(str(DATA_PATH))
            prev_mind = prev_data.mind
        except: pass
    
    mind = await council.generate_mind(
        context, 
        datetime.now().strftime("%Y-%m-%d"), 
        previous_state=prev_mind
    )
    
    # 3. Save
    await broadcast_event(LiveEvent(type="publish", message="Updating internal model..."))
    data = PortalData(
        meta=Meta(date=datetime.now().strftime("%A, %B %d, %Y")),
        mind=mind
    )
    data.to_json_file(str(DATA_PATH))
    
    await broadcast_event(LiveEvent(type="publish", message="Mind updated."))
    return data


# ═══════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {"status": "online", "mode": "Living Mind v2"}

@app.get("/api/briefing")
def get_briefing():
    """Returns Living Mind JSON."""
    if DATA_PATH.exists():
        try:
            return PortalData.from_json_file(str(DATA_PATH)).model_dump()
        except Exception as e:
            return JSONResponse(500, {"error": str(e)})
    return JSONResponse(404, {"error": "No mind state found"})

@app.post("/api/refresh")
async def refresh(bg: BackgroundTasks):
    bg.add_task(generate_mind)
    return {"status": "calibration_started"}

@app.get("/api/live")
async def live_stream():
    async def generator():
        yield f"data: {LiveEvent(type='delta', message='Connected to Living Mind').model_dump_json()}\n\n"
        while True:
            try:
                event = await asyncio.wait_for(EVENT_QUEUE.get(), timeout=15.0)
                yield f"data: {event.model_dump_json()}\n\n"
            except asyncio.TimeoutError:
                yield f"data: {LiveEvent(type='delta', message='heartbeat').model_dump_json()}\n\n"

    return StreamingResponse(generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import sys
    import uvicorn
    if "--generate-daily" in sys.argv:
        asyncio.run(generate_mind())
    else:
        uvicorn.run("server:app", host="0.0.0.0", port=8083, reload=True)
