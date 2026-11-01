'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Shield, Activity, AlertTriangle, Link as LinkIcon,
  Phone, Smartphone, Brain, Clock, Play, ChevronRight,
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, MetricCard, Badge, Button,
  EmptyState, StatusIndicator, Progress
} from '@/components/ui';
import AgentVisualization from '@/components/AgentVisualization';
import { checkHealth, API_BASE } from '@/lib/api';

interface OverviewData {
  securityEvents: number;
  threatsDetected: number;
  urlsAnalyzed: number;
  activeAgents: number;
  criticalIncidents: number;
  totalAnalyses: number;
  isLive: boolean;
}

const agentList = [
  { id: 'orchestrator', name: 'Central Orchestrator', status: 'Idle', color: '#3B82F6' },
  { id: 'call', name: 'Call Intelligence', status: 'Idle', color: '#06D6F0' },
  { id: 'link', name: 'Link Intelligence', status: 'Idle', color: '#0D9488' },
  { id: 'device', name: 'Device Guardian', status: 'Idle', color: '#8B5CF6' },
  { id: 'prediction', name: 'Scam Prediction', status: 'Idle', color: '#F59E0B' },
  { id: 'explanation', name: 'Explanation', status: 'Idle', color: '#EC4899' },
  { id: 'intervention', name: 'Safety Intervention', status: 'Idle', color: '#EF4444' },
];

export default function OverviewPage() {
  const [backendLive, setBackendLive] = useState(false);
  const [overview, setOverview] = useState<OverviewData | null>(null);

  useEffect(() => {
    async function loadData() {
      const health = await checkHealth();
      if (!health || health.database !== 'connected') {
        setBackendLive(false);
        return;
      }
      setBackendLive(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/dashboard/overview`, {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json() as OverviewData;
          setOverview(data);
        }
      } catch {
        // ignore — backend connected but overview failed
      }
    }
    loadData();
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
  }, []);

  const kpiCards = [
    {
      title: 'Security Events',
      value: overview ? String(overview.securityEvents) : '—',
      subtitle: overview ? 'Total analyses run' : 'Waiting for backend',
      icon: <Activity size={18} />,
      color: 'blue' as const,
      isDemo: !backendLive,
    },
    {
      title: 'Threats Detected',
      value: overview ? String(overview.threatsDetected) : '—',
      subtitle: overview ? 'High + Critical risk' : 'No active session',
      icon: <AlertTriangle size={18} />,
      color: 'red' as const,
      isDemo: !backendLive,
    },
    {
      title: 'URLs Analyzed',
      value: overview ? String(overview.urlsAnalyzed) : '—',
      subtitle: overview ? 'Link analyses' : 'No URLs submitted',
      icon: <LinkIcon size={18} />,
      color: 'cyan' as const,
      isDemo: !backendLive,
    },
    {
      title: 'Active Agents',
      value: '0/7',
      subtitle: 'All agents idle',
      icon: <Brain size={18} />,
      color: 'emerald' as const,
      isDemo: false,
    },
    {
      title: 'Critical Incidents',
      value: overview ? String(overview.criticalIncidents) : '—',
      subtitle: overview ? 'Critical risk only' : 'No data',
      icon: <Shield size={18} />,
      color: 'amber' as const,
      isDemo: !backendLive,
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Backend notice */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${backendLive ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-[#080F20] border-[#1E2D47]'}`}>
        <StatusIndicator status={backendLive ? 'online' : 'offline'} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#94A3B8]">
            {backendLive
              ? <><span className="text-emerald-400 font-semibold">Backend Connected</span> — Showing live security data from database.</>
              : <>Backend Not Connected — <span className="text-[#64748B]">Showing initial state. Start a session or connect the backend to see live security data.</span></>
            }
          </p>
        </div>
        <Badge variant={backendLive ? 'status' : 'demo'}>{backendLive ? 'LIVE' : 'DEMO MODE'}</Badge>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpiCards.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Central Visualization */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Active Monitoring Session</CardTitle>
              <Badge variant="status">No Active Session</Badge>
            </CardHeader>

            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Agent viz */}
              <div className="flex-shrink-0">
                <AgentVisualization size="lg" />
              </div>

              {/* Right info panel */}
              <div className="flex-1 space-y-4">
                <div className="rounded-lg bg-[#080F20] border border-[#1E2D47] p-4">
                  <p className="text-xs text-[#64748B] mb-1">Session Status</p>
                  <p className="text-sm font-semibold text-[#94A3B8]">Waiting for Security Events</p>
                  <p className="text-xs text-[#64748B] mt-1">Start a monitoring session or submit data to analyze</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-[#64748B] font-medium">Risk Channels</p>
                  <Progress label="Call Risk" value={0} showValue className="opacity-50" />
                  <Progress label="Link Risk" value={0} showValue className="opacity-50" />
                  <Progress label="Device Risk" value={0} showValue className="opacity-50" />
                </div>

                <Link href="/console/monitoring">
                  <Button variant="gradient" size="sm" className="w-full">
                    <Play size={13} />
                    Start Monitoring Session
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Agent status panel */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Agent Activity</CardTitle>
              <Link href="/console/monitoring" className="text-xs text-blue-400 hover:underline flex items-center gap-0.5">
                View all <ChevronRight size={12} />
              </Link>
            </CardHeader>
            <div className="space-y-2">
              {agentList.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[#080F20] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#374151]" />
                    <span className="text-xs text-[#94A3B8] truncate max-w-[120px]">{agent.name}</span>
                  </div>
                  <Badge variant="status" size="sm">{agent.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Security Event Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Security Activity</CardTitle>
            <Badge variant="status">No events</Badge>
          </CardHeader>
          <EmptyState
            icon={<Clock size={20} />}
            title="Waiting for Security Events"
            description="Submit a transcript, URL, or device-risk evidence to generate security events. Events will appear here."
            action={
              <Link href="/console/call">
                <Button variant="secondary" size="sm">
                  Start Call Analysis
                </Button>
              </Link>
            }
          />
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {[
              { label: 'Analyze a Suspicious Call Transcript', href: '/console/call', icon: Phone, color: '#3B82F6' },
              { label: 'Check a Suspicious Link or URL', href: '/console/link', icon: LinkIcon, color: '#06D6F0' },
              { label: 'Assess Device Risk Evidence', href: '/console/device', icon: Smartphone, color: '#0D9488' },
              { label: 'Run Scam Prediction', href: '/console/prediction', icon: Brain, color: '#8B5CF6' },
              { label: 'Open Live Agent Monitor', href: '/console/monitoring', icon: Activity, color: '#F59E0B' },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#080F20] border border-transparent hover:border-[#1E2D47] transition-all group"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${action.color}15`, border: `1px solid ${action.color}25` }}
                  >
                    <Icon size={13} style={{ color: action.color }} />
                  </div>
                  <span className="text-xs text-[#94A3B8] group-hover:text-[#F8FAFC] transition-colors">{action.label}</span>
                  <ChevronRight size={12} className="ml-auto text-[#64748B] group-hover:text-[#94A3B8] transition-colors" />
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
