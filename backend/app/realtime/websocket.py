"""WebSocket connection manager and real-time event streaming.

Manages WebSocket connections per analysis_id and broadcasts events.
Falls back gracefully when Redis is not configured.
"""
from __future__ import annotations

import asyncio
import json
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from fastapi import WebSocket
from app.core.logging import get_logger

logger = get_logger("websocket")


class ConnectionManager:
    """
    In-memory WebSocket connection manager.
    For production multi-worker deployments, use Redis Pub/Sub.
    """

    def __init__(self):
        # analysis_id -> set of WebSocket connections
        self._analysis_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        # Global connections (agents monitor page)
        self._global_connections: Set[WebSocket] = set()
        # Event buffer: last N events per analysis_id for reconnecting clients
        self._event_buffer: Dict[str, List[dict]] = defaultdict(list)
        self._buffer_size = 50

    async def connect_analysis(self, websocket: WebSocket, analysis_id: str):
        await websocket.accept()
        self._analysis_connections[analysis_id].add(websocket)
        logger.info("ws_connected", analysis_id=analysis_id)

        # Replay buffered events for reconnecting clients
        buffered = self._event_buffer.get(analysis_id, [])
        if buffered:
            for event in buffered:
                try:
                    await websocket.send_json(event)
                except Exception:
                    break

    async def connect_global(self, websocket: WebSocket):
        await websocket.accept()
        self._global_connections.add(websocket)
        logger.info("ws_global_connected")

    def disconnect_analysis(self, websocket: WebSocket, analysis_id: str):
        self._analysis_connections[analysis_id].discard(websocket)
        if not self._analysis_connections[analysis_id]:
            del self._analysis_connections[analysis_id]

    def disconnect_global(self, websocket: WebSocket):
        self._global_connections.discard(websocket)

    async def broadcast_event(
        self,
        analysis_id: str,
        event_type: str,
        status: str,
        agent_id: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
    ) -> dict:
        """Broadcast an event to all WebSocket connections subscribed to this analysis."""
        event = {
            "event_id": str(uuid.uuid4()),
            "analysis_id": analysis_id,
            "event_type": event_type,
            "agent_id": agent_id,
            "status": status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "backend",
            "payload": payload or {},
        }

        # Buffer the event
        self._event_buffer[analysis_id].append(event)
        if len(self._event_buffer[analysis_id]) > self._buffer_size:
            self._event_buffer[analysis_id].pop(0)

        # Send to analysis-specific connections
        dead = set()
        for ws in self._analysis_connections.get(analysis_id, set()):
            try:
                await ws.send_json(event)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._analysis_connections[analysis_id].discard(ws)

        # Also broadcast to global agent monitor connections
        dead_global = set()
        for ws in self._global_connections:
            try:
                await ws.send_json(event)
            except Exception:
                dead_global.add(ws)
        for ws in dead_global:
            self._global_connections.discard(ws)

        return event

    def get_buffered_events(self, analysis_id: str) -> List[dict]:
        return list(self._event_buffer.get(analysis_id, []))


# Singleton instance
manager = ConnectionManager()
