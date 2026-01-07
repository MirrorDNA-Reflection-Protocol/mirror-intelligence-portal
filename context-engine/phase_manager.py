"""
⟡ Mirror Intelligence — Phase Manager (Correctness Layer)

This module is the SINGLE SOURCE OF TRUTH for engine phase.
No state may change unless the required events exist.

Valid phases (in order):
- idle: No activity
- ingesting: Fetching sources
- deliberating: ≥2 agent executions required
- synthesizing: Arbiter output required  
- published: Ledger commit required

Phase transitions are GATED. If requirements not met, state does not advance.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Set
from enum import Enum
import hashlib
import json


class Phase(Enum):
    IDLE = "idle"
    INGESTING = "ingesting"
    DELIBERATING = "deliberating"
    SYNTHESIZING = "synthesizing"
    PUBLISHED = "published"


@dataclass
class AgentExecution:
    """Record of a single agent execution."""
    agent_id: str
    role: str
    provider: str  # Internal only
    timestamp: str
    output_hash: str
    
    @classmethod
    def create(cls, agent_id: str, role: str, provider: str, output: str) -> "AgentExecution":
        return cls(
            agent_id=agent_id,
            role=role,
            provider=provider,
            timestamp=datetime.utcnow().isoformat() + "Z",
            output_hash=hashlib.sha256(output.encode()).hexdigest()[:16]
        )


@dataclass
class PhaseRequirements:
    """Hard requirements for each phase."""
    agents_required: int = 0
    agents_completed: int = 0
    arbiter_required: bool = False
    arbiter_ready: bool = False
    ledger_commit_required: bool = False
    ledger_committed: bool = False
    
    def met(self) -> bool:
        if self.agents_required > 0 and self.agents_completed < self.agents_required:
            return False
        if self.arbiter_required and not self.arbiter_ready:
            return False
        if self.ledger_commit_required and not self.ledger_committed:
            return False
        return True
    
    def missing(self) -> List[str]:
        issues = []
        if self.agents_required > 0 and self.agents_completed < self.agents_required:
            issues.append(f"agents: {self.agents_completed}/{self.agents_required}")
        if self.arbiter_required and not self.arbiter_ready:
            issues.append("arbiter_output_missing")
        if self.ledger_commit_required and not self.ledger_committed:
            issues.append("ledger_commit_pending")
        return issues


@dataclass
class EngineState:
    """The authoritative engine state object."""
    phase: Phase = Phase.IDLE
    since: str = ""
    session_id: Optional[str] = None
    requirements: PhaseRequirements = field(default_factory=PhaseRequirements)
    last_event: Optional[str] = None
    agent_executions: List[AgentExecution] = field(default_factory=list)
    blocked_reason: Optional[str] = None
    
    def __post_init__(self):
        if not self.since:
            self.since = datetime.utcnow().isoformat() + "Z"
    
    def to_dict(self) -> Dict:
        """Render state for frontend — NO LIES."""
        return {
            "phase": self.phase.value,
            "since": self.since,
            "session_id": self.session_id,
            "requirements": {
                "agents_required": self.requirements.agents_required,
                "agents_completed": self.requirements.agents_completed,
                "arbiter_required": self.requirements.arbiter_required,
                "arbiter_ready": self.requirements.arbiter_ready,
                "ledger_committed": self.requirements.ledger_committed,
                "met": self.requirements.met(),
                "missing": self.requirements.missing()
            },
            "last_event": self.last_event,
            "blocked_reason": self.blocked_reason
        }


class PhaseManager:
    """
    Single source of truth for engine phase.
    
    Rules:
    1. No state changes without required events
    2. If requirements not met, state remains unchanged
    3. Frontend MUST render this verbatim
    """
    
    # Gate requirements for each phase transition
    GATES = {
        Phase.DELIBERATING: {"agents_required": 2},
        Phase.SYNTHESIZING: {"arbiter_required": True},
        Phase.PUBLISHED: {"ledger_commit_required": True}
    }
    
    def __init__(self):
        self.state = EngineState()
        self._event_log: List[Dict] = []
    
    def get_state(self) -> Dict:
        """Get current state for API response."""
        return self.state.to_dict()
    
    def log_event(self, event_type: str, data: Dict) -> None:
        """Log an event that may trigger state change."""
        event = {
            "type": event_type,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            **data
        }
        self._event_log.append(event)
        self.state.last_event = event_type
    
    def record_agent_execution(self, agent_id: str, role: str, provider: str, output: str) -> None:
        """Record that an agent has completed execution."""
        execution = AgentExecution.create(agent_id, role, provider, output)
        self.state.agent_executions.append(execution)
        self.state.requirements.agents_completed = len(self.state.agent_executions)
        self.log_event("agent_completed", {"agent_id": agent_id, "role": role})
    
    def record_arbiter_output(self, output: str) -> None:
        """Record arbiter completion."""
        self.state.requirements.arbiter_ready = True
        self.log_event("arbiter_completed", {"output_hash": hashlib.sha256(output.encode()).hexdigest()[:16]})
    
    def record_ledger_commit(self, entry_id: str) -> None:
        """Record ledger commit."""
        self.state.requirements.ledger_committed = True
        self.log_event("ledger_committed", {"entry_id": entry_id})
    
    def start_session(self, session_id: str) -> None:
        """Start a new deliberation session."""
        self.state = EngineState(
            phase=Phase.IDLE,
            session_id=session_id,
            requirements=PhaseRequirements()
        )
        self.log_event("session_started", {"session_id": session_id})
    
    def try_advance_to(self, target: Phase) -> bool:
        """
        Attempt to advance to target phase.
        Returns True if allowed, False if blocked.
        
        HARD GATE: If requirements not met, state does not change.
        """
        # Always allow reset to idle
        if target == Phase.IDLE:
            self.state.phase = Phase.IDLE
            self.state.since = datetime.utcnow().isoformat() + "Z"
            self.state.blocked_reason = None
            return True
        
        # Always allow ingesting from idle
        if target == Phase.INGESTING and self.state.phase == Phase.IDLE:
            self.state.phase = Phase.INGESTING
            self.state.since = datetime.utcnow().isoformat() + "Z"
            self.state.blocked_reason = None
            return True
        
        # Check gates for other transitions
        gate = self.GATES.get(target, {})
        
        # Update requirements based on gate
        if "agents_required" in gate:
            self.state.requirements.agents_required = gate["agents_required"]
        if "arbiter_required" in gate:
            self.state.requirements.arbiter_required = gate["arbiter_required"]
        if "ledger_commit_required" in gate:
            self.state.requirements.ledger_commit_required = gate["ledger_commit_required"]
        
        # Check if requirements met
        if not self.state.requirements.met():
            missing = self.state.requirements.missing()
            self.state.blocked_reason = f"waiting: {', '.join(missing)}"
            self.log_event("phase_blocked", {"target": target.value, "missing": missing})
            return False
        
        # Requirements met — advance
        self.state.phase = target
        self.state.since = datetime.utcnow().isoformat() + "Z"
        self.state.blocked_reason = None
        self.log_event("phase_changed", {"new_phase": target.value})
        return True
    
    def reset(self) -> None:
        """Reset to idle state."""
        self.state = EngineState()
        self._event_log = []


# Singleton instance — THE authority
_manager: Optional[PhaseManager] = None

def get_phase_manager() -> PhaseManager:
    """Get the singleton PhaseManager."""
    global _manager
    if _manager is None:
        _manager = PhaseManager()
    return _manager


if __name__ == "__main__":
    # Test the phase manager
    pm = get_phase_manager()
    
    print("=== Test: Cannot advance to deliberating with 0 agents ===")
    pm.start_session("test_001")
    result = pm.try_advance_to(Phase.DELIBERATING)
    print(f"Advance allowed: {result}")
    print(f"State: {pm.get_state()}")
    
    print("\n=== Test: Cannot advance with 1 agent ===")
    pm.record_agent_execution("bear", "Bear", "ollama", "test output")
    result = pm.try_advance_to(Phase.DELIBERATING)
    print(f"Advance allowed: {result}")
    print(f"State: {pm.get_state()}")
    
    print("\n=== Test: CAN advance with 2 agents ===")
    pm.record_agent_execution("skeptic", "Skeptic", "ollama", "another output")
    result = pm.try_advance_to(Phase.DELIBERATING)
    print(f"Advance allowed: {result}")
    print(f"State: {pm.get_state()}")
    
    print("\n=== Test: Cannot synthesize without arbiter ===")
    result = pm.try_advance_to(Phase.SYNTHESIZING)
    print(f"Advance allowed: {result}")
    print(f"State: {pm.get_state()}")
    
    print("\n=== Test: CAN synthesize with arbiter ===")
    pm.record_arbiter_output("synthesis result")
    result = pm.try_advance_to(Phase.SYNTHESIZING)
    print(f"Advance allowed: {result}")
    print(f"State: {pm.get_state()}")
