"""Central Orchestrator Agent — coordinates all seven agents."""
from __future__ import annotations

import asyncio
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.core.logging import get_logger
from app.intelligence.call_analysis import analyze_transcript
from app.intelligence.url_analysis import analyze_url_structure
from app.intelligence.device_analysis import analyze_device_evidence
from app.integrations import urlhaus_client, virustotal_client, openai_client
from app.risk.scoring import calculate_risk
from app.realtime.websocket import manager

logger = get_logger("orchestrator")


async def _emit(analysis_id: str, event_type: str, status: str, agent_id: Optional[str] = None, payload: Optional[dict] = None):
    """Emit a WebSocket event and return it."""
    return await manager.broadcast_event(
        analysis_id=analysis_id,
        event_type=event_type,
        status=status,
        agent_id=agent_id,
        payload=payload,
    )


async def run_full_analysis(
    analysis_id: str,
    transcript: Optional[str] = None,
    language: str = "auto",
    url: Optional[str] = None,
    remote_access_apps: Optional[list] = None,
    suspicious_permissions: Optional[list] = None,
    custom_device_evidence: Optional[str] = None,
    is_demo: bool = False,
) -> Dict[str, Any]:
    """
    Run the full 7-agent analysis pipeline.
    Each agent's result is independent — one failure does NOT stop others.
    Returns a complete result dict with all findings.
    """
    results: Dict[str, Any] = {
        "analysis_id": analysis_id,
        "call_result": None,
        "link_result": None,
        "device_result": None,
        "risk_assessment": None,
        "explanation": None,
        "intervention": None,
        "agent_executions": [],
        "is_demo": is_demo,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "status": "running",
    }

    await _emit(analysis_id, "analysis.started", "running", payload={"is_demo": is_demo})

    # ─── Agent 2: Call Intelligence ─────────────────────────────────────────
    call_exec = _start_exec("call_intelligence", "Call Intelligence Agent", analysis_id)
    if transcript:
        await _emit(analysis_id, "call_analysis_started", "running", agent_id="call_intelligence")
        try:
            call_result = analyze_transcript(transcript, language, is_demo)
            results["call_result"] = call_result
            call_exec.update({"status": "completed", "completed_at": _now(), "output_summary": call_result.get("summary", "")})
            await _emit(analysis_id, "call_analysis_completed", "completed",
                       agent_id="call_intelligence",
                       payload={"risk_score": call_result["risk_score"], "risk_level": call_result["risk_level"]})
        except Exception as exc:
            logger.error("call_agent_error", error=str(exc), analysis_id=analysis_id)
            call_exec.update({"status": "failed", "error_message": str(exc), "completed_at": _now()})
            await _emit(analysis_id, "call_analysis_failed", "failed", agent_id="call_intelligence", payload={"error": str(exc)})
    else:
        call_exec.update({"status": "idle", "output_summary": "No transcript provided"})

    call_exec["duration_ms"] = _duration_ms(call_exec)
    results["agent_executions"].append(call_exec)

    # ─── Agent 3: Link Intelligence (parallel URLhaus + VT) ────────────────
    link_exec = _start_exec("link_intelligence", "Link Intelligence Agent", analysis_id)
    if url:
        await _emit(analysis_id, "link_analysis_started", "running", agent_id="link_intelligence")
        try:
            # Run URLhaus and VirusTotal concurrently
            uh_task = urlhaus_client.lookup_url(url)
            vt_task = virustotal_client.analyze_url(url)
            urlhaus_r, virustotal_r = await asyncio.gather(uh_task, vt_task, return_exceptions=True)

            if isinstance(urlhaus_r, Exception):
                urlhaus_r = {"lookup_status": "failed", "threat_status": "unknown", "error": str(urlhaus_r)}
            if isinstance(virustotal_r, Exception):
                virustotal_r = {"analysis_status": "failed", "malicious_count": 0, "error": str(virustotal_r)}

            link_result = analyze_url_structure(url, urlhaus_r, virustotal_r, is_demo)
            # Attach raw provider results
            link_result["urlhaus_result"] = urlhaus_r
            link_result["virustotal_result"] = virustotal_r
            results["link_result"] = link_result
            link_exec.update({"status": "completed", "completed_at": _now(), "output_summary": link_result.get("summary", "")})
            await _emit(analysis_id, "link_analysis_completed", "completed",
                       agent_id="link_intelligence",
                       payload={"risk_score": link_result["risk_score"], "risk_level": link_result["risk_level"]})
        except Exception as exc:
            logger.error("link_agent_error", error=str(exc), analysis_id=analysis_id)
            link_exec.update({"status": "failed", "error_message": str(exc), "completed_at": _now()})
            await _emit(analysis_id, "link_analysis_failed", "failed", agent_id="link_intelligence", payload={"error": str(exc)})
    else:
        link_exec.update({"status": "idle", "output_summary": "No URL provided"})

    link_exec["duration_ms"] = _duration_ms(link_exec)
    results["agent_executions"].append(link_exec)

    # ─── Agent 4: Device Guardian ──────────────────────────────────────────
    device_exec = _start_exec("device_guardian", "Device Guardian Agent", analysis_id)
    apps = remote_access_apps or []
    perms = suspicious_permissions or []
    if apps or perms or custom_device_evidence:
        await _emit(analysis_id, "device_analysis_started", "running", agent_id="device_guardian")
        try:
            device_result = analyze_device_evidence(apps, perms, custom_device_evidence, is_demo)
            results["device_result"] = device_result
            device_exec.update({"status": "completed", "completed_at": _now(), "output_summary": device_result.get("summary", "")})
            await _emit(analysis_id, "device_analysis_completed", "completed",
                       agent_id="device_guardian",
                       payload={"risk_score": device_result["risk_score"], "risk_level": device_result["risk_level"]})
        except Exception as exc:
            logger.error("device_agent_error", error=str(exc), analysis_id=analysis_id)
            device_exec.update({"status": "failed", "error_message": str(exc), "completed_at": _now()})
            await _emit(analysis_id, "device_analysis_failed", "failed", agent_id="device_guardian", payload={"error": str(exc)})
    else:
        device_exec.update({"status": "idle", "output_summary": "No device evidence provided"})

    device_exec["duration_ms"] = _duration_ms(device_exec)
    results["agent_executions"].append(device_exec)

    # ─── Agent 5: Scam Prediction ──────────────────────────────────────────
    pred_exec = _start_exec("scam_prediction", "Scam Prediction Agent", analysis_id)
    await _emit(analysis_id, "prediction_started", "running", agent_id="scam_prediction")

    # ─── Agent 6 (integrated): Deterministic Risk Engine ──────────────────
    try:
        risk_result = calculate_risk(
            call_result=results.get("call_result"),
            link_result=results.get("link_result"),
            device_result=results.get("device_result"),
        )
        results["risk_assessment"] = {
            "id": str(uuid.uuid4()),
            "analysis_id": analysis_id,
            "overall_score": risk_result.risk_score,
            "risk_level": risk_result.risk_level,
            "call_risk_score": risk_result.call_risk_score,
            "link_risk_score": risk_result.link_risk_score,
            "device_risk_score": risk_result.device_risk_score,
            "ai_confidence": risk_result.ai_confidence,
            "scam_category": risk_result.scam_category,
            "predicted_stage": risk_result.predicted_stage,
            "contributing_signals": risk_result.contributing_signals,
            "missing_signals": risk_result.missing_signals,
            "explanation": risk_result.explanation,
            "scoring_version": risk_result.scoring_version,
            "is_demo": is_demo,
            "created_at": _now(),
        }
        pred_exec.update({"status": "completed", "completed_at": _now(),
                          "output_summary": f"Risk: {risk_result.risk_score:.0f} ({risk_result.risk_level})"})
        await _emit(analysis_id, "prediction_completed", "completed",
                   agent_id="scam_prediction",
                   payload={"risk_score": risk_result.risk_score, "risk_level": risk_result.risk_level,
                            "predicted_stage": risk_result.predicted_stage})
        await _emit(analysis_id, "risk.updated", "completed",
                   payload=results["risk_assessment"])
    except Exception as exc:
        logger.error("prediction_error", error=str(exc), analysis_id=analysis_id)
        pred_exec.update({"status": "failed", "error_message": str(exc), "completed_at": _now()})

    pred_exec["duration_ms"] = _duration_ms(pred_exec)
    results["agent_executions"].append(pred_exec)

    # ─── Agent 6: OpenAI Explanation ─────────────────────────────────────
    expl_exec = _start_exec("explanation", "Explanation Agent", analysis_id)
    await _emit(analysis_id, "explanation_started", "running", agent_id="explanation")
    try:
        risk_data = results.get("risk_assessment", {})
        explanation = await openai_client.generate_explanation(
            risk_score=risk_data.get("overall_score", 0),
            risk_level=risk_data.get("risk_level", "low"),
            call_findings=results.get("call_result"),
            link_findings=results.get("link_result"),
            device_findings=results.get("device_result"),
            contributing_signals=risk_data.get("contributing_signals"),
            is_demo=is_demo,
        )
        results["explanation"] = explanation
        expl_exec.update({"status": "completed", "completed_at": _now(),
                          "output_summary": explanation.get("status", "")})
        await _emit(analysis_id, "explanation_completed", "completed",
                   agent_id="explanation",
                   payload={"status": explanation.get("status")})
    except Exception as exc:
        logger.error("explanation_error", error=str(exc), analysis_id=analysis_id)
        expl_exec.update({"status": "failed", "error_message": str(exc), "completed_at": _now()})

    expl_exec["duration_ms"] = _duration_ms(expl_exec)
    results["agent_executions"].append(expl_exec)

    # ─── Agent 7: Safety Intervention ───────────────────────────────────
    intv_exec = _start_exec("safety_intervention", "Safety Intervention Agent", analysis_id)
    risk_data = results.get("risk_assessment", {})
    risk_level = risk_data.get("risk_level", "low")
    risk_score = risk_data.get("overall_score", 0)

    intervention = _build_intervention(
        analysis_id=analysis_id,
        risk_level=risk_level,
        risk_score=risk_score,
        call_result=results.get("call_result"),
        link_result=results.get("link_result"),
        device_result=results.get("device_result"),
        explanation=results.get("explanation"),
        is_demo=is_demo,
    )
    results["intervention"] = intervention
    intv_exec.update({"status": "completed", "completed_at": _now(),
                      "output_summary": intervention.get("trigger_reason", "")})

    intv_exec["duration_ms"] = _duration_ms(intv_exec)
    results["agent_executions"].append(intv_exec)

    if risk_level in ("high", "critical"):
        await _emit(analysis_id, "intervention.recommended", "completed",
                   agent_id="safety_intervention",
                   payload={"risk_level": risk_level, "risk_score": risk_score})

    # ─── Orchestrator: Analysis Completed ───────────────────────────────
    orch_exec = _start_exec("orchestrator", "Central Orchestrator Agent", analysis_id)
    results["completed_at"] = _now()
    results["status"] = "completed"
    orch_exec.update({"status": "completed", "completed_at": _now()})
    orch_exec["duration_ms"] = _duration_ms(orch_exec)
    results["agent_executions"].insert(0, orch_exec)

    await _emit(analysis_id, "analysis.completed", "completed",
               agent_id="orchestrator",
               payload={"risk_score": risk_data.get("overall_score", 0),
                        "risk_level": risk_data.get("risk_level", "low")})

    return results


