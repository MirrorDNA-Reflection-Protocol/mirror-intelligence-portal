"""
⟡ Mirror Intelligence — Council Protocol
Multi-model analysis layer using Ollama for inference.
"""

import asyncio
import httpx
from datetime import datetime
from typing import List, Dict, Optional, Callable, Awaitable
from dataclasses import dataclass

from data_schema import (
    Briefing, BriefingSections, BriefingItem, BriefingStats,
    Prediction, ProbabilityData, ModelReasoning, Evidence,
    Source
)

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

OLLAMA_URL = "http://localhost:11434"

# Council members with their roles and biases
COUNCIL = {
    "gpt": {
        "model": "mirrorbrain-ami:latest",
        "name": "GPT-4o",
        "role": "Narrative Analyst",
        "bias": "Finds the story beneath the data. Sees patterns in communication."
    },
    "deepseek": {
        "model": "mirrorbrain-ami:latest",  # Use same model, different system prompt
        "name": "DeepSeek R1",
        "role": "Facts & Metrics", 
        "bias": "Extracts concrete numbers. Distrusts vague claims."
    },
    "groq": {
        "model": "qwen3:8b",  # Faster model for filtering
        "name": "Llama 3.3",
        "role": "Signal Filter",
        "bias": "Separates hype from durable change. Thinks in 6-month windows."
    },
    "mistral": {
        "model": "mirrorbrain-ami:latest",
        "name": "Mistral",
        "role": "Contrarian Voice",
        "bias": "Finds what everyone is missing. Comfortable with dissent."
    }
}


@dataclass
class CouncilEvent:
    """An event from the council for streaming."""
    agent: str
    status: str  # "thinking", "responding", "complete", "error"
    message: str
    timestamp: str = None
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.utcnow().isoformat() + "Z"


# ═══════════════════════════════════════════════════════════════
# COUNCIL ENGINE
# ═══════════════════════════════════════════════════════════════

