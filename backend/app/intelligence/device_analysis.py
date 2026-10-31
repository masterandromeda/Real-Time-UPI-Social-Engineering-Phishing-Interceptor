"""Device risk evidence analysis for UPI Sentinel.

Web-first model: analyzes user-provided evidence only.
Does NOT claim to inspect installed apps or background processes automatically.
"""
from __future__ import annotations

import time
import uuid
from typing import Dict, List, Optional

# Risk weight for known high-risk remote access apps
REMOTE_ACCESS_APP_WEIGHTS: Dict[str, float] = {
    "AnyDesk": 50.0,
    "TeamViewer": 45.0,
    "QuickSupport": 45.0,
    "AirDroid": 30.0,
    "Zoho Assist": 35.0,
    "RustDesk": 35.0,
    "Chrome Remote Desktop": 20.0,
}

# Risk weight for dangerous Android permissions
PERMISSION_WEIGHTS: Dict[str, float] = {
    "Screen Recording": 35.0,
    "Accessibility Service": 40.0,
    "Device Admin": 45.0,
    "Install Unknown Apps": 30.0,
    "Overlay Permission": 25.0,
    "Notification Access": 15.0,
}

HIGH_RISK_APP_NAMES = {"AnyDesk", "TeamViewer", "QuickSupport"}


def analyze_device_evidence(
    remote_access_apps: List[str],
    suspicious_permissions: List[str],
    custom_evidence: Optional[str] = None,
    is_demo: bool = False,
) -> dict:
    """
    Analyze user-provided device-risk indicators.
    Returns a structured risk result. Does NOT claim automated device monitoring.
    """
    start = time.time()
    evidence_items = []
    risk_score = 0.0

    # ─── Remote Access Apps ──────────────────────────────────────────────────
    for app in remote_access_apps:
        weight = REMOTE_ACCESS_APP_WEIGHTS.get(app, 25.0)
        risk_score += weight
        severity = "critical" if app in HIGH_RISK_APP_NAMES else "high"
        evidence_items.append({
            "type": "remote_access_app",
            "indicator": app,
            "severity": severity,
            "description": f"{app} is a remote-access application. If installed/enabled at the request of an unknown caller, this is a high-risk indicator of device compromise.",
        })

    # ─── Suspicious Permissions ────────────────────────────────────────────
    for perm in suspicious_permissions:
        weight = PERMISSION_WEIGHTS.get(perm, 15.0)
        risk_score += weight
        evidence_items.append({
            "type": "suspicious_permission",
            "indicator": perm,
            "severity": "high",
            "description": f"'{perm}' permission granted. This permission can allow malicious apps to observe or control the device.",
        })

    # ─── Custom Evidence Text Analysis ────────────────────────────────────
    custom_risk = 0.0
    if custom_evidence:
        text = custom_evidence.lower()
        if any(kw in text for kw in ["remote", "screen share", "anydesk", "teamviewer"]):
            custom_risk += 20
            evidence_items.append({
                "type": "custom_evidence",
                "indicator": "remote_access_mention",
                "severity": "high",
                "description": "Custom evidence mentions remote access or screen sharing.",
            })
        if any(kw in text for kw in ["otp", "pin", "password", "share", "tell"]):
            custom_risk += 15
            evidence_items.append({
                "type": "custom_evidence",
                "indicator": "credential_mention",
                "severity": "high",
                "description": "Custom evidence mentions OTP, PIN, or credential sharing.",
            })
        if any(kw in text for kw in ["apk", "download", "install", "unknown"]):
            custom_risk += 20
            evidence_items.append({
                "type": "custom_evidence",
                "indicator": "suspicious_install",
                "severity": "high",
                "description": "Custom evidence suggests installation of an unknown app.",
            })

    risk_score = min(100.0, risk_score + custom_risk)
    risk_level = _score_to_level(risk_score)

    summary = _build_summary(risk_level, remote_access_apps, suspicious_permissions, evidence_items)
    recommended_action = _recommended_action(risk_level, remote_access_apps)

    return {
        "id": str(uuid.uuid4()),
        "remote_access_apps": remote_access_apps,
        "suspicious_permissions": suspicious_permissions,
        "evidence_items": evidence_items,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "summary": summary,
        "recommended_action": recommended_action,
        "is_demo": is_demo,
        "execution_time_ms": int((time.time() - start) * 1000),
    }


def _score_to_level(score: float) -> str:
    if score >= 75: return "critical"
    if score >= 50: return "high"
    if score >= 25: return "medium"
    return "low"


def _build_summary(risk_level, remote_apps, permissions, evidence_items) -> str:
    parts = []
    if remote_apps:
        parts.append(f"Remote-access application(s) detected: {', '.join(remote_apps)}")
    if permissions:
        parts.append(f"Suspicious permission(s) reported: {', '.join(permissions)}")
    if not parts:
        if evidence_items:
            parts.append("Custom evidence analyzed")
        else:
            parts.append("No device-risk indicators reported")
    return ". ".join(parts) + "."


def _recommended_action(risk_level: str, remote_apps: List[str]) -> str:
    if risk_level == "critical" or (remote_apps and any(a in HIGH_RISK_APP_NAMES for a in remote_apps)):
        return (
            "CRITICAL: Immediately uninstall the remote-access application. "
            "Disconnect from the internet. Do NOT proceed with any UPI payment. "
            "Contact your bank's fraud helpline immediately."
        )
    if risk_level == "high":
        return "Remove the remote-access application. Do not authorize any payments until this device is secured."
    if risk_level == "medium":
        return "Review the identified permissions and apps. Do not share OTP or authorize payments on this device."
    return "No high-risk device indicators detected. Continue to exercise normal caution."
