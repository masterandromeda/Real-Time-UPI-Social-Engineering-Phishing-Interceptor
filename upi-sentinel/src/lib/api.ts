/**
 * UPI Sentinel — Frontend API Client
 *
 * This module provides typed wrappers for all backend REST endpoints,
 * a WebSocket client factory, and event polling helpers.
 *
 * All communication happens through NEXT_PUBLIC_API_URL (default: http://localhost:8001).
 * No credentials or API keys are held in this file.
 */

// ─── Base Configuration ────────────────────────────────────────────────────────

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001';

const API_V1 = `${API_BASE}/api/v1`;

// ─── Connection State ─────────────────────────────────────────────────────────

export type BackendStatus = 'connected' | 'disconnected' | 'checking';

export interface HealthResponse {
  status: 'ok' | 'error';
  version: string;
  env: string;
  database: 'connected' | 'unavailable';
  integrations_configured: {
    sarvam_ai: boolean;
    urlhaus: boolean;
    virustotal: boolean;
    openai: boolean;
  };
  timestamp: string;
}

export async function checkHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}

// ─── Analysis API ──────────────────────────────────────────────────────────────

export interface AnalysisStartResponse {
  analysis_id: string;
  status: string;
  message?: string;
}

export interface BackendEvent {
  event_id: string;
  analysis_id: string;
  event_type: string;
  agent_id: string | null;
  status: string;
  timestamp: string;
  source: string;
  payload: Record<string, unknown>;
}

export interface EventsResponse {
  analysis_id: string;
  events: BackendEvent[];
  count: number;
}

/** Submit a conversation transcript for analysis. */
export async function analyzeCall(params: {
  transcript: string;
  language?: string;
  is_demo?: boolean;
  analysis_id?: string;
}): Promise<AnalysisStartResponse> {
  const res = await fetch(`${API_V1}/call/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(
      (detail as { detail?: string }).detail ?? `HTTP ${res.status}`,
    );
  }
  return res.json();
}

/** Submit a URL for analysis. */
export async function analyzeLink(params: {
  url: string;
  is_demo?: boolean;
  analysis_id?: string;
}): Promise<AnalysisStartResponse> {
  const res = await fetch(`${API_V1}/link/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(
      (detail as { detail?: string }).detail ?? `HTTP ${res.status}`,
    );
  }
  return res.json();
}

/** Submit device risk evidence for analysis. */
export async function analyzeDevice(params: {
  evidence_items: string[];
  remote_access_apps?: string[];
  suspicious_permissions?: string[];
  is_demo?: boolean;
  analysis_id?: string;
}): Promise<AnalysisStartResponse> {
  const res = await fetch(`${API_V1}/device/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(
      (detail as { detail?: string }).detail ?? `HTTP ${res.status}`,
    );
  }
  return res.json();
}

/** Poll for buffered events for a given analysis_id. */
export async function getAnalysisEvents(
  analysisId: string,
): Promise<EventsResponse | null> {
  try {
    const res = await fetch(`${API_V1}/analysis/${analysisId}/events`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Poll events until analysis.completed (or analysis.failed) arrives,
 * or until maxWaitMs elapses.
 *
 * Calls onEvents with each batch as they arrive.
 */
export async function pollUntilComplete(
  analysisId: string,
  onEvents: (events: BackendEvent[]) => void,
  maxWaitMs = 30_000,
  intervalMs = 800,
): Promise<BackendEvent[]> {
  const deadline = Date.now() + maxWaitMs;
  const seen = new Set<string>();
  let allEvents: BackendEvent[] = [];

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const data = await getAnalysisEvents(analysisId);
    if (!data) continue;

    const fresh = data.events.filter((e) => !seen.has(e.event_id));
    if (fresh.length > 0) {
      fresh.forEach((e) => seen.add(e.event_id));
      allEvents = [...allEvents, ...fresh];
      onEvents(allEvents);
    }

    const done = data.events.some(
      (e) =>
        e.event_type === 'analysis.completed' ||
        e.event_type === 'analysis.failed',
    );
    if (done) break;
  }

  return allEvents;
}

// ─── Parsed result helpers ────────────────────────────────────────────────────

/**
 * Extract the risk.updated payload from a completed event list.
 * Returns null if the event has not arrived yet.
 */
export function extractRiskAssessment(events: BackendEvent[]): RiskPayload | null {
  const ev = events.find((e) => e.event_type === 'risk.updated');
  if (!ev) return null;
  return ev.payload as unknown as RiskPayload;
}

export interface RiskPayload {
  id: string;
  analysis_id: string;
  overall_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  call_risk_score: number;
  link_risk_score: number;
  device_risk_score: number;
  ai_confidence: number;
  scam_category: string | null;
  predicted_stage: string | null;
  contributing_signals: ContributingSignal[];
  missing_signals: string[];
  explanation: string;
  scoring_version: string;
  is_demo: boolean;
  created_at: string;
}

export interface ContributingSignal {
  signal: string;
  raw_score: number;
  weighted_contribution: number;
  evidence: string[];
}

/**
 * Extract the call_analysis_completed payload.
 */
export function extractCallResult(events: BackendEvent[]): CallResultPayload | null {
  const ev = events.find((e) => e.event_type === 'call_analysis_completed');
  if (!ev) return null;
  return ev.payload as unknown as CallResultPayload;
}

export interface CallResultPayload {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  impersonation_detected?: boolean;
  urgency_indicators?: string[];
  fear_indicators?: string[];
  suspicious_phrases?: string[];
  confidence?: number;
  summary?: string;
  recommended_action?: string;
}

/**
 * Extract the link_analysis_completed payload.
 */
export function extractLinkResult(events: BackendEvent[]): LinkResultPayload | null {
  const ev = events.find((e) => e.event_type === 'link_analysis_completed');
  if (!ev) return null;
  return ev.payload as unknown as LinkResultPayload;
}

export interface LinkResultPayload {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  domain?: string;
  is_upi_deep_link?: boolean;
  urlhaus_status?: string;
  virustotal_status?: string;
  threat_categories?: string[];
  summary?: string;
  recommended_action?: string;
}

/**
 * Extract the device_analysis_completed payload.
 */
export function extractDeviceResult(events: BackendEvent[]): DeviceResultPayload | null {
  const ev = events.find((e) => e.event_type === 'device_analysis_completed');
  if (!ev) return null;
  return ev.payload as unknown as DeviceResultPayload;
}

export interface DeviceResultPayload {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  remote_access_apps?: string[];
  suspicious_permissions?: string[];
  summary?: string;
  recommended_action?: string;
}

// ─── Integration Status API ───────────────────────────────────────────────────

export interface IntegrationStatusItem {
  id: string;
  name: string;
  purpose: string;
  /** 'connected' | 'disconnected' — as returned by backend */
  connectionStatus: string;
  /** 'configured' | 'not_configured' — as returned by backend */
  configurationStatus: string;
  lastChecked: string | null;
  docsUrl: string | null;
}

export interface IntegrationsStatusResponse {
  integrations: IntegrationStatusItem[];
  timestamp: string;
}

export async function getIntegrationsStatus(): Promise<IntegrationsStatusResponse | null> {
  try {
    const res = await fetch(`${API_V1}/integrations/status`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      integrations: data.integrations ?? [],
      timestamp: data.timestamp ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ─── Demo Scenario API ────────────────────────────────────────────────────────

export interface DemoScenarioResponse {
  analysis_id: string;
  scenario: string;
  status: string;
}

export async function runDemoScenario(
  scenario: 'low_risk_call' | 'high_risk_call_link' | 'critical_full_scam',
): Promise<DemoScenarioResponse> {
  const res = await fetch(`${API_V1}/demo/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(
      (detail as { detail?: string }).detail ?? `HTTP ${res.status}`,
    );
  }
  return res.json();
}

