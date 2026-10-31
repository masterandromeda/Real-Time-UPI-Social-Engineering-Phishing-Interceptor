"""Analysis and security module API endpoints."""
from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.database.connection import get_db
from app.database.models import (
    Analysis, AgentExecution, CallAnalysisResult,
    LinkAnalysisResult, DeviceRiskResult, RiskAssessment,
    SafetyIntervention, WSEvent
)
from app.agents.orchestrator import run_full_analysis, DEMO_SCENARIOS
from app.schemas.schemas import (
    CallAnalysisRequest, CallAnalysisResponse,
    LinkAnalysisRequest, LinkAnalysisResponse,
    DeviceAnalysisRequest, DeviceAnalysisResponse,
    PredictionRequest, PredictionResponse,
    InterventionRecommendRequest, InterventionAcknowledgeRequest,
    SafetyInterventionResponse, AnalysisCreateRequest, AnalysisSummary,
    DemoScenarioRequest, RiskAssessmentResponse
)
from app.realtime.websocket import manager

router = APIRouter(prefix="", tags=["Analysis"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _persist_analysis_results(db: AsyncSession, analysis_db: Analysis, results: Dict[str, Any]):
    """Persist analysis results to the database after orchestration completes."""
    try:
        # Update analysis record
        analysis_db.status = results.get("status", "completed")
        analysis_db.completed_at = _now()

        risk = results.get("risk_assessment")
        if risk:
            analysis_db.overall_risk_score = risk.get("overall_score")
            analysis_db.risk_level = risk.get("risk_level")
            analysis_db.scam_category = risk.get("scam_category")
            analysis_db.ai_confidence = risk.get("ai_confidence")

            risk_db = RiskAssessment(
                id=risk.get("id", str(uuid.uuid4())),
                analysis_id=analysis_db.id,
                overall_score=risk.get("overall_score", 0),
                risk_level=risk.get("risk_level", "low"),
                call_risk_score=risk.get("call_risk_score", 0),
                link_risk_score=risk.get("link_risk_score", 0),
                device_risk_score=risk.get("device_risk_score", 0),
                ai_confidence=risk.get("ai_confidence", 0),
                scam_category=risk.get("scam_category"),
                predicted_stage=risk.get("predicted_stage"),
                contributing_signals=risk.get("contributing_signals"),
                missing_signals=risk.get("missing_signals"),
                explanation=risk.get("explanation"),
                is_demo=results.get("is_demo", False),
            )
            db.add(risk_db)

        # Agent executions
        for exec_data in results.get("agent_executions", []):
            exec_db = AgentExecution(
                id=exec_data.get("id", str(uuid.uuid4())),
                analysis_id=analysis_db.id,
                agent_id=exec_data.get("agent_id"),
                agent_name=exec_data.get("agent_name", ""),
                status=exec_data.get("status", "completed"),
                stage=exec_data.get("stage"),
                output_summary=exec_data.get("output_summary"),
                error_message=exec_data.get("error_message"),
                started_at=_parse_dt(exec_data.get("started_at")),
                completed_at=_parse_dt(exec_data.get("completed_at")),
                duration_ms=exec_data.get("duration_ms"),
            )
            db.add(exec_db)

        # Call result
        call_r = results.get("call_result")
        if call_r:
            call_db = CallAnalysisResult(
                id=call_r.get("id", str(uuid.uuid4())),
                analysis_id=analysis_db.id,
                transcript_snippet=call_r.get("transcript", "")[:500],
                language=call_r.get("language"),
                risk_score=call_r.get("risk_score", 0),
                risk_level=call_r.get("risk_level", "low"),
                impersonation_detected=call_r.get("impersonation_detected", False),
                urgency_indicators=call_r.get("urgency_indicators"),
                fear_indicators=call_r.get("fear_indicators"),
                suspicious_phrases=call_r.get("suspicious_phrases"),
                provider_status=call_r.get("provider_status", "local_analysis"),
                confidence=call_r.get("confidence", 0),
                summary=call_r.get("summary"),
                recommended_action=call_r.get("recommended_action"),
                is_demo=results.get("is_demo", False),
            )
            db.add(call_db)
            analysis_db.has_call_input = True

        # Link result
        link_r = results.get("link_result")
        if link_r:
            link_db = LinkAnalysisResult(
                id=link_r.get("id", str(uuid.uuid4())),
                analysis_id=analysis_db.id,
                submitted_url=link_r.get("url", ""),
                domain=link_r.get("domain"),
                is_upi_deep_link=link_r.get("is_upi_deep_link", False),
                risk_score=link_r.get("risk_score", 0),
                risk_level=link_r.get("risk_level", "low"),
                urlhaus_status=link_r.get("urlhaus_status", "not_configured"),
                virustotal_status=link_r.get("virustotal_result", {}).get("analysis_status", "not_configured"),
                urlhaus_result=link_r.get("urlhaus_result"),
                virustotal_result=link_r.get("virustotal_result"),
                threat_categories=link_r.get("threat_categories"),
                summary=link_r.get("summary"),
                recommended_action=link_r.get("recommended_action"),
                is_demo=results.get("is_demo", False),
            )
            db.add(link_db)
            analysis_db.has_link_input = True

        # Device result
        device_r = results.get("device_result")
        if device_r:
            device_db = DeviceRiskResult(
                id=device_r.get("id", str(uuid.uuid4())),
                analysis_id=analysis_db.id,
                remote_access_apps=device_r.get("remote_access_apps"),
                suspicious_permissions=device_r.get("suspicious_permissions"),
                evidence_items=device_r.get("evidence_items"),
                risk_score=device_r.get("risk_score", 0),
                risk_level=device_r.get("risk_level", "low"),
                summary=device_r.get("summary"),
                recommended_action=device_r.get("recommended_action"),
                is_demo=results.get("is_demo", False),
            )
            db.add(device_db)
            analysis_db.has_device_input = True

        # Safety intervention
        intv = results.get("intervention")
        if intv:
            intv_db = SafetyIntervention(
                id=intv.get("id", str(uuid.uuid4())),
                analysis_id=analysis_db.id,
                risk_level=intv.get("risk_level", "low"),
                trigger_reason=intv.get("trigger_reason"),
                evidence_summary=intv.get("evidence_summary"),
                recommended_action=intv.get("recommended_action"),
                safety_hold_active=intv.get("safety_hold_active", False),
                is_simulated=intv.get("is_simulated", True),
            )
            db.add(intv_db)

        await db.commit()

    except Exception as exc:
        await db.rollback()
        from app.core.logging import get_logger
        get_logger("analysis").error("persist_error", error=str(exc))


def _parse_dt(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s)
    except Exception:
        return None


# ─── Full Analysis ────────────────────────────────────────────────────────────

@router.post("/analysis/start")
async def start_analysis(
    payload: AnalysisCreateRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a new analysis record and return analysis_id immediately."""
    analysis_id = str(uuid.uuid4())

    if db is not None:
        analysis_db = Analysis(
            id=analysis_id,
            user_id=current_user.id if current_user else None,
            status="queued",
            is_demo=payload.is_demo,
            input_types=payload.input_types,
        )
        db.add(analysis_db)
        try:
            await db.commit()
        except Exception:
            pass

    await manager.broadcast_event(analysis_id, "analysis.created", "queued", payload={"is_demo": payload.is_demo})
    return {"analysis_id": analysis_id, "status": "queued"}


@router.get("/analysis/{analysis_id}")
async def get_analysis(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    result = await db.execute(select(Analysis).where(Analysis.id == analysis_id))
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {
        "id": analysis.id,
        "status": analysis.status,
        "is_demo": analysis.is_demo,
        "overall_risk_score": analysis.overall_risk_score,
        "risk_level": analysis.risk_level,
        "scam_category": analysis.scam_category,
        "ai_confidence": analysis.ai_confidence,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
        "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None,
    }


@router.get("/analysis/{analysis_id}/events")
async def get_analysis_events(analysis_id: str):
    """Return buffered WebSocket events for this analysis (REST fallback)."""
    events = manager.get_buffered_events(analysis_id)
    return {"analysis_id": analysis_id, "events": events, "count": len(events)}


@router.get("/analysis/{analysis_id}/results")
async def get_analysis_results(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """Return complete analysis results."""
    from sqlalchemy import select
    result = await db.execute(select(Analysis).where(Analysis.id == analysis_id))
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Fetch related records
    call_r = await db.execute(
        select(CallAnalysisResult).where(CallAnalysisResult.analysis_id == analysis_id)
    )
    link_r = await db.execute(
        select(LinkAnalysisResult).where(LinkAnalysisResult.analysis_id == analysis_id)
    )
    device_r = await db.execute(
        select(DeviceRiskResult).where(DeviceRiskResult.analysis_id == analysis_id)
    )
    risk_r = await db.execute(
        select(RiskAssessment).where(RiskAssessment.analysis_id == analysis_id)
    )
    agents_r = await db.execute(
        select(AgentExecution).where(AgentExecution.analysis_id == analysis_id)
    )
    intv_r = await db.execute(
        select(SafetyIntervention).where(SafetyIntervention.analysis_id == analysis_id)
    )

    return {
        "analysis": {"id": analysis.id, "status": analysis.status, "is_demo": analysis.is_demo},
        "call_results": [_model_to_dict(r) for r in call_r.scalars().all()],
        "link_results": [_model_to_dict(r) for r in link_r.scalars().all()],
        "device_results": [_model_to_dict(r) for r in device_r.scalars().all()],
        "risk_assessments": [_model_to_dict(r) for r in risk_r.scalars().all()],
        "agent_executions": [_model_to_dict(r) for r in agents_r.scalars().all()],
        "interventions": [_model_to_dict(r) for r in intv_r.scalars().all()],
    }


# ─── Call Analysis ────────────────────────────────────────────────────────────

@router.post("/call/analyze")
async def analyze_call(
    payload: CallAnalysisRequest,
    background_tasks: BackgroundTasks,
):
    """Analyze a conversation transcript."""
    analysis_id = payload.analysis_id or str(uuid.uuid4())

    async def run_bg():
        results = await run_full_analysis(
            analysis_id=analysis_id,
            transcript=payload.transcript,
            language=payload.language,
            is_demo=payload.is_demo,
        )
        try:
            from app.database.connection import AsyncSessionLocal
            from sqlalchemy import select
            async with AsyncSessionLocal() as bg_db:
                r = await bg_db.execute(select(Analysis).where(Analysis.id == analysis_id))
                analysis_db = r.scalar_one_or_none()
                if not analysis_db:
                    analysis_db = Analysis(id=analysis_id, status="running", is_demo=payload.is_demo)
                    bg_db.add(analysis_db)
                await _persist_analysis_results(bg_db, analysis_db, results)
        except Exception:
            pass  # DB not available — results still delivered via WebSocket

    background_tasks.add_task(run_bg)
    return {"analysis_id": analysis_id, "status": "processing", "message": "Analysis started. Connect to WebSocket for real-time updates."}


# ─── Link Analysis ────────────────────────────────────────────────────────────

@router.post("/link/analyze")
async def analyze_link(
    payload: LinkAnalysisRequest,
    background_tasks: BackgroundTasks,
):
    """Analyze a suspicious URL."""
    from app.intelligence.url_analysis import is_ssrf_risk
    if is_ssrf_risk(payload.url):
        raise HTTPException(status_code=422, detail="URL targets a private/internal address and cannot be analyzed")

    analysis_id = payload.analysis_id or str(uuid.uuid4())

    async def run_bg():
        results = await run_full_analysis(
            analysis_id=analysis_id,
            url=payload.url,
            is_demo=payload.is_demo,
        )
        try:
            from app.database.connection import AsyncSessionLocal
            from sqlalchemy import select
            async with AsyncSessionLocal() as bg_db:
                r = await bg_db.execute(select(Analysis).where(Analysis.id == analysis_id))
                analysis_db = r.scalar_one_or_none()
                if not analysis_db:
                    analysis_db = Analysis(id=analysis_id, status="running", is_demo=payload.is_demo)
                    bg_db.add(analysis_db)
                await _persist_analysis_results(bg_db, analysis_db, results)
        except Exception:
            pass

    background_tasks.add_task(run_bg)
    return {"analysis_id": analysis_id, "status": "processing", "message": "Link analysis started."}


# ─── Device Analysis ──────────────────────────────────────────────────────────

@router.post("/device/analyze")
async def analyze_device(
    payload: DeviceAnalysisRequest,
    background_tasks: BackgroundTasks,
):
    """Analyze user-provided device risk evidence."""
    analysis_id = payload.analysis_id or str(uuid.uuid4())

    async def run_bg():
        results = await run_full_analysis(
            analysis_id=analysis_id,
            remote_access_apps=payload.remote_access_apps,
            suspicious_permissions=payload.suspicious_permissions,
            custom_device_evidence=payload.custom_evidence,
            is_demo=payload.is_demo,
        )
        try:
            from app.database.connection import AsyncSessionLocal
            from sqlalchemy import select
            async with AsyncSessionLocal() as bg_db:
                r = await bg_db.execute(select(Analysis).where(Analysis.id == analysis_id))
                analysis_db = r.scalar_one_or_none()
                if not analysis_db:
                    analysis_db = Analysis(id=analysis_id, status="running", is_demo=payload.is_demo)
                    bg_db.add(analysis_db)
                await _persist_analysis_results(bg_db, analysis_db, results)
        except Exception:
            pass

    background_tasks.add_task(run_bg)
    return {"analysis_id": analysis_id, "status": "processing"}


# ─── Prediction ───────────────────────────────────────────────────────────────

@router.post("/prediction/analyze")
async def analyze_prediction(payload: PredictionRequest):
    """Quick correlated risk prediction from pre-computed signal scores."""
    from app.risk.scoring import calculate_risk
    risk = calculate_risk(
        call_result={"risk_score": payload.call_risk_score, "impersonation_detected": False, "urgency_indicators": [], "fear_indicators": []},
        link_result={"risk_score": payload.link_risk_score, "urlhaus_status": "not_configured", "virustotal_malicious": 0, "virustotal_suspicious": 0, "is_upi_deep_link": False},
        device_result={"risk_score": payload.device_risk_score, "remote_access_apps": [], "suspicious_permissions": []},
    )
    return {
        "id": str(uuid.uuid4()),
        "analysis_id": payload.analysis_id or str(uuid.uuid4()),
        "call_risk_score": payload.call_risk_score,
        "link_risk_score": payload.link_risk_score,
        "device_risk_score": payload.device_risk_score,
        "correlated_score": risk.risk_score,
        "risk_level": risk.risk_level,
        "predicted_stage": risk.predicted_stage or "unknown",
        "confidence": risk.ai_confidence,
        "explanation": risk.explanation,
        "next_expected_action": risk.predicted_stage or "unknown",
        "recommended_steps": [],
        "is_demo": payload.is_demo,
    }


# ─── Intervention ─────────────────────────────────────────────────────────────

@router.post("/intervention/recommend")
async def recommend_intervention(
    payload: InterventionRecommendRequest,
    db: AsyncSession = Depends(get_db),
):
    """Trigger a safety intervention recommendation for a given analysis."""
    from sqlalchemy import select
    result = await db.execute(select(Analysis).where(Analysis.id == payload.analysis_id))
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    risk_level = analysis.risk_level or "low"
    score = analysis.overall_risk_score or 0

    intv = SafetyIntervention(
        id=str(uuid.uuid4()),
        analysis_id=payload.analysis_id,
        risk_level=risk_level,
        trigger_reason=f"Manual intervention requested. Risk: {score:.0f}/100 ({risk_level})",
        safety_hold_active=risk_level in ("high", "critical"),
        is_simulated=analysis.is_demo,
    )
    db.add(intv)
    await db.commit()
    await db.refresh(intv)
    return {"id": intv.id, "risk_level": intv.risk_level, "safety_hold_active": intv.safety_hold_active}


# ─── Demo Simulator ───────────────────────────────────────────────────────────

@router.post("/demo/run-scenario")
async def run_demo_scenario(
    payload: DemoScenarioRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Run a predefined demo scenario through the real analysis pipeline."""
    if payload.scenario_id not in DEMO_SCENARIOS:
        raise HTTPException(status_code=422, detail=f"Unknown scenario. Valid: {list(DEMO_SCENARIOS.keys())}")

    scenario = DEMO_SCENARIOS[payload.scenario_id]
    analysis_id = str(uuid.uuid4())

    analysis_db = Analysis(id=analysis_id, status="queued", is_demo=True)
    db.add(analysis_db)
    await db.commit()

    await manager.broadcast_event(analysis_id, "analysis.created", "queued", payload={"scenario": payload.scenario_id, "is_demo": True})

    async def run_bg():
        from app.database.connection import AsyncSessionLocal
        async with AsyncSessionLocal() as bg_db:
            bg_analysis = Analysis(id=analysis_id, status="running", is_demo=True)
            results = await run_full_analysis(
                analysis_id=analysis_id,
                transcript=scenario.get("transcript"),
                language=scenario.get("language", "auto"),
                url=scenario.get("url"),
                remote_access_apps=scenario.get("remote_access_apps", []),
                suspicious_permissions=scenario.get("suspicious_permissions", []),
                custom_device_evidence=scenario.get("custom_device_evidence"),
                is_demo=True,
            )
            from sqlalchemy import select
            r = await bg_db.execute(select(Analysis).where(Analysis.id == analysis_id))
            db_rec = r.scalar_one_or_none()
            if db_rec:
                await _persist_analysis_results(bg_db, db_rec, results)

    background_tasks.add_task(run_bg)
    return {"analysis_id": analysis_id, "scenario_id": payload.scenario_id, "is_demo": True,
            "message": "Demo scenario started. All events are clearly labelled DEMO/SIMULATED."}


# ─── Agents Status ─────────────────────────────────────────────────────────────

@router.get("/agents/status")
async def get_agents_status(db: AsyncSession = Depends(get_db)):
    """Return current status of all seven agents (based on latest executions)."""
    from sqlalchemy import select, func
    from sqlalchemy.orm import aliased

    AGENTS = [
        {"id": "orchestrator", "name": "Central Orchestrator Agent", "purpose": "Coordinates all agent activities"},
        {"id": "call_intelligence", "name": "Call Intelligence Agent", "purpose": "Analyzes transcripts for social-engineering patterns"},
        {"id": "link_intelligence", "name": "Link Intelligence Agent", "purpose": "Evaluates URL reputation"},
        {"id": "device_guardian", "name": "Device Guardian Agent", "purpose": "Assesses device-risk evidence"},
        {"id": "scam_prediction", "name": "Scam Prediction Agent", "purpose": "Correlates signals to predict scam stage"},
        {"id": "explanation", "name": "Explanation Agent", "purpose": "Generates human-readable explanations"},
        {"id": "safety_intervention", "name": "Safety Intervention Agent", "purpose": "Triggers protective warnings"},
    ]

    # Get latest execution per agent
    latest = {}
    for agent in AGENTS:
        r = await db.execute(
            select(AgentExecution)
            .where(AgentExecution.agent_id == agent["id"])
            .order_by(AgentExecution.started_at.desc())
            .limit(1)
        )
        exec_rec = r.scalar_one_or_none()
        latest[agent["id"]] = exec_rec

    return {
        "agents": [
            {
                "id": a["id"],
                "name": a["name"],
                "purpose": a["purpose"],
                "status": latest[a["id"]].status if latest[a["id"]] else "idle",
                "lastActivity": latest[a["id"]].started_at.isoformat() if latest[a["id"]] and latest[a["id"]].started_at else None,
                "processingStage": latest[a["id"]].stage if latest[a["id"]] else None,
                "executionDurationMs": latest[a["id"]].duration_ms if latest[a["id"]] else None,
                "latestOutput": latest[a["id"]].output_summary if latest[a["id"]] else None,
                "associatedEventId": latest[a["id"]].analysis_id if latest[a["id"]] else None,
            }
            for a in AGENTS
        ]
    }


@router.get("/agents/executions")
async def get_agent_executions(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    r = await db.execute(
        select(AgentExecution).order_by(AgentExecution.started_at.desc()).limit(limit)
    )
    execs = r.scalars().all()
    return {"executions": [_model_to_dict(e) for e in execs]}


# ─── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard/overview")
async def get_dashboard_overview(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select, func
    total = (await db.execute(select(func.count(Analysis.id)))).scalar() or 0
    threats = (await db.execute(
        select(func.count(Analysis.id)).where(Analysis.risk_level.in_(["high", "critical"]))
    )).scalar() or 0
    urls = (await db.execute(select(func.count(LinkAnalysisResult.id)))).scalar() or 0
    critical = (await db.execute(
        select(func.count(Analysis.id)).where(Analysis.risk_level == "critical")
    )).scalar() or 0

    return {
        "securityEvents": total,
        "threatsDetected": threats,
        "urlsAnalyzed": urls,
        "activeAgents": 0,  # would need running process tracking
        "criticalIncidents": critical,
        "totalAnalyses": total,
        "isLive": True,
    }


@router.get("/dashboard/activity")
async def get_dashboard_activity(limit: int = 20, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    r = await db.execute(
        select(Analysis).order_by(Analysis.created_at.desc()).limit(limit)
    )
    return {"activities": [_model_to_dict(a) for a in r.scalars().all()]}


def _model_to_dict(model) -> dict:
    if model is None:
        return {}
    result = {}
    for col in model.__table__.columns:
        val = getattr(model, col.name)
        if hasattr(val, "isoformat"):
            val = val.isoformat()
        result[col.name] = val
    return result
