from __future__ import annotations

import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.services.orchestrator import get_orchestrator

app = FastAPI(
    title="Golden Corridor Industrial Pollution Monitor",
    description=(
        "Agentic defense system for Vapi–Ankleshwar industrial corridor. "
        "IBM Granite + IBM Bob prototype for Gujarat Hackathon 2026."
    ),
    version="1.0.0",
)

# Allow all origins, methods, and headers for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mounted under /api for REST endpoints (/api/...)
app.include_router(router, prefix="/api")

# Also mounted at root so calls directly to /ws/monitoring resolve
app.include_router(router)


@app.on_event("startup")
async def startup():
    orch = get_orchestrator()
    asyncio.create_task(orch.start())


@app.on_event("shutdown")
async def shutdown():
    get_orchestrator().stop()