class CouncilEngine:
    """Multi-model analysis engine implementing the Council Protocol."""
    
    def __init__(self, event_callback: Optional[Callable[[CouncilEvent], Awaitable]] = None):
        self.event_callback = event_callback
    
    async def _emit(self, event: CouncilEvent):
        """Emit a council event."""
        if self.event_callback:
            await self.event_callback(event)
    
    async def _query_model(self, agent: str, prompt: str, system: str = None) -> str:
        """Query Ollama with a specific model."""
        config = COUNCIL[agent]
        
        await self._emit(CouncilEvent(
            agent=agent,
            status="thinking",
            message=f"{config['name']} analyzing..."
        ))
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                payload = {
                    "model": config["model"],
                    "prompt": prompt,
                    "stream": False
                }
                if system:
                    payload["system"] = system
                
                response = await client.post(
                    f"{OLLAMA_URL}/api/generate",
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                
                output = result.get("response", "").strip()
                
                # Strip thinking blocks
                if "</think>" in output.lower():
                    idx = output.lower().find("</think>") + len("</think>")
                    output = output[idx:].strip()
                
                await self._emit(CouncilEvent(
                    agent=agent,
                    status="complete",
                    message=f"{config['name']} analysis complete"
                ))
                
                return output
                
        except Exception as e:
            await self._emit(CouncilEvent(
                agent=agent,
                status="error",
                message=f"{config['name']} error: {str(e)}"
            ))
            return f"[Error: {str(e)}]"
    
    async def generate_briefing(self, context: str, date: str) -> Briefing:
        """Generate a daily briefing from ingested context."""
        
        # Step 1: Extract key changes (using GPT persona)
        changes_prompt = f"""
You are analyzing today's tech/AI news. Extract exactly 3-5 key changes that matter.

TODAY'S CONTEXT:
{context}

For each change, output in this EXACT format (one per line):
CHANGE: [brief statement] | DETAIL: [one sentence detail] | SOURCE: [source name]

Focus on:
- Concrete announcements, not speculation
- Changes that affect business/technology decisions
- Regulatory or policy shifts
"""
        
        gpt_system = f"You are {COUNCIL['gpt']['name']}, {COUNCIL['gpt']['role']}. {COUNCIL['gpt']['bias']}"
        changes_raw = await self._query_model("gpt", changes_prompt, gpt_system)
        
        # Step 2: Get contrarian risks (Mistral)
        risks_prompt = f"""
You are the contrarian voice. Given today's news, identify 1-2 risks that others are missing.

TODAY'S CONTEXT:
{context}

For each risk, output:
RISK: [the risk] | SEVERITY: [low/medium/high]

Be specific and concrete. No vague warnings.
"""
        
        mistral_system = f"You are {COUNCIL['mistral']['name']}, {COUNCIL['mistral']['role']}. {COUNCIL['mistral']['bias']}"
        risks_raw = await self._query_model("mistral", risks_prompt, mistral_system)
        
        # Step 3: Filter signal from noise (Groq/fast model)
        ignore_prompt = f"""
Looking at today's noise, what should decision-makers IGNORE?
List 1-2 things that are hype/vaporware/not actionable.

TODAY'S CONTEXT:
{context}

Output format:
IGNORE: [thing to ignore] | WHY: [brief reason]
"""
        
        groq_system = f"You are {COUNCIL['groq']['name']}, {COUNCIL['groq']['role']}. {COUNCIL['groq']['bias']}"
        ignore_raw = await self._query_model("groq", ignore_prompt, groq_system)
        
        # Step 4: Synthesize headline (GPT)
        headline_prompt = f"""
Based on today's analysis, create a compelling headline and subline.

KEY CHANGES:
{changes_raw}

RISKS:
{risks_raw}

Output:
HEADLINE: [punchy headline, max 10 words]
SUBLINE: [one sentence context]
SUMMARY: [2-3 sentence executive summary]
"""
        
        headline_raw = await self._query_model("gpt", headline_prompt, gpt_system)
        
        # Parse outputs into structured data
        briefing = self._parse_briefing_outputs(
            headline_raw, changes_raw, risks_raw, ignore_raw
        )
        
        return briefing
    
    def _parse_briefing_outputs(
        self, 
        headline_raw: str, 
        changes_raw: str, 
        risks_raw: str, 
        ignore_raw: str
    ) -> Briefing:
        """Parse raw model outputs into structured Briefing."""
        
        # Parse headline
        headline = "Daily Intelligence Brief"
        subline = "Today's synthesis"
        summary = ""
        
        for line in headline_raw.split("\n"):
            line = line.strip()
            if line.startswith("HEADLINE:"):
                headline = line.replace("HEADLINE:", "").strip()
            elif line.startswith("SUBLINE:"):
                subline = line.replace("SUBLINE:", "").strip()
            elif line.startswith("SUMMARY:"):
                summary = line.replace("SUMMARY:", "").strip()
        
        # Parse changes
        changed = []
        source_counter = 1
        for line in changes_raw.split("\n"):
            if line.strip().startswith("CHANGE:"):
                parts = line.split("|")
                text = parts[0].replace("CHANGE:", "").strip()
                detail = None
                source_name = "Analysis"
                
                for part in parts[1:]:
                    if "DETAIL:" in part:
                        detail = part.replace("DETAIL:", "").strip()
                    elif "SOURCE:" in part:
                        source_name = part.replace("SOURCE:", "").strip()
                
                changed.append(BriefingItem(
                    text=text,
                    detail=detail,
                    source=Source(n=source_counter, name=source_name),
                    voice="gpt"
                ))
                source_counter += 1
        
        # Parse risks
        risks = []
        for line in risks_raw.split("\n"):
            if line.strip().startswith("RISK:"):
                parts = line.split("|")
                text = parts[0].replace("RISK:", "").strip()
                severity = "medium"
                
                for part in parts[1:]:
                    if "SEVERITY:" in part:
                        sev = part.replace("SEVERITY:", "").strip().lower()
                        if sev in ["low", "medium", "high"]:
                            severity = sev
                
                risks.append(BriefingItem(
                    text=text,
                    voice="mistral",
                    severity=severity
                ))
        
        # Parse ignore
        ignore = []
        for line in ignore_raw.split("\n"):
            if line.strip().startswith("IGNORE:"):
                parts = line.split("|")
                text = parts[0].replace("IGNORE:", "").strip()
                ignore.append(BriefingItem(
                    text=text,
                    voice="groq"
                ))
        
        return Briefing(
            headline=headline,
            subline=subline,
            summary=summary or "Council synthesis in progress.",
            stats=BriefingStats(sources=source_counter - 1, models=4),
            sections=BriefingSections(
                changed=changed[:5],
                matters=[],  # Can be added if needed
                risks=risks[:3],
                actions=[],
                ignore=ignore[:3]
            )
        )
    
    async def analyze_prediction(
        self, 
        prediction_text: str, 
        context: str
    ) -> Dict[str, ModelReasoning]:
        """Get multi-model analysis of a prediction."""
        
        reasoning = {}
        
        for agent in ["gpt", "deepseek", "groq", "mistral"]:
            config = COUNCIL[agent]
            
            prompt = f"""
PREDICTION: {prediction_text}

CURRENT CONTEXT:
{context}

You are {config['name']}, {config['role']}. {config['bias']}

Analyze this prediction and respond in EXACTLY this format:
POSITION: [supports/neutral/skeptical]
ARGUMENT: [your main argument in one sentence]
WOULD_CHANGE: [what evidence would change your view]
"""
            
            system = f"You are {config['name']}. Be direct and concise."
            response = await self._query_model(agent, prompt, system)
            
            # Parse response
            position = "neutral"
            argument = "Analysis in progress."
            would_change = "New evidence."
            
            for line in response.split("\n"):
                line = line.strip()
                if line.startswith("POSITION:"):
                    pos = line.replace("POSITION:", "").strip().lower()
                    if pos in ["supports", "neutral", "skeptical"]:
                        position = pos
                elif line.startswith("ARGUMENT:"):
                    argument = line.replace("ARGUMENT:", "").strip()
                elif line.startswith("WOULD_CHANGE:"):
                    would_change = line.replace("WOULD_CHANGE:", "").strip()
            
            reasoning[agent] = ModelReasoning(
                position=position,
                argument=argument,
                would_change=would_change
            )
        
        return reasoning


# ═══════════════════════════════════════════════════════════════
# STANDALONE TEST
# ═══════════════════════════════════════════════════════════════

async def main():
    """Test council."""
    async def log_event(event: CouncilEvent):
        print(f"[{event.agent}] {event.status}: {event.message}")
    
    engine = CouncilEngine(event_callback=log_event)
    
    test_context = """
    [TechCrunch] OpenAI announces new enterprise tier with local deployment options.
    [MIT Tech Review] DeepSeek R1 benchmarks show competitive performance with GPT-4.
    [The Verge] EU AI Act enforcement begins, requiring watermark compliance for AI models.
    """
    
    print("⟡ Generating briefing...")
    briefing = await engine.generate_briefing(test_context, "January 7, 2026")
    
    print(f"\nHeadline: {briefing.headline}")
    print(f"Subline: {briefing.subline}")
    print(f"Changes: {len(briefing.sections.changed)}")
    print(f"Risks: {len(briefing.sections.risks)}")


if __name__ == "__main__":
    asyncio.run(main())
