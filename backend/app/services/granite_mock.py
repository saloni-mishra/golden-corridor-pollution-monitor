from __future__ import annotations

from datetime import datetime, timezone
from typing import Protocol

from app.models.schemas import RegulatoryNotice, ViolationBundle, ViolationSeverity


class LLMProvider(Protocol):
    async def generate_regulatory_notice(self, bundle: ViolationBundle) -> RegulatoryNotice:
        ...


class MockGraniteProvider:
    """Deterministic, template-based mock provider. Zero dependencies. Works fully offline."""

    async def generate_regulatory_notice(self, bundle: ViolationBundle) -> RegulatoryNotice:
        now = datetime.now(timezone.utc).isoformat()

        # Determine worst factory from bundle
        if bundle.violations:
            factory_id = bundle.violations[0].factory_id
            factories_affected = list({v.factory_id for v in bundle.violations})
        else:
            factory_id = "UNKNOWN"
            factories_affected = []

        # Determine overall severity
        severities = [v.severity for v in bundle.violations]
        if ViolationSeverity.SEVERE in severities:
            overall_severity = "SEVERE"
        elif ViolationSeverity.CRITICAL in severities:
            overall_severity = "CRITICAL"
        else:
            overall_severity = "WARNING"

        violation_dicts = [
            {
                "parameter": v.parameter,
                "factory_id": v.factory_id,
                "observed_value": v.observed_value,
                "threshold": v.threshold,
                "unit": v.unit,
                "severity": v.severity.value,
                "timestamp": v.timestamp.isoformat(),
            }
            for v in bundle.violations
        ]

        params_list = list({v.parameter for v in bundle.violations})
        params_str = ", ".join(params_list)
        factories_str = ", ".join(factories_affected)

        summary = (
            f"[SIMULATED DATA — AI-GENERATED DRAFT FOR DEMONSTRATION PURPOSES]\n\n"
            f"Environmental monitoring telemetry (simulated) recorded {len(bundle.violations)} "
            f"threshold exceedance(s) across factory unit(s): {factories_str}. "
            f"Affected parameters: {params_str}. "
            f"Overall violation severity classification: {overall_severity}. "
            f"Immediate operator response and regulatory review is recommended. "
            f"This notice was drafted by IBM Granite (Mock Provider) for inspector review "
            f"under the Golden Corridor Industrial Pollution Agentic Defense System prototype. "
            f"All values are simulated and do not represent real measured environmental data."
        )

        recommended_actions = [
            "Notify factory environmental officer immediately",
            "Initiate emergency shutdown protocol for affected process units",
            "Deploy rapid-response effluent sampling team",
            "Submit incident report to GPCB within 24 hours",
            "Coordinate with local health authorities for community assessment",
            "Maintain continuous monitoring until parameters return to threshold range",
        ]

        evidence = [
            f"[SIMULATED] {v.parameter}: {v.observed_value} {v.unit} "
            f"(threshold: {v.threshold} {v.unit}) at {v.timestamp.strftime('%Y-%m-%dT%H:%M:%SZ')}"
            for v in bundle.violations
        ]

        return RegulatoryNotice(
            notice_id=f"GPCB-DRAFT-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
            title="Draft Environmental Compliance Violation Notice",
            factory=factories_str or factory_id,
            severity=overall_severity,
            summary=summary,
            violations=violation_dicts,
            recommended_actions=recommended_actions,
            evidence=evidence,
            generated_at=now,
            disclaimer=(
                "AI-generated draft for demonstration and inspector review. "
                "Not a legally binding document. All data is simulated. "
                "Verify thresholds against current GPCB/CPCB standards before any regulatory action."
            ),
        )
