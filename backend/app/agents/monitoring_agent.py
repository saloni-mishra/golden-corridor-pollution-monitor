from __future__ import annotations

import random
from datetime import datetime

from app.models.schemas import (
    Factory,
    FactoryStatus,
    TelemetryReading,
    TelemetrySnapshot,
)
from app.utils.logger import get_logger

logger = get_logger("MonitoringAgent")

# Healthy baseline ranges per parameter
_BASELINES: dict[str, tuple[float, float]] = {
    "aqi":  (50.0, 120.0),
    "pm25": (20.0, 60.0),
    "so2":  (10.0, 50.0),
    "ph":   (6.5, 8.5),
    "cod":  (100.0, 300.0),
}

# Toxic-event target values (reliably breach all thresholds)
_CRITICAL_TARGETS: dict[str, float] = {
    "aqi":  380.0,
    "pm25": 195.0,
    "so2":  210.0,
    "ph":   4.2,
    "cod":  950.0,
}

# Per-factory drift state (starts at mid-baseline)
_state: dict[str, dict[str, float]] = {}


def _init_state(factory_id: str) -> None:
    if factory_id not in _state:
        _state[factory_id] = {
            "aqi":  85.0,
            "pm25": 40.0,
            "so2":  30.0,
            "ph":   7.2,
            "cod":  200.0,
        }


def _drift(current: float, lo: float, hi: float, step: float) -> float:
    """Move current value randomly within ±step, staying inside [lo, hi]."""
    delta = random.uniform(-step, step)
    return max(lo, min(hi, current + delta))


def _drift_toward(current: float, target: float, factor: float = 0.35) -> float:
    """Drift current value toward target each tick, with small jitter."""
    diff = target - current
    step = diff * factor + random.uniform(-abs(diff) * 0.05, abs(diff) * 0.05)
    return current + step


class MonitoringAgent:
    """Agent 1 — Emission & Effluent Monitoring."""

    def run(
        self,
        factories: list[Factory],
        critical_mode: bool = False,
    ) -> TelemetrySnapshot:
        readings: list[TelemetryReading] = []
        now = datetime.utcnow()

        for factory in factories:
            fid = factory.id
            _init_state(fid)
            s = _state[fid]

            if critical_mode:
                s["aqi"]  = _drift_toward(s["aqi"],  _CRITICAL_TARGETS["aqi"])
                s["pm25"] = _drift_toward(s["pm25"], _CRITICAL_TARGETS["pm25"])
                s["so2"]  = _drift_toward(s["so2"],  _CRITICAL_TARGETS["so2"])
                s["ph"]   = _drift_toward(s["ph"],   _CRITICAL_TARGETS["ph"])
                s["cod"]  = _drift_toward(s["cod"],  _CRITICAL_TARGETS["cod"])
            else:
                s["aqi"]  = _drift(s["aqi"],  *_BASELINES["aqi"],  8.0)
                s["pm25"] = _drift(s["pm25"], *_BASELINES["pm25"], 4.0)
                s["so2"]  = _drift(s["so2"],  *_BASELINES["so2"],  3.0)
                s["ph"]   = _drift(s["ph"],   *_BASELINES["ph"],   0.15)
                s["cod"]  = _drift(s["cod"],  *_BASELINES["cod"],  15.0)

            readings.append(
                TelemetryReading(
                    factory_id=fid,
                    timestamp=now,
                    aqi=round(s["aqi"], 2),
                    pm25=round(s["pm25"], 2),
                    so2=round(s["so2"], 2),
                    ph=round(s["ph"], 3),
                    cod=round(s["cod"], 2),
                )
            )
            logger.info(
                "[%s] AQI=%.1f PM2.5=%.1f SO2=%.1f pH=%.2f COD=%.1f",
                fid, s["aqi"], s["pm25"], s["so2"], s["ph"], s["cod"],
            )

        return TelemetrySnapshot(timestamp=now, readings=readings)


def reset_simulator_state() -> None:
    """Reset drift state to healthy baseline (called on simulation reset)."""
    _state.clear()
