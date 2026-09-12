from __future__ import annotations

from app.models.schemas import (
    RegulatoryNotice,
    Violation,
    ViolationBundle,
    ViolationSeverity,
)
from app.utils.logger import get_logger

logger = get_logger("RegulatoryAgent")


class RegulatoryAgent:
    """Agent 4 — Regulatory Alert & Escalation.

    Fires only when escalation criteria are met (≥1 CRITICAL or any SEVERE violation).
    Delegates notice generation to the injected LLM provider.
    """

    @staticmethod
    def escalation_criteria_met(violations: list[Violation]) -> bool:
        return any(
            v.severity in (ViolationSeverity.CRITICAL, ViolationSeverity.SEVERE)
            for v in violations
        )

    async def run(
        self,
        bundle: ViolationBundle,
        llm_provider,
    ) -> RegulatoryNotice:
        logger.info(
            "Escalation criteria met — %d violation(s), requesting Granite draft",
            len(bundle.violations),
        )
        notice = await llm_provider.generate_regulatory_notice(bundle)
        logger.info("Regulatory notice ready — ID: %s", notice.notice_id)
        return notice
