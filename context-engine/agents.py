"""
⟡ Mirror Intelligence — Agent Runtime Layer v1.0

Role-based agents abstracted from provider implementation.
Provider names are INTERNAL ONLY — never exposed to frontend.

Agents:
- Sentinel: Breaking news, first responder
- Curator: Source quality, relevance ranking  
- Bull: Optimistic case, upside potential
- Bear: Pessimistic case, risk identification
- Skeptic: Challenge consensus, find flaws
- Historian: Pattern matching, precedent
- Forecaster: Probability estimation, resolution criteria
- Arbiter: Final synthesis, consensus building
- Console: Q&A handler (future)
"""

from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional, List
import os


class AgentRole(Enum):
    """Public-facing agent roles."""
    SENTINEL = "sentinel"
    CURATOR = "curator"
    BULL = "bull"
    BEAR = "bear"
    SKEPTIC = "skeptic"
    HISTORIAN = "historian"
    FORECASTER = "forecaster"
    ARBITER = "arbiter"
    CONSOLE = "console"


class Provider(Enum):
    """Internal provider identifiers — NEVER exposed to UI."""
    OLLAMA = "ollama"
    DEEPSEEK = "deepseek"
    OPENAI = "openai"
    GROQ = "groq"
    ANTHROPIC = "anthropic"


@dataclass
class AgentConfig:
    """Configuration for a single agent."""
    role: AgentRole
    display_name: str
    purpose: str
    persona: str  # System prompt personality
    provider: Provider
    model_id: str
    api_key_env: Optional[str] = None
    base_url: Optional[str] = None
    
    @property
    def available(self) -> bool:
        """Check if this agent's provider is available."""
        if self.provider == Provider.OLLAMA:
            return True  # Always try local
        if self.api_key_env:
            key = os.environ.get(self.api_key_env, "")
            return bool(key and key != "YOUR_KEY_HERE")
        return False


# ═══════════════════════════════════════════════════════════════
# AGENT REGISTRY
# ═══════════════════════════════════════════════════════════════

AGENTS: Dict[AgentRole, AgentConfig] = {
    
    AgentRole.SENTINEL: AgentConfig(
        role=AgentRole.SENTINEL,
        display_name="The Sentinel",
        purpose="Breaking news detection, first responder",
        persona="""You are the first responder. You scan for breaking developments.
        You ask: "What just changed? What is new here?"
        Be direct. Flag urgency. No fluff.""",
        provider=Provider.DEEPSEEK,
        model_id="deepseek-chat",
        api_key_env="DEEPSEEK_API_KEY",
        base_url="https://api.deepseek.com/v1"
    ),
    
    AgentRole.CURATOR: AgentConfig(
        role=AgentRole.CURATOR,
        display_name="The Curator",
        purpose="Source quality assessment, relevance ranking",
        persona="""You assess source quality and relevance.
        You ask: "Is this source credible? Is this signal or noise?"
        Rank by importance. Filter aggressively.""",
        provider=Provider.OLLAMA,
        model_id="mirrorbrain-ami:latest",
        base_url="http://localhost:11434"
    ),
    
    AgentRole.BULL: AgentConfig(
        role=AgentRole.BULL,
        display_name="The Bull",
        purpose="Optimistic case, upside potential",
        persona="""You find the upside. You see opportunity in chaos.
        You ask: "What if this goes right? What's the best case?"
        Be specific about mechanisms, not just hopeful.""",
        provider=Provider.DEEPSEEK,
        model_id="deepseek-chat",
        api_key_env="DEEPSEEK_API_KEY",
        base_url="https://api.deepseek.com/v1"
    ),
    
    AgentRole.BEAR: AgentConfig(
        role=AgentRole.BEAR,
        display_name="The Bear",
        purpose="Pessimistic case, risk identification",
        persona="""You find the downside. You see risk where others see hope.
        You ask: "What could go wrong? What's being ignored?"
        Be specific about failure modes.""",
        provider=Provider.OLLAMA,
        model_id="mirrorbrain-ami:latest",
        base_url="http://localhost:11434"
    ),
    
    AgentRole.SKEPTIC: AgentConfig(
        role=AgentRole.SKEPTIC,
        display_name="The Skeptic",
        purpose="Challenge consensus, find flaws",
        persona="""You MUST disagree. If everyone agrees, you find the flaw.
        You ask: "Why could this be wrong? What's the counter-argument?"
        Silence is not allowed. Forced dissent is your mandate.""",
        provider=Provider.OLLAMA,
        model_id="mirrorbrain-ami:latest", 
        base_url="http://localhost:11434"
    ),
    
    AgentRole.HISTORIAN: AgentConfig(
        role=AgentRole.HISTORIAN,
        display_name="The Historian",
        purpose="Pattern matching, precedent identification",
        persona="""You find historical parallels. You remember what happened before.
        You ask: "When did we see this pattern before? What happened next?"
        Cite specific precedents.""",
        provider=Provider.DEEPSEEK,
        model_id="deepseek-chat",
        api_key_env="DEEPSEEK_API_KEY",
        base_url="https://api.deepseek.com/v1"
    ),
    
    AgentRole.FORECASTER: AgentConfig(
        role=AgentRole.FORECASTER,
        display_name="The Forecaster",
        purpose="Probability estimation, resolution criteria",
        persona="""You convert uncertainty into probability.
        Every prediction must be: Binary, Time-bound, Falsifiable.
        Format: FORECAST: [question?] | PROB: [0.00-1.00] | DATE: [YYYY-MM-DD] | CRITERIA: [exact condition]""",
        provider=Provider.OLLAMA,
        model_id="mirrorbrain-ami:latest",
        base_url="http://localhost:11434"
    ),
    
    AgentRole.ARBITER: AgentConfig(
        role=AgentRole.ARBITER,
        display_name="The Arbiter",
        purpose="Final synthesis, consensus building",
        persona="""You synthesize multiple perspectives into clear conclusions.
        You ask: "What do they agree on? Where do they diverge? What remains unresolved?"
        You are the final word. Be definitive but honest about uncertainty.""",
        provider=Provider.DEEPSEEK,
        model_id="deepseek-chat",
        api_key_env="DEEPSEEK_API_KEY",
        base_url="https://api.deepseek.com/v1"
    ),
    
    AgentRole.CONSOLE: AgentConfig(
        role=AgentRole.CONSOLE,
        display_name="The Console",
        purpose="Q&A handler, system state queries",
        persona="""You answer questions about the current system state.
        You cite ledger entries. You reference the last deliberation.
        You NEVER hallucinate outside the system's knowledge.""",
        provider=Provider.DEEPSEEK,
        model_id="deepseek-chat",
        api_key_env="DEEPSEEK_API_KEY",
        base_url="https://api.deepseek.com/v1"
    ),
}