def _build_intervention(
    analysis_id: str,
    risk_level: str,
    risk_score: float,
    call_result, link_result, device_result, explanation, is_demo: bool,
) -> dict:
    evidence_summary = []
    if call_result and call_result.get("risk_score", 0) > 0:
        evidence_summary.append(f"Call analysis: {call_result.get('summary', '')}")
    if link_result and link_result.get("risk_score", 0) > 0:
        evidence_summary.append(f"Link analysis: {link_result.get('summary', '')}")
    if device_result and device_result.get("risk_score", 0) > 0:
        evidence_summary.append(f"Device analysis: {device_result.get('summary', '')}")

    trigger_reason = _trigger_reason(risk_level, risk_score, evidence_summary)
    recommended = _intervention_actions(risk_level)

    return {
        "id": str(uuid.uuid4()),
        "analysis_id": analysis_id,
        "risk_level": risk_level,
        "trigger_reason": trigger_reason,
        "evidence_summary": evidence_summary,
        "recommended_action": recommended,
        "user_acknowledged": False,
        "safety_hold_active": risk_level in ("high", "critical"),
        "is_simulated": is_demo,
        "created_at": _now(),
    }


def _trigger_reason(risk_level: str, score: float, evidence: list) -> str:
    if risk_level == "critical":
        return f"CRITICAL RISK ({score:.0f}/100): Potential social-engineering scam detected. Immediate protective action required."
    if risk_level == "high":
        return f"HIGH RISK ({score:.0f}/100): Suspicious indicators detected across multiple channels."
    if risk_level == "medium":
        return f"MEDIUM RISK ({score:.0f}/100): Some suspicious signals detected. Exercise caution."
    return f"LOW RISK ({score:.0f}/100): No significant threat indicators detected."


