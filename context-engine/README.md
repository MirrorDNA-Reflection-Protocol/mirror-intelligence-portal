# Context Engine - Mirror Intelligence

Python backend powering live data for [brief.activemirror.ai](https://brief.activemirror.ai).

## Quick Start

```bash
./launch.sh          # Start API server on port 8083
./launch.sh --generate  # Generate daily briefing once
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/api/briefing` | GET | Current day's briefing |
| `/api/predictions` | GET | Active predictions |
| `/api/live` | GET | SSE stream of live events |
| `/api/refresh` | POST | Trigger manual refresh |

## Architecture

```
ingest.py   → RSS/API fetching
council.py  → Multi-model analysis (Ollama)
server.py   → FastAPI + SSE
```

## Dependencies

- `fastapi`, `uvicorn` — Web server
- `httpx`, `feedparser` — Data fetching
- `pydantic` — Data validation
- Ollama running locally with `mirrorbrain-ami:latest`
