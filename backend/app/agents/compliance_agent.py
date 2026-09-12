from __future__ import annotations

from datetime import datetime

from app.data.thresholds import THRESHOLDS
from app.models.schemas import (
    Factory,
    FactoryStatus,
    TelemetryReading,
    TelemetrySnapshot,
    Violation,
    ViolationBundle,
    ViolationSeverity,
)
from app.utils.logger import get_logger

logger = get_logger("ComplianceAgent")


def _severity_for(value: float, lo: float, hi: float, warn: float, crit: float, sev: float, above: bool = True) -> ViolationSeverity | None:
    """Return severity if value breaches threshold (above=True means high is bad)."""
    if above:
        if value >= sev:
            return ViolationSeverity.SEVERE
        if value >= crit:
            return ViolationSeverity.CRITICAL
        if value >= warn:
            return ViolationSeverity.WARNING
    else:
        if value <= sev:
            return ViolationSeverity.SEVERE
        if value <= crit:
            return ViolationSeverity.CRITICAL
        if value <= warn:
            return ViolationSeverity.WARNING
    return None


class ComplianceAgent:
    """Agent 2 — Violation Detection & Compliance."""

    def run(
        self,
        snapshot: TelemetrySnapshot,
        factories: list[Factory],
    ) -> tuple[list[Violation], list[Factory]]:
        th = THRESHOLDS
        now = datetime.utcnow()
        violations: list[Violation] = []
        factory_map = {f.id: f for f in factories}
        updated: list[Factory] = []

        for reading in snapshot.readings:
            factory = factory_map.get(reading.factory_id)
            if not factory:
                continue

            factory_violations: list[Violation] = []

            # AQI
            sev = _severity_for(reading.aqi, 0, 9999, th["aqi"]["warning"], th["aqi"]["critical"], th["aqi"]["severe"])
            if sev:
                factory_violations.append(Violation(
                    factory_id=reading.factory_id,
                    parameter="AQI",
                    observed_value=reading.aqi,
                    threshold=th["aqi"][sev.value.lower()],
                    unit=th["aqi"]["unit"],
                    severity=sev,
                    timestamp=now,
                    message=f"AQI {reading.aqi:.1f} exceeds configured demonstration threshold",
                ))

            # PM2.5
            sev = _severity_for(reading.pm25, 0, 9999, th["pm25"]["warning"], th["pm25"]["critical"], th["pm25"]["severe"])
            if sev:
                factory_violations.append(Violation(
                    factory_id=reading.factory_id,
                    parameter="PM2.5",
                    observed_value=reading.pm25,
                    threshold=th["pm25"][sev.value.lower()],
                    unit=th["pm25"]["unit"],
                    severity=sev,
                    timestamp=now,
                    message=f"PM2.5 {reading.pm25:.1f} µg/m³ exceeds configured demonstration threshold",
                ))

            # SO2
            sev = _severity_for(reading.so2, 0, 9999, th["so2"]["warning"], th["so2"]["critical"], th["so2"]["severe"])
            if sev:
                factory_violations.append(Violation(
                    factory_id=reading.factory_id,
                    parameter="SO2",
                    observed_value=reading.so2,
                    threshold=th["so2"][sev.value.lower()],
                    unit=th["so2"]["unit"],
                    severity=sev,
                    timestamp=now,
                    message=f"SO2 concentration {reading.so2:.1f} µg/m³ exceeds configured demonstration threshold",
                ))

            # pH low
            sev = _severity_for(reading.ph, 0, 14, th["ph_low"]["warning"], th["ph_low"]["critical"], th["ph_low"]["severe"], above=False)
            if sev:
                factory_violations.append(Violation(
                    factory_id=reading.factory_id,
                    parameter="Effluent pH",
                    observed_value=reading.ph,
                    threshold=th["ph_low"][sev.value.lower()],
                    unit=th["ph_low"]["unit"],
                    severity=sev,
                    timestamp=now,
                    message=f"Effluent pH {reading.ph:.2f} below minimum demonstration threshold (acidic exceedance)",
                ))

            # pH high
            if not any(v.parameter == "Effluent pH" for v in factory_violations):
                sev = _severity_for(reading.ph, 0, 14, th["ph_high"]["warning"], th["ph_high"]["critical"], th["ph_high"]["severe"], above=True)
                if sev:
                    factory_violations.append(Violation(
                        factory_id=reading.factory_id,
                        parameter="Effluent pH",
                        observed_value=reading.ph,
                        threshold=th["ph_high"][sev.value.lower()],
                        unit=th["ph_high"]["unit"],
                        severity=sev,
                        timestamp=now,
                        message=f"Effluent pH {reading.ph:.2f} exceeds maximum demonstration threshold (alkaline exceedance)",
                    ))

            # COD
            sev = _severity_for(reading.cod, 0, 9999, th["cod"]["warning"], th["cod"]["critical"], th["cod"]["severe"])
            if sev:
                factory_violations.append(Violation(
                    factory_id=reading.factory_id,
                    parameter="COD",
                    observed_value=reading.cod,
                    threshold=th["cod"][sev.value.lower()],
                    unit=th["cod"]["unit"],
                    severity=sev,
                    timestamp=now,
                    message=f"COD {reading.cod:.1f} mg/L exceeds configured demonstration threshold",
                ))

            violations.extend(factory_violations)

            # Update factory status
            if factory_violations:
                worst = max(factory_violations, key=lambda v: ["WARNING", "CRITICAL", "SEVERE"].index(v.severity.value))
                if worst.severity == ViolationSeverity.SEVERE:
                    new_status = FactoryStatus.BREACH
                elif worst.severity == ViolationSeverity.CRITICAL:
                    new_status = FactoryStatus.CRITICAL
                else:
                    new_status = FactoryStatus.WARNING
            else:
                new_status = FactoryStatus.NORMAL

            updated.append(factory.model_copy(update={"current_status": new_status, "last_updated": now}))
            if factory_violations:
                logger.warning("[%s] %d violation(s) detected", reading.factory_id, len(factory_violations))

        logger.info("Compliance check complete — %d total violations", len(violations))
        return violations, updated