def _intervention_actions(risk_level: str) -> str:
    if risk_level == "critical":
        return (
            "STOP IMMEDIATELY. Do not share OTP, PIN, or password with anyone. "
            "Do not install any remote-access application. "
            "Do not authorize any UPI payment. "
            "Disconnect and call your bank using the official number on the back of your card."
        )
    if risk_level == "high":
        return "Do not proceed. Verify the caller's identity using official channels before taking any action."
    if risk_level == "medium":
        return "Exercise caution. Do not share sensitive information. Verify before proceeding."
    return "No immediate action required. Continue to exercise normal caution."


def _start_exec(agent_id: str, agent_name: str, analysis_id: str) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "agent_id": agent_id,
        "agent_name": agent_name,
        "analysis_id": analysis_id,
        "status": "running",
        "stage": "executing",
        "started_at": _now(),
        "completed_at": None,
        "duration_ms": None,
        "output_summary": None,
        "error_message": None,
    }


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _duration_ms(exec_dict: dict) -> Optional[int]:
    try:
        start = datetime.fromisoformat(exec_dict["started_at"])
        end_str = exec_dict.get("completed_at")
        if end_str:
            end = datetime.fromisoformat(end_str)
            return int((end - start).total_seconds() * 1000)
    except Exception:
        pass
    return None