# ═══════════════════════════════════════════════════════════════
# AGENT GROUPS (for deliberation phases)
# ═══════════════════════════════════════════════════════════════

INGESTION_AGENTS = [AgentRole.SENTINEL, AgentRole.CURATOR]
ANALYSIS_AGENTS = [AgentRole.BULL, AgentRole.BEAR, AgentRole.HISTORIAN]
DISSENT_AGENTS = [AgentRole.SKEPTIC]
SYNTHESIS_AGENTS = [AgentRole.FORECASTER, AgentRole.ARBITER]


def get_available_agents() -> List[AgentConfig]:
    """Return list of agents with available providers."""
    return [config for config in AGENTS.values() if config.available]


def get_agent(role: AgentRole) -> Optional[AgentConfig]:
    """Get agent config by role."""
    return AGENTS.get(role)


def get_agents_for_phase(phase: str) -> List[AgentConfig]:
    """Get agents for a specific deliberation phase."""
    if phase == "ingestion":
        roles = INGESTION_AGENTS
    elif phase == "analysis":
        roles = ANALYSIS_AGENTS
    elif phase == "dissent":
        roles = DISSENT_AGENTS
    elif phase == "synthesis":
        roles = SYNTHESIS_AGENTS
    else:
        return []
    
    return [AGENTS[role] for role in roles if AGENTS[role].available]


# ═══════════════════════════════════════════════════════════════
# PUBLIC API (for frontend)
# ═══════════════════════════════════════════════════════════════

def get_agent_status() -> List[Dict]:
    """Return agent status for frontend display.
    NOTE: Provider names are NOT included — they are internal.
    """
    return [
        {
            "id": config.role.value,
            "name": config.display_name,
            "purpose": config.purpose,
            "available": config.available,
            "phase": _get_agent_phase(config.role)
        }
        for config in AGENTS.values()
        if config.role != AgentRole.CONSOLE  # Hide console until implemented
    ]


def _get_agent_phase(role: AgentRole) -> str:
    """Determine which phase an agent belongs to."""
    if role in INGESTION_AGENTS:
        return "ingestion"
    elif role in ANALYSIS_AGENTS:
        return "analysis"
    elif role in DISSENT_AGENTS:
        return "dissent"
    elif role in SYNTHESIS_AGENTS:
        return "synthesis"
    return "console"


if __name__ == "__main__":
    print("⟡ Agent Runtime Layer")
    print(f"Total agents: {len(AGENTS)}")
    print(f"Available agents: {len(get_available_agents())}")
    print()
    for agent in get_available_agents():
        print(f"  ✓ {agent.display_name} ({agent.role.value})")
