"""VirusTotal URL intelligence client.

Uses VirusTotal v3 API for URL and domain reputation analysis.
Respects rate limits and quota. Never fabricates clean results.
"""
from __future__ import annotations

import base64
import time
from datetime import datetime, timezone
from typing import Optional

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("virustotal_client")
settings = get_settings()

VT_BASE = "https://www.virustotal.com/api/v3"


def _url_id(url: str) -> str:
    """Compute the VirusTotal URL identifier (base64url of the URL)."""
    return base64.urlsafe_b64encode(url.strip().encode()).decode().rstrip("=")


async def analyze_url(url: str) -> dict:
    """
    Submit a URL to VirusTotal and return analysis results.
    Uses GET /urls/{id} first; submits new analysis only if not cached.
    Never treats a pending analysis as a clean result.
    """
    if not settings.virustotal_configured:
        return {
            "submitted_url": url,
            "url_identifier": None,
            "analysis_status": "not_configured",
            "malicious_count": 0,
            "suspicious_count": 0,
            "harmless_count": 0,
            "undetected_count": 0,
            "vendor_results": None,
            "reputation": None,
            "source": "virustotal",
            "checked_at": None,
            "execution_time": 0,
            "error": "VIRUSTOTAL_API_KEY not configured",
        }

    start = time.time()
    headers = {"x-apikey": settings.virustotal_api_key}
    url_id = _url_id(url)
    checked_at = datetime.now(timezone.utc).isoformat()

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Try to GET cached analysis first
            r = await client.get(f"{VT_BASE}/urls/{url_id}", headers=headers)
            elapsed = int((time.time() - start) * 1000)

            if r.status_code == 200:
                return _parse_vt_response(url, url_id, r.json(), elapsed, checked_at)

            elif r.status_code == 404:
                # Not cached — submit for analysis
                r2 = await client.post(
                    f"{VT_BASE}/urls",
                    headers=headers,
                    data={"url": url},
                )
                elapsed2 = int((time.time() - start) * 1000)

                if r2.status_code == 200:
                    data2 = r2.json()
                    analysis_id_vt = data2.get("data", {}).get("id", "")
                    # Fetch the analysis result
                    if analysis_id_vt:
                        r3 = await client.get(
                            f"{VT_BASE}/analyses/{analysis_id_vt}", headers=headers
                        )
                        elapsed3 = int((time.time() - start) * 1000)
                        if r3.status_code == 200:
                            return _parse_vt_analysis(url, url_id, r3.json(), elapsed3, checked_at)
                    return {
                        "submitted_url": url,
                        "url_identifier": url_id,
                        "analysis_status": "pending",
                        "malicious_count": 0,
                        "suspicious_count": 0,
                        "harmless_count": 0,
                        "undetected_count": 0,
                        "vendor_results": None,
                        "reputation": None,
                        "source": "virustotal",
                        "checked_at": checked_at,
                        "execution_time": elapsed2,
                        "error": "Analysis submitted but result not yet available",
                    }
                elif r2.status_code == 429:
                    return _rate_limited_result(url, url_id, elapsed2, checked_at)
                else:
                    return _error_result(url, url_id, f"HTTP {r2.status_code}", elapsed2, checked_at)

            elif r.status_code == 401:
                return _error_result(url, url_id, "Invalid API key", elapsed, checked_at)
            elif r.status_code == 429:
                return _rate_limited_result(url, url_id, elapsed, checked_at)
            else:
                return _error_result(url, url_id, f"HTTP {r.status_code}", elapsed, checked_at)

    except httpx.TimeoutException:
        return _error_result(url, url_id, "Request timed out", int((time.time() - start) * 1000), checked_at)
    except Exception as exc:
        logger.error("virustotal_exception", error=str(exc))
        return _error_result(url, url_id, str(exc), int((time.time() - start) * 1000), checked_at)


