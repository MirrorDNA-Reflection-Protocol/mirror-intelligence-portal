"""
⟡ Mirror Intelligence — Council Protocol v2 (Living Mind)
Multi-model analysis generating Reality Deltas and Mental Model Updates.
"""

import asyncio
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from dataclasses import dataclass

from data_schema import (
    LivingMind, RealityDelta, MentalModelUpdate, LivingBelief, 
    Risk, CouncilDialogue, BriefingStats, TimePoint
)

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

OLLAMA_URL = "http://localhost:11434"

# The Triad
COUNCIL = {
    "architect": {
        "model": "mirrorbrain-ami:latest", # GPT-4o Persona
        "name": "The Architect",
        "role": "Synthesis & Alignment",
        "bias": "Sees the structural shift. Ignores noise. Updates the internal model."
    },
    "skeptic": {
        "model": "mirrorbrain-ami:latest", # Mistral Persona
        "name": "The Skeptic",
        "role": "Risk & Blindspots",
        "bias": "Assumes consensus is wrong. Looks for compounding tail risks."
    },
    "historian": {
        "model": "qwen3:8b", # Faster model for context
        "name": "The Historian", 
        "role": "Drift & Context",
        "bias": "Remembers what we believed yesterday. Measures drift."
    }
}

@dataclass
class CouncilEvent:
    agent: str
    status: str
    message: str
    timestamp: str = None
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.utcnow().isoformat() + "Z"

# ═══════════════════════════════════════════════════════════════
# COUNCIL ENGINE
# ═══════════════════════════════════════════════════════════════

