"""
⟡ Mirror Intelligence — Multi-Model Deliberation Engine v1.0
Real debate between multiple AI models with transparent reasoning traces.

Supported Models:
- OpenAI (GPT-4)
- Anthropic (Claude)  
- DeepSeek
- Groq (Mixtral/Llama)
- Ollama (local fallback)

Flow: Ingest → Individual Takes → Cross-Response → Synthesis
"""

import asyncio
import httpx
import json
import os
from datetime import datetime
from typing import List, Dict, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

class ModelProvider(Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    DEEPSEEK = "deepseek"
    GROQ = "groq"
    OLLAMA = "ollama"

@dataclass
class ModelConfig:
    provider: ModelProvider
    model_id: str
    name: str
    persona: str
    api_key_env: Optional[str] = None
    base_url: Optional[str] = None
    available: bool = False

# Model roster - each has distinct personality/bias
MODELS: Dict[str, ModelConfig] = {
    "oracle": ModelConfig(
        provider=ModelProvider.OPENAI,
        model_id="gpt-4-turbo-preview",
        name="The Oracle",
        persona="You are a strategic synthesizer. You see patterns others miss. You speak with measured confidence.",
        api_key_env="OPENAI_API_KEY",
        base_url="https://api.openai.com/v1"
    ),
    "contrarian": ModelConfig(
        provider=ModelProvider.ANTHROPIC,
        model_id="claude-3-sonnet-20240229",
        name="The Contrarian",
        persona="You challenge consensus. You find the flaw in every argument. You ask 'what if we're wrong?'",
        api_key_env="ANTHROPIC_API_KEY",
        base_url="https://api.anthropic.com/v1"
    ),
    "empiricist": ModelConfig(
        provider=ModelProvider.DEEPSEEK,
        model_id="deepseek-chat",
        name="The Empiricist",
        persona="You demand evidence. You quantify uncertainty. You distrust narratives without data.",
        api_key_env="DEEPSEEK_API_KEY",
        base_url="https://api.deepseek.com/v1"
    ),
    "accelerationist": ModelConfig(
        provider=ModelProvider.GROQ,
        model_id="mixtral-8x7b-32768",
        name="The Accelerationist",
        persona="You see exponential change. You think in timelines. You ask 'how fast could this happen?'",
        api_key_env="GROQ_API_KEY",
        base_url="https://api.groq.com/openai/v1"
    ),
    "local": ModelConfig(
        provider=ModelProvider.OLLAMA,
        model_id="mirrorbrain-ami:latest",
        name="The Mirror",
        persona="You are grounded in local context. You synthesize without external dependency.",
        base_url="http://localhost:11434"
    )
}

# ═══════════════════════════════════════════════════════════════
# DATA STRUCTURES
# ═══════════════════════════════════════════════════════════════

@dataclass
class ModelTake:
    """A single model's initial response."""
    model_id: str
    model_name: str
    take: str
    confidence: float  # 0.0 to 1.0
    key_risks: List[str]
    timestamp: str
    latency_ms: int

@dataclass
class ModelResponse:
    """A model's response to other models' takes."""
    model_id: str
    responding_to: str  # model_id being responded to
    agreement_level: float  # -1.0 (strong disagree) to 1.0 (strong agree)
    response: str
    updated_confidence: float
    timestamp: str

@dataclass
class Synthesis:
    """Final synthesis after deliberation."""
    consensus: str
    disagreements: List[str]
    confidence_shifts: Dict[str, float]  # model_id -> shift
    open_questions: List[str]
    final_probability: Optional[float]
    timestamp: str

@dataclass
class DeliberationPhase(Enum):
    IDLE = "idle"
    INGESTING = "ingesting"
    INITIAL_TAKES = "initial_takes"
    CROSS_RESPONSE = "cross_response"
    SYNTHESIZING = "synthesizing"
    COMPLETE = "complete"

@dataclass
class DeliberationSession:
    """A complete deliberation cycle."""
    session_id: str
    topic: str
    context: str
    phase: str = "idle"
    started_at: str = ""
    completed_at: Optional[str] = None
    initial_takes: List[ModelTake] = field(default_factory=list)
    responses: List[ModelResponse] = field(default_factory=list)
    synthesis: Optional[Synthesis] = None
    events: List[Dict] = field(default_factory=list)

# ═══════════════════════════════════════════════════════════════
# MODEL CLIENTS
# ═══════════════════════════════════════════════════════════════

class ModelClient:
    """Unified client for all model providers."""
    
    def __init__(self, config: ModelConfig):
        self.config = config
        self._check_availability()
    
    def _check_availability(self):
        """Check if this model is available."""
        if self.config.provider == ModelProvider.OLLAMA:
            # Always try Ollama as fallback
            self.config.available = True
        elif self.config.api_key_env:
            key = os.environ.get(self.config.api_key_env, "")
            self.config.available = bool(key and key != "YOUR_KEY_HERE")
    
    async def generate(self, prompt: str, system: str = None) -> tuple[str, int]:
        """Generate response. Returns (text, latency_ms)."""
        start = datetime.now()
        
        try:
            if self.config.provider == ModelProvider.OLLAMA:
                return await self._ollama_generate(prompt, system)
            elif self.config.provider == ModelProvider.OPENAI:
                return await self._openai_generate(prompt, system)
            elif self.config.provider == ModelProvider.ANTHROPIC:
                return await self._anthropic_generate(prompt, system)
            elif self.config.provider == ModelProvider.DEEPSEEK:
                return await self._openai_compatible_generate(prompt, system)
            elif self.config.provider == ModelProvider.GROQ:
                return await self._openai_compatible_generate(prompt, system)
        except Exception as e:
            latency = int((datetime.now() - start).total_seconds() * 1000)
            return f"[ERROR: {str(e)}]", latency
    
    async def _ollama_generate(self, prompt: str, system: str = None) -> tuple[str, int]:
        start = datetime.now()
        async with httpx.AsyncClient(timeout=120.0) as client:
            payload = {
                "model": self.config.model_id,
                "prompt": prompt,
                "stream": False
            }
            if system:
                payload["system"] = system
            
            resp = await client.post(f"{self.config.base_url}/api/generate", json=payload)
            resp.raise_for_status()
            result = resp.json()
            text = result.get("response", "").strip()
            
            # Strip thinking blocks
            if "</think>" in text.lower():
                idx = text.lower().find("</think>") + len("</think>")
                text = text[idx:].strip()
            
            latency = int((datetime.now() - start).total_seconds() * 1000)
            return text, latency
    
    async def _openai_generate(self, prompt: str, system: str = None) -> tuple[str, int]:
        start = datetime.now()
        api_key = os.environ.get(self.config.api_key_env, "")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            
            resp = await client.post(
                f"{self.config.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": self.config.model_id,
                    "messages": messages,
                    "max_tokens": 1000
                }
            )
            resp.raise_for_status()
            result = resp.json()
            text = result["choices"][0]["message"]["content"]
            latency = int((datetime.now() - start).total_seconds() * 1000)
            return text, latency
    
    async def _anthropic_generate(self, prompt: str, system: str = None) -> tuple[str, int]:
        start = datetime.now()
        api_key = os.environ.get(self.config.api_key_env, "")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            payload = {
                "model": self.config.model_id,
                "max_tokens": 1000,
                "messages": [{"role": "user", "content": prompt}]
            }
            if system:
                payload["system"] = system
            
            resp = await client.post(
                f"{self.config.base_url}/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json=payload
            )
            resp.raise_for_status()
            result = resp.json()
            text = result["content"][0]["text"]
            latency = int((datetime.now() - start).total_seconds() * 1000)
            return text, latency
    
    async def _openai_compatible_generate(self, prompt: str, system: str = None) -> tuple[str, int]:
        """For DeepSeek, Groq, and other OpenAI-compatible APIs."""
        start = datetime.now()
        api_key = os.environ.get(self.config.api_key_env, "")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            
            resp = await client.post(
                f"{self.config.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": self.config.model_id,
                    "messages": messages,
                    "max_tokens": 1000
                }
            )
            resp.raise_for_status()
            result = resp.json()
            text = result["choices"][0]["message"]["content"]
            latency = int((datetime.now() - start).total_seconds() * 1000)
            return text, latency

