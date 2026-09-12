# 🏭 Golden Corridor Industrial Pollution Agentic Defense System

[![Gujarat Hackathon 2026](https://img.shields.io/badge/Gujarat_Hackathon-2026-blue)](https://gujhackathon.gujarat.gov.in)
[![Challenge 9](https://img.shields.io/badge/Challenge-09:_Golden_Corridor-emerald)](https://github.com)
[![Tech Stack](https://img.shields.io/badge/Stack-IBM_Granite_|_FastAPI_|_React-purple)](https://ibm.com)

> **Gujarat Hackathon 2026 — Challenge 9: Smart Industrial Pollution Monitoring for the Golden Corridor (Vapi–Ankleshwar)**
> **Domain:** Environmental Sustainability &nbsp;|&nbsp; **Tech Stack:** IBM Granite LLM + FastAPI + React
---

### ⚠️ Regulatory Disclaimer

This is a **demonstration prototype only**. All telemetry values are simulated. Thresholds defined in `backend/app/data/thresholds.py` are for demonstration purposes only and must be validated against current applicable GPCB/CPCB standards, site-specific consent conditions, and environmental regulations before any real-world regulatory deployment.

No real monitoring data is used. No legally binding notices are issued.

---

## Overview

A closed-loop multi-agent monitoring platform tracking four simulated industrial units across the Vapi–Ankleshwar chemical corridor:

```
Simulated Telemetry → Monitoring Agent → Compliance Agent → Health Risk Agent
    → Regulatory Agent → Granite LLM Notice → Simulated Dispatch
```

The entire operational lifecycle — baseline telemetry, toxic chemical discharge trigger, threshold violation detection, public health risk escalation, Granite legal notice drafting, dispatch simulation, and baseline reset — runs in real time from the dashboard in under two minutes.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                        │
│  Header (Day/Night) │ FactoryGrid │ Map │ Charts │ RiskPanel     │
│  ViolationPanel │ ActionPanel │ Terminal │ LegalNoticeModal      │
│               ↕ WebSocket (ws://localhost:8000/ws/monitoring)   │
│               ↕ REST API (http://localhost:8000/api/*)          │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                               │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                Orchestrator Loop (3s)                    │    │
│  │                                                           │    │
│  │  MonitoringAgent → ComplianceAgent → HealthRiskAgent     │    │
│  │         ↓ (if CRITICAL/SEVERE violations)                │    │
│  │  RegulatoryAgent → LLMProvider → NotificationService     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  System State: IDLE → MONITORING → ANALYZING → RISK_ASSESSMENT   │
│                → ESCALATING → ALERT_READY → DISPATCHED           │
│                                                                   │
│  Pluggable LLM Provider:                                         │
│    • MockGraniteProvider    (default, offline, zero-latency)     │
│    • WatsonxGraniteProvider (live IBM watsonx.ai Granite API)    │
└─────────────────────────────────────────────────────────────────┘
```

- **4 Industrial Units:** VAPI-A · VAPI-B · ANK-4 · ANK-C
- **5 Monitored Parameters:** AQI · PM2.5 · SO₂ · Effluent pH · COD

---

## Agents

| Agent | What it does |
|---|---|
| **Monitoring Agent** | Streams simulated telemetry; injects non-linear pollutant spikes during incident mode. |
| **Compliance Agent** | Compares telemetry against CPCB/GPCB thresholds and classifies incidents as WARNING, CRITICAL, or SEVERE. |
| **Public Health Risk Agent** | Computes a real-time 0–100 deterministic risk score combining pollutant toxicity, population proximity weights, and effluent dispersion metrics (LOW / MODERATE / HIGH / SEVERE). |
| **Regulatory Alert & Escalation Agent** | Triggers automatically on critical violations, dispatches violation bundles to IBM Granite to draft formal show-cause notices, and orchestrates simulated multi-channel dispatch. |
| **Dashboard Agent** | Manages live WebSocket event broadcasting, the interactive GIS map corridor projection, dual telemetry trends, and the operational audit feed. |

---

## Core UI Features

- **Real-Time Telemetry Grid** — live status cards for all 4 industrial units tracking AQI, PM2.5, SO₂, pH, and COD.
- **Geospatial Corridor Map** — SVG tracking view showing facility locations, statuses, and corridor dispersion paths across Vapi and Ankleshwar.
- **Public Health Risk Gauge** — radial risk index reflecting localized human health exposure risk based on demographic proximity.
- **Dual-Theme Engine** — toggle between Night (SCADA Control Room) and Day (Field Inspector) modes.
- **Interactive Incident Simulation** — one-click buttons to trigger toxic events, view auto-drafted Granite legal notices, and simulate dispatch workflows.
- **Agent Terminal Feed** — live audit stream of agent reasoning cycles, violation alerts, and model synthesis logs, without breaking the viewport layout.

---

## Install & Run

### Prerequisites
- Python 3.11+ (native CPython recommended on Windows)
- Node.js 18+ & npm 9+

### Backend Setup
```bash
cd backend

# Create and activate virtual environment
# Windows:
py -3 -m venv .venv
.\.venv\Scripts\activate

# Linux / macOS:
python3 -m venv .venv && source .venv/bin/activate

# Install dependencies (pure-Python WebSockets)
pip install -r requirements.txt
pip install websockets wsproto

# Start backend server
python run.py
```

### Frontend Setup
```bash
cd frontend

# Install node dependencies
npm install

# Start Vite dev server
npm run dev
```

### Core Endpoints & URLs

| Service | URL | Notes |
|---|---|---|
| Frontend UI | `http://localhost:5173` | React + Vite operations dashboard |
| Backend API | `http://localhost:8000` | FastAPI server entry point |
| Interactive Docs | `http://localhost:8000/docs` | OpenAPI / Swagger interface |
| WebSocket Stream | `ws://localhost:8000/ws/monitoring` | Real-time bi-directional telemetry connection |
| Health Check | `http://localhost:8000/api/health` | Service uptime and heartbeat |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Service health check |
| GET | `/api/factories` | Current operational status of all 4 industrial units |
| GET | `/api/telemetry` | Rolling telemetry history for charting |
| GET | `/api/violations` | Active regulatory violation records |
| GET | `/api/risk` | Local public health risk evaluation |
| GET | `/api/system-state` | Current orchestration phase and mode |
| GET | `/api/logs` | Rolling backend agent event logs (last 200 entries) |
| POST | `/api/simulation/trigger` | Trigger synthetic toxic spill / AQI spike |
| POST | `/api/simulation/reset` | Reset all factory units to healthy baseline |
| POST | `/api/regulatory/generate-notice` | Trigger Granite LLM to compose a draft notice |
| POST | `/api/regulatory/dispatch` | Execute simulated emergency alert dispatch (Email + SMS) |
| WS | `/ws/monitoring` | Streaming WebSocket pipeline for telemetry and agent logs |

---

## Interactive Demo Walkthrough

1. **Baseline State** — Dashboard displays `SYSTEM ONLINE`, `SIM: HEALTHY`, `Risk: LOW`, 4 factories normal, and 0 violations. Charts stream telemetry cycles every 3 seconds.
2. **Trigger Incident** — Click "Simulate Toxic Spill / AQI Spike." System mode shifts to `CRITICAL_EVENT`.
3. **Escalation Detection** — Within 3 seconds, telemetry exceeds safe thresholds. Factory badges flip to `WARNING` / `BREACH`, and the Public Health Risk gauge surges.
4. **Agent Action** — The Agent Terminal reflects escalation checks. The Regulatory Agent invokes IBM Granite to draft a formal regulatory notice, opening the Legal Notice Modal.
5. **Dispatch Alert** — Click "Dispatch Regulatory Alert" to step through the simulated multi-channel delivery protocol.
6. **Recovery** — Click "Reset to Healthy Baseline" to return parameters, risk scores, and factory states to compliant levels.

---

## IBM Granite Integration

The regulatory notice generator implements a pluggable `LLMProvider` protocol:

```python
class LLMProvider(Protocol):
    async def generate_regulatory_notice(self, bundle: ViolationBundle) -> RegulatoryNotice:
        ...
```

- **`MockGraniteProvider`** (default) — zero-dependency, deterministic fallback that requires no API keys and guarantees reliable offline evaluations.
- **`WatsonxGraniteProvider`** (live) — automatically activates when credentials are present in `backend/.env`:

```env
GRANITE_API_KEY=<your_ibm_cloud_api_key>
GRANITE_API_URL=<your_watsonx_instance_url>
GRANITE_PROJECT_ID=<your_watsonx_project_id>
```

If credentials are missing or the endpoint is unreachable, the system automatically falls back to the local mock provider without disrupting UI operations.

---

## Prototype Scope & Architecture Tradeoffs

- **In-Memory Telemetry Pipeline** — engineered for zero-latency WebSocket streaming during evaluation demos. A production deployment would transition telemetry to an Apache Kafka / MQTT broker with TimescaleDB for persistent compliance audits.
- **Dual-Mode Granite Synthesis** — an integrated mock fallback ensures zero evaluation downtime, with seamless configuration for live IBM Cloud watsonx.ai Granite foundation models.
- **Frictionless Access Boundary** — authentication is omitted on development endpoints to allow unhindered live testing by judges; production deployments assume OAuth2/JWT role-based access control (GPCB Officer vs. Plant Environmental Manager).
- **Display Optimization** — the interface is structured for command centers, desktop monitors, and inspection tablets (≥768px).

---

## Non-Claims & Compliance Notice

- Does **NOT** issue legally binding government notices or official GPCB certificates.
- Uses simulated environmental data designed to replicate industrial telemetry patterns.
- Dispatches simulated alert workflows; does not send unprompted SMS or external emails.
- All generated notices are watermarked: *"AI-generated draft for demonstration and inspector review."*