class CouncilEngine:
    
    def __init__(self, event_callback=None):
        self.event_callback = event_callback
    
    async def _emit(self, agent: str, msg: str):
        if self.event_callback:
            await self.event_callback(CouncilEvent(agent, "thinking", msg))

    async def _query(self, agent: str, prompt: str, system: str = None) -> str:
        config = COUNCIL[agent]
        await self._emit(agent, f"Analyzing: {prompt[:30]}...")
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
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
                output = result.get("response", "").strip()
                
                # Strip thinking blocks
                if "</think>" in output.lower():
                    idx = output.lower().find("</think>") + len("</think>")
                    output = output[idx:].strip()
                
                return output
        except Exception as e:
            await self._emit(agent, f"Error: {str(e)}")
            return ""

    async def generate_mind(self, context: str, date: str, previous_state: Optional[LivingMind] = None) -> LivingMind:
        """Generate the Living Mind state."""
        
        await self._emit("architect", "Synthesizing Mental Model Update...")
        
        # 1. Mental Model Update (Architect)
        update_prompt = f"""
You are the internal monologue of a highly intelligent observer.
Based on today's inputs, update our internal model of the world.

INPUTS:
{context}

Output exactly 3 lines in this format:
MATTERS: [What actually matters today - the signal]
CONFIDENCE: [What belief are we gaining/losing confidence in]
UNRESOLVED: [The biggest open question]

Be opinionated. No fluff.
"""
        architect_sys = f"You are {COUNCIL['architect']['name']}. {COUNCIL['architect']['bias']}"
        update_raw = await self._query("architect", update_prompt, architect_sys)
        
        # Parse Update
        update = self._parse_update(update_raw)
        
        # 2. Risks (Skeptic)
        await self._emit("skeptic", "Scanning for compounding risks...")
        risk_prompt = f"""
Identify 1-2 systemic risks from this input.
Focus on "If this compounds, X breaks".

INPUTS:
{context}

Format:
RISK: [The risk] | SEVERITY: [Low/Medium/High] | COMPOUND: [If this continues...]
"""
        skeptic_sys = f"You are {COUNCIL['skeptic']['name']}. {COUNCIL['skeptic']['bias']}"
        risk_raw = await self._query("skeptic", risk_prompt, skeptic_sys)
        risks = self._parse_risks(risk_raw)
        
        # 3. Deltas (Historian/Architect)
        # For now, generate deltas based on sentiment/magnitude of news
        await self._emit("historian", "Calculating Reality Deltas...")
        delta_prompt = f"""
Extract 3 distinct "shifts" in reality from the inputs.
Format:
DELTA: [Text] | MAGNITUDE: [+10 to +50 or -10 to -50] | SENTIMENT: [positive/negative/alert]
"""
        deltas_raw = await self._query("architect", delta_prompt, architect_sys)
        deltas = self._parse_deltas(deltas_raw)
        
        # 4. Living Beliefs (Preserve old ones, update if needed)
        # Simplified: If no previous state, generate fresh. If prev, just keep them (passive).
        # In a real system, we'd update them. For now, let's generate 2 core beliefs derived from context.
        beliefs = []
        if previous_state and previous_state.beliefs:
            beliefs = previous_state.beliefs
        else:
            # Generate initial beliefs
            belief_prompt = f"""
Formulate 2 core beliefs derived from this context.
Format:
BELIEF: [Statement] | CONFIDENCE: [0-100] | STATUS: [strengthening/questioned]
"""
            belief_raw = await self._query("architect", belief_prompt, architect_sys)
            beliefs = self._parse_beliefs(belief_raw, date)

        # 5. Council Dialogue (Optional, forced dissent on top topic)
        dialogue = CouncilDialogue(
             topic="Context Interpretation",
             architect=update.matters,
             skeptic=risks[0].text if risks else "No major risks detected.",
             historian="This matches the cyclical pattern of hype vs reality.",
             conclusion="Monitor the signal."
        )

        return LivingMind(
            deltas=deltas,
            update=update,
            beliefs=beliefs,
            risks=risks,
            council=dialogue,
            stats=BriefingStats(models=3)
        )

    def _parse_update(self, raw: str) -> MentalModelUpdate:
        matters = "Processing..."
        conf = "Analysing..."
        unres = "Unknown."
        for line in raw.split("\n"):
            if line.startswith("MATTERS:"): matters = line.replace("MATTERS:", "").strip()
            elif line.startswith("CONFIDENCE:"): conf = line.replace("CONFIDENCE:", "").strip()
            elif line.startswith("UNRESOLVED:"): unres = line.replace("UNRESOLVED:", "").strip()
        return MentalModelUpdate(matters=matters, confidence=conf, unresolved=unres)

    def _parse_risks(self, raw: str) -> List[Risk]:
        risks = []
        count = 1
        for line in raw.split("\n"):
            if "RISK:" in line:
                parts = line.split("|")
                text = parts[0].replace("RISK:", "").strip()
                sev = "medium"
                comp = "Unknown impact."
                for p in parts:
                    if "SEVERITY:" in p: sev = p.replace("SEVERITY:", "").strip().lower()
                    if "COMPOUND:" in p: comp = p.replace("COMPOUND:", "").strip()
                
                risks.append(Risk(
                    id=f"risk-{datetime.now().timestamp()}-{count}",
                    text=text,
                    status="developing",
                    compounding_factor=comp,
                    severity=sev
                ))
                count += 1
        return risks

    def _parse_deltas(self, raw: str) -> List[RealityDelta]:
        deltas = []
        for line in raw.split("\n"):
            if "DELTA:" in line:
                parts = line.split("|")
                text = parts[0].replace("DELTA:", "").strip()
                mag = 10
                sent = "neutral"
                for p in parts:
                    if "MAGNITUDE:" in p: 
                        try: mag = int(p.replace("MAGNITUDE:", "").strip())
                        except: pass
                    if "SENTIMENT:" in p: sent = p.replace("SENTIMENT:", "").strip().lower()
                
                deltas.append(RealityDelta(
                    type="probability_shift",
                    text=text,
                    magnitude=mag,
                    sentiment=sent
                ))
        return deltas

    def _parse_beliefs(self, raw: str, date: str) -> List[LivingBelief]:
        beliefs = []
        count = 1
        for line in raw.split("\n"):
            if "BELIEF:" in line:
                parts = line.split("|")
                text = parts[0].replace("BELIEF:", "").strip()
                conf = 50
                status = "active"
                for p in parts:
                    if "CONFIDENCE:" in p:
                        try: conf = int(p.replace("CONFIDENCE:", "").strip())
                        except: pass
                    if "STATUS:" in p: status = p.replace("STATUS:", "").strip()
                
                beliefs.append(LivingBelief(
                    id=f"belief-{count}",
                    statement=text,
                    status=status,
                    confidence=conf,
                    last_challenged=date,
                    evidence_for="Initial synthesis",
                    evidence_against="Pending review",
                    history=[TimePoint(date=date, value=conf)]
                ))
                count += 1
        return beliefs
