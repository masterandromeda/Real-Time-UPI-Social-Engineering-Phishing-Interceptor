'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity, Cpu, Phone, Link as LinkIcon, Smartphone, Brain,
  MessageSquare, AlertTriangle, Clock, Play, Square,
  ChevronDown, ChevronRight, Info, RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, EmptyState, StatusIndicator } from '@/components/ui';
import AgentVisualization from '@/components/AgentVisualization';
import { cn, formatTimestamp } from '@/lib/utils';
import type { AgentStatus } from '@/lib/types';
import { checkHealth, openAgentsSocket, type BackendEvent } from '@/lib/api';

const AGENTS = [
  {
    id: 'orchestrator',
    name: 'Central Orchestrator Agent',
    purpose: 'Coordinates all agent activities, receives events, routes tasks, and manages the overall analysis workflow.',
    icon: Cpu,
    color: '#3B82F6',
  },
  {
    id: 'call_intelligence',
    name: 'Call Intelligence Agent',
    purpose: 'Analyzes conversation transcripts and consent-based audio for impersonation, urgency, fear, and social-engineering patterns.',
    icon: Phone,
    color: '#06D6F0',
  },
  {
    id: 'link_intelligence',
    name: 'Link Intelligence Agent',
    purpose: 'Evaluates URLs, UPI deep links, redirect chains, domains, and cross-references with threat intelligence sources.',
    icon: LinkIcon,
    color: '#0D9488',
  },
  {
    id: 'device_guardian',
    name: 'Device Guardian Agent',
    purpose: 'Assesses device-risk evidence, remote-access application indicators, and suspicious permission combinations.',
    icon: Smartphone,
    color: '#8B5CF6',
  },
  {
    id: 'scam_prediction',
    name: 'Scam Prediction Agent',
    purpose: 'Correlates call, link, and device signals to estimate the scam likelihood and predict the next attack stage.',
    icon: Brain,
    color: '#F59E0B',
  },
  {
    id: 'explanation',
    name: 'Explanation Agent',
    purpose: 'Generates clear, human-readable explanations of risk assessments, evidence summaries, and recommended actions.',
    icon: MessageSquare,
    color: '#EC4899',
  },
  {
    id: 'safety_intervention',
    name: 'Safety Intervention Agent',
    purpose: 'Triggers protective warnings, presents evidence to users, and manages simulated pre-authorization safety holds.',
    icon: AlertTriangle,
    color: '#EF4444',
  },
];

interface AgentLiveState {
  status: AgentStatus;
  lastActivity: string | null;
  processingStage: string | null;
  latestOutput: string | null;
  durationMs: number | null;
}