def _parse_vt_response(url: str, url_id: str, data: dict, elapsed: int, checked_at: str) -> dict:
    attrs = data.get("data", {}).get("attributes", {})
    stats = attrs.get("last_analysis_stats", {})
    vendor_results = attrs.get("last_analysis_results", {})

    # Summarize vendors to top 20 to keep payload manageable
    summarized = {k: {"category": v.get("category"), "result": v.get("result")}
                  for k, v in list(vendor_results.items())[:20]}

    return {
        "submitted_url": url,
        "url_identifier": url_id,
        "analysis_status": "completed",
        "malicious_count": stats.get("malicious", 0),
        "suspicious_count": stats.get("suspicious", 0),
        "harmless_count": stats.get("harmless", 0),
        "undetected_count": stats.get("undetected", 0),
        "vendor_results": summarized,
        "reputation": attrs.get("reputation"),
        "source": "virustotal",
        "checked_at": checked_at,
        "execution_time": elapsed,
        "error": None,
    }


def _parse_vt_analysis(url: str, url_id: str, data: dict, elapsed: int, checked_at: str) -> dict:
    attrs = data.get("data", {}).get("attributes", {})
    stats = attrs.get("stats", {})
    status = attrs.get("status", "queued")

    if status == "queued" or status == "running":
        return {
            "submitted_url": url,
            "url_identifier": url_id,
            "analysis_status": "pending",
            "malicious_count": 0,
            "suspicious_count": 0,
            "harmless_count": 0,
            "undetected_count": 0,
            "vendor_results": None,
            "reputation": None,
            "source": "virustotal",
            "checked_at": checked_at,
            "execution_time": elapsed,
            "error": "Analysis still in progress",
        }

    return {
        "submitted_url": url,
        "url_identifier": url_id,
        "analysis_status": "completed",
        "malicious_count": stats.get("malicious", 0),
        "suspicious_count": stats.get("suspicious", 0),
        "harmless_count": stats.get("harmless", 0),
        "undetected_count": stats.get("undetected", 0),
        "vendor_results": None,
        "reputation": None,
        "source": "virustotal",
        "checked_at": checked_at,
        "execution_time": elapsed,
        "error": None,
    }


def _rate_limited_result(url: str, url_id: str, elapsed: int, checked_at: str) -> dict:
    return {
        "submitted_url": url,
        "url_identifier": url_id,
        "analysis_status": "rate_limited",
        "malicious_count": 0,
        "suspicious_count": 0,
        "harmless_count": 0,
        "undetected_count": 0,
        "vendor_results": None,
        "reputation": None,
        "source": "virustotal",
        "checked_at": checked_at,
        "execution_time": elapsed,
        "error": "API rate limit exceeded",
    }


def _error_result(url: str, url_id: str, error: str, elapsed: int, checked_at: str) -> dict:
    return {
        "submitted_url": url,
        "url_identifier": url_id,
        "analysis_status": "failed",
        "malicious_count": 0,
        "suspicious_count": 0,
        "harmless_count": 0,
        "undetected_count": 0,
        "vendor_results": None,
        "reputation": None,
        "source": "virustotal",
        "checked_at": checked_at,
        "execution_time": elapsed,
        "error": error,
    }


async def check_virustotal_health() -> dict:
    if not settings.virustotal_configured:
        return {"configured": False, "status": "not_configured", "latency_ms": None, "error": None}
    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(
                f"{VT_BASE}/urls/{_url_id('https://www.google.com')}",
                headers={"x-apikey": settings.virustotal_api_key},
            )
            elapsed = int((time.time() - start) * 1000)
            if r.status_code in (200, 404):  # 404 just means URL not cached — API works
                return {"configured": True, "status": "connected", "latency_ms": elapsed, "error": None}
            elif r.status_code == 401:
                return {"configured": True, "status": "invalid_key", "latency_ms": elapsed, "error": "Invalid API key"}
            elif r.status_code == 429:
                return {"configured": True, "status": "rate_limited", "latency_ms": elapsed, "error": "Rate limited"}
            return {"configured": True, "status": "error", "latency_ms": elapsed, "error": f"HTTP {r.status_code}"}
    except Exception as exc:
        return {"configured": True, "status": "failed", "latency_ms": None, "error": str(exc)}
