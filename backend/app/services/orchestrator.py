from __future__ import annotations

import asyncio
import json
from datetime import datetime
from typing import Callable

from app.agents.compliance_agent import ComplianceAgent
from app.agents.health_agent import HealthRiskAgent
from app.agents.monitoring_agent import MonitoringAgent, reset_simulator_state
from app.agents.regulatory_agent import RegulatoryAgent
from app.data.factories import FACTORIES
from app.models.schemas import (
    AgentEvent,
    AgentStatuses,
    AgentStatus,
    DispatchResult,
    Factory,
    RegulatoryNotice,
    RiskAssessment,
    SimulationMode,
    SystemPhase,
    TelemetryReading,
    TelemetrySnapshot,
    Violation,
    ViolationBundle,
    WsPayload,
)
from app.services.granite_watsonx import get_llm_provider
from app.services.notification_service import NotificationService
from app.utils.logger import get_logger

logger = get_logger("Orchestrator")

CYCLE_INTERVAL = 3.0  # seconds between telemetry cycles

# Agent log color hints (consumed by frontend)
AGENT_COLORS = {
    "SYSTEM": "cyan",
    "MonitoringAgent": "emerald",
    "ComplianceAgent": "amber",
    "HealthRiskAgent": "orange",
    "RegulatoryAgent": "red",
    "WatsonxGraniteProvider": "purple",
    "NotificationService": "blue",
    "Orchestrator": "slate",
}


