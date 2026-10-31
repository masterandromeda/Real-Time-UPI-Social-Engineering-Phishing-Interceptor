"""UPI Sentinel FastAPI Application — main entry point."""
from __future__ import annotations

import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import get_settings
from app.core.exceptions import UPISentinelError, upi_sentinel_exception_handler, generic_exception_handler
from app.core.logging import configure_logging, get_logger
from app.database.connection import engine, check_db_connection
from app.database.models import Base
from app.realtime.websocket import manager

# Import routers
from app.api.auth import router as auth_router
from app.api.analysis import router as analysis_router
from app.api.integrations import router as integrations_router
from app.api.reports import router as reports_router

configure_logging()
logger = get_logger("main")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    logger.info("upi_sentinel_starting", version=settings.app_version, env=settings.app_env)

    # Attempt to create tables if DB is available — non-fatal if unavailable
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("database_tables_ready")
    except Exception as exc:
        logger.warning(
            "database_unavailable",
            error=str(exc),
            message="Backend starting without database. Configure DATABASE_URL to enable persistence.",
        )

    logger.info("upi_sentinel_ready", port=8001, docs="/api/docs")
    yield
    logger.info("upi_sentinel_shutdown")


app = FastAPI(
    title="UPI Sentinel API",
    description="AI-powered social-engineering scam interception platform.",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ─── Middleware ───────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Exception Handlers ───────────────────────────────────────────────────────
app.add_exception_handler(UPISentinelError, upi_sentinel_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# ─── API Routers ─────────────────────────────────────────────────────────────
API_V1 = "/api/v1"

app.include_router(auth_router, prefix=API_V1)
app.include_router(analysis_router, prefix=API_V1)
app.include_router(integrations_router, prefix=API_V1)
app.include_router(reports_router, prefix=API_V1)


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    db_ok = await check_db_connection()
    return {
        "status": "ok",
        "version": settings.app_version,
        "env": settings.app_env,
        "database": "connected" if db_ok else "unavailable",
        "integrations_configured": {
            "sarvam_ai": settings.sarvam_configured,
            "urlhaus": settings.urlhaus_configured,
            "virustotal": settings.virustotal_configured,
            "openai": settings.openai_configured,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/", tags=["Health"])
async def root():
    return {
        "product": "UPI Sentinel",
        "tagline": "Detect Early. Intercept Before Authorization. Protect Every User.",
        "api_docs": "/api/docs",
        "health": "/health",
        "version": settings.app_version,
    }


# ─── WebSocket Endpoints ──────────────────────────────────────────────────────

@app.websocket("/ws/analysis/{analysis_id}")
async def ws_analysis(websocket: WebSocket, analysis_id: str):
    """
    WebSocket connection for real-time analysis events.
    Connect to receive live updates for a specific analysis.
    Replays buffered events on reconnect.
    """
    await manager.connect_analysis(websocket, analysis_id)
    logger.info("ws_analysis_connect", analysis_id=analysis_id)
    try:
        # Keep connection alive — client will receive pushed events
        while True:
            # Receive any client messages (e.g., acknowledgements)
            try:
                data = await websocket.receive_json()
                logger.info("ws_client_message", analysis_id=analysis_id, data=data)
            except Exception:
                break
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect_analysis(websocket, analysis_id)
        logger.info("ws_analysis_disconnect", analysis_id=analysis_id)


@app.websocket("/ws/agents")
async def ws_agents(websocket: WebSocket):
    """
    Global WebSocket for all agent events (used by Live Agent Monitor page).
    Receives all events across all analyses.
    """
    await manager.connect_global(websocket)
    logger.info("ws_agents_connect")
    try:
        while True:
            try:
                await websocket.receive_text()
            except Exception:
                break
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect_global(websocket)
        logger.info("ws_agents_disconnect")
