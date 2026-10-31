"""URLhaus malware URL intelligence client.

URLhaus is a malware URL feed. An unlisted URL does NOT mean it is safe.
Always communicate this clearly in results.
"""
from __future__ import annotations

import time
from typing import Optional
from urllib.parse import urlparse

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("urlhaus_client")
settings = get_settings()

URLHAUS_API = "https://urlhaus-api.abuse.ch/v1/url/"


async def lookup_url(url: str) -> dict:
    """
    Look up a URL in the URLhaus malware feed.
    Returns structured result. 'not_listed' ≠ 'safe'.
    """
    if not settings.urlhaus_configured:
        return {
            "submitted_url": url,
            "normalized_url": _normalize(url),
            "lookup_status": "not_configured",
            "threat_status": "unknown",
            "threat_information": None,
            "source": "urlhaus",
            "checked_at": None,
            "execution_time": 0,
            "error": "URLHAUS_AUTH_KEY not configured",
        }

    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                URLHAUS_API,
                headers={"Auth-Key": settings.urlhaus_auth_key},
                data={"url": url},
            )
            elapsed = int((time.time() - start) * 1000)
            from datetime import datetime, timezone
            checked_at = datetime.now(timezone.utc).isoformat()

            if response.status_code == 200:
                data = response.json()
                query_status = data.get("query_status", "unknown")

                if query_status == "is_listed":
                    return {
                        "submitted_url": url,
                        "normalized_url": _normalize(url),
                        "lookup_status": "found",
                        "threat_status": "malicious",
                        "threat_information": {
                            "threat": data.get("threat"),
                            "url_status": data.get("url_status"),
                            "date_added": data.get("date_added"),
                            "tags": data.get("tags", []),
                            "reporter": data.get("reporter"),
                            "urlhaus_reference": data.get("urlhaus_reference"),
                        },
                        "source": "urlhaus",
                        "checked_at": checked_at,
                        "execution_time": elapsed,
                        "error": None,
                    }
                elif query_status == "no_results":
                    return {
                        "submitted_url": url,
                        "normalized_url": _normalize(url),
                        "lookup_status": "not_listed",
                        "threat_status": "not_listed",  # NOT "clean" — just not in database
                        "threat_information": None,
                        "source": "urlhaus",
                        "checked_at": checked_at,
                        "execution_time": elapsed,
                        "error": None,
                    }
                else:
                    return {
                        "submitted_url": url,
                        "normalized_url": _normalize(url),
                        "lookup_status": "api_error",
                        "threat_status": "unknown",
                        "threat_information": None,
                        "source": "urlhaus",
                        "checked_at": checked_at,
                        "execution_time": elapsed,
                        "error": f"Unexpected query_status: {query_status}",
                    }
            else:
                logger.warning("urlhaus_error", status=response.status_code, body=response.text[:200])
                return {
                    "submitted_url": url,
                    "normalized_url": _normalize(url),
                    "lookup_status": "api_error",
                    "threat_status": "unknown",
                    "threat_information": None,
                    "source": "urlhaus",
                    "checked_at": None,
                    "execution_time": elapsed,
                    "error": f"HTTP {response.status_code}",
                }
    except httpx.TimeoutException:
        return {
            "submitted_url": url,
            "normalized_url": _normalize(url),
            "lookup_status": "timeout",
            "threat_status": "unknown",
            "threat_information": None,
            "source": "urlhaus",
            "checked_at": None,
            "execution_time": int((time.time() - start) * 1000),
            "error": "Request timed out",
        }
    except Exception as exc:
        logger.error("urlhaus_exception", error=str(exc))
        return {
            "submitted_url": url,
            "normalized_url": _normalize(url),
            "lookup_status": "failed",
            "threat_status": "unknown",
            "threat_information": None,
            "source": "urlhaus",
            "checked_at": None,
            "execution_time": int((time.time() - start) * 1000),
            "error": str(exc),
        }


def _normalize(url: str) -> Optional[str]:
    try:
        parsed = urlparse(url.strip())
        return parsed.geturl()
    except Exception:
        return url


async def check_urlhaus_health() -> dict:
    if not settings.urlhaus_configured:
        return {"configured": False, "status": "not_configured", "latency_ms": None, "error": None}
    # Test with a safe known query
    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.post(
                URLHAUS_API,
                headers={"Auth-Key": settings.urlhaus_auth_key},
                data={"url": "http://example.com"},
            )
            elapsed = int((time.time() - start) * 1000)
            if r.status_code in (200,):
                return {"configured": True, "status": "connected", "latency_ms": elapsed, "error": None}
            return {"configured": True, "status": "error", "latency_ms": elapsed, "error": f"HTTP {r.status_code}"}
    except Exception as exc:
        return {"configured": True, "status": "failed", "latency_ms": None, "error": str(exc)}
