"""DOCX, JSON, and CSV report generators."""
from __future__ import annotations

import csv
import io
import json
from datetime import datetime, timezone
from typing import Any, Dict

from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH


def generate_docx_report(analysis_data: Dict[str, Any]) -> io.BytesIO:
    """Generate a professional Word document report."""
    doc = Document()

    # Page margins
    for section in doc.sections:
        section.top_margin = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin = Cm(2.5)
        section.right_margin = Cm(2.5)

    analysis = analysis_data.get("analysis", {})
    risk_data = (analysis_data.get("risk_assessments") or [{}])[0]
    is_demo = analysis.get("is_demo", False)

    # Title
    title = doc.add_heading("UPI Sentinel — Security Intelligence Report", 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    if is_demo:
        demo_para = doc.add_paragraph("⚠ DEMO / SIMULATED — This report contains illustrative data from a demonstration scenario.")
        demo_para.runs[0].font.color.rgb = RGBColor(0xF5, 0x9E, 0x0B)
        demo_para.runs[0].bold = True

    doc.add_paragraph()

    # Metadata table
    meta_table = doc.add_table(rows=7, cols=2)
    meta_table.style = "Table Grid"
    rows_data = [
        ("Report Generated", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")),
        ("Analysis ID", analysis.get("id", "—")),
        ("Risk Level", risk_data.get("risk_level", "—").upper()),
        ("Risk Score", f"{risk_data.get('overall_score', 0):.0f} / 100"),
        ("AI Confidence", f"{(risk_data.get('ai_confidence', 0) * 100):.0f}%"),
        ("Status", analysis.get("status", "—").title()),
        ("Demo / Simulated", "YES" if is_demo else "NO"),
    ]
    for i, (k, v) in enumerate(rows_data):
        meta_table.rows[i].cells[0].text = k
        meta_table.rows[i].cells[1].text = str(v)

    doc.add_heading("Executive Summary", 1)
    explanation = risk_data.get("explanation", "No explanation available.")
    doc.add_paragraph(explanation)

    doc.add_heading("Risk Assessment", 1)
    rt = doc.add_table(rows=6, cols=3)
    rt.style = "Table Grid"
    headers = ["Signal", "Score", "Weight"]
    for j, h in enumerate(headers):
        rt.rows[0].cells[j].text = h
    risk_rows = [
        ("Call Intelligence", f"{risk_data.get('call_risk_score', 0):.0f}/100", "30%"),
        ("Link Intelligence", f"{risk_data.get('link_risk_score', 0):.0f}/100", "25%"),
        ("Device Guardian", f"{risk_data.get('device_risk_score', 0):.0f}/100", "25%"),
        ("Scam Sequence", "—", "20%"),
        (f"OVERALL RISK SCORE", f"{risk_data.get('overall_score', 0):.0f}/100", "—"),
    ]
    for i, row in enumerate(risk_rows):
        for j, val in enumerate(row):
            rt.rows[i + 1].cells[j].text = val

    # Call findings
    call_results = analysis_data.get("call_results", [])
    if call_results:
        cr = call_results[0]
        doc.add_heading("Call Intelligence Findings", 1)
        doc.add_paragraph(f"Risk Score: {cr.get('risk_score', 0):.0f}/100 | Level: {cr.get('risk_level', '').upper()}")
        doc.add_paragraph(f"Impersonation Detected: {'Yes' if cr.get('impersonation_detected') else 'No'}")
        if cr.get("summary"):
            doc.add_paragraph(cr["summary"])

    # Link findings
    link_results = analysis_data.get("link_results", [])
    if link_results:
        lr = link_results[0]
        doc.add_heading("Link Intelligence Findings", 1)
        doc.add_paragraph(f"URL: {lr.get('submitted_url', '—')}")
        doc.add_paragraph(f"Risk Score: {lr.get('risk_score', 0):.0f}/100 | URLhaus: {lr.get('urlhaus_status', '—')}")
        if lr.get("summary"):
            doc.add_paragraph(lr["summary"])

    # Device findings
    device_results = analysis_data.get("device_results", [])
    if device_results:
        dr = device_results[0]
        doc.add_heading("Device Guardian Findings", 1)
        doc.add_paragraph(f"Risk Score: {dr.get('risk_score', 0):.0f}/100")
        if dr.get("summary"):
            doc.add_paragraph(dr["summary"])

    # Safety Intervention
    interventions = analysis_data.get("interventions", [])
    if interventions:
        intv = interventions[0]
        doc.add_heading("Safety Intervention", 1)
        p = doc.add_paragraph(intv.get("trigger_reason", ""))
        p.runs[0].bold = True
        if intv.get("recommended_action"):
            doc.add_paragraph(f"Recommended Action: {intv['recommended_action']}")

    # Disclaimer
    doc.add_heading("Limitations and Disclaimer", 1)
    doc.add_paragraph(
        "This report is generated from user-provided evidence. Risk scores represent estimated risk levels, "
        "not confirmed fraud. UPI Sentinel cannot block actual UPI transactions without authorized payment processor integration."
    )

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer


def generate_json_report(analysis_data: Dict[str, Any]) -> io.BytesIO:
    """Generate structured JSON report."""
    report = {
        "report_generated_at": datetime.now(timezone.utc).isoformat(),
        "report_type": "upi_sentinel_security_report",
        "version": "1.0",
        "disclaimer": (
            "This report contains estimated risk analysis. "
            "Not a confirmed fraud determination. "
            "Risk scores calculated by backend deterministic engine."
        ),
        **analysis_data,
    }
    buf = io.BytesIO()
    buf.write(json.dumps(report, indent=2, default=str).encode("utf-8"))
    buf.seek(0)
    return buf


def generate_csv_report(analysis_data: Dict[str, Any]) -> io.BytesIO:
    """Generate CSV report for spreadsheet analysis."""
    buf = io.StringIO()
    writer = csv.writer(buf)

    analysis = analysis_data.get("analysis", {})
    risk_data = (analysis_data.get("risk_assessments") or [{}])[0]

    writer.writerow(["UPI Sentinel — Security Analysis CSV Report"])
    writer.writerow(["Generated", datetime.now(timezone.utc).isoformat()])
    writer.writerow(["Analysis ID", analysis.get("id", "")])
    writer.writerow(["Is Demo", analysis.get("is_demo", False)])
    writer.writerow([])

    writer.writerow(["RISK SUMMARY"])
    writer.writerow(["Overall Risk Score", risk_data.get("overall_score", 0)])
    writer.writerow(["Risk Level", risk_data.get("risk_level", "")])
    writer.writerow(["Call Risk Score", risk_data.get("call_risk_score", 0)])
    writer.writerow(["Link Risk Score", risk_data.get("link_risk_score", 0)])
    writer.writerow(["Device Risk Score", risk_data.get("device_risk_score", 0)])
    writer.writerow(["AI Confidence", risk_data.get("ai_confidence", 0)])
    writer.writerow(["Scam Category", risk_data.get("scam_category", "")])
    writer.writerow(["Predicted Stage", risk_data.get("predicted_stage", "")])
    writer.writerow([])

    writer.writerow(["AGENT EXECUTIONS"])
    writer.writerow(["Agent ID", "Agent Name", "Status", "Duration (ms)", "Output"])
    for ae in analysis_data.get("agent_executions", []):
        writer.writerow([
            ae.get("agent_id", ""),
            ae.get("agent_name", ""),
            ae.get("status", ""),
            ae.get("duration_ms", ""),
            (ae.get("output_summary", "") or "")[:100],
        ])

    bytes_buf = io.BytesIO()
    bytes_buf.write(buf.getvalue().encode("utf-8-sig"))
    bytes_buf.seek(0)
    return bytes_buf
