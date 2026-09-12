from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class SimulationMode(str, Enum):
    HEALTHY = "HEALTHY"
    CRITICAL_EVENT = "CRITICAL_EVENT"


class SystemPhase(str, Enum):
    IDLE = "IDLE"
    MONITORING = "MONITORING"
    ANALYZING = "ANALYZING"
    RISK_ASSESSMENT = "RISK_ASSESSMENT"
    ESCALATING = "ESCALATING"
    ALERT_READY = "ALERT_READY"
    DISPATCHED = "DISPATCHED"


class FactoryStatus(str, Enum):
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    BREACH = "BREACH"
    CRITICAL = "CRITICAL"


class ViolationSeverity(str, Enum):
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    SEVERE = "SEVERE"


class RiskCategory(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    SEVERE = "SEVERE"


class AgentStatus(str, Enum):
    IDLE = "IDLE"
    RUNNING = "RUNNING"
    COMPLETE = "COMPLETE"
    ERROR = "ERROR"


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

class FactoryLocation(BaseModel):
    city: str
    lat: float
    lon: float
    proximity_to_population: str  # e.g. "High", "Medium", "Low"


class Factory(BaseModel):
    id: str
    name: str
    location: FactoryLocation
    industry_type: str
    current_status: FactoryStatus = FactoryStatus.NORMAL
    last_updated: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Telemetry
# ---------------------------------------------------------------------------

class TelemetryReading(BaseModel):
    factory_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    aqi: float
    pm25: float       # µg/m³
    so2: float        # µg/m³
    ph: float         # effluent pH
    cod: float        # mg/L


class TelemetrySnapshot(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    readings: list[TelemetryReading]


# ---------------------------------------------------------------------------
# Violations
# ---------------------------------------------------------------------------

class Violation(BaseModel):
    factory_id: str
    parameter: str
    observed_value: float
    threshold: float
    unit: str
    severity: ViolationSeverity
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    message: str


class ViolationBundle(BaseModel):
    violations: list[Violation]
    factories_affected: list[str]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Risk Assessment
# ---------------------------------------------------------------------------

class RiskAssessment(BaseModel):
    score: float = Field(ge=0, le=100)
    category: RiskCategory
    primary_drivers: list[str]
    recommended_action: str
    computed_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Regulatory Notice
# ---------------------------------------------------------------------------

class RegulatoryNotice(BaseModel):
    notice_id: str
    title: str
    factory: str
    severity: str
    summary: str
    violations: list[dict[str, Any]]
    recommended_actions: list[str]
    evidence: list[str]
    generated_at: str
    disclaimer: str


# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

class DispatchStep(BaseModel):
    step: str
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class DispatchResult(BaseModel):
    notice_id: str
    steps: list[DispatchStep]
    completed: bool
    message: str
    dispatched_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Agent Events
# ---------------------------------------------------------------------------

class AgentEvent(BaseModel):
    agent: str
    level: str          # INFO, WARNING, ERROR, SUCCESS
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data: Optional[dict[str, Any]] = None


class AgentStatuses(BaseModel):
    monitoring: AgentStatus = AgentStatus.IDLE
    compliance: AgentStatus = AgentStatus.IDLE
    health_risk: AgentStatus = AgentStatus.IDLE
    regulatory: AgentStatus = AgentStatus.IDLE


# ---------------------------------------------------------------------------
# System State
# ---------------------------------------------------------------------------

class SystemState(BaseModel):
    phase: SystemPhase = SystemPhase.IDLE
    simulation_mode: SimulationMode = SimulationMode.HEALTHY
    agent_statuses: AgentStatuses = Field(default_factory=AgentStatuses)
    active_violations: int = 0
    last_cycle_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# WebSocket Payload
# ---------------------------------------------------------------------------

class WsPayload(BaseModel):
    type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    factories: list[Factory] = Field(default_factory=list)
    violations: list[Violation] = Field(default_factory=list)
    risk: Optional[RiskAssessment] = None
    agents: AgentStatuses = Field(default_factory=AgentStatuses)
    system_state: SystemPhase = SystemPhase.MONITORING
    simulation_mode: SimulationMode = SimulationMode.HEALTHY
    agent_log: Optional[AgentEvent] = None
    notice: Optional[RegulatoryNotice] = None
    dispatch: Optional[DispatchResult] = None
