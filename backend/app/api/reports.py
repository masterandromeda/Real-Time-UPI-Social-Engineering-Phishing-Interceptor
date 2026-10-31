"""Reports API — generate and download PDF, DOCX, JSON, CSV."""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.database.models import Analysis, Report
from app.reports.pdf_generator import generate_pdf_report
from app.reports.generators import generate_docx_report, generate_json_report, generate_csv_report

router = APIRouter(prefix="/reports", tags=["Reports"])


async def _fetch_analysis_data(analysis_id: str, db: AsyncSession) -> dict:
    """Fetch all analysis data needed for report generation."""
    from app.api.analysis import _model_to_dict
    from app.database.models import (
        CallAnalysisResult, LinkAnalysisResult, DeviceRiskResult,
        RiskAssessment, AgentExecution, SafetyIntervention
    )

    r = await db.execute(select(Analysis).where(Analysis.id == analysis_id))
    analysis = r.scalar_one_or_none()
    if not analysis:
        return {}

    call_r = (await db.execute(select(CallAnalysisResult).where(CallAnalysisResult.analysis_id == analysis_id))).scalars().all()
    link_r = (await db.execute(select(LinkAnalysisResult).where(LinkAnalysisResult.analysis_id == analysis_id))).scalars().all()
    device_r = (await db.execute(select(DeviceRiskResult).where(DeviceRiskResult.analysis_id == analysis_id))).scalars().all()
    risk_r = (await db.execute(select(RiskAssessment).where(RiskAssessment.analysis_id == analysis_id))).scalars().all()
    agents_r = (await db.execute(select(AgentExecution).where(AgentExecution.analysis_id == analysis_id))).scalars().all()
    intv_r = (await db.execute(select(SafetyIntervention).where(SafetyIntervention.analysis_id == analysis_id))).scalars().all()

    return {
        "analysis": _model_to_dict(analysis),
        "call_results": [_model_to_dict(r) for r in call_r],
        "link_results": [_model_to_dict(r) for r in link_r],
        "device_results": [_model_to_dict(r) for r in device_r],
        "risk_assessments": [_model_to_dict(r) for r in risk_r],
        "agent_executions": [_model_to_dict(r) for r in agents_r],
        "interventions": [_model_to_dict(r) for r in intv_r],
    }


@router.get("")
async def list_reports(db: AsyncSession = Depends(get_db)):
    """List available reports."""
    r = await db.execute(select(Report).order_by(Report.created_at.desc()).limit(50))
    reports = r.scalars().all()
    from app.api.analysis import _model_to_dict
    return {"reports": [_model_to_dict(rep) for rep in reports]}


@router.get("/{analysis_id}/download")
async def download_report(
    analysis_id: str,
    format: str = Query(default="json", description="pdf | docx | json | csv"),
    db: AsyncSession = Depends(get_db),
):
    """Generate and download a report in the requested format."""
    if format not in ("pdf", "docx", "json", "csv"):
        raise HTTPException(status_code=422, detail="Invalid format. Use: pdf, docx, json, csv")

    analysis_data = await _fetch_analysis_data(analysis_id, db)
    if not analysis_data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename_base = f"upi_sentinel_{analysis_id[:8]}_{timestamp}"

    if format == "pdf":
        buf = generate_pdf_report(analysis_data)
        media_type = "application/pdf"
        filename = f"{filename_base}.pdf"
    elif format == "docx":
        buf = generate_docx_report(analysis_data)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = f"{filename_base}.docx"
    elif format == "json":
        buf = generate_json_report(analysis_data)
        media_type = "application/json"
        filename = f"{filename_base}.json"
    else:  # csv
        buf = generate_csv_report(analysis_data)
        media_type = "text/csv"
        filename = f"{filename_base}.csv"

    # Log report generation
    report_record = Report(
        id=str(uuid.uuid4()),
        analysis_id=analysis_id,
        report_type=format,
        filename=filename,
        file_path=f"generated/{filename}",
        is_demo=analysis_data.get("analysis", {}).get("is_demo", False),
    )
    db.add(report_record)
    await db.commit()

    return StreamingResponse(
        buf,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