class Orchestrator:
    """Central loop: drives the agent pipeline and fans out WebSocket events."""

    def __init__(self) -> None:
        self._ws_clients: set[Callable] = set()
        self._simulation_mode: SimulationMode = SimulationMode.HEALTHY
        self._phase: SystemPhase = SystemPhase.IDLE
        self._factories: list[Factory] = [f.model_copy() for f in FACTORIES]
        self._violations: list[Violation] = []
        self._risk: RiskAssessment | None = None
        self._notice: RegulatoryNotice | None = None
        self._dispatch: DispatchResult | None = None
        self._agent_statuses = AgentStatuses()
        self._telemetry_history: list[TelemetryReading] = []  # rolling buffer
        self._log_buffer: list[dict] = []  # recent agent log entries
        self._running = False

        self._monitor = MonitoringAgent()
        self._compliance = ComplianceAgent()
        self._health = HealthRiskAgent()
        self._regulatory = RegulatoryAgent()
        self._notification = NotificationService()
        self._llm = get_llm_provider()

    # ------------------------------------------------------------------
    # WebSocket subscription management
    # ------------------------------------------------------------------

    def subscribe(self, send_fn: Callable) -> None:
        self._ws_clients.add(send_fn)
        logger.info("WS client connected — %d active", len(self._ws_clients))

    def unsubscribe(self, send_fn: Callable) -> None:
        self._ws_clients.discard(send_fn)
        logger.info("WS client disconnected — %d active", len(self._ws_clients))

    async def _broadcast(self, payload: dict) -> None:
        dead = set()
        for fn in list(self._ws_clients):
            try:
                await fn(json.dumps(payload, default=str))
            except Exception:
                dead.add(fn)
        for fn in dead:
            self._ws_clients.discard(fn)

    async def _emit_log(self, agent: str, level: str, message: str, data: dict | None = None) -> None:
        entry = {
            "agent": agent,
            "level": level,
            "message": message,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "color": AGENT_COLORS.get(agent, "slate"),
            "data": data,
        }
        self._log_buffer.append(entry)
        if len(self._log_buffer) > 500:
            self._log_buffer.pop(0)
        await self._broadcast({"type": "agent_log", "log": entry, "timestamp": entry["timestamp"]})

    # ------------------------------------------------------------------
    # State helpers
    # ------------------------------------------------------------------

    async def _set_phase(self, phase: SystemPhase) -> None:
        self._phase = phase
        await self._broadcast({
            "type": "system_state",
            "system_state": phase.value,
            "simulation_mode": self._simulation_mode.value,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })

    # ------------------------------------------------------------------
    # Simulation controls
    # ------------------------------------------------------------------

    async def trigger_critical_event(self) -> None:
        self._simulation_mode = SimulationMode.CRITICAL_EVENT
        self._notice = None
        self._dispatch = None
        await self._emit_log("SYSTEM", "WARNING", "🚨 Toxic spill simulation triggered — entering CRITICAL_EVENT mode")
        await self._broadcast({
            "type": "simulation_started",
            "simulation_mode": SimulationMode.CRITICAL_EVENT.value,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })

    async def reset_simulation(self) -> None:
        self._simulation_mode = SimulationMode.HEALTHY
        self._violations = []
        self._risk = None
        self._notice = None
        self._dispatch = None
        reset_simulator_state()
        for factory in self._factories:
            factory.current_status = factory.current_status.__class__.NORMAL  # type: ignore
        self._factories = [f.model_copy() for f in FACTORIES]
        await self._emit_log("SYSTEM", "INFO", "✅ Simulation reset — returning to healthy baseline")
        await self._set_phase(SystemPhase.MONITORING)
        await self._broadcast({
            "type": "simulation_reset",
            "simulation_mode": SimulationMode.HEALTHY.value,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })

    # ------------------------------------------------------------------
    # Notice / dispatch
    # ------------------------------------------------------------------

    async def generate_notice(self) -> RegulatoryNotice | None:
        if not self._violations:
            return None
        bundle = ViolationBundle(
            violations=self._violations[:],
            factories_affected=list({v.factory_id for v in self._violations}),
        )
        await self._emit_log("RegulatoryAgent", "INFO", "Generating regulatory notice via Granite provider…")
        try:
            self._notice = await self._regulatory.run(bundle, self._llm)
            await self._broadcast({
                "type": "regulatory_notice_ready",
                "notice": self._notice.model_dump(),
                "timestamp": datetime.utcnow().isoformat() + "Z",
            })
            await self._emit_log("RegulatoryAgent", "SUCCESS", f"Notice ready — {self._notice.notice_id}")
        except Exception as exc:
            await self._emit_log("RegulatoryAgent", "ERROR", f"Notice generation failed: {exc}")
            logger.exception("Notice generation error")
        return self._notice

    async def dispatch_notice(self) -> DispatchResult | None:
        if not self._notice:
            return None
        await self._emit_log("NotificationService", "INFO", "Dispatching regulatory alert (simulated)…")
        try:
            self._dispatch = await self._notification.dispatch(self._notice)
            for step in self._dispatch.steps:
                await self._emit_log("NotificationService", "INFO", f"[DISPATCH] {step.step} — {step.status}")
            await self._broadcast({
                "type": "notification_dispatched",
                "dispatch": self._dispatch.model_dump(),
                "timestamp": datetime.utcnow().isoformat() + "Z",
            })
            await self._emit_log("NotificationService", "SUCCESS", self._dispatch.message)
        except Exception as exc:
            await self._emit_log("NotificationService", "ERROR", f"Dispatch failed: {exc}")
        return self._dispatch

    # ------------------------------------------------------------------
    # Main telemetry cycle
    # ------------------------------------------------------------------

    async def _run_cycle(self) -> None:
        await self._set_phase(SystemPhase.MONITORING)
        self._agent_statuses.monitoring = AgentStatus.RUNNING

        # ---- Agent 1: Monitoring ----
        critical = self._simulation_mode == SimulationMode.CRITICAL_EVENT
        snapshot: TelemetrySnapshot = self._monitor.run(self._factories, critical_mode=critical)

        # Accumulate telemetry history (rolling 30 per factory)
        for r in snapshot.readings:
            self._telemetry_history.append(r)
        max_history = 30 * len(self._factories)
        if len(self._telemetry_history) > max_history:
            self._telemetry_history = self._telemetry_history[-max_history:]

        self._agent_statuses.monitoring = AgentStatus.COMPLETE
        await self._emit_log("MonitoringAgent", "INFO",
                             f"Telemetry cycle complete — {len(snapshot.readings)} factories scanned")

        # ---- Agent 2: Compliance ----
        await self._set_phase(SystemPhase.ANALYZING)
        self._agent_statuses.compliance = AgentStatus.RUNNING
        violations, updated_factories = self._compliance.run(snapshot, self._factories)
        self._factories = updated_factories
        self._violations = violations
        self._agent_statuses.compliance = AgentStatus.COMPLETE

        if violations:
            await self._emit_log("ComplianceAgent", "WARNING",
                                 f"{len(violations)} violation(s) detected — {[v.severity.value for v in violations]}")
            await self._broadcast({
                "type": "violation_detected",
                "violations": [v.model_dump() for v in violations],
                "timestamp": datetime.utcnow().isoformat() + "Z",
            })
        else:
            await self._emit_log("ComplianceAgent", "INFO", "No violations detected — all parameters within range")

        # ---- Agent 3: Health Risk ----
        await self._set_phase(SystemPhase.RISK_ASSESSMENT)
        self._agent_statuses.health_risk = AgentStatus.RUNNING
        risk = self._health.run(violations, self._factories)
        self._risk = risk
        self._agent_statuses.health_risk = AgentStatus.COMPLETE
        await self._emit_log("HealthRiskAgent", "INFO",
                             f"Risk score: {risk.score}/100 ({risk.category.value})")
        await self._broadcast({
            "type": "risk_update",
            "risk": risk.model_dump(),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })

        # ---- Agent 4: Regulatory (only if escalation criteria met) ----
        if RegulatoryAgent.escalation_criteria_met(violations):
            if not self._notice:  # only generate once per event
                await self._set_phase(SystemPhase.ESCALATING)
                self._agent_statuses.regulatory = AgentStatus.RUNNING
                await self._emit_log("RegulatoryAgent", "WARNING",
                                     "Escalation criteria satisfied — calling Granite provider")
                await self.generate_notice()
                self._agent_statuses.regulatory = AgentStatus.COMPLETE
                await self._set_phase(SystemPhase.ALERT_READY)
        else:
            self._agent_statuses.regulatory = AgentStatus.IDLE

        # ---- Broadcast full telemetry update ----
        payload = {
            "type": "telemetry_update",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "factories": [f.model_dump() for f in self._factories],
            "violations": [v.model_dump() for v in violations],
            "risk": risk.model_dump() if risk else None,
            "agents": self._agent_statuses.model_dump(),
            "system_state": self._phase.value,
            "simulation_mode": self._simulation_mode.value,
            "telemetry": [r.model_dump() for r in snapshot.readings],
        }
        await self._broadcast(payload)

    async def start(self) -> None:
        self._running = True
        await self._emit_log("SYSTEM", "INFO", "Golden Corridor Monitoring System — ONLINE")
        await self._set_phase(SystemPhase.MONITORING)
        while self._running:
            try:
                await self._run_cycle()
            except Exception as exc:
                logger.exception("Cycle error: %s", exc)
                await self._emit_log("SYSTEM", "ERROR", f"Cycle error: {exc}")
            await asyncio.sleep(CYCLE_INTERVAL)

    def stop(self) -> None:
        self._running = False

    # ------------------------------------------------------------------
    # State accessors (for REST endpoints)
    # ------------------------------------------------------------------

    def get_factories(self) -> list[Factory]:
        return self._factories

    def get_violations(self) -> list[Violation]:
        return self._violations

    def get_risk(self) -> RiskAssessment | None:
        return self._risk

    def get_notice(self) -> RegulatoryNotice | None:
        return self._notice

    def get_dispatch(self) -> DispatchResult | None:
        return self._dispatch

    def get_system_state(self) -> dict:
        return {
            "phase": self._phase.value,
            "simulation_mode": self._simulation_mode.value,
            "agent_statuses": self._agent_statuses.model_dump(),
            "active_violations": len(self._violations),
            "last_cycle_at": datetime.utcnow().isoformat() + "Z",
        }

    def get_telemetry_history(self) -> list[TelemetryReading]:
        return self._telemetry_history

    def get_recent_logs(self, n: int = 200) -> list[dict]:
        return self._log_buffer[-n:]


# Singleton instance
_orchestrator: Orchestrator | None = None


def get_orchestrator() -> Orchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = Orchestrator()
    return _orchestrator
