# Golden Corridor Industrial Pollution Agentic Defense System

> **Gujarat Hackathon 2026 — Challenge 9: Smart Industrial Pollution Monitoring for the Golden Corridor (Vapi–Ankleshwar)**
> Domain: Environmental Sustainability | Tech: IBM Bob + IBM Granite LLM + IBM Cloud

---

## ⚠ Regulatory Disclaimer

This is a **demonstration prototype only**. All telemetry values are simulated. Thresholds defined in `backend/app/data/thresholds.py` are for **demonstration purposes only** and **must be validated against current applicable GPCB/CPCB standards**, site-specific consent conditions, and applicable environmental regulations before any real-world or regulatory use. No real monitoring data is used. No legally binding notices are generated.

---

## Overview

A closed-loop agentic monitoring prototype for four simulated factories along the Vapi–Ankleshwar industrial corridor, demonstrating end-to-end pipeline:

```
Simulated Telemetry → Monitoring Agent → Compliance Agent → Health-Risk Agent
   → Regulatory/Escalation Agent → Granite-generated Notice → Simulated Dispatch
   → Real-time Dashboard + Agent Terminal
```

The full loop — healthy state → toxic-spill trigger → violation → risk spike → notice → dispatch → reset — runs from the UI in under two minutes.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                         │
│  Header │ FactoryGrid │ Map │ Charts │ RiskPanel │ Terminal      │
│  ViolationPanel │ ActionPanel │ LegalNoticeModal                 │
│               ↕ WebSocket (ws://localhost:8000/ws/monitoring)   │
│               ↕ REST API (http://localhost:8000/api/*)          │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Orchestrator Loop (3s)                  │   │
│  │                                                          │   │
│  │  MonitoringAgent → ComplianceAgent → HealthRiskAgent     │   │
│  │         ↓ (if CRITICAL/SEVERE violations)                │   │
│  │  RegulatoryAgent → LLMProvider → NotificationService     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  System State: IDLE→MONITORING→ANALYZING→RISK_ASSESSMENT        │
│                →ESCALATING→ALERT_READY→DISPATCHED               │
│                                                                 │
│  LLM Provider (pluggable):                                      │
│    MockGraniteProvider   (default, offline, deterministic)      │
│    WatsonxGraniteProvider (real, activated by env vars)         │
└─────────────────────────────────────────────────────────────────┘

  4 Factories: VAPI-A │ VAPI-B │ ANK-4 │ ANK-C
  5 Parameters: AQI │ PM2.5 │ SO2 │ Effluent pH │ COD
```

---

## Agent Responsibilities

| Agent | Responsibility |
|-------|---------------|
| **Monitoring Agent** | Generates simulated telemetry every 3s with controlled drift. In CRITICAL_EVENT mode, values spike toward toxic levels. |
| **Compliance Agent** | Evaluates all readings against thresholds in `data/thresholds.py`. Produces `Violation` records with severity: WARNING / CRITICAL / SEVERE. |
| **Health Risk Agent** | Deterministic 0–100 risk score from pollution exposure, chemical exposure, effluent risk, proximity multiplier, and severity multiplier. Categories: LOW / MODERATE / HIGH / SEVERE. |
| **Regulatory Agent** | Fires only when ≥1 CRITICAL or SEVERE violation exists. Calls LLM provider to draft a formal regulatory notice, then triggers simulated dispatch. |

---

## Install & Run

### Prerequisites
- Python 3.11+ (CPython, not MSYS2/MinGW — use `py -3` launcher on Windows)
- Node.js 18+ / npm 9+

### Backend

```bash
cd golden-corridor-monitor/backend

# Create venv with native CPython (Windows)
py -3 -m venv .venv
.venv\Scripts\activate

# Linux/macOS
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install --only-binary=:all: -r requirements.txt

# Start backend
python run.py
```

### Frontend

```bash
cd golden-corridor-monitor/frontend
npm install
npm run dev
```

---

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| WebSocket | ws://localhost:8000/ws/monitoring |
| Health check | http://localhost:8000/api/health |

---

## API Reference

```
GET  /api/health                      — Service health check
GET  /api/factories                   — All 4 factory definitions + current status
GET  /api/telemetry                   — Rolling telemetry history
GET  /api/violations                  — Current active violations
GET  /api/risk                        — Current public health risk assessment
GET  /api/system-state                — System phase + simulation mode
GET  /api/logs                        — Recent agent log entries (up to 200)
POST /api/simulation/trigger          — Trigger toxic spill simulation
POST /api/simulation/reset            — Reset to healthy baseline
POST /api/regulatory/generate-notice — Generate Granite regulatory notice
POST /api/regulatory/dispatch         — Dispatch simulated alert (email + SMS)
WS   /ws/monitoring                   — Real-time event stream
```

---

## Demo Script

1. **Launch** — Dashboard shows SYSTEM ONLINE, Simulation: HEALTHY, Risk: LOW, 4 factories, 0 violations. Charts and terminal stream live data.
2. **Click "Simulate Toxic Spill / AQI Spike"** — simulation mode flips to CRITICAL_EVENT.
3. **Next cycle (~3s)** — AQI/PM2.5/SO2/COD spike, pH drops → factories turn BREACH → risk jumps to SEVERE (100/100).
4. **Terminal** shows escalation → Granite drafting notice → Legal Notice Modal opens automatically.
5. **Click "Dispatch Regulatory Alert"** → 6-step simulation plays out → success toast.
6. **Click "Reset to Healthy Baseline"** → system returns to HEALTHY / LOW / 0 violations.

---

## IBM Granite Integration

The regulatory notice generator is fully pluggable via a `LLMProvider` protocol interface:

```python
class LLMProvider(Protocol):
    async def generate_regulatory_notice(self, bundle: ViolationBundle) -> RegulatoryNotice:
        ...
```

### MockGraniteProvider (default)
- Deterministic, template-based, zero-dependency
- Works offline — no API key required
- Always produces valid structured `RegulatoryNotice`
- Used automatically when Granite env vars are absent

### WatsonxGraniteProvider (real)
Activated when all three of these env vars are set:

```
GRANITE_API_KEY=<your IBM Cloud API key>
GRANITE_API_URL=<your watsonx.ai endpoint URL>
GRANITE_PROJECT_ID=<your watsonx.ai project ID>
```

If credentials are missing or the API call fails, it logs:
```
[GRANITE] Using mock provider — no watsonx credentials configured
```
and falls back to mock — **the demo never crashes**.

Copy `.env.example` to `.env` in `backend/` and fill in the values to enable the real provider.

**System prompt sent to Granite:**
> You are an environmental regulatory compliance assistant. Analyze the supplied industrial violation records and produce a formal, fact-based regulatory compliance summary. Do not invent facts. Use only the supplied telemetry. Clearly distinguish observed values from thresholds. Identify affected parameters. Recommend appropriate next actions. Include timestamps. Mark this as a draft for inspector review.

---

## Project Structure

```
golden-corridor-monitor/
├── .env.example
├── .gitignore
├── README.md
├── backend/
│   ├── requirements.txt
│   ├── run.py
│   └── app/
│       ├── main.py                      — FastAPI app, CORS, startup
│       ├── api/routes.py                — REST + WebSocket endpoints
│       ├── agents/
│       │   ├── monitoring_agent.py      — Agent 1: Telemetry generation
│       │   ├── compliance_agent.py      — Agent 2: Violation detection
│       │   ├── health_agent.py          — Agent 3: Risk assessment
│       │   └── regulatory_agent.py      — Agent 4: Regulatory escalation
│       ├── models/schemas.py            — Pydantic v2 data models
│       ├── services/
│       │   ├── orchestrator.py          — Main pipeline loop + WS broadcast
│       │   ├── granite_mock.py          — MockGraniteProvider
│       │   ├── granite_watsonx.py       — WatsonxGraniteProvider + LLMProvider
│       │   └── notification_service.py  — Simulated dispatch pipeline
│       ├── data/
│       │   ├── factories.py             — 4 factory definitions
│       │   └── thresholds.py            — Demonstration thresholds (⚠ see disclaimer)
│       └── utils/logger.py              — Logging utilities
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx / App.jsx / index.css
        ├── components/
        │   ├── Header.jsx               — Title, status, clock, WS indicator
        │   ├── FactoryGrid.jsx          — 4 interactive factory cards
        │   ├── IndustrialMap.jsx        — SVG corridor map
        │   ├── TelemetryCharts.jsx      — AQI + pH line charts (Recharts)
        │   ├── RiskPanel.jsx            — Animated risk gauge
        │   ├── ViolationPanel.jsx       — Live violations table
        │   ├── AgentTerminal.jsx        — Real-time backend log stream
        │   ├── ActionPanel.jsx          — Simulation controls
        │   └── LegalNoticeModal.jsx     — Regulatory notice viewer
        ├── hooks/useMonitoringSocket.js — WebSocket state management
        ├── services/api.js              — REST API client
        └── utils/formatters.js          — Date/color/text helpers
```

---

## Explicit Non-Claims

This system does **NOT**:
- Generate official GPCB certifications or legally binding notices
- Produce real measured environmental data
- Send real email or SMS messages
- Represent actual pollution levels at any real site

All notices are labeled "AI-generated draft for demonstration and inspector review."

---

## Known Limitations

1. In-memory state only — restarting the backend resets all history
2. No authentication or authorization on any endpoint
3. Telemetry is simulated — not connected to real sensors
4. The watsonx.ai Granite path wraps the generated text in a structured notice; real production use would need prompt engineering for full JSON output
5. No persistence layer — Postgres/Redis/Kafka would be the next step for production
6. Chart history is lost on page reload (state is in-memory React only)
7. No horizontal scrolling prevention on very small screens (< 320px)
