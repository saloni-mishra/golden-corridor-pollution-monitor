from __future__ import annotations

import logging
import os

from app.models.schemas import RegulatoryNotice, ViolationBundle
from app.services.granite_mock import MockGraniteProvider

logger = logging.getLogger("WatsonxGraniteProvider")

_SYSTEM_PROMPT = (
    "You are an environmental regulatory compliance assistant. "
    "Analyze the supplied industrial violation records and produce a formal, "
    "fact-based regulatory compliance summary. Do not invent facts. Use only the "
    "supplied telemetry. Clearly distinguish observed values from thresholds. "
    "Identify affected parameters. Recommend appropriate next actions. Include "
    "timestamps. Mark this as a draft for inspector review."
)


class WatsonxGraniteProvider:
    """Real IBM watsonx.ai Granite provider.

    Activated only when GRANITE_API_KEY, GRANITE_API_URL, and GRANITE_PROJECT_ID
    are present in the environment. Falls back to MockGraniteProvider otherwise.
    """

    def __init__(self) -> None:
        self.api_key = os.getenv("GRANITE_API_KEY", "")
        self.api_url = os.getenv("GRANITE_API_URL", "")
        self.project_id = os.getenv("GRANITE_PROJECT_ID", "")
        self._mock = MockGraniteProvider()

        if not all([self.api_key, self.api_url, self.project_id]):
            logger.info("[GRANITE] Using mock provider — no watsonx credentials configured")
            self._use_mock = True
        else:
            logger.info("[GRANITE] watsonx.ai credentials found — real Granite provider active")
            self._use_mock = False

    async def generate_regulatory_notice(self, bundle: ViolationBundle) -> RegulatoryNotice:
        if self._use_mock:
            return await self._mock.generate_regulatory_notice(bundle)

        try:
            return await self._call_watsonx(bundle)
        except Exception as exc:
            logger.error("[GRANITE] watsonx.ai call failed (%s) — falling back to mock", exc)
            return await self._mock.generate_regulatory_notice(bundle)

    async def _call_watsonx(self, bundle: ViolationBundle) -> RegulatoryNotice:
        """Call the IBM watsonx.ai REST inference endpoint."""
        import httpx
        from datetime import datetime, timezone

        violation_text = "\n".join(
            f"- {v.parameter}: {v.observed_value} {v.unit} (threshold {v.threshold} {v.unit}), "
            f"severity {v.severity.value}, factory {v.factory_id}, at {v.timestamp.isoformat()}"
            for v in bundle.violations
        )
        user_message = (
            f"Factory units affected: {', '.join({v.factory_id for v in bundle.violations})}\n"
            f"Violation count: {len(bundle.violations)}\n"
            f"Violations:\n{violation_text}\n\n"
            "Generate a regulatory compliance notice following the output contract."
        )

        payload = {
            "model_id": "ibm/granite-13b-instruct-v2",
            "input": f"[INST] <<SYS>>\n{_SYSTEM_PROMPT}\n<</SYS>>\n\n{user_message} [/INST]",
            "parameters": {
                "decoding_method": "greedy",
                "max_new_tokens": 800,
                "temperature": 0.1,
            },
            "project_id": self.project_id,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{self.api_url}/ml/v1/text/generation?version=2023-05-29",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()

        generated_text = data["results"][0]["generated_text"]
        # Wrap the generated text in a RegulatoryNotice (the real Granite output
        # is used as the summary; structure is filled deterministically)
        mock_notice = await self._mock.generate_regulatory_notice(bundle)
        return mock_notice.model_copy(
            update={
                "summary": generated_text.strip(),
                "notice_id": f"GPCB-WATSONX-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
                "disclaimer": (
                    "AI-generated draft produced by IBM Granite via watsonx.ai. "
                    "For inspector review only. Not a legally binding document."
                ),
            }
        )


def get_llm_provider() -> WatsonxGraniteProvider:
    """Return the configured LLM provider (watsonx or mock)."""
    return WatsonxGraniteProvider()