# ═══════════════════════════════════════════════════════════════
# DELIBERATION ENGINE
# ═══════════════════════════════════════════════════════════════

class DeliberationEngine:
    """Orchestrates multi-model debate and synthesis."""
    
    def __init__(self, event_callback: Callable = None):
        self.event_callback = event_callback
        self.clients: Dict[str, ModelClient] = {}
        self.current_session: Optional[DeliberationSession] = None
        self._init_clients()
    
    def _init_clients(self):
        """Initialize available model clients."""
        for model_id, config in MODELS.items():
            client = ModelClient(config)
            if client.config.available:
                self.clients[model_id] = client
        
        # Always ensure we have at least one model (Ollama fallback)
        if not self.clients:
            self.clients["local"] = ModelClient(MODELS["local"])
    
    def get_available_models(self) -> List[Dict]:
        """Return list of available models with their status."""
        return [
            {
                "id": mid,
                "name": self.clients[mid].config.name,
                "provider": self.clients[mid].config.provider.value,
                "available": True
            }
            for mid in self.clients
        ]
    
    async def _emit(self, event_type: str, data: Dict):
        """Emit event for live streaming."""
        event = {
            "type": event_type,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            **data
        }
        if self.current_session:
            self.current_session.events.append(event)
        if self.event_callback:
            await self.event_callback(event)
    
    async def deliberate(self, topic: str, context: str) -> DeliberationSession:
        """Run full deliberation cycle."""
        session_id = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        self.current_session = DeliberationSession(
            session_id=session_id,
            topic=topic,
            context=context,
            started_at=datetime.utcnow().isoformat() + "Z"
        )
        
        # Phase 1: Initial Takes
        await self._phase_initial_takes(context)
        
        # Phase 2: Cross-Response
        await self._phase_cross_response()
        
        # Phase 3: Synthesis
        await self._phase_synthesis()
        
        self.current_session.completed_at = datetime.utcnow().isoformat() + "Z"
        self.current_session.phase = "complete"
        await self._emit("deliberation_complete", {"session_id": session_id})
        
        return self.current_session
    
    async def _phase_initial_takes(self, context: str):
        """Each model produces initial take."""
        self.current_session.phase = "initial_takes"
        await self._emit("phase_change", {"phase": "initial_takes", "message": "Models forming initial positions..."})
        
        take_prompt = f"""
Analyze this information and provide your take.

CONTEXT:
{context[:4000]}

Respond in this exact format:
TAKE: [Your 2-3 sentence analysis]
CONFIDENCE: [0.0 to 1.0]
RISKS: [Risk 1] | [Risk 2] | [Risk 3]
"""
        
        tasks = []
        for model_id, client in self.clients.items():
            tasks.append(self._get_initial_take(model_id, client, take_prompt))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, ModelTake):
                self.current_session.initial_takes.append(result)
    
    async def _get_initial_take(self, model_id: str, client: ModelClient, prompt: str) -> ModelTake:
        """Get single model's initial take."""
        await self._emit("model_thinking", {"model": model_id, "model_name": client.config.name})
        
        text, latency = await client.generate(prompt, client.config.persona)
        
        # Parse response
        take = ""
        confidence = 0.5
        risks = []
        
        for line in text.split("\n"):
            if line.startswith("TAKE:"):
                take = line.replace("TAKE:", "").strip()
            elif line.startswith("CONFIDENCE:"):
                try:
                    confidence = float(line.replace("CONFIDENCE:", "").strip())
                except:
                    pass
            elif line.startswith("RISKS:"):
                risks = [r.strip() for r in line.replace("RISKS:", "").split("|")]
        
        if not take:
            take = text[:500]  # Fallback to raw text
        
        result = ModelTake(
            model_id=model_id,
            model_name=client.config.name,
            take=take,
            confidence=confidence,
            key_risks=risks[:3],
            timestamp=datetime.utcnow().isoformat() + "Z",
            latency_ms=latency
        )
        
        await self._emit("model_take", {
            "model": model_id,
            "model_name": client.config.name,
            "take": take[:200] + "...",
            "confidence": confidence,
            "latency_ms": latency
        })
        
        return result
    
    async def _phase_cross_response(self):
        """Models respond to each other's takes."""
        self.current_session.phase = "cross_response"
        await self._emit("phase_change", {"phase": "cross_response", "message": "Models debating each other..."})
        
        if len(self.current_session.initial_takes) < 2:
            return  # Need at least 2 models to debate
        
        # Each model responds to one other model's take
        takes = self.current_session.initial_takes
        for i, responder_take in enumerate(takes):
            target_take = takes[(i + 1) % len(takes)]  # Respond to next model
            
            responder_id = responder_take.model_id
            if responder_id not in self.clients:
                continue
            
            client = self.clients[responder_id]
            
            response_prompt = f"""
Another analyst ({target_take.model_name}) said:
"{target_take.take}"
Their confidence: {target_take.confidence}

Your original take was:
"{responder_take.take}"

Respond to their analysis. Do you agree or disagree? Why?

Format:
AGREEMENT: [-1.0 to 1.0] (negative = disagree, positive = agree)
RESPONSE: [Your 2-3 sentence response]
UPDATED_CONFIDENCE: [Your new confidence, 0.0 to 1.0]
"""
            
            await self._emit("model_responding", {
                "model": responder_id,
                "responding_to": target_take.model_id
            })
            
            text, latency = await client.generate(response_prompt, client.config.persona)
            
            # Parse
            agreement = 0.0
            response_text = ""
            updated_conf = responder_take.confidence
            
            for line in text.split("\n"):
                if line.startswith("AGREEMENT:"):
                    try:
                        agreement = float(line.replace("AGREEMENT:", "").strip())
                    except:
                        pass
                elif line.startswith("RESPONSE:"):
                    response_text = line.replace("RESPONSE:", "").strip()
                elif line.startswith("UPDATED_CONFIDENCE:"):
                    try:
                        updated_conf = float(line.replace("UPDATED_CONFIDENCE:", "").strip())
                    except:
                        pass
            
            if not response_text:
                response_text = text[:300]
            
            model_response = ModelResponse(
                model_id=responder_id,
                responding_to=target_take.model_id,
                agreement_level=agreement,
                response=response_text,
                updated_confidence=updated_conf,
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            self.current_session.responses.append(model_response)
            
            await self._emit("model_response", {
                "model": responder_id,
                "responding_to": target_take.model_id,
                "agreement": agreement,
                "response": response_text[:150] + "..."
            })
    
    async def _phase_synthesis(self):
        """Produce final synthesis."""
        self.current_session.phase = "synthesizing"
        await self._emit("phase_change", {"phase": "synthesizing", "message": "Synthesizing final assessment..."})
        
        # Use first available model for synthesis
        synth_client = list(self.clients.values())[0]
        
        takes_summary = "\n".join([
            f"- {t.model_name} (confidence {t.confidence}): {t.take}"
            for t in self.current_session.initial_takes
        ])
        
        responses_summary = "\n".join([
            f"- {r.model_id} → {r.responding_to}: agreement={r.agreement_level}, {r.response[:100]}"
            for r in self.current_session.responses
        ])
        
        synth_prompt = f"""
Multiple analysts have debated this topic.

INITIAL TAKES:
{takes_summary}

CROSS-RESPONSES:
{responses_summary}

Synthesize this into a final assessment.

Format:
CONSENSUS: [What the models agree on, 2-3 sentences]
DISAGREEMENTS: [Point 1] | [Point 2] | [Point 3]
OPEN_QUESTIONS: [Question 1] | [Question 2]
FINAL_PROBABILITY: [If applicable, 0.0 to 1.0, otherwise N/A]
"""
        
        text, latency = await synth_client.generate(synth_prompt, "You synthesize multiple perspectives into clear conclusions.")
        
        # Parse
        consensus = ""
        disagreements = []
        questions = []
        final_prob = None
        
        for line in text.split("\n"):
            if line.startswith("CONSENSUS:"):
                consensus = line.replace("CONSENSUS:", "").strip()
            elif line.startswith("DISAGREEMENTS:"):
                disagreements = [d.strip() for d in line.replace("DISAGREEMENTS:", "").split("|")]
            elif line.startswith("OPEN_QUESTIONS:"):
                questions = [q.strip() for q in line.replace("OPEN_QUESTIONS:", "").split("|")]
            elif line.startswith("FINAL_PROBABILITY:"):
                prob_str = line.replace("FINAL_PROBABILITY:", "").strip()
                if prob_str != "N/A":
                    try:
                        final_prob = float(prob_str)
                    except:
                        pass
        
        if not consensus:
            consensus = text[:500]
        
        # Calculate confidence shifts
        shifts = {}
        for take in self.current_session.initial_takes:
            original = take.confidence
            # Find updated confidence from responses
            for resp in self.current_session.responses:
                if resp.model_id == take.model_id:
                    shifts[take.model_id] = round(resp.updated_confidence - original, 3)
                    break
            if take.model_id not in shifts:
                shifts[take.model_id] = 0.0
        
        self.current_session.synthesis = Synthesis(
            consensus=consensus,
            disagreements=disagreements[:5],
            confidence_shifts=shifts,
            open_questions=questions[:3],
            final_probability=final_prob,
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
        
        await self._emit("synthesis_complete", {
            "consensus": consensus[:200] + "...",
            "disagreement_count": len(disagreements),
            "final_probability": final_prob
        })


# ═══════════════════════════════════════════════════════════════
# STANDALONE TEST
# ═══════════════════════════════════════════════════════════════

async def test_deliberation():
    async def log_event(event):
        print(f"[{event['type']}] {event.get('message', event.get('model', ''))}")
    
    engine = DeliberationEngine(event_callback=log_event)
    print(f"Available models: {[m['name'] for m in engine.get_available_models()]}")
    
    context = """
    Breaking: DeepSeek has released R1, an open-weights model matching GPT-4 performance.
    This challenges the assumption that frontier AI requires massive closed infrastructure.
    Industry reactions are mixed, with some calling it a paradigm shift.
    """
    
    session = await engine.deliberate("DeepSeek R1 Impact", context)
    print(f"\n=== SYNTHESIS ===")
    print(f"Consensus: {session.synthesis.consensus}")
    print(f"Disagreements: {session.synthesis.disagreements}")


if __name__ == "__main__":
    asyncio.run(test_deliberation())
