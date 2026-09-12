"""
Telemetry Simulator

Generates realistic telemetry readings with controlled drift.
State: HEALTHY (normal operating range) or CRITICAL_EVENT (toxic spill).
Values drift from the previous reading — no random jumps.
"""
from __future__ import annotations

import random
from datetime import datetime, timezone
from typing import Optional

from app.models.schemas import Factory, SimulationMode, Telemetry


# ---------------------------------------------------------------------------
# Baseline ranges (HEALTHY mode)
# ---------------------------------------------------------------------------
_HEALTHY_BASELINES: dict[str, tuple[float, float]] = {
    "aqi":          (50.0,  120.0),
    "pm25":         (20.0,   60.0),
    "so2":          (10.0,   50.0),
    "effluent_ph":  ( 6.5,    8.5),
    "cod":          (100.0, 300.0),
}

# CRITICAL_EVENT target values (forced during spill mode)
_CRITICAL_TARGETS: dict[str, float] = {
    "aqi":          370.0,
    "pm25":         190.0,
    "so2":          210.0,
    "effluent_ph":  4.4,
    "cod":          920.0,
}

# Max drift per cycle (fraction of range)
_DRIFT_FRACTION = 0.06
_CRITICAL_APPROACH_RATE = 0.30  # how fast we move toward target in CRITICAL mode


class FactorySimulator:
    """Simulates one factory's telemetry with drift-based realism."""

    def __init__(self, factory: Factory) -> None:
        self.factory = factory
        self._current: dict[str, float] = {
            "aqi":         random.uniform(55, 85),
            "pm25":        random.uniform(22, 45),
            "so2":         random.uniform(12, 35),
            "effluent_ph": random.uniform(6.8, 8.0),
            "cod":         random.uniform(110, 240),
        }

    def tick(self, mode: SimulationMode) -> Telemetry:
        if mode == SimulationMode.CRITICAL_EVENT:
            self._drift_toward_critical()
        else:
            self._drift_healthy()

        return Telemetry(
            factory_id=self.factory.factory_id,
            timestamp=datetime.now(timezone.utc),
            aqi=round(self._current["aqi"], 1),
            pm25=round(self._current["pm25"], 1),
            so2=round(self._current["so2"], 1),
            effluent_ph=round(self._current["effluent_ph"], 2),
            cod=round(self._current["cod"], 1),
        )

    def reset(self) -> None:
        baselines = _HEALTHY_BASELINES
        self._current = {
            "aqi":         random.uniform(baselines["aqi"][0], baselines["aqi"][0] + 30),
            "pm25":        random.uniform(baselines["pm25"][0], baselines["pm25"][0] + 20),
            "so2":         random.uniform(baselines["so2"][0], baselines["so2"][0] + 15),
            "effluent_ph": random.uniform(6.8, 7.8),
            "cod":         random.uniform(110, 220),
        }

    def _drift_healthy(self) -> None:
        for key, (lo, hi) in _HEALTHY_BASELINES.items():
            span = hi - lo
            delta = random.uniform(-span * _DRIFT_FRACTION, span * _DRIFT_FRACTION)
            self._current[key] = max(lo, min(hi, self._current[key] + delta))

    def _drift_toward_critical(self) -> None:
        for key, target in _CRITICAL_TARGETS.items():
            current = self._current[key]
            # Move CRITICAL_APPROACH_RATE of the remaining distance + small noise
            diff = target - current
            step = diff * _CRITICAL_APPROACH_RATE
            noise = random.uniform(-abs(diff) * 0.05, abs(diff) * 0.05)
            self._current[key] = current + step + noise


class Simulator:
    """Global simulation state for all four factories."""

    def __init__(self, factories: list[Factory]) -> None:
        self._factory_sims: dict[str, FactorySimulator] = {
            f.factory_id: FactorySimulator(f) for f in factories
        }
        self.mode: SimulationMode = SimulationMode.HEALTHY
        self._cycle: int = 0

    def tick(self) -> list[Telemetry]:
        self._cycle += 1
        readings: list[Telemetry] = []
        for fsim in self._factory_sims.values():
            readings.append(fsim.tick(self.mode))
        return readings

    def trigger_critical(self) -> None:
        self.mode = SimulationMode.CRITICAL_EVENT

    def reset(self) -> None:
        self.mode = SimulationMode.HEALTHY
        for fsim in self._factory_sims.values():
            fsim.reset()
        self._cycle = 0

    @property
    def cycle(self) -> int:
        return self._cycle
