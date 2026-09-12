from __future__ import annotations

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from app.services.orchestrator import get_orchestrator

router = APIRouter()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@router.get("/health")
async def health():
    return {"status": "ok", "service": "Golden Corridor Industrial Pollution Monitor"}


# ---------------------------------------------------------------------------
# Factories
# ---------------------------------------------------------------------------

@router.get("/factories")
async def get_factories():
    orch = get_orchestrator()
    return [f.model_dump() for f in orch.get_factories()]


# ---------------------------------------------------------------------------
# Telemetry
# ---------------------------------------------------------------------------

@router.get("/telemetry")
async def get_telemetry():
    orch = get_orchestrator()
    history = orch.get_telemetry_history()
    return [r.model_dump() for r in history]


# ---------------------------------------------------------------------------
# Violations
# ---------------------------------------------------------------------------

@router.get("/violations")
async def get_violations():
    orch = get_orchestrator()
    return [v.model_dump() for v in orch.get_violations()]


# ---------------------------------------------------------------------------
# Risk
# ---------------------------------------------------------------------------

@router.get("/risk")
async def get_risk():
    orch = get_orchestrator()
    risk = orch.get_risk()
    if risk is None:
        return {"score": 5, "category": "LOW", "primary_drivers": [], "recommended_action": "Continue monitoring"}
    return risk.model_dump()


# ---------------------------------------------------------------------------
# System state
# ---------------------------------------------------------------------------

@router.get("/system-state")
async def get_system_state():
    return get_orchestrator().get_system_state()


# ---------------------------------------------------------------------------
# Simulation controls
# ---------------------------------------------------------------------------

@router.post("/simulation/trigger")
async def trigger_simulation():
    await get_orchestrator().trigger_critical_event()
    return {"status": "ok", "message": "Critical event simulation triggered", "simulation_mode": "CRITICAL_EVENT"}


@router.post("/simulation/reset")
async def reset_simulation():
    await get_orchestrator().reset_simulation()
    return {"status": "ok", "message": "Simulation reset to healthy baseline", "simulation_mode": "HEALTHY"}


# ---------------------------------------------------------------------------
# Regulatory notice
# ---------------------------------------------------------------------------

@router.post("/regulatory/generate-notice")
async def generate_notice():
    orch = get_orchestrator()
    notice = await orch.generate_notice()
    if notice is None:
        raise HTTPException(status_code=400, detail="No active violations — trigger simulation first")
    return notice.model_dump()


@router.post("/regulatory/dispatch")
async def dispatch_alert():
    orch = get_orchestrator()
    result = await orch.dispatch_notice()
    if result is None:
        raise HTTPException(status_code=400, detail="No notice to dispatch — generate a notice first")
    return result.model_dump()


# ---------------------------------------------------------------------------
# Logs (for initial terminal hydration)
# ---------------------------------------------------------------------------

@router.get("/logs")
async def get_logs():
    return get_orchestrator().get_recent_logs(200)


# ---------------------------------------------------------------------------
# WebSocket
# ---------------------------------------------------------------------------

@router.websocket("/ws/monitoring")
async def ws_monitoring(websocket: WebSocket):
    await websocket.accept()
    orch = get_orchestrator()

    async def send(msg: str) -> None:
        await websocket.send_text(msg)

    orch.subscribe(send)
    try:
        while True:
            # Keep connection alive; client drives the session
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        orch.unsubscribe(send)