function AgentCard({
  agent,
  liveState,
}: {
  agent: typeof AGENTS[0];
  liveState: AgentLiveState;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = agent.icon;

  const statusConfig: Record<AgentStatus, { label: string; dot: string; text: string }> = {
    idle: { label: 'Idle', dot: 'bg-slate-600', text: 'text-slate-400' },
    waiting: { label: 'Waiting', dot: 'bg-cyan-400 animate-pulse', text: 'text-cyan-400' },
    queued: { label: 'Queued', dot: 'bg-amber-400 animate-pulse', text: 'text-amber-400' },
    running: { label: 'Running', dot: 'bg-blue-400 animate-pulse', text: 'text-blue-400' },
    completed: { label: 'Completed', dot: 'bg-emerald-400', text: 'text-emerald-400' },
    failed: { label: 'Failed', dot: 'bg-red-400', text: 'text-red-400' },
  };

  const s = statusConfig[liveState.status];

  return (
    <div className="rounded-xl border border-[#1E2D47] bg-[#0B1224] overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#101A30] transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30` }}
        >
          <Icon size={16} style={{ color: agent.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#F8FAFC] truncate">{agent.name}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
            <span className={cn('text-xs font-medium', s.text)}>{s.label}</span>
          </div>
          {expanded ? <ChevronDown size={14} className="text-[#64748B]" /> : <ChevronRight size={14} className="text-[#64748B]" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#1E2D47] pt-3 space-y-3">
          <p className="text-xs text-[#94A3B8] leading-relaxed">{agent.purpose}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-[#080F20] border border-[#1E2D47] p-2.5">
              <p className="text-[10px] text-[#64748B] mb-0.5">Last Activity</p>
              <p className="text-xs text-[#94A3B8]">
                {liveState.lastActivity ? formatTimestamp(liveState.lastActivity) : 'No activity yet'}
              </p>
            </div>
            <div className="rounded-lg bg-[#080F20] border border-[#1E2D47] p-2.5">
              <p className="text-[10px] text-[#64748B] mb-0.5">Processing Stage</p>
              <p className="text-xs text-[#94A3B8]">{liveState.processingStage ?? '—'}</p>
            </div>
            <div className="rounded-lg bg-[#080F20] border border-[#1E2D47] p-2.5">
              <p className="text-[10px] text-[#64748B] mb-0.5">Execution Duration</p>
              <p className="text-xs text-[#94A3B8]">
                {liveState.durationMs != null ? `${liveState.durationMs}ms` : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-[#080F20] border border-[#1E2D47] p-2.5">
              <p className="text-[10px] text-[#64748B] mb-0.5">Latest Output</p>
              <p className="text-xs text-[#94A3B8] truncate">{liveState.latestOutput ?? '—'}</p>
            </div>
          </div>
          <div className="rounded-lg bg-[#080F20] border border-[#1E2D47] p-2.5">
            <p className="text-[10px] text-[#64748B] mb-1">Agent Log</p>
            <p className="text-xs text-[#64748B] font-mono">
              {liveState.status === 'idle'
                ? 'No log entries. Waiting for events.'
                : `Status: ${liveState.status}${liveState.processingStage ? ` — ${liveState.processingStage}` : ''}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

type ConnectionStatus = 'checking' | 'connected' | 'disconnected';

export default function MonitoringPage() {
  const [sessionActive, setSessionActive] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [apiConnected, setApiConnected] = useState<ConnectionStatus>('checking');
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [agentStates, setAgentStates] = useState<Record<string, AgentLiveState>>(
    () => Object.fromEntries(
      AGENTS.map((a) => [a.id, {
        status: 'idle' as AgentStatus,
        lastActivity: null,
        processingStage: null,
        latestOutput: null,
        durationMs: null,
      }])
    )
  );

  const wsCleanupRef = useRef<(() => void) | null>(null);

  // Check REST health once on mount
  useEffect(() => {
    checkHealth().then((h) => {
      setApiConnected(h?.status === 'ok' ? 'connected' : 'disconnected');
    });
  }, []);

  // Map backend event_type to agent status transitions
  const handleWsEvent = useCallback((event: BackendEvent) => {
    setEvents((prev) => [...prev.slice(-99), event]);

    const agentId = event.agent_id;
    if (!agentId) return;

    setAgentStates((prev) => {
      const current = prev[agentId] ?? {
        status: 'idle' as AgentStatus,
        lastActivity: null,
        processingStage: null,
        latestOutput: null,
        durationMs: null,
      };

      let next = { ...current, lastActivity: event.timestamp };

      if (event.status === 'running') next = { ...next, status: 'running', processingStage: event.event_type };
      else if (event.status === 'completed') next = { ...next, status: 'completed', processingStage: null };
      else if (event.status === 'failed') next = { ...next, status: 'failed' };
      else if (event.status === 'queued') next = { ...next, status: 'queued' };

      // Extract output summary from payload
      const payload = event.payload;
      if (payload?.risk_score != null) {
        next = { ...next, latestOutput: `Risk: ${(payload.risk_score as number).toFixed(0)}/100 (${payload.risk_level ?? ''})` };
      } else if (payload?.status === 'not_configured') {
        next = { ...next, latestOutput: 'Not configured — skipped' };
      }

      return { ...prev, [agentId]: next };
    });
  }, []);

  // Open WebSocket when session starts
  function startSession() {
    setSessionActive(true);
    setEvents([]);

    const cleanup = openAgentsSocket(
      handleWsEvent,
      (connected) => setWsConnected(connected),
      3,
    );
    wsCleanupRef.current = cleanup;
  }

  function stopSession() {
    setSessionActive(false);
    wsCleanupRef.current?.();
    wsCleanupRef.current = null;
    setWsConnected(false);
    // Reset agent states to idle
    setAgentStates(
      Object.fromEntries(
        AGENTS.map((a) => [a.id, {
          status: 'idle' as AgentStatus,
          lastActivity: null,
          processingStage: null,
          latestOutput: null,
          durationMs: null,
        }])
      )
    );
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsCleanupRef.current?.();
    };
  }, []);

  const eventCount = events.length;
  const activeAgentCount = Object.values(agentStates).filter(
    (s) => s.status === 'running' || s.status === 'queued',
  ).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <Info size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-300/80 leading-relaxed">
          <span className="font-semibold">Live Agent Monitor:</span> Agent statuses update in real-time via WebSocket when the backend is connected.
          All agent states shown are truthful — no fake activity is simulated. Run an analysis (Call/Link/Device) to see agents activate.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Session Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Session</CardTitle>
              <StatusIndicator
                status={sessionActive && wsConnected ? 'online' : sessionActive ? 'loading' : 'offline'}
                label={sessionActive && wsConnected ? 'Active' : sessionActive ? 'Connecting…' : 'Inactive'}
              />
            </CardHeader>

            <div className="space-y-3">
              <div className="rounded-lg bg-[#080F20] border border-[#1E2D47] p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748B]">Session Status</span>
                  <span className="text-[#94A3B8]">{sessionActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748B]">Events Received</span>
                  <span className="text-[#94A3B8] font-mono">{eventCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748B]">Active Agents</span>
                  <span className={cn('text-xs font-semibold', activeAgentCount > 0 ? 'text-blue-400' : 'text-[#64748B]')}>
                    {activeAgentCount}/7
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748B]">Mode</span>
                  {wsConnected
                    ? <span className="text-xs text-emerald-400 font-medium">Live</span>
                    : <Badge variant="demo" size="sm">Demo</Badge>
                  }
                </div>
              </div>

              {!sessionActive ? (
                <Button
                  variant="gradient"
                  size="md"
                  className="w-full"
                  onClick={startSession}
                >
                  <Play size={13} />
                  Start Monitoring Session
                </Button>
              ) : (
                <Button
                  variant="danger"
                  size="md"
                  className="w-full"
                  onClick={stopSession}
                >
                  <Square size={13} />
                  Stop Session
                </Button>
              )}
            </div>
          </Card>

          {/* Connection status */}
          <Card>
            <CardHeader>
              <CardTitle>System Connections</CardTitle>
            </CardHeader>
            <div className="space-y-2.5">
              {[
                {
                  label: 'REST API',
                  status: apiConnected === 'connected' ? 'online' : apiConnected === 'checking' ? 'loading' : 'offline',
                  label2: apiConnected === 'connected' ? 'Connected' : apiConnected === 'checking' ? 'Checking…' : 'Disconnected',
                } as const,
                {
                  label: 'WebSocket',
                  status: wsConnected ? 'online' : sessionActive ? 'loading' : 'offline',
                  label2: wsConnected ? 'Connected' : sessionActive ? 'Connecting…' : 'Disconnected',
                } as const,
                {
                  label: 'Redis Streams',
                  status: 'offline' as const,
                  label2: 'Not applicable (backend uses in-memory)',
                } as const,
                {
                  label: 'Agent Engine',
                  status: activeAgentCount > 0 ? 'online' : apiConnected === 'connected' ? 'warning' : 'offline',
                  label2: activeAgentCount > 0 ? `${activeAgentCount} running` : apiConnected === 'connected' ? 'Idle' : 'Disconnected',
                } as const,
              ].map((c) => (
                <div key={c.label} className="flex items-center justify-between py-1">
                  <span className="text-xs text-[#94A3B8]">{c.label}</span>
                  <StatusIndicator status={c.status} label={c.label2} size="sm" />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#64748B] mt-3 pt-2 border-t border-[#1E2D47]">
              Start a session to open the WebSocket connection to the agent engine.
            </p>
          </Card>
        </div>

        {/* Center: Agent Visualization */}
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Agent Intelligence Network</CardTitle>
              <button
                onClick={() => {
                  if (sessionActive) {
                    stopSession();
                    setTimeout(startSession, 100);
                  }
                }}
                className="p-1 rounded hover:bg-[#101A30] text-[#64748B] hover:text-[#94A3B8] transition-colors"
                title="Refresh connection"
              >
                <RefreshCw size={13} />
              </button>
            </CardHeader>
            <div className="flex-1 flex flex-col items-center justify-center py-4">
              <AgentVisualization
                size="lg"
                className="mb-4"
                agentStatuses={
                  Object.fromEntries(
                    AGENTS.map((a) => [a.id, agentStates[a.id]?.status ?? 'idle'])
                  ) as Record<string, AgentStatus>
                }
              />
              <p className="text-xs text-[#64748B] text-center">
                {sessionActive && wsConnected
                  ? 'Session active — listening for events'
                  : sessionActive
                  ? 'Connecting to agent engine…'
                  : 'Start a session to activate agent monitoring'}
              </p>
            </div>
          </Card>
        </div>

        {/* Right: Current Risk */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Risk Assessment</CardTitle>
            </CardHeader>
            {events.filter((e) => e.event_type === 'risk.updated').length === 0 ? (
              <EmptyState
                title="No Risk Data"
                description="Risk assessment will appear here once security events are analyzed."
                className="py-8"
              />
            ) : (
              (() => {
                const riskEvents = events.filter((e) => e.event_type === 'risk.updated');
                const latest = riskEvents[riskEvents.length - 1];
                const p = latest.payload as Record<string, unknown>;
                const score = p.overall_score as number ?? 0;
                const level = p.risk_level as string ?? 'low';
                return (
                  <div className="space-y-3">
                    <div className={cn(
                      'px-3 py-2 rounded-lg border',
                      level === 'critical' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                      level === 'high' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                      level === 'medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                      'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                    )}>
                      <p className="text-xs font-bold capitalize">{level} Risk</p>
                      <p className="text-lg font-bold">{score.toFixed(0)}<span className="text-xs font-normal">/100</span></p>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {[
                        ['Call Risk', (p.call_risk_score as number)?.toFixed(0) ?? '—'],
                        ['Link Risk', (p.link_risk_score as number)?.toFixed(0) ?? '—'],
                        ['Device Risk', (p.device_risk_score as number)?.toFixed(0) ?? '—'],
                        ['Predicted Stage', p.predicted_stage as string ?? '—'],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between py-1 border-b border-[#1E2D47] last:border-0">
                          <span className="text-[#94A3B8]">{label}</span>
                          <span className="text-[#F8FAFC] font-medium">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Detection Summary</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {[
                { label: 'Call Threats', filter: (e: BackendEvent) => e.event_type === 'call_analysis_completed' && (e.payload?.risk_level === 'high' || e.payload?.risk_level === 'critical') },
                { label: 'Link Threats', filter: (e: BackendEvent) => e.event_type === 'link_analysis_completed' && (e.payload?.risk_level === 'high' || e.payload?.risk_level === 'critical') },
                { label: 'Device Risks', filter: (e: BackendEvent) => e.event_type === 'device_analysis_completed' && (e.payload?.risk_level === 'high' || e.payload?.risk_level === 'critical') },
                { label: 'Predictions', filter: (e: BackendEvent) => e.event_type === 'prediction_completed' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-[#1E2D47] last:border-0">
                  <span className="text-xs text-[#94A3B8]">{item.label}</span>
                  <span className={cn('text-xs font-semibold', events.filter(item.filter).length > 0 ? 'text-red-400' : 'text-[#64748B]')}>
                    {events.filter(item.filter).length}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Agent Cards */}
      <div>
        <h2 className="text-sm font-semibold text-[#F8FAFC] mb-4">Seven-Agent System Status</h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {AGENTS.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              liveState={agentStates[agent.id] ?? {
                status: 'idle',
                lastActivity: null,
                processingStage: null,
                latestOutput: null,
                durationMs: null,
              }}
            />
          ))}
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Execution Timeline</CardTitle>
          <Badge variant="status">{eventCount} events</Badge>
        </CardHeader>
        {events.length === 0 ? (
          <EmptyState
            icon={<Clock size={20} />}
            title="No Agent Executions Yet"
            description="Agent execution history will appear here once events are processed."
          />
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {[...events].reverse().map((ev) => (
              <div key={ev.event_id} className="flex items-center gap-3 py-1.5 border-b border-[#1E2D47] last:border-0 text-xs">
                <span className="text-[#64748B] font-mono flex-shrink-0">{formatTimestamp(ev.timestamp)}</span>
                <span className="font-mono text-[#94A3B8] truncate flex-1">{ev.event_type}</span>
                {ev.agent_id && <span className="text-blue-400 flex-shrink-0 text-[10px]">{ev.agent_id}</span>}
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded flex-shrink-0',
                  ev.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                  ev.status === 'running' ? 'bg-blue-500/10 text-blue-400' :
                  ev.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                  'bg-[#101A30] text-[#64748B]',
                )}>{ev.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
