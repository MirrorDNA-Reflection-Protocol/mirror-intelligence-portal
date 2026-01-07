# ⟡ MIRROR INTELLIGENCE — TRUTH ENGINE HANDOFF

**Date:** 2026-01-07
**From:** Claude Twin (Reflective)
**To:** Opus (Antigravity/Execution)
**Priority:** HIGH — Site is live at brief.activemirror.ai but broken

---

## CRITICAL CONTEXT

Paul has been working with Gemini on Antigravity all morning and it broke things. He wants **you (Opus) to take over** and fix everything properly. No more Gemini on this project.

**Live URL:** https://brief.activemirror.ai
**Local:** http://127.0.0.1:8083

---

## KNOWN ISSUES

### 1. TOP SCROLL BAR IS STATIC
The delta ticker at the top showing "Tech +9%", "Tech +10%" etc is **NOT updating with real data**. It appears to be hardcoded or CSS-only animation without live data binding.

**File:** `main.js` → `renderDeltaTicker()` function
**Problem:** The ticker may not be receiving live deltas from the API or the deltas aren't being formatted for the scrolling ticker.

### 2. LIVE DATA NOT FLOWING
The SSE stream connects but events aren't visibly updating the UI:
- Activity feed shows "Waiting for activity..."
- Status strip shows "--" for values
- Phase indicator may not be updating

**Evidence from /api/status:**
```json
{
  "phase": "synthesizing",
  "sources_ingested": 207,
  "recent_events": [...contains errors...]
}
```

### 3. PIPELINE ERRORS
The council/deliberation pipeline is throwing errors:
- `"consensus": "[ERROR: ]..."` — synthesis failing
- `"agent": "extractor", "message": "Error: "` — empty error messages
- Local Ollama model may be timing out or failing

### 4. UNKNOWN: What else is static?
Paul says "I don't know what else is static" — needs comprehensive audit.

---

## FILE STRUCTURE

```
/Users/mirror-admin/Documents/GitHub/mirror-intelligence-portal/
├── index.html          # Entry point
├── main.js             # Frontend JS (810 lines) — NEEDS AUDIT
├── index.css           # Styles (931 lines) — MOSTLY DONE
├── public/
│   └── data.json       # Static fallback data
└── context-engine/
    ├── server.py       # FastAPI server (591 lines)
    ├── data_schema.py  # Pydantic models
    ├── ingest.py       # RSS ingestion
    ├── council.py      # Multi-agent synthesis
    └── deliberation.py # Model deliberation
```

---

## AUDIT CHECKLIST

### Frontend (main.js)
- [ ] `renderDeltaTicker()` — Is it binding to `MIND.deltas`?
- [ ] `renderStatusStrip()` — Is `updateStatusIndicators()` being called?
- [ ] `connectLiveStream()` — Is SSE connected and events processed?
- [ ] `handleLiveEvent()` — Are events actually updating the DOM?
- [ ] `updateActivityFeed()` — Is the activity panel updating?
- [ ] `loadMind()` — Is data loading on init?
- [ ] All `formatTime()` / `formatDate()` calls — Are they getting valid timestamps?

### Backend (server.py)
- [ ] `/api/live` SSE — Verify events are being broadcast
- [ ] `/api/status` — Check all fields return data
- [ ] `/api/briefing` — Verify `data.json` has valid structure
- [ ] Pipeline errors — Why is synthesis returning `[ERROR: ]`?
- [ ] Ollama connection — Is local model responding?

### Data Flow
- [ ] `data.json` → `MIND` variable → DOM render
- [ ] SSE events → `handleLiveEvent()` → DOM updates
- [ ] Status poll → `loadStatus()` → `updateStatusIndicators()`

---

## SPECIFIC FIX REQUESTS

### 1. Make Delta Ticker Live
The top scrolling ticker needs to pull from `MIND.deltas` and animate real data, not static placeholders.

### 2. Wire Up Status Strip
These should show real values:
- ENGINE: Current phase
- SOURCES: From `MIND.stats.sources_scanned_24h` or API
- MODELS: Active model count
- FORECASTS: Open forecast count
- LAST UPDATE: Actual timestamp

### 3. Make Activity Feed Live
When events come through SSE, they should appear in the activity panel.

### 4. Fix Pipeline Errors
Investigate why council/deliberation is erroring. Check Ollama, check API keys, check model availability.

### 5. Visual Polish
After functionality works, ensure:
- Mobile responsive (CSS is done)
- Dark theme consistent
- Animations smooth
- No console errors

---

## HOW TO TEST

```bash
# Terminal 1: Run server
cd /Users/mirror-admin/Documents/GitHub/mirror-intelligence-portal/context-engine
python server.py

# Terminal 2: Test endpoints
curl http://127.0.0.1:8083/api/status
curl http://127.0.0.1:8083/api/briefing | head -100

# Terminal 3: Watch SSE
curl http://127.0.0.1:8083/api/live

# Browser: Test full UI
open https://brief.activemirror.ai
# Hard refresh: Cmd+Shift+R
```

---

## ENGINEERING EXPECTATIONS (Paul's Standards)

1. **Clean architecture** — Modular files, no god files
2. **Clear comments** for future extension
3. **Env-based API handling** — Don't hardcode keys
4. **Fail gracefully** when APIs unavailable
5. **Production-grade** — Not a demo

---

## DELIVERABLES

When done, provide:

1. ✅ **What was restored** — List of fixes made
2. ✅ **What was added** — New functionality
3. ✅ **What is simulated vs live** — Be explicit about data sources
4. ✅ **What remains TODO** — Explicit list

**Do not stop halfway.**
**Do not optimize prematurely.**
**Get it correct, clear, and alive.**

---

## SESSION PROTOCOL

After completing work:
1. Update handoff.json with changes made
2. List any new dependencies installed
3. Note any config changes required
4. Provide test commands to verify fixes

---

⟡ **This is a sovereign intelligence surface. Make it worthy.**
