"""
⟡ Mirror Intelligence — Council Protocol v3 (Four Agents)
Multi-model deliberation with independent agent outputs and forced dissent.
"""

import asyncio
import httpx
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
from pathlib import Path

from data_schema import (
    LivingMind, RealityDelta, MentalModelUpdate, LivingBelief, 
    Risk, CouncilDialogue, TimePoint, Forecast, Evidence
)

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

OLLAMA_URL = "http://localhost:11434"
ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
ARTIFACTS_DIR.mkdir(exist_ok=True)

# The Quartet (4 Independent Agents)
COUNCIL = {
    "extractor": {
        "model": "mirrorbrain-ami:latest",
        "name": "The Extractor",
        "role": "Signal & Claim Extraction",
        "bias": "Identifies concrete claims, facts, and signals. No interpretation, just extraction."
    },
    "skeptic": {
        "model": "mirrorbrain-ami:latest",
        "name": "The Skeptic", 
        "role": "Challenger & Counterargument",
        "bias": "Must find counterarguments. If consensus exists, must articulate why it could be wrong."
    },
    "analyst": {
        "model": "mirrorbrain-ami:latest",
        "name": "The Analyst",
        "role": "Second-Order Effects",
        "bias": "Focuses on downstream impacts. If X happens, what breaks? What compounds?"
    },
    "forecaster": {
        "model": "mirrorbrain-ami:latest",
        "name": "The Forecaster",
        "role": "Probability & Resolution",
        "bias": "Converts uncertainty to probabilities. Specifies exact resolution criteria."
    }
}

@dataclass
class AgentOutput:
    """Raw output from a single agent run."""
    agent_id: str
    model_name: str
    timestamp: str
    prompt: str
    raw_response: str
    parsed: Dict[str, Any] = field(default_factory=dict)

@dataclass  
class CouncilEvent:
    agent: str
    status: str
    message: str
    timestamp: str = None
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.utcnow().isoformat() + "Z"

@dataclass
class DeliberationRun:
    """A complete deliberation cycle with all agent outputs."""
    run_id: str
    started_at: str
    finished_at: Optional[str] = None
    status: str = "running"
    agent_outputs: Dict[str, AgentOutput] = field(default_factory=dict)
    synthesis: Dict[str, Any] = field(default_factory=dict)

# ═══════════════════════════════════════════════════════════════
# COUNCIL ENGINE
# ═══════════════════════════════════════════════════════════════

