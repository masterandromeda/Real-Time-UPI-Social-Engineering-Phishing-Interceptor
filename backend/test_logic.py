"""Quick logic tests — run with: python test_logic.py"""
import sys
sys.path.insert(0, ".")

from app.intelligence.call_analysis import analyze_transcript
from app.intelligence.url_analysis import analyze_url_structure
from app.intelligence.device_analysis import analyze_device_evidence
from app.risk.scoring import calculate_risk

def test_call_analysis():
    r = analyze_transcript(
        "This is SBI bank officer. Your account will be blocked. Share your OTP immediately. Do not delay.",
        "english"
    )
    assert r["risk_score"] > 0, "Call risk score should be > 0"
    assert r["risk_level"] in ("low", "medium", "high", "critical")
    assert r["impersonation_detected"] == True, f"Impersonation should be detected, got: {r}"
    print(f"  call: score={r['risk_score']:.0f}, level={r['risk_level']}, impersonation={r['impersonation_detected']}")

def test_url_analysis():
    r = analyze_url_structure("http://sbi-kyc-update.xyz/verify")
    assert r["risk_score"] > 0, "URL risk score should be > 0 for suspicious URL"
    assert r["risk_level"] in ("low", "medium", "high", "critical")
    print(f"  url: score={r['risk_score']:.0f}, level={r['risk_level']}, domain={r['domain']}")

def test_device_analysis():
    r = analyze_device_evidence(
        ["AnyDesk", "TeamViewer"],
        ["Screen Recording", "Accessibility Service"]
    )
    assert r["risk_score"] > 50, f"Device risk should be > 50 with AnyDesk + Screen Recording, got {r['risk_score']}"
    assert r["risk_level"] in ("high", "critical")
    print(f"  device: score={r['risk_score']:.0f}, level={r['risk_level']}")

def test_risk_engine():
    call_r = analyze_transcript("SBI officer. Account blocked. Share OTP now.", "english")
    url_r = analyze_url_structure("http://sbi-kyc-update.xyz/verify")
    dev_r = analyze_device_evidence(["AnyDesk"], ["Screen Recording"])
    
    risk = calculate_risk(call_r, url_r, dev_r)
    assert risk.risk_score > 0
    assert risk.risk_level in ("low", "medium", "high", "critical")
    assert risk.scoring_version == "1.0"
    print(f"  risk engine: total={risk.risk_score:.1f}, level={risk.risk_level}, category={risk.scam_category}, stage={risk.predicted_stage}")
    print(f"  contributing signals: {[s['signal'] for s in risk.contributing_signals]}")

def test_no_evidence():
    """Risk engine with no inputs should return 0 risk."""
    risk = calculate_risk()
    assert risk.risk_score == 0.0, f"Risk with no evidence should be 0, got {risk.risk_score}"
    assert risk.risk_level == "low"
    assert len(risk.missing_signals) == 3
    print(f"  no evidence: score={risk.risk_score}, missing={risk.missing_signals}")

def test_ssrf_protection():
    from app.intelligence.url_analysis import is_ssrf_risk
    assert is_ssrf_risk("http://localhost/admin") == True
    assert is_ssrf_risk("http://192.168.1.1/") == True
    assert is_ssrf_risk("http://10.0.0.1/") == True
    assert is_ssrf_risk("https://www.google.com/") == False
    print("  SSRF protection: OK")

def test_report_generation():
    """Test that report generators produce non-empty output."""
    from app.reports.pdf_generator import generate_pdf_report
    from app.reports.generators import generate_docx_report, generate_json_report, generate_csv_report
    
    sample_data = {
        "analysis": {"id": "test-123", "status": "completed", "is_demo": True},
        "risk_assessments": [{"overall_score": 72, "risk_level": "high", "call_risk_score": 60,
                               "link_risk_score": 45, "device_risk_score": 80, "ai_confidence": 0.75,
                               "scam_category": "bank_impersonation", "predicted_stage": "device_compromise",
                               "explanation": "Test explanation"}],
        "call_results": [],
        "link_results": [],
        "device_results": [],
        "agent_executions": [],
        "interventions": [],
    }
    
    pdf_buf = generate_pdf_report(sample_data)
    assert pdf_buf.tell() == 0  # buffer is at start
    pdf_bytes = pdf_buf.read()
    assert len(pdf_bytes) > 1000, "PDF should be > 1KB"
    print(f"  PDF: {len(pdf_bytes)} bytes OK")
    
    docx_buf = generate_docx_report(sample_data)
    docx_bytes = docx_buf.read()
    assert len(docx_bytes) > 1000, "DOCX should be > 1KB"
    print(f"  DOCX: {len(docx_bytes)} bytes OK")
    
    json_buf = generate_json_report(sample_data)
    json_bytes = json_buf.read()
    import json
    json.loads(json_bytes)  # Must be valid JSON
    print(f"  JSON: {len(json_bytes)} bytes, valid JSON OK")
    
    csv_buf = generate_csv_report(sample_data)
    csv_bytes = csv_buf.read()
    assert len(csv_bytes) > 50
    print(f"  CSV: {len(csv_bytes)} bytes OK")

if __name__ == "__main__":
    tests = [
        ("Call Analysis", test_call_analysis),
        ("URL Analysis", test_url_analysis),
        ("Device Analysis", test_device_analysis),
        ("Risk Engine", test_risk_engine),
        ("No Evidence", test_no_evidence),
        ("SSRF Protection", test_ssrf_protection),
        ("Report Generation", test_report_generation),
    ]
    
    passed = 0
    failed = 0
    for name, fn in tests:
        try:
            print(f"Testing: {name}")
            fn()
            print(f"  PASS")
            passed += 1
        except Exception as e:
            print(f"  FAIL: {e}")
            import traceback; traceback.print_exc()
            failed += 1
    
    print(f"\nResults: {passed} passed, {failed} failed")
    sys.exit(0 if failed == 0 else 1)
