"""URL structural analysis for UPI Sentinel.

Performs local structural/domain analysis in addition to
URLhaus and VirusTotal external lookups.
"""
from __future__ import annotations

import re
import time
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from urllib.parse import urlparse, parse_qs

# SSRF protection: private/reserved IP ranges — never actually browse these
PRIVATE_NETWORKS = [
    r"^(10\.\d+\.\d+\.\d+)",
    r"^(172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)",
    r"^(192\.168\.\d+\.\d+)",
    r"^(127\.\d+\.\d+\.\d+)",
    r"^(localhost)",
    r"^(0\.0\.0\.0)",
    r"^(::1)",
    r"^(fd[0-9a-f]{2}:)",
]

SUSPICIOUS_TLDS = {".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".club",
                   ".online", ".site", ".click", ".download", ".zip"}

HIGH_RISK_TLDS = {".exe", ".app", ".apk"}

UPI_DEEP_LINK_PATTERN = re.compile(r"^upi://pay\?", re.IGNORECASE)


def is_ssrf_risk(url: str) -> bool:
    """Return True if the URL points to a private/internal address."""
    try:
        parsed = urlparse(url)
        host = (parsed.hostname or "").lower()
        for pattern in PRIVATE_NETWORKS:
            if re.match(pattern, host):
                return True
        return False
    except Exception:
        return False


def analyze_url_structure(
    url: str,
    urlhaus_result: Optional[dict] = None,
    virustotal_result: Optional[dict] = None,
    is_demo: bool = False,
) -> dict:
    """
    Combine local structural analysis with provider results.
    Does NOT make external network calls — only analyzes the URL string
    and incorporates pre-fetched provider results.
    """
    start = time.time()

    # ─── Structural Analysis ─────────────────────────────────────────────────
    is_upi = bool(UPI_DEEP_LINK_PATTERN.match(url.strip()))
    threat_categories: List[str] = []
    structural_risk = 0.0

    try:
        parsed = urlparse(url.strip())
        domain = parsed.netloc or parsed.path.split("/")[0]
        scheme = parsed.scheme.lower()
        path = parsed.path.lower()

        # Non-HTTPS
        if scheme == "http" and not is_upi:
            structural_risk += 10
            threat_categories.append("non_https")

        # Suspicious TLD
        for tld in SUSPICIOUS_TLDS:
            if domain.endswith(tld):
                structural_risk += 20
                threat_categories.append(f"suspicious_tld_{tld}")
                break

        # High risk TLD
        for tld in HIGH_RISK_TLDS:
            if domain.endswith(tld) or path.endswith(tld):
                structural_risk += 30
                threat_categories.append("executable_extension")
                break

        # IP address instead of domain
        if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", domain):
            structural_risk += 25
            threat_categories.append("ip_address_url")

        # Deceptive domain patterns
        bank_keywords = ["sbi", "hdfc", "icici", "axis", "kotak", "paytm", "phonepe", "google", "neft", "upi", "npci"]
        for kw in bank_keywords:
            if kw in domain and not domain.startswith(f"{kw}.") and not domain.endswith(f".{kw}.com"):
                structural_risk += 20
                threat_categories.append(f"deceptive_domain_{kw}")
                break

        # Very long URL (obfuscation)
        if len(url) > 200:
            structural_risk += 10
            threat_categories.append("excessively_long_url")

    except Exception:
        domain = ""
        structural_risk = 0

    # ─── Provider Result Integration ─────────────────────────────────────────
    provider_risk = 0.0
    reputation_sources = []
    urlhaus_status = "not_configured"
    vt_malicious = 0
    vt_suspicious = 0

    if urlhaus_result:
        uh_status = urlhaus_result.get("lookup_status", "not_configured")
        threat = urlhaus_result.get("threat_status", "unknown")
        if threat == "malicious":
            provider_risk = max(provider_risk, 80.0)
            urlhaus_status = "malicious"
        elif uh_status == "not_listed":
            urlhaus_status = "not_listed"  # ≠ clean
        elif uh_status in ("timeout", "failed", "api_error"):
            urlhaus_status = "unavailable"
        elif uh_status == "not_configured":
            urlhaus_status = "not_configured"

        reputation_sources.append({
            "name": "URLhaus",
            "status": "malicious" if urlhaus_status == "malicious" else
                      "unavailable" if urlhaus_status == "unavailable" else
                      "not_configured" if urlhaus_status == "not_configured" else
                      "clean",
            "details": urlhaus_result.get("threat_information", {}).get("threat") if urlhaus_status == "malicious" else None,
        })

    if virustotal_result:
        vt_status = virustotal_result.get("analysis_status", "not_configured")
        vt_malicious = virustotal_result.get("malicious_count", 0)
        vt_suspicious = virustotal_result.get("suspicious_count", 0)

        if vt_status == "completed":
            if vt_malicious > 0:
                vt_risk = min(100, 40 + vt_malicious * 8)
                provider_risk = max(provider_risk, float(vt_risk))
            elif vt_suspicious > 0:
                provider_risk = max(provider_risk, 30.0)

        reputation_sources.append({
            "name": "VirusTotal",
            "status": "malicious" if vt_malicious > 0 else
                      "suspicious" if vt_suspicious > 0 else
                      "unavailable" if vt_status in ("failed", "timeout", "rate_limited") else
                      "not_configured" if vt_status == "not_configured" else
                      "pending" if vt_status == "pending" else
                      "clean",
            "details": f"{vt_malicious} malicious, {vt_suspicious} suspicious" if vt_malicious > 0 or vt_suspicious > 0 else None,
        })

    # Final score
    risk_score = min(100.0, structural_risk + provider_risk)
    risk_level = _score_to_level(risk_score)

    summary = _build_summary(risk_level, urlhaus_status, vt_malicious, threat_categories, is_upi)
    recommended_action = _recommended_action(risk_level)

    return {
        "id": str(uuid.uuid4()),
        "url": url,
        "is_upi_deep_link": is_upi,
        "domain": domain,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "urlhaus_status": urlhaus_status,
        "virustotal_malicious": vt_malicious,
        "virustotal_suspicious": vt_suspicious,
        "reputation_sources": reputation_sources,
        "threat_categories": threat_categories,
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


def _build_summary(risk_level, urlhaus_status, vt_malicious, threat_cats, is_upi) -> str:
    parts = []
    if urlhaus_status == "malicious":
        parts.append("URL found in URLhaus malware database")
    if vt_malicious > 0:
        parts.append(f"VirusTotal: {vt_malicious} engine(s) flagged as malicious")
    if "deceptive_domain_sbi" in threat_cats or any("deceptive" in c for c in threat_cats):
        parts.append("Domain appears to impersonate a known financial service")
    if is_upi:
        parts.append("UPI deep link detected")
    if not parts:
        parts.append("No definitive threat confirmed by configured providers")
    return ". ".join(parts) + "."


def _recommended_action(risk_level: str) -> str:
    if risk_level == "critical":
        return "Do NOT click this link. It has been flagged as malicious. Report it to your bank immediately."
    if risk_level == "high":
        return "High risk link. Do not proceed. Verify through official channels only."
    if risk_level == "medium":
        return "Suspicious link. Exercise caution. Do not enter credentials or authorize payments."
    return "No significant threat detected. Continue to exercise normal caution."
