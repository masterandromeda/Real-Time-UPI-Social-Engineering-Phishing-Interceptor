"""Sarvam AI client — consent-based speech transcription and NLU.

Uses the Sarvam AI API for Hindi/Punjabi/Hinglish speech-to-text
and text understanding. All audio analysis is consent-based only.
"""
from __future__ import annotations

import time
from typing import Optional

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("sarvam_client")
settings = get_settings()

SARVAM_BASE_URL = "https://api.sarvam.ai"


async def transcribe_audio(
    audio_bytes: bytes,
    filename: str,
    language_code: str = "unknown",
    model: str = "saarika:v2",
) -> dict:
    """
    Transcribe audio using Sarvam AI speech-to-text.
    Returns a structured result dict — never raises silently.
    """
    if not settings.sarvam_configured:
        return {
            "provider": "sarvam_ai",
            "transcription_status": "not_configured",
            "transcript": None,
            "detected_language": None,
            "error_status": "SARVAM_API_KEY not configured",
            "execution_time": 0,
        }

    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{SARVAM_BASE_URL}/speech-to-text",
                headers={"api-subscription-key": settings.sarvam_api_key},
                files={"file": (filename, audio_bytes, "audio/mpeg")},
                data={
                    "model": model,
                    "language_code": language_code,
                    "with_timestamps": "false",
                    "with_disfluencies": "false",
                },
            )
            elapsed = int((time.time() - start) * 1000)

            if response.status_code == 200:
                data = response.json()
                return {
                    "provider": "sarvam_ai",
                    "transcription_status": "completed",
                    "transcript": data.get("transcript", ""),
                    "detected_language": data.get("language_code", language_code),
                    "error_status": None,
                    "execution_time": elapsed,
                    "raw_response": data,
                }
            else:
                logger.warning("sarvam_transcribe_error", status=response.status_code, body=response.text[:200])
                return {
                    "provider": "sarvam_ai",
                    "transcription_status": "failed",
                    "transcript": None,
                    "detected_language": None,
                    "error_status": f"HTTP {response.status_code}",
                    "execution_time": elapsed,
                }
    except httpx.TimeoutException:
        return {
            "provider": "sarvam_ai",
            "transcription_status": "timeout",
            "transcript": None,
            "detected_language": None,
            "error_status": "Request timed out",
            "execution_time": int((time.time() - start) * 1000),
        }
    except Exception as exc:
        logger.error("sarvam_transcribe_exception", error=str(exc))
        return {
            "provider": "sarvam_ai",
            "transcription_status": "failed",
            "transcript": None,
            "detected_language": None,
            "error_status": str(exc),
            "execution_time": int((time.time() - start) * 1000),
        }


async def check_sarvam_health() -> dict:
    """Returns connectivity status for Sarvam AI."""
    if not settings.sarvam_configured:
        return {"configured": False, "status": "not_configured", "latency_ms": None, "error": None}
    # We cannot safely health-check without making a billable call,
    # so we just verify the key exists and report configured.
    return {
        "configured": True,
        "status": "configured_not_verified",
        "latency_ms": None,
        "error": "Health check requires a real transcription request",
    }
