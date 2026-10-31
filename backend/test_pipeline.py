"""Test the API endpoint directly without the HTTP server."""
import asyncio
import sys
sys.path.insert(0, ".")

async def main():
    from app.intelligence.call_analysis import analyze_transcript
    from app.agents.orchestrator import run_full_analysis

    print("Testing run_full_analysis directly...")
    results = await run_full_analysis(
        analysis_id="test-direct-001",
        transcript="This is SBI bank. Account will be blocked. Share OTP now. Very urgent.",
        language="english",
        is_demo=True,
    )
    
    print("Status:", results["status"])
    call_r = results.get("call_result")
    if call_r:
        print(f"Call: score={call_r['risk_score']:.0f}, level={call_r['risk_level']}, impersonation={call_r['impersonation_detected']}")
    
    risk = results.get("risk_assessment")
    if risk:
        print(f"Risk: {risk['overall_score']:.0f}/100 ({risk['risk_level']})")
    
    explanation = results.get("explanation")
    if explanation:
        print(f"Explanation status: {explanation.get('status')}")
    
    intv = results.get("intervention")
    if intv:
        print(f"Intervention: {intv['risk_level']} — hold_active={intv['safety_hold_active']}")
    
    execs = results.get("agent_executions", [])
    print(f"\nAgent executions ({len(execs)}):")
    for e in execs:
        dur = e.get("duration_ms", "?")
        print(f"  [{e['agent_id']:25s}] {e['status']:10s} {dur}ms")
    
    print("\nFULL PIPELINE TEST PASSED")

asyncio.run(main())
