"""Call transcript analysis using pattern matching + Sarvam AI.

This module performs local pattern-based analysis of transcripts
in addition to calling Sarvam AI when configured.
"""
from __future__ import annotations

import re
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

IMPERSONATION_PATTERNS = [
    # Bank impersonation
    r"\b(rbi|reserve bank|sbi|hdfc|icici|axis bank|kotak|yes bank|paytm bank|phonepe)\b",
    r"\b(bank officer|branch manager|bank executive|helpline|customer care)\b",
    r"\b(kyc|kyc expir|kyc update|account block|account suspend|account freez)\b",
    # Government/authority
    r"\b(police|cbi|cyber crime|enforcement|income tax|aadhaar|uida[ie]|customs|narcotics)\b",
    r"\b(arrest|legal action|court|fir|criminal case|warrant)\b",
    # Tech support
    r"\b(microsoft|windows|computer virus|tech support|remote access|anydesk|teamviewer)\b",
]

URGENCY_PATTERNS = [
    r"\b(urgent|immediately|right now|within \d+ (minutes?|hours?))\b",
    r"\b(last chance|final warning|expire[sd]?|deadline|today only)\b",
    r"\b(block(ed)?|suspend(ed)?|freez(e|ed)?|deactivat(e|ed)?)\b",
    r"\b(don'?t delay|act now|hurry|quick(ly)?|fast)\b",
]

FEAR_PATTERNS = [
    r"\b(arrested?|jail|prison|criminal|police|lawsuit|legal|court)\b",
    r"\b(lose|lost|stolen|fraud|scam|hack(ed)?|compromis(e|ed)?)\b",
    r"\b(penalty|fine|consequences|serious)\b",
    r"\b(don'?t tell|don'?t share|secret|confidential|private)\b",
]

OTP_PAYMENT_PATTERNS = [
    r"\b(otp|one.?time.?password|pin|password)\b",
    r"\b(share|send|tell|provide|give).{0,20}(otp|pin|password)\b",
    r"\b(upi|gpay|phonepe|paytm|neft|imps|transfer)\b",
    r"\b(\d{4,8})\b",  # numeric codes
]


def analyze_transcript(
    transcript: str,
    language: str = "auto",
    is_demo: bool = False,
) -> dict:
    """
    Analyze a conversation transcript for social-engineering patterns.
    Returns structured findings — does NOT require Sarvam AI.
    """
    start = time.time()
    text = transcript.lower()

    urgency_found = _find_patterns(text, URGENCY_PATTERNS)
    fear_found = _find_patterns(text, FEAR_PATTERNS)
    impersonation_matches = _find_patterns(text, IMPERSONATION_PATTERNS)
    otp_payment_matches = _find_patterns(text, OTP_PAYMENT_PATTERNS)

    impersonation_detected = len(impersonation_matches) >= 1

    # Score calculation
    score = 0.0
    if impersonation_detected:
        score += 35
    score += min(25, len(urgency_found) * 8)
    score += min(20, len(fear_found) * 7)
    score += min(15, len(otp_payment_matches) * 5)
    score = min(100.0, score)

    risk_level = _score_to_level(score)
    confidence = min(1.0, 0.4 + (len(urgency_found) + len(fear_found) + len(impersonation_matches)) * 0.1)

    # Build suspicious phrases list
    suspicious_phrases = []
    for pattern_list, category in [
        (impersonation_matches, "impersonation"),
        (urgency_found, "urgency"),
        (fear_found, "fear"),
        (otp_payment_matches, "payment_pressure"),
    ]:
        for match in pattern_list[:3]:
            suspicious_phrases.append({
                "text": match,
                "category": category,
                "severity": "high" if score >= 50 else "medium",
                "position": transcript.lower().find(match),
            })

    # Summary
    concerns = []
    if impersonation_detected:
        concerns.append("authority impersonation language")
    if urgency_found:
        concerns.append("urgency/pressure tactics")
    if fear_found:
        concerns.append("fear/threat language")
    if otp_payment_matches:
        concerns.append("OTP or payment request indicators")

    if concerns:
        summary = f"Transcript contains {', '.join(concerns)}."
    else:
        summary = "No significant social-engineering patterns detected in this transcript."

    recommended_action = _recommended_action(risk_level, impersonation_detected)

    return {
        "id": str(uuid.uuid4()),
        "transcript": transcript[:500],  # truncated for privacy
        "language": language,
        "risk_score": score,
        "risk_level": risk_level,
        "impersonation_detected": impersonation_detected,
        "urgency_indicators": urgency_found[:5],
        "fear_indicators": fear_found[:5],
        "suspicious_phrases": suspicious_phrases[:10],
        "provider_status": "local_analysis",
        "confidence": round(confidence, 2),
        "summary": summary,
        "recommended_action": recommended_action,
        "is_demo": is_demo,
        "execution_time_ms": int((time.time() - start) * 1000),
    }


def _find_patterns(text: str, patterns: List[str]) -> List[str]:
    found = []
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for m in matches:
            # re.findall returns strings or tuples (for groups) — flatten to string
            if isinstance(m, tuple):
                found.extend(s for s in m if s)
            elif isinstance(m, str) and m:
                found.append(m)
    return list(set(found))


def _score_to_level(score: float) -> str:
    if score >= 75: return "critical"
    if score >= 50: return "high"
    if score >= 25: return "medium"
    return "low"


def _recommended_action(risk_level: str, impersonation: bool) -> str:
    if risk_level == "critical":
        return "STOP IMMEDIATELY. Do not share OTP, PIN, or personal details. Hang up and call your bank using the official number on the back of your card."
    if risk_level == "high":
        return "High risk detected. Do not share OTP or authorize any payment. Verify the caller's identity independently."
    if risk_level == "medium":
        return "Suspicious patterns detected. Exercise caution. Do not share sensitive information until you can verify the caller."
    return "No immediate risk detected. Continue to exercise normal caution."
