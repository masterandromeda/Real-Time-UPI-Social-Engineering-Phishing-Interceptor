"""SQLAlchemy ORM models for UPI Sentinel."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey, Integer, JSON,
    String, Text, UniqueConstraint, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_uuid() -> str:
    return str(uuid.uuid4())


# ─── User & Organization ─────────────────────────────────────────────────────

class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    org_type: Mapped[str] = mapped_column(String(50), nullable=False, default="individual")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    plan: Mapped[str] = mapped_column(String(20), nullable=False, default="free")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    users: Mapped[List["User"]] = relationship("User", back_populates="organization")
    analyses: Mapped[List["Analysis"]] = relationship("Analysis", back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="user")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    organization_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    organization: Mapped[Optional["Organization"]] = relationship("Organization", back_populates="users")
    analyses: Mapped[List["Analysis"]] = relationship("Analysis", back_populates="user")

    __table_args__ = (Index("ix_users_email", "email"),)


# ─── Analysis ─────────────────────────────────────────────────────────────────

class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    organization_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="queued", index=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    input_types: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # list of input types used

    # Input data references (not raw data — stored separately)
    has_call_input: Mapped[bool] = mapped_column(Boolean, default=False)
    has_link_input: Mapped[bool] = mapped_column(Boolean, default=False)
    has_device_input: Mapped[bool] = mapped_column(Boolean, default=False)

    # Summary results (populated after completion)
    overall_risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    scam_category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    ai_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user: Mapped[Optional["User"]] = relationship("User", back_populates="analyses")
    organization: Mapped[Optional["Organization"]] = relationship("Organization", back_populates="analyses")
    call_results: Mapped[List["CallAnalysisResult"]] = relationship("CallAnalysisResult", back_populates="analysis")
    link_results: Mapped[List["LinkAnalysisResult"]] = relationship("LinkAnalysisResult", back_populates="analysis")
    device_results: Mapped[List["DeviceRiskResult"]] = relationship("DeviceRiskResult", back_populates="analysis")
    risk_assessments: Mapped[List["RiskAssessment"]] = relationship("RiskAssessment", back_populates="analysis")
    agent_executions: Mapped[List["AgentExecution"]] = relationship("AgentExecution", back_populates="analysis")
    safety_interventions: Mapped[List["SafetyIntervention"]] = relationship("SafetyIntervention", back_populates="analysis")
    ws_events: Mapped[List["WSEvent"]] = relationship("WSEvent", back_populates="analysis")
    reports: Mapped[List["Report"]] = relationship("Report", back_populates="analysis")


# ─── Agent Executions ──────────────────────────────────────────────────────────

class AgentExecution(Base):
    __tablename__ = "agent_executions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    analysis_id: Mapped[str] = mapped_column(String(36), ForeignKey("analyses.id"), nullable=False, index=True)
    agent_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    agent_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="queued")
    stage: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    output_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="agent_executions")


# ─── Call Analysis ─────────────────────────────────────────────────────────────

class CallAnalysisResult(Base):
    __tablename__ = "call_analysis_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    analysis_id: Mapped[str] = mapped_column(String(36), ForeignKey("analyses.id"), nullable=False, index=True)
    transcript_snippet: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # not full transcript for privacy
    language: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False, default="low")
    impersonation_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    urgency_indicators: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    fear_indicators: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    suspicious_phrases: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    provider_status: Mapped[str] = mapped_column(String(30), nullable=False, default="not_configured")
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommended_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="call_results")


# ─── Link Analysis ─────────────────────────────────────────────────────────────

class LinkAnalysisResult(Base):
    __tablename__ = "link_analysis_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    analysis_id: Mapped[str] = mapped_column(String(36), ForeignKey("analyses.id"), nullable=False, index=True)
    submitted_url: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    domain: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_upi_deep_link: Mapped[bool] = mapped_column(Boolean, default=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False, default="low")
    urlhaus_status: Mapped[str] = mapped_column(String(30), nullable=False, default="not_configured")
    virustotal_status: Mapped[str] = mapped_column(String(30), nullable=False, default="not_configured")
    urlhaus_result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    virustotal_result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    threat_categories: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommended_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="link_results")


# ─── Device Risk ────────────────────────────────────────────────────────────────

class DeviceRiskResult(Base):
    __tablename__ = "device_risk_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    analysis_id: Mapped[str] = mapped_column(String(36), ForeignKey("analyses.id"), nullable=False, index=True)
    remote_access_apps: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    suspicious_permissions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    custom_evidence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence_items: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False, default="low")
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommended_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="device_results")


# ─── Risk Assessment ────────────────────────────────────────────────────────────

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    analysis_id: Mapped[str] = mapped_column(String(36), ForeignKey("analyses.id"), nullable=False, index=True)
    overall_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False, default="low")
    call_risk_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    link_risk_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    device_risk_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    ai_confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    scam_category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    predicted_stage: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    contributing_signals: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    missing_signals: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommended_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    scoring_version: Mapped[str] = mapped_column(String(10), nullable=False, default="1.0")
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="risk_assessments")


# ─── Safety Intervention ────────────────────────────────────────────────────────

class SafetyIntervention(Base):
    __tablename__ = "safety_interventions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    analysis_id: Mapped[str] = mapped_column(String(36), ForeignKey("analyses.id"), nullable=False, index=True)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False, default="low")
    trigger_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence_summary: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    recommended_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    user_acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    safety_hold_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="safety_interventions")


# ─── WebSocket Events ───────────────────────────────────────────────────────────

class WSEvent(Base):
    __tablename__ = "ws_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    analysis_id: Mapped[str] = mapped_column(String(36), ForeignKey("analyses.id"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    agent_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="published")
    payload: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="ws_events")


# ─── Reports ────────────────────────────────────────────────────────────────────

class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    analysis_id: Mapped[str] = mapped_column(String(36), ForeignKey("analyses.id"), nullable=False, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    report_type: Mapped[str] = mapped_column(String(20), nullable=False)  # pdf, docx, json, csv
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="reports")


# ─── Audit Log ──────────────────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    resource_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    resource_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
