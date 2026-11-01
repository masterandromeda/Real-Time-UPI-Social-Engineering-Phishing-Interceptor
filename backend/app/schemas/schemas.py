"""Pydantic schemas matching the frontend TypeScript interfaces exactly."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict


# ─── Enums ───────────────────────────────────────────────────────────────────

class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class AgentStatusEnum(str, Enum):
    idle = "idle"
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"
    waiting = "waiting"


class AgentId(str, Enum):
    orchestrator = "orchestrator"
    call_intelligence = "call_intelligence"
    link_intelligence = "link_intelligence"
    device_guardian = "device_guardian"
    scam_prediction = "scam_prediction"
    explanation = "explanation"
    safety_intervention = "safety_intervention"


class ScamStage(str, Enum):
    initial_contact = "initial_contact"
    trust_building = "trust_building"
    urgency_creation = "urgency_creation"
    link_delivery = "link_delivery"
    device_compromise = "device_compromise"
    authorization_pressure = "authorization_pressure"
    payment_extraction = "payment_extraction"
    unknown = "unknown"


class ScamCategory(str, Enum):
    bank_impersonation = "bank_impersonation"
    investment_fraud = "investment_fraud"
    tech_support_scam = "tech_support_scam"
    lottery_scam = "lottery_scam"
    government_impersonation = "government_impersonation"
    romantic_scam = "romantic_scam"
    unknown = "unknown"


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class UserRegisterRequest(BaseModel):
    email: str
    password: str
    display_name: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    display_name: Optional[str]
    role: str
    organization_id: Optional[str]
    created_at: datetime


# ─── Analysis Schemas ─────────────────────────────────────────────────────────

class AnalysisCreateRequest(BaseModel):
    is_demo: bool = False
    input_types: Optional[List[str]] = None


class AnalysisSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    status: str
    is_demo: bool
    has_call_input: bool
    has_link_input: bool
    has_device_input: bool
    overall_risk_score: Optional[float]
    risk_level: Optional[str]
    scam_category: Optional[str]
    ai_confidence: Optional[float]
    created_at: datetime
    completed_at: Optional[datetime]


# ─── Call Analysis Schemas ─────────────────────────────────────────────────────

class CallAnalysisRequest(BaseModel):
    transcript: str = Field(..., min_length=10, max_length=50000)
    language: str = Field(default="auto")
    analysis_id: Optional[str] = None
    is_demo: bool = False


class SuspiciousPhrase(BaseModel):
    text: str
    category: str
    severity: RiskLevel
    position: int


class CallAnalysisResponse(BaseModel):
    id: str
    analysis_id: str
    transcript: str
    language: str
    riskScore: float = Field(alias="risk_score")
    riskLevel: RiskLevel = Field(alias="risk_level")
    impersonationDetected: bool = Field(alias="impersonation_detected")
    urgencyIndicators: List[str] = Field(alias="urgency_indicators")
    fearIndicators: List[str] = Field(alias="fear_indicators")
    suspiciousPhrases: List[SuspiciousPhrase] = Field(alias="suspicious_phrases")
    confidence: float
    summary: str
    recommendedAction: str = Field(alias="recommended_action")
    providerStatus: str = Field(alias="provider_status")
    isDemo: bool = Field(alias="is_demo")
    createdAt: datetime = Field(alias="created_at")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ─── Link Analysis Schemas ─────────────────────────────────────────────────────

class LinkAnalysisRequest(BaseModel):
    url: str = Field(..., min_length=3, max_length=2048)
    analysis_id: Optional[str] = None
    is_demo: bool = False


class ReputationSource(BaseModel):
    name: str
    status: str  # clean | malicious | suspicious | unavailable | pending | not_configured
    details: Optional[str] = None


class LinkAnalysisResponse(BaseModel):
    id: str
    analysis_id: str
    url: str
    isUpiDeepLink: bool = Field(alias="is_upi_deep_link")
    domain: Optional[str]
    riskScore: float = Field(alias="risk_score")
    riskLevel: RiskLevel = Field(alias="risk_level")
    reputationSources: List[ReputationSource] = Field(alias="reputation_sources")
    threatCategories: List[str] = Field(alias="threat_categories")
    summary: str
    recommendedAction: str = Field(alias="recommended_action")
    isDemo: bool = Field(alias="is_demo")
    createdAt: datetime = Field(alias="created_at")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ─── Device Risk Schemas ───────────────────────────────────────────────────────

class DeviceAnalysisRequest(BaseModel):
    remote_access_apps: List[str] = Field(default_factory=list)
    suspicious_permissions: List[str] = Field(default_factory=list)
    custom_evidence: Optional[str] = Field(default=None, max_length=5000)
    analysis_id: Optional[str] = None
    is_demo: bool = False


class DeviceEvidenceItem(BaseModel):
    type: str
    indicator: str
    severity: RiskLevel
    description: str


class DeviceAnalysisResponse(BaseModel):
    id: str
    analysis_id: str
    evidenceItems: List[DeviceEvidenceItem] = Field(alias="evidence_items")
    remoteAccessApps: List[str] = Field(alias="remote_access_apps")
    suspiciousPermissions: List[str] = Field(alias="suspicious_permissions")
    riskScore: float = Field(alias="risk_score")
    riskLevel: RiskLevel = Field(alias="risk_level")
    summary: str
    recommendedAction: str = Field(alias="recommended_action")
    isDemo: bool = Field(alias="is_demo")
    createdAt: datetime = Field(alias="created_at")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ─── Scam Prediction Schemas ───────────────────────────────────────────────────

class PredictionRequest(BaseModel):
    call_risk_score: float = Field(default=0.0, ge=0, le=100)
    link_risk_score: float = Field(default=0.0, ge=0, le=100)
    device_risk_score: float = Field(default=0.0, ge=0, le=100)
    analysis_id: Optional[str] = None
    is_demo: bool = False


class PredictionResponse(BaseModel):
    id: str
    analysis_id: str
    callRiskScore: float = Field(alias="call_risk_score")
    linkRiskScore: float = Field(alias="link_risk_score")
    deviceRiskScore: float = Field(alias="device_risk_score")
    correlatedScore: float = Field(alias="correlated_score")
    riskLevel: RiskLevel = Field(alias="risk_level")
    predictedStage: ScamStage = Field(alias="predicted_stage")
    confidence: float
    explanation: str
    nextExpectedAction: str = Field(alias="next_expected_action")
    recommendedSteps: List[str] = Field(alias="recommended_steps")
    isDemo: bool = Field(alias="is_demo")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ─── Risk Assessment Schemas ───────────────────────────────────────────────────

class RiskAssessmentResponse(BaseModel):
    id: str
    sessionId: str = Field(alias="analysis_id")
    timestamp: datetime = Field(alias="created_at")
    overallScore: float = Field(alias="overall_score")
    riskLevel: RiskLevel = Field(alias="risk_level")
    callRiskScore: float = Field(alias="call_risk_score")
    linkRiskScore: float = Field(alias="link_risk_score")
    deviceRiskScore: float = Field(alias="device_risk_score")
    aiConfidence: float = Field(alias="ai_confidence")
    scamCategory: Optional[ScamCategory] = Field(alias="scam_category")
    explanation: str
    recommendedAction: str = Field(alias="recommended_action")
    isSimulated: bool = Field(alias="is_demo")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ─── Safety Intervention Schemas ───────────────────────────────────────────────

class InterventionRecommendRequest(BaseModel):
    analysis_id: str


class InterventionAcknowledgeRequest(BaseModel):
    intervention_id: str
    acknowledged: bool = True


class SafetyInterventionResponse(BaseModel):
    id: str
    riskLevel: RiskLevel = Field(alias="risk_level")
    triggerReason: str = Field(alias="trigger_reason")
    evidenceSummary: List[str] = Field(alias="evidence_summary")
    recommendedAction: str = Field(alias="recommended_action")
    userAcknowledged: bool = Field(alias="user_acknowledged")
    safetyHoldActive: bool = Field(alias="safety_hold_active")
    isSimulated: bool = Field(alias="is_simulated")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ─── Agent Schemas ─────────────────────────────────────────────────────────────

class AgentExecutionResponse(BaseModel):
    id: str
    agentId: str = Field(alias="agent_id")
    eventId: str = Field(alias="analysis_id")
    startedAt: Optional[datetime] = Field(alias="started_at")
    completedAt: Optional[datetime] = Field(alias="completed_at")
    status: AgentStatusEnum
    stage: Optional[str]
    output: Optional[str] = Field(alias="output_summary")
    error: Optional[str] = Field(alias="error_message")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class AgentInfoResponse(BaseModel):
    id: str
    name: str
    purpose: str
    status: AgentStatusEnum
    lastActivity: Optional[datetime] = None
    processingStage: Optional[str] = None
    executionDurationMs: Optional[int] = None
    latestOutput: Optional[str] = None
    associatedEventId: Optional[str] = None


# ─── Integration Status Schemas ────────────────────────────────────────────────

class IntegrationStatusResponse(BaseModel):
    id: str
    name: str
    purpose: str
    connectionStatus: str  # connected | disconnected | pending | error
    configurationStatus: str  # configured | not_configured | partial
    lastChecked: Optional[datetime] = None
    docsUrl: Optional[str] = None
    latencyMs: Optional[int] = None
    errorMessage: Optional[str] = None


# ─── Dashboard Schemas ─────────────────────────────────────────────────────────

class DashboardOverview(BaseModel):
    securityEvents: int = 0
    threatsDetected: int = 0
    urlsAnalyzed: int = 0
    activeAgents: int = 0
    criticalIncidents: int = 0
    totalAnalyses: int = 0
    isLive: bool = False


# ─── WebSocket Event Schemas ───────────────────────────────────────────────────

class WSEventPayload(BaseModel):
    event_id: str
    analysis_id: str
    event_type: str
    agent_id: Optional[str] = None
    status: str
    timestamp: datetime
    source: str = "backend"
    payload: Optional[Dict[str, Any]] = None


# ─── Report Schemas ────────────────────────────────────────────────────────────

class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    analysis_id: str
    report_type: str
    filename: str
    file_size_bytes: Optional[int]
    is_demo: bool
    created_at: datetime


# ─── Demo Scenarios ────────────────────────────────────────────────────────────

class DemoScenarioRequest(BaseModel):
    scenario_id: str  # "low_risk" | "high_risk" | "critical_risk"


class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    redis: str
    timestamp: datetime


# ─── Audio Chunk Schemas ───────────────────────────────────────────────────────

class AudioChunkRequest(BaseModel):
    audio_base64: str = Field(..., description="Base64-encoded audio bytes")
    language: str = Field(default="hi-IN", description="Sarvam language code, e.g. hi-IN")
    session_id: str = Field(..., description="Shared session ID for this mic session")
    chunk_index: int = Field(..., ge=0)
    is_demo: bool = False

