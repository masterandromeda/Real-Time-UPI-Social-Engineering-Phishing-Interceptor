"""Deterministic Risk Scoring Engine for UPI Sentinel.

Risk score is calculated from verified backend evidence only.
OpenAI does NOT set the risk score.
API errors do NOT award points.
Unknown URLs are NOT scored as malicious.

Scoring Version: 1.0
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


SCORING_VERSION = "1.0"

# Blueprint weights
WEIGHT_SOCIAL_ENGINEERING = 30   # Call intelligence signals
WEIGHT_URL_REPUTATION = 25       # Link intelligence signals
WEIGHT_DEVICE_RISK = 25          # Device guardian signals
WEIGHT_SCAM_SEQUENCE = 20        # Combined scam sequence bonus

# Risk thresholds
THRESHOLDS = {
    "low": (0, 24),
    "medium": (25, 49),
    "high": (50, 74),
    "critical": (75, 100),
}


@dataclass
class SignalContribution:
    signal_name: str
    raw_score: float
    weighted_contribution: float
    evidence: List[str] = field(default_factory=list)
    confidence: float = 1.0


@dataclass
class RiskEngineResult:
    risk_score: float
    risk_level: str
    contributing_signals: List[Dict[str, Any]]
    missing_signals: List[str]
    call_risk_score: float
    link_risk_score: float
    device_risk_score: float
    ai_confidence: float
    scam_category: Optional[str]
    predicted_stage: Optional[str]
    explanation: str
    scoring_version: str = SCORING_VERSION


def calculate_risk(
    call_result: Optional[Dict[str, Any]] = None,
    link_result: Optional[Dict[str, Any]] = None,
    device_result: Optional[Dict[str, Any]] = None,
) -> RiskEngineResult:
    """
    Calculate overall risk score from verified analysis results.

    Rules:
    - API errors count as 0, not as threat evidence
    - 'not_listed' in URLhaus ≠ clean
    - Missing evidence is tracked but doesn't add points
    """
    contributions: List[SignalContribution] = []
    missing: List[str] = []

    # ─── 1. Social-Engineering Score (Call Intelligence) ───────────────────────
    call_score = 0.0
    call_evidence: List[str] = []

    if call_result is None:
        missing.append("call_intelligence")
    else:
        raw = call_result.get("risk_score", 0.0)
        call_score = min(100.0, float(raw))
        if call_result.get("impersonation_detected"):
            call_evidence.append("Impersonation language detected")
        call_evidence.extend(call_result.get("urgency_indicators", [])[:3])
        call_evidence.extend(call_result.get("fear_indicators", [])[:3])

    weighted_call = (call_score / 100) * WEIGHT_SOCIAL_ENGINEERING
    contributions.append(SignalContribution(
        signal_name="call_intelligence",
        raw_score=call_score,
        weighted_contribution=weighted_call,
        evidence=call_evidence,
    ))

    # ─── 2. URL Reputation Score (Link Intelligence) ───────────────────────────
    link_score = 0.0
    link_evidence: List[str] = []

    if link_result is None:
        missing.append("link_intelligence")
    else:
        urlhaus_status = link_result.get("urlhaus_status", "not_configured")
        vt_malicious = link_result.get("virustotal_malicious", 0)
        vt_suspicious = link_result.get("virustotal_suspicious", 0)

        # URLhaus: listed = 80 base score
        if urlhaus_status == "malicious":
            link_score = max(link_score, 80.0)
            link_evidence.append(f"URLhaus: URL listed as malicious")
        elif urlhaus_status in ("failed", "timeout", "api_error"):
            link_evidence.append(f"URLhaus: lookup {urlhaus_status} — could not verify")
        elif urlhaus_status in ("not_configured",):
            pass  # Not configured — no points

        # VirusTotal: scale by detections
        if vt_malicious > 0:
            vt_score = min(100, 40 + vt_malicious * 8)
            link_score = max(link_score, float(vt_score))
            link_evidence.append(f"VirusTotal: {vt_malicious} engine(s) flagged as malicious")
        if vt_suspicious > 0 and vt_malicious == 0:
            link_score = max(link_score, 30.0)
            link_evidence.append(f"VirusTotal: {vt_suspicious} engine(s) flagged as suspicious")

        # UPI deep link + unknown domain — structural risk
        if link_result.get("is_upi_deep_link") and not link_result.get("domain_verified"):
            link_score = max(link_score, 20.0)
            link_evidence.append("Unverified UPI deep link detected")

    link_score = min(100.0, link_score)
    weighted_link = (link_score / 100) * WEIGHT_URL_REPUTATION
    contributions.append(SignalContribution(
        signal_name="link_intelligence",
        raw_score=link_score,
        weighted_contribution=weighted_link,
        evidence=link_evidence,
    ))

    # ─── 3. Device Risk Score ─────────────────────────────────────────────────
    device_score = 0.0
    device_evidence: List[str] = []

    if device_result is None:
        missing.append("device_guardian")
    else:
        device_score = float(device_result.get("risk_score", 0.0))
        remote_apps = device_result.get("remote_access_apps", [])
        if remote_apps:
            device_evidence.append(f"Remote-access apps: {', '.join(remote_apps[:3])}")
        perms = device_result.get("suspicious_permissions", [])
        if perms:
            device_evidence.append(f"Suspicious permissions: {', '.join(perms[:3])}")

    device_score = min(100.0, device_score)
    weighted_device = (device_score / 100) * WEIGHT_DEVICE_RISK
    contributions.append(SignalContribution(
        signal_name="device_guardian",
        raw_score=device_score,
        weighted_contribution=weighted_device,
        evidence=device_evidence,
    ))

    # ─── 4. Scam Sequence Bonus ───────────────────────────────────────────────
    # Award extra points when multiple signals align (social engineering attack pattern)
    active_signals = sum(1 for s in [call_score, link_score, device_score] if s > 20)
    sequence_score = 0.0
    sequence_evidence: List[str] = []

    if active_signals >= 3:
        # All three signals — classic combined scam journey
        sequence_score = min(100.0, (call_score + link_score + device_score) / 3)
        sequence_evidence.append("All three risk channels active — combined scam journey pattern")
    elif active_signals >= 2:
        scores = [s for s in [call_score, link_score, device_score] if s > 20]
        sequence_score = min(100.0, max(scores) * 0.6)
        sequence_evidence.append("Two or more risk channels active — partial scam pattern")

    weighted_sequence = (sequence_score / 100) * WEIGHT_SCAM_SEQUENCE
    contributions.append(SignalContribution(
        signal_name="scam_sequence",
        raw_score=sequence_score,
        weighted_contribution=weighted_sequence,
        evidence=sequence_evidence,
    ))

    # ─── 5. Total Risk Score ──────────────────────────────────────────────────
    total = weighted_call + weighted_link + weighted_device + weighted_sequence
    total = min(100.0, round(total, 1))
    risk_level = _score_to_level(total)

    # ─── 6. Confidence ───────────────────────────────────────────────────────
    # Confidence is higher when more signals are available and providers succeeded
    available = 3 - len(missing)
    confidence = (available / 3) * 0.7 + 0.3  # base 30% even with one signal
    confidence = round(min(1.0, confidence), 2)

    # ─── 7. Scam Category & Predicted Stage ──────────────────────────────────
    scam_category = _infer_scam_category(call_result, link_result, device_result)
    predicted_stage = _infer_predicted_stage(call_score, link_score, device_score)

    # ─── 8. Explanation (deterministic) ─────────────────────────────────────
    explanation = _build_explanation(total, risk_level, contributions, missing)

    return RiskEngineResult(
        risk_score=total,
        risk_level=risk_level,
        contributing_signals=[{
            "signal": c.signal_name,
            "raw_score": c.raw_score,
            "weighted_contribution": round(c.weighted_contribution, 1),
            "evidence": c.evidence,
        } for c in contributions],
        missing_signals=missing,
        call_risk_score=call_score,
        link_risk_score=link_score,
        device_risk_score=device_score,
        ai_confidence=confidence,
        scam_category=scam_category,
        predicted_stage=predicted_stage,
        explanation=explanation,
    )


def _score_to_level(score: float) -> str:
    if score >= 75:
        return "critical"
    if score >= 50:
        return "high"
    if score >= 25:
        return "medium"
    return "low"


def _infer_scam_category(call_r, link_r, device_r) -> Optional[str]:
    if call_r and call_r.get("impersonation_detected"):
        urgency = call_r.get("urgency_indicators", [])
        for u in urgency:
            if isinstance(u, str):
                u_lower = u.lower()
                if "bank" in u_lower or "account" in u_lower or "rbi" in u_lower:
                    return "bank_impersonation"
                if "police" in u_lower or "government" in u_lower or "arrest" in u_lower:
                    return "government_impersonation"
                if "tech" in u_lower or "support" in u_lower or "microsoft" in u_lower:
                    return "tech_support_scam"
    return "unknown"


def _infer_predicted_stage(call_score: float, link_score: float, device_score: float) -> str:
    if device_score > 60:
        return "device_compromise"
    if link_score > 60:
        return "link_delivery"
    if call_score > 60:
        return "urgency_creation"
    if call_score > 30 or link_score > 20:
        return "trust_building"
    return "initial_contact"


def _build_explanation(score: float, level: str, contributions: List[SignalContribution], missing: List[str]) -> str:
    active = [c for c in contributions if c.weighted_contribution > 0]
    if not active:
        return f"Risk score: {score:.0f}/100 ({level.upper()}). No suspicious signals detected in submitted evidence."

    parts = [f"Risk score: {score:.0f}/100 ({level.upper()})."]
    for c in active:
        if c.weighted_contribution > 0:
            parts.append(f"{c.signal_name.replace('_', ' ').title()}: {c.raw_score:.0f}/100 → +{c.weighted_contribution:.1f} pts")
            for ev in c.evidence[:2]:
                parts.append(f"  • {ev}")

    if missing:
        parts.append(f"Missing signals (not analyzed): {', '.join(missing)}")

    return " | ".join(parts)
