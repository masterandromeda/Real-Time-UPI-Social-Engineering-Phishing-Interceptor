"""Integrations health and status API."""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import get_settings
from app.integrations import urlhaus_client, virustotal_client, openai_client, sarvam_client
from app.database.connection import check_db_connection

router = APIRouter(prefix="/integrations", tags=["Integrations"])
settings = get_settings()


@router.get("/status")
async def get_integration_status():
    """Return configuration and connection status of all integrations."""
    return {
        "integrations": [
            {
                "id": "sarvam_ai",
                "name": "Sarvam AI",
                "purpose": "Multilingual speech-to-text and NLU for Hindi/Punjabi/Hinglish",
                "connectionStatus": "disconnected" if not settings.sarvam_configured else "connected",
                "configurationStatus": "configured" if settings.sarvam_configured else "not_configured",
                "lastChecked": None,
                "docsUrl": "https://sarvam.ai",
            },
            {
                "id": "urlhaus",
                "name": "URLhaus",
                "purpose": "Malware URL intelligence feed",
                "connectionStatus": "disconnected" if not settings.urlhaus_configured else "connected",
                "configurationStatus": "configured" if settings.urlhaus_configured else "not_configured",
                "lastChecked": None,
                "docsUrl": "https://urlhaus.abuse.ch",
            },
            {
                "id": "virustotal",
                "name": "VirusTotal",
                "purpose": "Multi-engine URL and domain reputation",
                "connectionStatus": "disconnected" if not settings.virustotal_configured else "connected",
                "configurationStatus": "configured" if settings.virustotal_configured else "not_configured",
                "lastChecked": None,
                "docsUrl": "https://www.virustotal.com",
            },
            {
                "id": "openai",
                "name": "OpenAI",
                "purpose": "Explanation generation (explanation layer only)",
                "connectionStatus": "disconnected" if not settings.openai_configured else "connected",
                "configurationStatus": "configured" if settings.openai_configured else "not_configured",
                "lastChecked": None,
                "docsUrl": "https://platform.openai.com",
            },
        ]
    }


@router.get("/health")
async def get_integration_health():
    """Run live health checks against all configured integrations."""
    now = datetime.now(timezone.utc).isoformat()

    # Run all health checks concurrently
    db_ok = await check_db_connection()

    health_tasks = await asyncio.gather(
        sarvam_client.check_sarvam_health(),
        urlhaus_client.check_urlhaus_health(),
        virustotal_client.check_virustotal_health(),
        openai_client.check_openai_health(),
        return_exceptions=True,
    )

    def _safe(result, name):
        if isinstance(result, Exception):
            return {"name": name, "status": "failed", "error": str(result), "checked_at": now}
        result["name"] = name
        result["checked_at"] = now
        return result

    return {
        "database": {"status": "connected" if db_ok else "failed", "checked_at": now},
        "sarvam_ai": _safe(health_tasks[0], "Sarvam AI"),
        "urlhaus": _safe(health_tasks[1], "URLhaus"),
        "virustotal": _safe(health_tasks[2], "VirusTotal"),
        "openai": _safe(health_tasks[3], "OpenAI"),
        "timestamp": now,
    }