// ─── WebSocket Client ─────────────────────────────────────────────────────────

export type WSMessageHandler = (event: BackendEvent) => void;
export type WSStatusHandler = (connected: boolean) => void;

const WS_BASE = API_BASE.replace(/^http/, 'ws');

/**
 * Open a WebSocket connection for a specific analysis.
 * Automatically reconnects up to `maxRetries` times.
 *
 * Returns a cleanup function — call it to close the socket.
 */
export function openAnalysisSocket(
  analysisId: string,
  onMessage: WSMessageHandler,
  onStatus?: WSStatusHandler,
  maxRetries = 3,
): () => void {
  let ws: WebSocket | null = null;
  let retries = 0;
  let closed = false;

  function connect() {
    if (closed) return;
    try {
      ws = new WebSocket(`${WS_BASE}/ws/analysis/${analysisId}`);
    } catch {
      return;
    }

    ws.onopen = () => {
      retries = 0;
      onStatus?.(true);
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string) as BackendEvent;
        onMessage(data);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => {
      onStatus?.(false);
    };

    ws.onclose = () => {
      onStatus?.(false);
      if (!closed && retries < maxRetries) {
        retries++;
        setTimeout(connect, 1500 * retries);
      }
    };
  }

  connect();

  return () => {
    closed = true;
    ws?.close();
  };
}

/**
 * Open the global agent WebSocket (for Live Agent Monitor page).
 * Returns a cleanup function.
 */
export function openAgentsSocket(
  onMessage: WSMessageHandler,
  onStatus?: WSStatusHandler,
  maxRetries = 3,
): () => void {
  let ws: WebSocket | null = null;
  let retries = 0;
  let closed = false;

  function connect() {
    if (closed) return;
    try {
      ws = new WebSocket(`${WS_BASE}/ws/agents`);
    } catch {
      return;
    }

    ws.onopen = () => {
      retries = 0;
      onStatus?.(true);
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string) as BackendEvent;
        onMessage(data);
      } catch {
        // ignore
      }
    };

    ws.onerror = () => {
      onStatus?.(false);
    };

    ws.onclose = () => {
      onStatus?.(false);
      if (!closed && retries < maxRetries) {
        retries++;
        setTimeout(connect, 1500 * retries);
      }
    };
  }

  connect();

  return () => {
    closed = true;
    ws?.close();
  };
}
