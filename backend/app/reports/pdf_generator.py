"""PDF report generation using ReportLab."""
from __future__ import annotations

import os
from datetime import datetime, timezone
from io import BytesIO
from typing import Any, Dict, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER

DARK_BG = colors.HexColor("#030712")
NAVY = colors.HexColor("#0B1224")
BLUE = colors.HexColor("#3B82F6")
CYAN = colors.HexColor("#06D6F0")
RED = colors.HexColor("#EF4444")
AMBER = colors.HexColor("#F59E0B")
GREEN = colors.HexColor("#10B981")
LIGHT_TEXT = colors.HexColor("#F8FAFC")
MUTED = colors.HexColor("#94A3B8")
WHITE = colors.white


def _risk_color(level: str):
    return {"critical": RED, "high": colors.HexColor("#F97316"), "medium": AMBER, "low": GREEN}.get(level, MUTED)


def generate_pdf_report(analysis_data: Dict[str, Any]) -> BytesIO:
    """Generate a professional PDF report from analysis data."""
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    story = []

    # ─── Header ──────────────────────────────────────────────────────────────
    story.append(Paragraph(
        '<font color="#3B82F6"><b>UPI SENTINEL</b></font> — Predictive Scam Interceptor',
        ParagraphStyle("header", parent=styles["Heading1"], fontSize=20, spaceAfter=4)
    ))
    story.append(Paragraph(
        "Security Intelligence Report",
        ParagraphStyle("subheader", parent=styles["Normal"], fontSize=14, textColor=MUTED, spaceAfter=4)
    ))

    is_demo = analysis_data.get("analysis", {}).get("is_demo", False)
    if is_demo:
        story.append(Paragraph(
            "⚠ DEMO / SIMULATED — This report contains illustrative data from a demonstration scenario.",
            ParagraphStyle("demo_warning", parent=styles["Normal"], fontSize=10,
                          textColor=AMBER, spaceAfter=6, backColor=colors.HexColor("#1A1200"))
        ))

    story.append(HRFlowable(width="100%", thickness=1, color=BLUE))
    story.append(Spacer(1, 4 * mm))

    # ─── Report Metadata ─────────────────────────────────────────────────────
    analysis = analysis_data.get("analysis", {})
    risk_data = (analysis_data.get("risk_assessments") or [{}])[0]

    meta_data = [
        ["Report Generated", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")],
        ["Analysis ID", analysis.get("id", "—")],
        ["Risk Level", risk_data.get("risk_level", "—").upper()],
        ["Risk Score", f"{risk_data.get('overall_score', 0):.0f} / 100"],
        ["AI Confidence", f"{(risk_data.get('ai_confidence', 0) * 100):.0f}%"],
        ["Status", analysis.get("status", "—").title()],
        ["Demo / Simulated", "YES" if is_demo else "NO"],
    ]

    meta_table = Table(meta_data, colWidths=[55 * mm, 100 * mm])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("TEXTCOLOR", (0, 0), (0, -1), MUTED),
        ("TEXTCOLOR", (1, 0), (1, -1), LIGHT_TEXT),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [NAVY, colors.HexColor("#101A30")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#1E2D47")),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6 * mm))

    # ─── Executive Summary ────────────────────────────────────────────────────
    story.append(Paragraph("Executive Summary", ParagraphStyle("h2", parent=styles["Heading2"], textColor=BLUE, fontSize=13)))
    explanation = risk_data.get("explanation", "No explanation available.")
    story.append(Paragraph(explanation, ParagraphStyle("body", parent=styles["Normal"], fontSize=9, textColor=LIGHT_TEXT, spaceAfter=4)))
    story.append(Spacer(1, 4 * mm))

    # ─── Risk Assessment ─────────────────────────────────────────────────────
    story.append(Paragraph("Risk Assessment", ParagraphStyle("h2", parent=styles["Heading2"], textColor=BLUE, fontSize=13)))

    risk_level = risk_data.get("risk_level", "low")
    risk_table_data = [
        ["Signal", "Score", "Weight"],
        ["Call Intelligence", f"{risk_data.get('call_risk_score', 0):.0f}/100", "30%"],
        ["Link Intelligence", f"{risk_data.get('link_risk_score', 0):.0f}/100", "25%"],
        ["Device Guardian", f"{risk_data.get('device_risk_score', 0):.0f}/100", "25%"],
        ["Scam Sequence", "—", "20%"],
        ["OVERALL RISK SCORE", f"{risk_data.get('overall_score', 0):.0f}/100", "—"],
    ]
    risk_table = Table(risk_table_data, colWidths=[70 * mm, 40 * mm, 30 * mm])
    risk_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("BACKGROUND", (0, -1), (-1, -1), _risk_color(risk_level)),
        ("TEXTCOLOR", (0, -1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [NAVY, colors.HexColor("#101A30")]),
        ("TEXTCOLOR", (0, 1), (-1, -2), LIGHT_TEXT),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#1E2D47")),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
    ]))
    story.append(risk_table)
    story.append(Spacer(1, 6 * mm))

    # ─── Call Intelligence ────────────────────────────────────────────────────
    call_results = analysis_data.get("call_results", [])
    if call_results:
        call_r = call_results[0]
        story.append(Paragraph("Call Intelligence Findings", ParagraphStyle("h2", parent=styles["Heading2"], textColor=CYAN, fontSize=13)))
        story.append(Paragraph(f"Risk Score: {call_r.get('risk_score', 0):.0f}/100 | Level: {call_r.get('risk_level', '').upper()}", ParagraphStyle("body", parent=styles["Normal"], fontSize=9, textColor=LIGHT_TEXT)))
        story.append(Paragraph(f"Impersonation Detected: {'Yes' if call_r.get('impersonation_detected') else 'No'}", ParagraphStyle("body", parent=styles["Normal"], fontSize=9, textColor=LIGHT_TEXT)))
        summary = call_r.get("summary", "")
        if summary:
            story.append(Paragraph(summary, ParagraphStyle("body", parent=styles["Normal"], fontSize=9, textColor=MUTED, spaceAfter=4)))
        story.append(Spacer(1, 4 * mm))

    # ─── Link Intelligence ────────────────────────────────────────────────────
    link_results = analysis_data.get("link_results", [])
    if link_results:
        link_r = link_results[0]
        story.append(Paragraph("Link Intelligence Findings", ParagraphStyle("h2", parent=styles["Heading2"], textColor=CYAN, fontSize=13)))
        story.append(Paragraph(f"URL: {link_r.get('submitted_url', '—')}", ParagraphStyle("mono", parent=styles["Code"], fontSize=8, textColor=MUTED)))
        story.append(Paragraph(f"Risk Score: {link_r.get('risk_score', 0):.0f}/100 | URLhaus: {link_r.get('urlhaus_status', '—')}", ParagraphStyle("body", parent=styles["Normal"], fontSize=9, textColor=LIGHT_TEXT)))
        story.append(Paragraph(link_r.get("summary", ""), ParagraphStyle("body", parent=styles["Normal"], fontSize=9, textColor=MUTED, spaceAfter=4)))
        story.append(Spacer(1, 4 * mm))

    # ─── Device Guardian ─────────────────────────────────────────────────────
    device_results = analysis_data.get("device_results", [])
    if device_results:
        device_r = device_results[0]
        story.append(Paragraph("Device Guardian Findings", ParagraphStyle("h2", parent=styles["Heading2"], textColor=CYAN, fontSize=13)))
        story.append(Paragraph(f"Risk Score: {device_r.get('risk_score', 0):.0f}/100", ParagraphStyle("body", parent=styles["Normal"], fontSize=9, textColor=LIGHT_TEXT)))
        story.append(Paragraph(device_r.get("summary", ""), ParagraphStyle("body", parent=styles["Normal"], fontSize=9, textColor=MUTED, spaceAfter=4)))
        story.append(Spacer(1, 4 * mm))

    # ─── Agent Execution Summary ──────────────────────────────────────────────
    agent_execs = analysis_data.get("agent_executions", [])
    if agent_execs:
        story.append(Paragraph("Agent Execution Summary", ParagraphStyle("h2", parent=styles["Heading2"], textColor=BLUE, fontSize=13)))
        agent_table_data = [["Agent", "Status", "Duration (ms)", "Output"]]
        for ae in agent_execs:
            agent_table_data.append([
                ae.get("agent_name", ae.get("agent_id", ""))[:25],
                ae.get("status", "—").title(),
                str(ae.get("duration_ms", "—")),
                (ae.get("output_summary", "") or "—")[:40],
            ])
        agent_table = Table(agent_table_data, colWidths=[50 * mm, 25 * mm, 25 * mm, 60 * mm])
        agent_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), BLUE),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [NAVY, colors.HexColor("#101A30")]),
            ("TEXTCOLOR", (0, 1), (-1, -1), LIGHT_TEXT),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#1E2D47")),
            ("PADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(agent_table)
        story.append(Spacer(1, 4 * mm))

    # ─── Interventions ────────────────────────────────────────────────────────
    interventions = analysis_data.get("interventions", [])
    if interventions:
        intv = interventions[0]
        story.append(Paragraph("Safety Intervention", ParagraphStyle("h2", parent=styles["Heading2"], textColor=RED, fontSize=13)))
        story.append(Paragraph(intv.get("trigger_reason", ""), ParagraphStyle("body", parent=styles["Normal"], fontSize=9, textColor=LIGHT_TEXT)))
        action = intv.get("recommended_action", "")
        if action:
            story.append(Paragraph(f"Recommended Action: {action}", ParagraphStyle("body", parent=styles["Normal"], fontSize=9, textColor=AMBER, spaceAfter=4)))

    # ─── Limitations ─────────────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("Limitations and Disclaimer", ParagraphStyle("h2", parent=styles["Heading2"], textColor=MUTED, fontSize=12)))
    disclaimer_items = [
        "This report is generated from user-provided evidence and available threat intelligence sources.",
        "Risk scores are calculated by a deterministic scoring engine and represent estimated risk levels, not confirmed fraud.",
        "URLhaus and VirusTotal results reflect point-in-time lookups and may not capture all threats.",
        "An 'unlisted' result in URLhaus does NOT mean a URL is safe — it means it was not found in the database.",
        "OpenAI explanations are generated from structured evidence and may not be available if the service is unavailable.",
        "UPI Sentinel cannot block or freeze actual UPI transactions without authorized payment processor integration.",
        "All 'safety holds' shown in this report are simulated guidance, not actual transaction blocks.",
        "This tool does not provide legal, financial, or law enforcement advice.",
    ]
    for item in disclaimer_items:
        story.append(Paragraph(f"• {item}", ParagraphStyle("disc", parent=styles["Normal"], fontSize=8, textColor=MUTED, leftIndent=10, spaceAfter=2)))

    # ─── Footer line ─────────────────────────────────────────────────────────
    story.append(Spacer(1, 8 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BLUE))
    story.append(Paragraph(
        f"UPI Sentinel — Predictive Scam Interceptor | Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        ParagraphStyle("footer", parent=styles["Normal"], fontSize=7, textColor=MUTED, alignment=TA_CENTER)
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer
