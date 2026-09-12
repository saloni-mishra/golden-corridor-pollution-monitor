from __future__ import annotations

# ---------------------------------------------------------------------------
# Demonstration thresholds — verify against current applicable GPCB/CPCB
# standards before regulatory use.
# ---------------------------------------------------------------------------

THRESHOLDS: dict[str, dict] = {
    "aqi": {
        "warning": 100,
        "critical": 200,
        "severe": 300,
        "unit": "AQI",
    },
    "pm25": {
        "warning": 60,
        "critical": 120,
        "severe": 150,
        "unit": "µg/m³",
    },
    "so2": {
        "warning": 80,
        "critical": 150,
        "severe": 200,
        "unit": "µg/m³",
    },
    "ph_low": {
        "warning": 6.5,
        "critical": 6.0,
        "severe": 5.5,
        "unit": "pH",
    },
    "ph_high": {
        "warning": 8.5,
        "critical": 9.0,
        "severe": 9.5,
        "unit": "pH",
    },
    "cod": {
        "warning": 250,
        "critical": 500,
        "severe": 750,
        "unit": "mg/L",
    },
}

DISCLAIMER = (
    "Demonstration thresholds — verify against current applicable "
    "GPCB/CPCB standards before regulatory use."
)