class CouncilEngine:
    
    def __init__(self, event_callback=None):
        self.event_callback = event_callback
        self.current_run: Optional[DeliberationRun] = None
    
    async def _emit(self, agent: str, msg: str):
        if self.event_callback:
            await self.event_callback(CouncilEvent(agent, "thinking", msg))

    async def _query(self, agent: str, prompt: str, system: str = None) -> AgentOutput:
        """Query a single agent and return structured output."""
        config = COUNCIL[agent]
        await self._emit(agent, f"Processing...")
        
        output = AgentOutput(
            agent_id=agent,
            model_name=config["model"],
            timestamp=datetime.utcnow().isoformat() + "Z",
            prompt=prompt[:500] + "..." if len(prompt) > 500 else prompt,
            raw_response=""
        )
        
        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                payload = {
                    "model": config["model"],
                    "prompt": prompt,
                    "stream": False
                }
                if system:
                    payload["system"] = system
                
                response = await client.post(f"{OLLAMA_URL}/api/generate", json=payload)
                response.raise_for_status()
                result = response.json()
                raw = result.get("response", "").strip()
                
                # Strip thinking blocks
                if "</think>" in raw.lower():
                    idx = raw.lower().find("</think>") + len("</think>")
                    raw = raw[idx:].strip()
                
                output.raw_response = raw
                await self._emit(agent, f"Complete.")
                
        except Exception as e:
            await self._emit(agent, f"Error: {str(e)}")
            output.raw_response = f"ERROR: {str(e)}"
        
        return output

    def _save_run(self, run: DeliberationRun):
        """Persist deliberation run to artifacts."""
        run_file = ARTIFACTS_DIR / f"run_{run.run_id}.json"
        data = {
            "run_id": run.run_id,
            "started_at": run.started_at,
            "finished_at": run.finished_at,
            "status": run.status,
            "agent_outputs": {
                k: {
                    "agent_id": v.agent_id,
                    "model_name": v.model_name,
                    "timestamp": v.timestamp,
                    "prompt": v.prompt,
                    "raw_response": v.raw_response,
                    "parsed": v.parsed
                } for k, v in run.agent_outputs.items()
            },
            "synthesis": run.synthesis
        }
        with open(run_file, "w") as f:
            json.dump(data, f, indent=2, default=str)

    async def generate_mind(self, context: str, date: str, previous_state: Optional[LivingMind] = None) -> LivingMind:
        """Run full 4-agent deliberation cycle."""
        
        run_id = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        self.current_run = DeliberationRun(
            run_id=run_id,
            started_at=datetime.utcnow().isoformat() + "Z"
        )
        
        # ═══════════════════════════════════════════════════════════
        # PHASE 1: Independent Agent Runs (Blind to each other)
        # ═══════════════════════════════════════════════════════════
        
        # Agent A: Extractor
        await self._emit("extractor", "Extracting signals and claims...")
        extractor_prompt = f"""
You are a signal extractor. Your job is to identify concrete, verifiable claims from the input.
Do NOT interpret or analyze. Just extract.

INPUTS:
{context[:8000]}

Output format (one per line):
CLAIM: [Exact claim] | SOURCE: [Where it came from] | CONFIDENCE: [high/medium/low]
SIGNAL: [Market/tech/policy signal] | DIRECTION: [up/down/neutral] | MAGNITUDE: [1-10]

Extract 5-8 claims and 3-5 signals.
"""
        extractor_sys = f"You are {COUNCIL['extractor']['name']}. {COUNCIL['extractor']['bias']}"
        extractor_output = await self._query("extractor", extractor_prompt, extractor_sys)
        extractor_output.parsed = self._parse_extractor(extractor_output.raw_response)
        self.current_run.agent_outputs["extractor"] = extractor_output
        
        # Agent B: Skeptic (runs blind - doesn't see extractor output)
        await self._emit("skeptic", "Finding counterarguments...")
        skeptic_prompt = f"""
You are a professional skeptic. Your job is to find what could be wrong.
For EVERY apparent consensus or trend, you MUST provide numbered counterarguments.

INPUTS:
{context[:8000]}

=== REQUIRED OUTPUT FORMAT ===

COUNTERARGUMENTS (3-7 numbered):
1. [First counter] | TARGET: [What this challenges] | STRENGTH: [weak/moderate/strong]
2. [Second counter] | TARGET: [What this challenges] | STRENGTH: [weak/moderate/strong]
3. [Third counter] | TARGET: [What this challenges] | STRENGTH: [weak/moderate/strong]
... (continue to 7 max)

FALSIFIABILITY_TEST: [One specific test that could prove the consensus WRONG. Must be concrete and measurable.]

EVIDENCE_THAT_WOULD_CHANGE_MY_MIND: [What evidence, if produced, would make you abandon your skepticism?]

RISKS (2-4):
RISK: [Systemic risk if consensus is wrong] | SEVERITY: [low/medium/high/critical] | COMPOUND: [What makes this worse over time]

CONFIDENCE_PENALTY: [0-20] - How many percentage points should be deducted from any forecast confidence due to unaddressed risks?

UNRESOLVED_QUESTIONS (1-3):
1. [Question that remains unanswered]
2. [Another question]

=== RULES ===
- You MUST output at least 3 numbered counterarguments
- You MUST provide FALSIFIABILITY_TEST
- You MUST provide EVIDENCE_THAT_WOULD_CHANGE_MY_MIND
- Silence is NEVER allowed. If you cannot find counters, state why explicitly.
"""
        skeptic_sys = f"You are {COUNCIL['skeptic']['name']}. {COUNCIL['skeptic']['bias']} You are FORCED to dissent. Consensus without challenge is dangerous."
        skeptic_output = await self._query("skeptic", skeptic_prompt, skeptic_sys)
        skeptic_output.parsed = self._parse_skeptic(skeptic_output.raw_response)
        self.current_run.agent_outputs["skeptic"] = skeptic_output
        
        # Agent C: Analyst (runs blind)
        await self._emit("analyst", "Mapping second-order effects...")
        analyst_prompt = f"""
You analyze downstream effects. For each development, ask: "If this continues, what breaks?"

INPUTS:
{context[:8000]}

Output format:
EFFECT: [Second-order consequence] | TRIGGER: [What causes this] | TIMELINE: [days/weeks/months/years]
COMPOUND: [How this compounds with other factors] | SEVERITY: [low/medium/high]

Output 3-5 second-order effects.
"""
        analyst_sys = f"You are {COUNCIL['analyst']['name']}. {COUNCIL['analyst']['bias']}"
        analyst_output = await self._query("analyst", analyst_prompt, analyst_sys)
        analyst_output.parsed = self._parse_analyst(analyst_output.raw_response)
        self.current_run.agent_outputs["analyst"] = analyst_output
        
        # Agent D: Forecaster (runs blind)
        await self._emit("forecaster", "Generating falsifiable forecasts...")
        forecast_prompt = f"""
Convert uncertainty into probability. Every forecast must be:
- Binary (yes/no outcome)
- Time-bound (specific resolution date)
- Falsifiable (clear criteria)

INPUTS:
{context[:8000]}

Output format:
FORECAST: [Question ending in ?] | PROB: [0.00-1.00] | DATE: [YYYY-MM-DD] | CRITERIA: [Exact resolution condition]

Generate 3-5 forecasts with varying time horizons (30 days to 12 months).
"""
        forecaster_sys = f"You are {COUNCIL['forecaster']['name']}. {COUNCIL['forecaster']['bias']}"
        forecaster_output = await self._query("forecaster", forecast_prompt, forecaster_sys)
        forecaster_output.parsed = {"forecasts": self._parse_forecasts(forecaster_output.raw_response)}
        self.current_run.agent_outputs["forecaster"] = forecaster_output
        
        # ═══════════════════════════════════════════════════════════
        # PHASE 2: Synthesis (Combines all outputs WITH dissent)
        # ═══════════════════════════════════════════════════════════
        
        await self._emit("synthesis", "Synthesizing with forced dissent...")
        
        # Build synthesis from agent outputs
        claims = extractor_output.parsed.get("claims", [])
        signals = extractor_output.parsed.get("signals", [])
        counters = skeptic_output.parsed.get("counters", [])
        risks_raw = skeptic_output.parsed.get("risks", [])
        effects = analyst_output.parsed.get("effects", [])
        forecasts = forecaster_output.parsed.get("forecasts", [])
        
        # Create deltas from signals
        deltas = []
        for sig in signals[:5]:
            sent = "positive" if sig.get("direction") == "up" else ("negative" if sig.get("direction") == "down" else "neutral")
            mag = sig.get("magnitude", 10)
            if sent == "negative": mag = -abs(mag)
            deltas.append(RealityDelta(
                type="signal",
                text=sig.get("text", "Unknown signal"),
                magnitude=mag,
                sentiment=sent
            ))
        
        # Create risks from skeptic
        risks = []
        for r in risks_raw[:3]:
            risks.append(Risk(
                id=f"risk-{run_id}-{len(risks)+1}",
                text=r.get("text", "Unknown risk"),
                status="developing",
                compounding_factor=r.get("compound", "Unknown"),
                severity=r.get("severity", "medium").lower()
            ))
        
        # Mental model update
        top_claim = claims[0]["text"] if claims else "No clear signal"
        top_counter = counters[0]["text"] if counters else "No dissent recorded"
        top_effect = effects[0]["text"] if effects else "No second-order effects identified"
        
        update = MentalModelUpdate(
            matters=top_claim,
            confidence=f"Challenged by: {top_counter}",
            unresolved=top_effect
        )
        
        # Beliefs (preserve or generate)
        beliefs = []
        if previous_state and previous_state.beliefs:
            beliefs = previous_state.beliefs
        else:
            for i, claim in enumerate(claims[:2]):
                beliefs.append(LivingBelief(
                    id=f"belief-{run_id}-{i+1}",
                    statement=claim.get("text", "Unknown"),
                    status="active",
                    confidence=70 if claim.get("confidence") == "high" else 50,
                    last_challenged=date,
                    evidence_for=claim.get("source", "Initial extraction"),
                    evidence_against=counters[i]["text"] if i < len(counters) else "Pending review",
                    history=[TimePoint(date=date, value=70 if claim.get("confidence") == "high" else 50)]
                ))
        
        # Build mind
        mind = LivingMind(
            deltas=deltas,
            update=update,
            beliefs=beliefs,
            risks=risks
        )
        
        # Add forecasts
        for f in forecasts:
            mind.add_forecast(f)
        
        # Preserve existing forecasts from previous state
        if previous_state and previous_state.forecasts:
            for pf in previous_state.forecasts:
                if not any(f.id == pf.id for f in mind.forecasts):
                    mind.forecasts.append(pf)
        
        # Store synthesis
        self.current_run.synthesis = {
            "claims_extracted": len(claims),
            "counters_generated": len(counters),
            "risks_identified": len(risks),
            "forecasts_created": len(forecasts),
            "dissent_included": len(counters) > 0
        }
        
        # Finalize run
        self.current_run.finished_at = datetime.utcnow().isoformat() + "Z"
        self.current_run.status = "complete"
        self._save_run(self.current_run)
        
        return mind

    def _parse_extractor(self, raw: str) -> Dict[str, List]:
        """Parse extractor output. Falls back to extracting signals from raw content if format doesn't match."""
        claims = []
        signals = []
        
        # Try structured parsing first
        for line in raw.split("\n"):
            line = line.strip()
            if not line:
                continue
                
            # Look for CLAIM: format (case insensitive)
            if "claim:" in line.lower():
                parts = line.split("|")
                # Extract text after CLAIM:
                text_part = parts[0]
                for prefix in ["CLAIM:", "Claim:", "claim:"]:
                    if prefix in text_part:
                        text_part = text_part.split(prefix, 1)[1]
                        break
                text = text_part.strip()
                
                source = "Unknown"
                conf = "medium"
                for p in parts:
                    p_lower = p.lower()
                    if "source:" in p_lower:
                        source = p.split(":", 1)[1].strip() if ":" in p else "Unknown"
                    if "confidence:" in p_lower:
                        conf = p.split(":", 1)[1].strip().lower() if ":" in p else "medium"
                
                if text and len(text) > 5:
                    claims.append({"text": text[:500], "source": source, "confidence": conf})
            
            # Look for SIGNAL: format (case insensitive)
            elif "signal:" in line.lower():
                parts = line.split("|")
                text_part = parts[0]
                for prefix in ["SIGNAL:", "Signal:", "signal:"]:
                    if prefix in text_part:
                        text_part = text_part.split(prefix, 1)[1]
                        break
                text = text_part.strip()
                
                direction = "neutral"
                mag = 5
                for p in parts:
                    p_lower = p.lower()
                    if "direction:" in p_lower:
                        dir_val = p.split(":", 1)[1].strip().lower() if ":" in p else "neutral"
                        if "up" in dir_val or "positive" in dir_val or "+" in dir_val:
                            direction = "up"
                        elif "down" in dir_val or "negative" in dir_val or "-" in dir_val:
                            direction = "down"
                    if "magnitude:" in p_lower:
                        try:
                            mag_str = p.split(":", 1)[1].strip() if ":" in p else "5"
                            mag = int(''.join(filter(str.isdigit, mag_str)) or "5")
                            mag = min(max(mag, 1), 10)  # Clamp to 1-10
                        except:
                            mag = 5
                
                if text and len(text) > 5:
                    signals.append({"text": text[:300], "direction": direction, "magnitude": mag})
        
        # FALLBACK: If no structured signals found, extract top sentences as signals
        if not signals and raw:
            import re
            # Find sentences that look like signals (mention tech/market/policy terms)
            signal_keywords = ["ai", "market", "security", "risk", "growth", "decline", "increase", 
                             "decrease", "threat", "opportunity", "trend", "shift", "change"]
            sentences = re.split(r'[.!?]+', raw)
            
            for sentence in sentences[:10]:
                sentence = sentence.strip()
                if len(sentence) < 20:
                    continue
                    
                sentence_lower = sentence.lower()
                if any(kw in sentence_lower for kw in signal_keywords):
                    # Determine direction from sentiment words
                    direction = "neutral"
                    if any(w in sentence_lower for w in ["increase", "growth", "positive", "up", "gain", "rise"]):
                        direction = "up"
                    elif any(w in sentence_lower for w in ["decrease", "decline", "negative", "down", "loss", "fall", "drop"]):
                        direction = "down"
                    
                    signals.append({
                        "text": sentence[:300],
                        "direction": direction,
                        "magnitude": 5
                    })
                    
                    if len(signals) >= 3:  # Limit fallback signals
                        break
        
        return {"claims": claims, "signals": signals}

    def _parse_skeptic(self, raw: str) -> Dict[str, Any]:
        """Parse enhanced skeptic output with numbered counters and additional fields."""
        import re
        
        counters = []
        risks = []
        falsifiability_test = None
        evidence_to_change_mind = None
        confidence_penalty = 0
        unresolved_questions = []
        
        for line in raw.split("\n"):
            line = line.strip()
            if not line:
                continue
            
            # Parse numbered counters (1. [counter] | TARGET: ... | STRENGTH: ...)
            numbered_match = re.match(r'^(\d+)\.\s*(.+)', line)
            if numbered_match and "TARGET:" in line:
                parts = line.split("|")
                text = parts[0]
                # Remove the number prefix
                text = re.sub(r'^\d+\.\s*', '', text).strip()
                target = "General consensus"
                strength = "moderate"
                for p in parts:
                    p_lower = p.lower()
                    if "target:" in p_lower:
                        target = p.split(":", 1)[1].strip() if ":" in p else target
                    if "strength:" in p_lower:
                        strength = p.split(":", 1)[1].strip().lower() if ":" in p else strength
                if text and len(text) > 5:
                    counters.append({"text": text[:500], "target": target, "strength": strength})
            
            # Legacy COUNTER: format
            elif "COUNTER:" in line:
                parts = line.split("|")
                text = parts[0].replace("COUNTER:", "").strip()
                target = "General consensus"
                strength = "moderate"
                for p in parts:
                    if "TARGET:" in p: target = p.replace("TARGET:", "").strip()
                    if "STRENGTH:" in p: strength = p.replace("STRENGTH:", "").strip().lower()
                if text:
                    counters.append({"text": text[:500], "target": target, "strength": strength})
            
            # Parse RISK lines
            elif "RISK:" in line:
                parts = line.split("|")
                text = parts[0].replace("RISK:", "").strip()
                sev = "medium"
                compound = "Unknown"
                for p in parts:
                    if "SEVERITY:" in p: sev = p.replace("SEVERITY:", "").strip().lower()
                    if "COMPOUND:" in p: compound = p.replace("COMPOUND:", "").strip()
                if text:
                    risks.append({"text": text[:500], "severity": sev, "compound": compound})
            
            # Parse FALSIFIABILITY_TEST
            elif "FALSIFIABILITY_TEST:" in line:
                falsifiability_test = line.split(":", 1)[1].strip() if ":" in line else None
            
            # Parse EVIDENCE_THAT_WOULD_CHANGE_MY_MIND
            elif "EVIDENCE_THAT_WOULD_CHANGE_MY_MIND:" in line:
                evidence_to_change_mind = line.split(":", 1)[1].strip() if ":" in line else None
            
            # Parse CONFIDENCE_PENALTY
            elif "CONFIDENCE_PENALTY:" in line:
                try:
                    penalty_str = line.split(":", 1)[1].strip()
                    # Extract just the number
                    penalty_match = re.search(r'(\d+)', penalty_str)
                    if penalty_match:
                        confidence_penalty = min(int(penalty_match.group(1)), 20)
                except:
                    pass
            
            # Parse unresolved questions (numbered after UNRESOLVED_QUESTIONS header)
            elif line.startswith(("1.", "2.", "3.")) and "UNRESOLVED" not in line and "TARGET" not in line:
                question = re.sub(r'^\d+\.\s*', '', line).strip()
                if question and len(question) > 10 and "?" in question:
                    unresolved_questions.append(question)
        
        return {
            "counters": counters,
            "risks": risks,
            "falsifiability_test": falsifiability_test,
            "evidence_to_change_mind": evidence_to_change_mind,
            "confidence_penalty": confidence_penalty,
            "unresolved_questions": unresolved_questions[:3]  # Max 3
        }

    def _parse_analyst(self, raw: str) -> Dict[str, List]:
        effects = []
        for line in raw.split("\n"):
            if "EFFECT:" in line:
                parts = line.split("|")
                text = parts[0].replace("EFFECT:", "").strip()
                trigger = "Unknown"
                timeline = "months"
                for p in parts:
                    if "TRIGGER:" in p: trigger = p.replace("TRIGGER:", "").strip()
                    if "TIMELINE:" in p: timeline = p.replace("TIMELINE:", "").strip().lower()
                effects.append({"text": text, "trigger": trigger, "timeline": timeline})
        return {"effects": effects}

    def _parse_forecasts(self, raw: str) -> List[Forecast]:
        forecasts = []
        count = 1
        for line in raw.split("\n"):
            if "FORECAST:" in line:
                try:
                    parts = line.split("|")
                    q = parts[0].replace("FORECAST:", "").strip()
                    prob = 0.5
                    crit = "Unspecified"
                    res_date = datetime.utcnow() + timedelta(days=90)
                    
                    for p in parts:
                        if "PROB:" in p:
                            try: prob = float(p.replace("PROB:", "").strip())
                            except: pass
                        if "CRITERIA:" in p: 
                            crit = p.replace("CRITERIA:", "").strip()
                        if "DATE:" in p:
                            try:
                                date_str = p.replace("DATE:", "").strip()
                                res_date = datetime.strptime(date_str, "%Y-%m-%d")
                            except: pass
                    
                    # Clamp probability
                    prob = max(0.01, min(0.99, prob))
                    
                    f = Forecast(
                        id=f"fc-{datetime.now().strftime('%Y%m%d%H%M%S')}-{count}",
                        question=q,
                        created_at=datetime.utcnow(),
                        resolution_date=res_date,
                        resolution_criteria=crit,
                        probability=prob,
                        status="open"
                    )
                    forecasts.append(f)
                    count += 1
                except Exception:
                    pass
        return forecasts
