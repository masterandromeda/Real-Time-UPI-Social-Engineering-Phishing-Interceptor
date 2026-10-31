"""OpenAI explanation client.

OpenAI is used ONLY as an explanation layer.
The risk score is calculated deterministically by the backend Risk Engine.
OpenAI must NOT invent evidence. All prompts are structured and bounded.
"""
from __future__ import annotations

import time
from typing import Any, Dict, Optional

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("openai_client")
settings = get_settings()


async def generate_explanation(
    risk_score: float,
    risk_level: str,
    call_findings: Optional[Dict[str, Any]],
    link_findings: Optional[Dict[str, Any]],
    device_findings: Optional[Dict[str, Any]],
    contributing_signals: Optional[Dict[str, Any]],
    is_demo: bool = False,
) -> dict:
    """
    Generate a human-readable explanation of the risk assessment.
    Returns structured result. Falls back gracefully if OpenAI is unavailable.
    """
    if not settings.openai_configured:
        return {
            "status": "not_configured",
            "explanation": (
                "Explanation requires OpenAI API key configuration. "
                "Risk score was calculated deterministically by the backend Risk Engine."
            ),
            "incident_summary": _build_fallback_summary(risk_score, risk_level, call_findings, link_findings, device_findings),
            "next_scam_stage": _infer_next_stage(risk_score, call_findings, link_findings, device_findings),
            "recommended_actions": _default_recommendations(risk_level),
            "execution_time": 0,
            "error": "OPENAI_API_KEY not configured",
        }

    start = time.time()
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)

        evidence_parts = []
        if call_findings and call_findings.get("risk_score", 0) > 0:
            evidence_parts.append(
                f"CALL INTELLIGENCE (risk={call_findings.get('risk_score', 0):.0f}/100): "
                f"Impersonation={'yes' if call_findings.get('impersonation_detected') else 'no'}, "
                f"urgency_indicators={call_findings.get('urgency_indicators', [])}, "
                f"fear_indicators={call_findings.get('fear_indicators', [])}"
            )
        if link_findings and link_findings.get("risk_score", 0) > 0:
            evidence_parts.append(
                f"LINK INTELLIGENCE (risk={link_findings.get('risk_score', 0):.0f}/100): "
                f"urlhaus={link_findings.get('urlhaus_status', 'unknown')}, "
                f"virustotal_malicious={link_findings.get('virustotal_malicious', 0)}"
            )
        if device_findings and device_findings.get("risk_score", 0) > 0:
            evidence_parts.append(
                f"DEVICE GUARDIAN (risk={device_findings.get('risk_score', 0):.0f}/100): "
                f"remote_access_apps={device_findings.get('remote_access_apps', [])}, "
                f"suspicious_permissions={device_findings.get('suspicious_permissions', [])}"
            )

        if not evidence_parts:
            evidence_parts = ["No suspicious signals detected in submitted evidence."]

        prompt = f"""You are the Explanation Agent for UPI Sentinel, a social-engineering scam detection platform.

Your task is to explain WHY the backend Risk Engine calculated a risk score of {risk_score:.0f}/100 (level: {risk_level.upper()}).

IMPORTANT RULES:
- Only reference evidence listed below. Do NOT invent evidence.
- The risk score was calculated by the backend, not by you.
- {"Mark this as DEMO/SIMULATED" if is_demo else "This is a real analysis result."}
- Be concise, factual, and user-friendly.

EVIDENCE FROM BACKEND ANALYSIS:
{chr(10).join(f'- {e}' for e in evidence_parts)}

Respond in JSON with these exact keys:
{{
  "incident_summary": "2-3 sentence summary of what was detected",
  "why_suspicious": "explain the specific signals that contributed to the risk score",
  "next_scam_stage": "likely next step the scammer would attempt (be specific)",
  "recommended_actions": ["action 1", "action 2", "action 3"]
}}"""

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=600,
            temperature=0.1,
        )

        elapsed = int((time.time() - start) * 1000)
        content = response.choices[0].message.content or "{}"

        import json
        parsed = json.loads(content)

        return {
            "status": "completed",
            "explanation": parsed.get("why_suspicious", ""),
            "incident_summary": parsed.get("incident_summary", ""),
            "next_scam_stage": parsed.get("next_scam_stage", ""),
            "recommended_actions": parsed.get("recommended_actions", _default_recommendations(risk_level)),
            "execution_time": elapsed,
            "error": None,
        }

    except Exception as exc:
        logger.error("openai_explanation_exception", error=str(exc))
        return {
            "status": "failed",
            "explanation": _build_fallback_summary(risk_score, risk_level, call_findings, link_findings, device_findings),
            "incident_summary": _build_fallback_summary(risk_score, risk_level, call_findings, link_findings, device_findings),
            "next_scam_stage": _infer_next_stage(risk_score, call_findings, link_findings, device_findings),
            "recommended_actions": _default_recommendations(risk_level),
            "execution_time": int((time.time() - start) * 1000),
            "error": str(exc),
        }


def _build_fallback_summary(risk_score: float, risk_level: str, call_f, link_f, device_f) -> str:
    parts = []
    if call_f and call_f.get("risk_score", 0) > 0:
        parts.append("suspicious call patterns")
    if link_f and link_f.get("risk_score", 0) > 0:
        parts.append("suspicious URL indicators")
    if device_f and device_f.get("risk_score", 0) > 0:
        parts.append("device-risk evidence")
    signal_str = " and ".join(parts) if parts else "submitted evidence"
    return (
        f"Risk score {risk_score:.0f}/100 ({risk_level.upper()}) calculated from {signal_str}. "
        f"OpenAI explanation unavailable — deterministic analysis complete."
    )


def _infer_next_stage(risk_score: float, call_f, link_f, device_f) -> str:
    if device_f and device_f.get("remote_access_apps"):
        return "Attacker may attempt to observe payment authorization via remote screen access"
    if link_f and link_f.get("risk_score", 0) > 40:
        return "User may be directed to a phishing page to capture payment credentials or OTP"
    if call_f and call_f.get("impersonation_detected"):
        return "Caller may escalate urgency and request OTP or payment authorization"
    return "Continue monitoring — insufficient evidence for precise stage prediction"


def _default_recommendations(risk_level: str) -> list:
    base = [
        "Do not share OTP, PIN, or password with any caller",
        "Do not install any app at the request of an unknown caller",
        "Verify caller identity using official bank contact numbers",
    ]
    if risk_level in ("high", "critical"):
        base.insert(0, "STOP: Do not proceed with any payment until this alert is reviewed")
        base.append("Report this incident to your bank's fraud helpline immediately")
    return base


async def check_openai_health() -> dict:
    if not settings.openai_configured:
        return {"configured": False, "status": "not_configured", "latency_ms": None, "error": None}
    start = time.time()
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        models = await client.models.list()
        elapsed = int((time.time() - start) * 1000)
        return {"configured": True, "status": "connected", "latency_ms": elapsed, "error": None}
    except Exception as exc:
        return {"configured": True, "status": "failed", "latency_ms": None, "error": str(exc)}
