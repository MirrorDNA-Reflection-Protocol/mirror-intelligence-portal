# Mirror Intelligence — Truth Engine v3

A real-time intelligence synthesis platform with 4-agent deliberation, falsifiable forecasts, and append-only truth ledger.

## Quick Start

```bash
# Start backend (port 8083)
cd context-engine
python3 -m uvicorn server:app --host 0.0.0.0 --port 8083

# Start frontend (port 8085)
npm run dev -- --port 8085

# Trigger ingestion + deliberation
curl -X POST http://127.0.0.1:8083/api/refresh
```

## Architecture

### Four Independent Agents

| Agent | Role | Model |
|-------|------|-------|
| **Extractor** | Signal & claim extraction | qwen3:8b |
| **Skeptic** | Challenger & counterarguments | mirrorbrain-ami |
| **Analyst** | Second-order effects | mirrorbrain-ami |
| **Forecaster** | Probability & resolution | qwen3:8b |

Agents run **blind** (no access to each other's outputs until synthesis).

### Data Flow

```
RSS Feeds (25+) → Ingest → 4-Agent Council → Synthesis → Living Mind → Frontend
                                    ↓
                            Truth Ledger (append-only)
```

### Truth Ledger

Every change emits an immutable ledger entry:
- `INGEST` — Source ingested
- `FORECAST_OPEN` — New forecast created
- `FORECAST_RESOLVE` — Forecast resolved with Brier score
- `SYSTEM_UPDATE` — System events

Entries form a hash chain. No updates or deletes allowed.

## API Endpoints

### Core

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Status + endpoint list |
| `/api/health` | GET | Component health status |
| `/api/briefing` | GET | Full Living Mind JSON |
| `/api/refresh` | POST | Trigger ingestion + deliberation |
| `/api/live` | GET | SSE stream for real-time updates |

### Drill-downs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pulse/{index}` | GET | Evidence detail for delta item |
| `/api/forecast/{id}` | GET | Forecast detail with history |
| `/api/ledger` | GET | Paginated truth ledger |
| `/api/sources` | GET | Paginated source list |
| `/api/artifacts` | GET | List deliberation runs |
| `/api/artifacts/{run_id}` | GET | Raw agent outputs for run |

### Example Responses

**Pulse Detail:**
```json
{
  "index": 0,
  "summary": "Signal text",
  "magnitude": 30,
  "sentiment": "positive",
  "what_changed": "...",
  "why_it_matters": "...",
  "citations": [
    {"title": "Article", "url": "...", "excerpt": "..."}
  ]
}
```

**Forecast Detail:**
```json
{
  "id": "fc-001",
  "question": "Will X happen by Y?",
  "probability": 0.72,
  "resolution_date": "2026-06-15",
  "resolution_criteria": "Exact condition for true/false",
  "status": "open",
  "assumptions": ["..."],
  "evidence_sources": [{"title": "...", "url": "..."}],
  "history": [{"timestamp": "...", "type": "FORECAST_OPEN"}]
}
```

## Forecasting & Scoring

- All forecasts are **binary** (yes/no outcome)
- Each has **explicit resolution criteria**
- Resolved forecasts receive **Brier score**: `(outcome - probability)²`
  - 0.0 = perfect prediction
  - 1.0 = completely wrong
- Mean Brier score tracked in stats

## Configuration

### Feeds (`context-engine/feeds.txt`)

```
# TECHNOLOGY & AI
https://techcrunch.com/feed/
https://www.theverge.com/rss/index.xml
...

# MARKETS & FINANCE
https://www.ft.com/technology?format=rss
...
```

### Models (`context-engine/council.py`)

```python
COUNCIL = {
    "extractor": {"model": "qwen3:8b", ...},
    "skeptic": {"model": "mirrorbrain-ami:latest", ...},
    "analyst": {"model": "mirrorbrain-ami:latest", ...},
    "forecaster": {"model": "qwen3:8b", ...}
}
```

## Testing

```bash
# Run all tests
python3 -m pytest tests/ -v

# Test specific module
python3 -m pytest tests/test_truth_engine.py::TestCouncil -v
```

### Test Coverage

- Data schema validation
- Brier score calculation
- Ledger hash chain integrity
- Agent output parsing
- 4-agent configuration

## Graceful Degradation

The frontend **never blank-screens**:
- Shell renders immediately
- API failures show degraded status
- Fallback to cached data.json
- Auto-reconnect via SSE

## Files

```
mirror-intelligence-portal/
├── context-engine/
│   ├── server.py         # FastAPI backend
│   ├── council.py        # 4-agent deliberation
│   ├── ingest.py         # RSS ingestion
│   ├── data_schema.py    # Pydantic models
│   ├── feeds.txt         # RSS sources
│   └── artifacts/        # Deliberation run logs
├── public/
│   └── data.json         # Living Mind state
├── main.js               # Frontend logic
├── index.css             # Styles
├── tests/
│   └── test_truth_engine.py
└── .github/workflows/ci.yml
```

## Status Banner Format

```
YYYY-MM-DD HH:MM IST (UTC+05:30)
```

All timestamps stored UTC, rendered with explicit timezone.

---

**Mirror Intelligence // Truth Engine v3.0**
4-Agent Deliberation • Append-Only Ledger • Brier Scoring
