from __future__ import annotations

import asyncio
from datetime import datetime

from app.models.schemas import DispatchResult, DispatchStep, RegulatoryNotice
from app.utils.logger import get_logger

logger = get_logger("NotificationService")

_STEPS = [
    "Preparing notification",
    "Validating evidence",
    "Generating dispatch payload",
    "Simulating email delivery",
    "Simulating SMS delivery",
    "Dispatch successful",
]


class NotificationService:
    """Simulates regulatory dispatch (no real email/SMS is sent)."""

    async def dispatch(self, notice: RegulatoryNotice) -> DispatchResult:
        logger.info("Beginning simulated dispatch for notice %s", notice.notice_id)
        steps: list[DispatchStep] = []

        for step_label in _STEPS:
            await asyncio.sleep(0.4)  # simulate processing delay
            step = DispatchStep(
                step=step_label,
                status="COMPLETE",
                timestamp=datetime.utcnow(),
            )
            steps.append(step)
            logger.info("[DISPATCH] %s — OK", step_label)

        result = DispatchResult(
            notice_id=notice.notice_id,
            steps=steps,
            completed=True,
            message=(
                "Regulatory alert dispatched successfully — "
                "Email + SMS simulation completed. "
                "NOTE: No real email or SMS was sent. This is a simulation."
            ),
        )
        logger.info("Dispatch complete for notice %s", notice.notice_id)
        return result
