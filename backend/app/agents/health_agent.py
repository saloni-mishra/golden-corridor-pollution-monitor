from __future__ import annotations

from app.models.schemas import (
    Factory,
    RiskAssessment,
    RiskCategory,
    Violation,
    ViolationSeverity,
)
from app.utils.logger import get_logger

logger = get_logger("HealthRiskAgent")

_PROXIMITY_MULTIPLIER = {
    "High": 1.3,
    "Medium": 1.1,
    "Low": 1.0,
}

_SEVERITY_MULTIPLIER = {
    ViolationSeverity.WARNING: 1.0,
    ViolationSeverity.CRITICAL: 1.5,
    ViolationSeverity.SEVERE: 2.0,
}


def _category(score: float) -> RiskCategory:
    if score < 25:
        return RiskCategory.LOW
    if score < 50:
        return RiskCategory.MODERATE
    if score < 75:
        return RiskCategory.HIGH
    return RiskCategory.SEVERE


class HealthRiskAgent:
    """Agent 3 — Public Health Risk Assessment."""

    def run(
        self,
        violations: list[Violation],
        factories: list[Factory],
    ) -> RiskAssessment:
        if not violations:
            assessment = RiskAssessment(
                score=5.0,
                category=RiskCategory.LOW,
                primary_drivers=[],
                recommended_action="Continue routine monitoring",
            )
            logger.info("No violations — risk score: %.1f (LOW)", assessment.score)
            return assessment

        factory_map = {f.id: f for f in factories}
        drivers: set[str] = set()
        base_score = 0.0

        for v in violations:
            factory = factory_map.get(v.factory_id)
            proximity_mult = _PROXIMITY_MULTIPLIER.get(
                factory.location.proximity_to_population if factory else "Medium", 1.1
            )
            sev_mult = _SEVERITY_MULTIPLIER[v.severity]

            # Component scores per parameter
            if v.parameter == "AQI":
                component = min((v.observed_value / 300.0) * 25, 25) * sev_mult * proximity_mult
                drivers.add("Elevated AQI")
            elif v.parameter == "PM2.5":
                component = min((v.observed_value / 150.0) * 20, 20) * sev_mult * proximity_mult
                drivers.add("PM2.5 particulate spike")
            elif v.parameter == "SO2":
                component = min((v.observed_value / 200.0) * 20, 20) * sev_mult * proximity_mult
                drivers.add("Elevated SO2")
            elif v.parameter == "Effluent pH":
                component = min(abs(v.observed_value - 7.0) / 3.5 * 15, 15) * sev_mult * proximity_mult
                drivers.add("Effluent pH anomaly")
            elif v.parameter == "COD":
                component = min((v.observed_value / 900.0) * 20, 20) * sev_mult * proximity_mult
                drivers.add("High chemical oxygen demand")
            else:
                component = 5.0 * sev_mult

            base_score += component

        # Clamp
        score = round(min(max(base_score, 0.0), 100.0), 1)
        category = _category(score)

        # Action recommendation
        if category == RiskCategory.SEVERE:
            action = "Immediate inspection and community notification assessment required"
        elif category == RiskCategory.HIGH:
            action = "Escalate to regulatory authority — begin incident response protocol"
        elif category == RiskCategory.MODERATE:
            action = "Issue operator advisory — increase monitoring frequency"
        else:
            action = "Continue routine monitoring"

        assessment = RiskAssessment(
            score=score,
            category=category,
            primary_drivers=sorted(drivers)[:5],
            recommended_action=action,
        )
        logger.info(
            "Risk assessment: %.1f (%s) — drivers: %s",
            score, category.value, ", ".join(drivers),
        )
        return assessment
