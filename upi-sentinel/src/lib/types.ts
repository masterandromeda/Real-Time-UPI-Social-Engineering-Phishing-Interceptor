// ─── Frontend Type Contracts ───────────────────────────────────────────────
// These are frontend-only type definitions that will align with the
// backend API contracts once the backend is implemented in Phase 2.

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AgentStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'waiting';
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'demo';
export type SessionStatus = 'inactive' | 'initializing' | 'active' | 'stopping' | 'stopped';

// ─── Session ────────────────────────────────────────────────────────────────
export interface MonitoringSession {
  id: string;
  status: SessionStatus;
  startedAt: string | null;
  stoppedAt: string | null;
  inputTypes: InputType[];
  eventCount: number;
  isDemoMode: boolean;
}

export type InputType =
  | 'conversation_transcript'
  | 'audio_upload'
  | 'microphone'
  | 'url_submission'
  | 'device_risk'
  | 'demo_simulator'
  | 'business_integration';

// ─── Security Events ─────────────────────────────────────────────────────────
export interface SecurityEvent {
  id: string;
  sessionId: string;
  timestamp: string;
  category: EventCategory;
  riskLevel: RiskLevel;
  source: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'analyzed' | 'dismissed';
  isSimulated: boolean;
  evidence?: Evidence[];
}

export type EventCategory =
  | 'call_intelligence'
  | 'link_intelligence'
  | 'device_guardian'
  | 'scam_prediction'
  | 'safety_intervention'
  | 'system';

export interface Evidence {
  type: string;
  value: string;
  confidence: number;
}

// ─── Agent Types ─────────────────────────────────────────────────────────────
export interface AgentInfo {
  id: AgentId;
  name: string;
  purpose: string;
  status: AgentStatus;
  lastActivity: string | null;
  processingStage: string | null;
  executionDurationMs: number | null;
  latestOutput: string | null;
  associatedEventId: string | null;
}

export type AgentId =
  | 'orchestrator'
  | 'call_intelligence'
  | 'link_intelligence'
  | 'device_guardian'
  | 'scam_prediction'
  | 'explanation'
  | 'safety_intervention';

export interface AgentExecution {
  id: string;
  agentId: AgentId;
  eventId: string;
  startedAt: string;
  completedAt: string | null;
  status: AgentStatus;
  stage: string;
  output: string | null;
  error: string | null;
}

// ─── Risk Assessment ──────────────────────────────────────────────────────────
export interface RiskAssessment {
  id: string;
  sessionId: string;
  timestamp: string;
  overallScore: number; // 0–100
  riskLevel: RiskLevel;
  callRiskScore: number;
  linkRiskScore: number;
  deviceRiskScore: number;
  aiConfidence: number; // 0–1
  scamCategory: ScamCategory | null;
  explanation: string;
  recommendedAction: string;
  isSimulated: boolean;
}

export type ScamCategory =
  | 'bank_impersonation'
  | 'investment_fraud'
  | 'tech_support_scam'
  | 'lottery_scam'
  | 'government_impersonation'
  | 'romantic_scam'
  | 'unknown';

// ─── Analysis Results ─────────────────────────────────────────────────────────
export interface CallAnalysisResult {
  id: string;
  transcript: string;
  language: string;
  riskScore: number;
  riskLevel: RiskLevel;
  impersonationDetected: boolean;
  urgencyIndicators: string[];
  fearIndicators: string[];
  suspiciousPhrases: SuspiciousPhrase[];
  confidence: number;
  summary: string;
  recommendedAction: string;
}

export interface SuspiciousPhrase {
  text: string;
  category: string;
  severity: RiskLevel;
  position: number;
}

export interface LinkAnalysisResult {
  id: string;
  url: string;
  isUpiDeepLink: boolean;
  domain: string;
  registrationAge: string | null;
  redirectChain: string[];
  reputationSources: ReputationSource[];
  riskScore: number;
  riskLevel: RiskLevel;
  threatCategories: string[];
  summary: string;
  recommendedAction: string;
}

export interface ReputationSource {
  name: string;
  status: 'clean' | 'malicious' | 'suspicious' | 'unavailable' | 'pending';
  details: string | null;
}

export interface DeviceRiskResult {
  id: string;
  evidenceItems: DeviceEvidenceItem[];
  remoteAccessApps: string[];
  suspiciousPermissions: string[];
  riskScore: number;
  riskLevel: RiskLevel;
  summary: string;
  recommendedAction: string;
}

export interface DeviceEvidenceItem {
  type: string;
  indicator: string;
  severity: RiskLevel;
  description: string;
}

export interface ScamPredictionResult {
  id: string;
  callRiskScore: number;
  linkRiskScore: number;
  deviceRiskScore: number;
  correlatedScore: number;
  riskLevel: RiskLevel;
  predictedStage: ScamStage;
  confidence: number;
  explanation: string;
  nextExpectedAction: string;
  recommendedSteps: string[];
}

export type ScamStage =
  | 'initial_contact'
  | 'trust_building'
  | 'urgency_creation'
  | 'link_delivery'
  | 'device_compromise'
  | 'authorization_pressure'
  | 'payment_extraction'
  | 'unknown';

export interface SafetyInterventionResult {
  id: string;
  riskLevel: RiskLevel;
  triggerReason: string;
  evidenceSummary: string[];
  recommendedAction: string;
  userAcknowledged: boolean;
  safetyHoldActive: boolean;
  isSimulated: boolean;
}

// ─── Integration Status ───────────────────────────────────────────────────────
export interface IntegrationStatus {
  id: string;
  name: string;
  purpose: string;
  connectionStatus: 'connected' | 'disconnected' | 'pending' | 'error';
  configurationStatus: 'configured' | 'not_configured' | 'partial';
  lastChecked: string | null;
  docsUrl: string | null;
}

// ─── WebSocket Event Types ────────────────────────────────────────────────────
// Future event names for backend WebSocket integration
export type WebSocketEventType =
  | 'session.started'
  | 'session.stopped'
  | 'event.received'
  | 'agent.queued'
  | 'agent.started'
  | 'agent.completed'
  | 'agent.failed'
  | 'risk.updated'
  | 'alert.created'
  | 'intervention.recommended';

export interface WebSocketMessage {
  type: WebSocketEventType;
  payload: unknown;
  timestamp: string;
}