# Demo scenarios for hackathon demonstrations
DEMO_SCENARIOS = {
    "low_risk": {
        "transcript": "Hello, I am calling about your account. Please verify your details.",
        "language": "english",
        "url": None,
        "remote_access_apps": [],
        "suspicious_permissions": [],
        "custom_device_evidence": None,
    },
    "high_risk": {
        "transcript": (
            "This is SBI bank officer. Your account will be blocked in 2 hours due to KYC expiry. "
            "You must update KYC immediately. Please share the OTP sent to your mobile number now. "
            "This is very urgent. Do not delay."
        ),
        "language": "english",
        "url": "http://sbi-kyc-update.xyz/verify",
        "remote_access_apps": [],
        "suspicious_permissions": ["Accessibility Service"],
        "custom_device_evidence": "Caller asked me to click a link",
    },
    "critical_risk": {
        "transcript": (
            "Namaste. Main RBI cyber crime department se bol raha hoon. "
            "Aapka account fraudulent activity ke liye use ho raha hai. "
            "Aapko abhi ₹50,000 transfer karne honge ek safe account mein. "
            "OTP share karo turant. Nahi toh police action hoga."
        ),
        "language": "hindi",
        "url": "upi://pay?pa=cybercrime-refund@frauddomain&pn=CyberCrime+Refund&am=50000",
        "remote_access_apps": ["AnyDesk", "TeamViewer"],
        "suspicious_permissions": ["Screen Recording", "Accessibility Service", "Device Admin"],
        "custom_device_evidence": (
            "Caller asked me to install AnyDesk and share the 9-digit code. "
            "Then asked me to open my banking app and share OTP."
        ),
    },
}
