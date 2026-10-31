'use client';

import { useState } from 'react';
import { Smartphone, AlertTriangle, CheckCircle2, Info, Play, Loader2, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, Textarea, EmptyState } from '@/components/ui';
import { cn, getRiskBg, formatRiskScore } from '@/lib/utils';
import {
  analyzeDevice,
  pollUntilComplete,
  extractRiskAssessment,
  extractDeviceResult,
  type BackendEvent,
  type RiskPayload,
  type DeviceResultPayload,
} from '@/lib/api';

const REMOTE_ACCESS_APPS = [
  'AnyDesk', 'TeamViewer', 'QuickSupport', 'AirDroid',
  'Zoho Assist', 'RustDesk', 'Chrome Remote Desktop',
];

const RISKY_PERMISSIONS = [
  'Screen Recording', 'Accessibility Service', 'Device Admin',
  'Install Unknown Apps', 'Overlay Permission', 'Notification Access',
];

type AnalysisState =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'polling'; analysisId: string; events: BackendEvent[] }
  | { phase: 'complete'; risk: RiskPayload | null; device: DeviceResultPayload | null; events: BackendEvent[] }
  | { phase: 'error'; message: string };

export default function DeviceGuardianPage() {
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [customEvidence, setCustomEvidence] = useState('');
  const [state, setState] = useState<AnalysisState>({ phase: 'idle' });

  const isLoading = state.phase === 'submitting' || state.phase === 'polling';

  function toggleItem(item: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedApps.length && !selectedPerms.length && !customEvidence.trim()) return;
    if (isLoading) return;

    // Build evidence list
    const evidence: string[] = [
      ...selectedApps.map((app) => `Remote-access app installed: ${app}`),
      ...selectedPerms.map((perm) => `Suspicious permission granted: ${perm}`),
      ...(customEvidence.trim() ? [customEvidence.trim()] : []),
    ];

    setState({ phase: 'submitting' });
    try {
      const { analysis_id } = await analyzeDevice({
        evidence_items: evidence,
        remote_access_apps: selectedApps,
        suspicious_permissions: selectedPerms,
        is_demo: false,
      });

      setState({ phase: 'polling', analysisId: analysis_id, events: [] });

      const allEvents = await pollUntilComplete(
        analysis_id,
        (events) => setState({ phase: 'polling', analysisId: analysis_id, events }),
        30_000,
        600,
      );

      const risk = extractRiskAssessment(allEvents);
      const device = extractDeviceResult(allEvents);
      setState({ phase: 'complete', risk, device, events: allEvents });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to backend';
      setState({ phase: 'error', message: msg });
    }
  }

  function reset() {
    setState({ phase: 'idle' });
    setSelectedApps([]);
    setSelectedPerms([]);
    setCustomEvidence('');
  }

  const hasEvidence = selectedApps.length > 0 || selectedPerms.length > 0 || customEvidence.trim();
  const riskData = state.phase === 'complete' ? state.risk : null;
  const deviceData = state.phase === 'complete' ? state.device : null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-500/5 border border-teal-500/15">
        <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/25 flex items-center justify-center flex-shrink-0">
          <Smartphone size={15} className="text-teal-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F8FAFC]">Device Guardian</p>
          <p className="text-xs text-[#94A3B8]">Evaluate device-risk evidence provided by the user</p>
        </div>
        <Badge variant="demo" className="ml-auto">USER-PROVIDED EVIDENCE</Badge>
      </div>

      {/* Privacy notice */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-[#080F20] border border-[#1E2D47]">
        <Info size={13} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#94A3B8]">
          <span className="text-[#F8FAFC] font-medium">Privacy Note:</span> Device Guardian does not
          automatically inspect your installed applications, permissions, or device state from a browser context.
          You voluntarily provide evidence for analysis. Nothing is collected without your explicit action.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleAnalyze} className="space-y-4">
            {/* Remote access apps */}
            <Card>
              <CardHeader>
                <CardTitle>Remote-Access Applications</CardTitle>
                <Badge variant="status">{selectedApps.length} selected</Badge>
              </CardHeader>
              <p className="text-xs text-[#94A3B8] mb-3">
                Select any remote-access apps you have installed or that were requested to be installed during the suspicious interaction:
              </p>
              <div className="flex flex-wrap gap-2">
                {REMOTE_ACCESS_APPS.map((app) => (
                  <button
                    key={app}
                    type="button"
                    disabled={isLoading}
                    onClick={() => toggleItem(app, selectedApps, setSelectedApps)}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-lg border transition-all',
                      selectedApps.includes(app)
                        ? 'bg-red-500/15 border-red-500/40 text-red-400'
                        : 'bg-[#080F20] border-[#1E2D47] text-[#94A3B8] hover:border-[#2D4060]',
                      isLoading && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    {app}
                  </button>
                ))}
              </div>
            </Card>

            {/* Risky permissions */}
            <Card>
              <CardHeader>
                <CardTitle>Suspicious Permissions Granted</CardTitle>
                <Badge variant="status">{selectedPerms.length} selected</Badge>
              </CardHeader>
              <p className="text-xs text-[#94A3B8] mb-3">
                Select any permissions that were requested or granted during the suspicious interaction:
              </p>
              <div className="flex flex-wrap gap-2">
                {RISKY_PERMISSIONS.map((perm) => (
                  <button
                    key={perm}
                    type="button"
                    disabled={isLoading}
                    onClick={() => toggleItem(perm, selectedPerms, setSelectedPerms)}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-lg border transition-all',
                      selectedPerms.includes(perm)
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                        : 'bg-[#080F20] border-[#1E2D47] text-[#94A3B8] hover:border-[#2D4060]',
                      isLoading && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    {perm}
                  </button>
                ))}
              </div>
            </Card>

            {/* Additional evidence */}
            <Card>
              <CardHeader><CardTitle>Additional Evidence</CardTitle></CardHeader>
              <Textarea
                label="Describe any other suspicious device behavior"
                placeholder="E.g., 'The caller asked me to turn on screen sharing and navigate to my banking app' or 'I received an SMS with an APK download link'..."
                rows={4}
                value={customEvidence}
                onChange={(e) => setCustomEvidence(e.target.value)}
                disabled={isLoading}
              />
            </Card>

            <div className="flex gap-3">
              <Button type="submit" variant="gradient" size="md" loading={isLoading} disabled={!hasEvidence}>
                <Play size={13} />
                {isLoading ? 'Assessing...' : 'Assess Device Risk'}
              </Button>
              {(state.phase === 'complete' || state.phase === 'error') && (
                <Button type="button" variant="secondary" size="md" onClick={reset}>
                  Reset
                </Button>
              )}
            </div>
          </form>

          {/* Polling progress */}
          {state.phase === 'polling' && (
            <Card>
              <CardHeader>
                <CardTitle>Assessment in Progress</CardTitle>
                <Badge variant="status">{state.events.length} events</Badge>
              </CardHeader>
              <div className="space-y-2">
                {state.events.slice(-4).map((ev) => (
                  <div key={ev.event_id} className="flex items-center gap-2 text-xs text-[#94A3B8] py-1 border-b border-[#1E2D47] last:border-0">
                    <Loader2 size={10} className="text-teal-400 animate-spin flex-shrink-0" />
                    <span className="font-mono text-[#64748B]">{ev.event_type}</span>
                    <span className={cn(
                      'ml-auto text-[10px] px-1.5 py-0.5 rounded',
                      ev.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      ev.status === 'running' ? 'bg-blue-500/10 text-blue-400' : 'bg-[#101A30] text-[#64748B]',
                    )}>{ev.status}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
              {state.phase === 'complete' && riskData && (
                <Badge variant='demo'>
                  {riskData.risk_level.toUpperCase()}
                </Badge>
              )}
            </CardHeader>

            {state.phase === 'idle' && (
              <EmptyState
                icon={<Smartphone size={18} />}
                title="No Evidence Yet"
                description="Select indicators or describe suspicious behavior, then assess risk."
              />
            )}

            {state.phase === 'submitting' && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 size={24} className="text-teal-400 animate-spin" />
                <p className="text-xs text-[#94A3B8]">Submitting to backend…</p>
              </div>
            )}

            {state.phase === 'polling' && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 size={24} className="text-teal-400 animate-spin" />
                <p className="text-xs text-[#94A3B8]">Assessing device risk…</p>
                <p className="text-[10px] text-[#64748B]">ID: {state.analysisId.slice(0, 8)}…</p>
              </div>
            )}

            {state.phase === 'error' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/20">
                  <XCircle size={13} className="text-red-400" />
                  <div>
                    <p className="text-xs font-semibold text-red-300">Assessment Failed</p>
                    <p className="text-[10px] text-[#94A3B8]">{state.message}</p>
                  </div>
                </div>
                <p className="text-[10px] text-[#64748B]">Ensure backend is running on port 8001.</p>
              </div>
            )}

            {state.phase === 'complete' && (
              <div className="space-y-3">
                {riskData && (
                  <>
                    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border', getRiskBg(riskData.risk_level))}>
                      <Smartphone size={13} />
                      <div>
                        <p className="text-xs font-semibold capitalize">{riskData.risk_level} Device Risk</p>
                        <p className="text-[10px]">Score: {formatRiskScore(riskData.device_risk_score)}/100</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {[
                        { label: 'Device Risk Score', value: `${formatRiskScore(riskData.device_risk_score)}/100` },
                        {
                          label: 'Remote Access Apps',
                          value: deviceData?.remote_access_apps?.length
                            ? deviceData.remote_access_apps.join(', ')
                            : selectedApps.length ? selectedApps.join(', ') : 'None',
                        },
                        {
                          label: 'Suspicious Permissions',
                          value: deviceData?.suspicious_permissions?.length
                            ? deviceData.suspicious_permissions.join(', ')
                            : selectedPerms.length ? selectedPerms.join(', ') : 'None',
                        },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between py-1.5 border-b border-[#1E2D47] last:border-0">
                          <span className="text-xs text-[#94A3B8]">{item.label}</span>
                          <span className="text-xs font-medium text-[#F8FAFC] text-right max-w-[120px] truncate">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {deviceData?.summary && (
                      <div className="rounded-lg bg-[#080F20] border border-[#1E2D47] p-3">
                        <p className="text-[10px] text-[#64748B] mb-1">Assessment Summary</p>
                        <p className="text-xs text-[#94A3B8] leading-relaxed">{deviceData.summary}</p>
                      </div>
                    )}

                    {deviceData?.recommended_action && (
                      <div className="rounded-lg bg-teal-500/5 border border-teal-500/15 p-3">
                        <p className="text-[10px] text-teal-400 mb-1">Recommended Action</p>
                        <p className="text-xs text-[#F8FAFC] leading-relaxed">{deviceData.recommended_action}</p>
                      </div>
                    )}

                    {/* Explanation */}
                    {riskData.explanation && (
                      <div className="rounded-lg bg-[#080F20] border border-[#1E2D47] p-3">
                        <p className="text-[10px] text-[#64748B] mb-1">Risk Explanation</p>
                        <p className="text-xs text-[#94A3B8] leading-relaxed whitespace-pre-wrap">{riskData.explanation}</p>
                      </div>
                    )}
                  </>
                )}

                {!riskData && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/8 border border-amber-500/20">
                    <AlertTriangle size={13} className="text-amber-400" />
                    <div>
                      <p className="text-xs font-semibold text-amber-300">No Risk Assessment</p>
                      <p className="text-[10px] text-[#94A3B8]">Evidence submitted but no risk event received.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader><CardTitle>High-Risk Indicators</CardTitle></CardHeader>
            <ul className="space-y-2">
              {[
                'Remote-access app installed/requested',
                'Screen recording permission granted',
                'Accessibility service enabled for unknown app',
                'APK downloaded from unknown source',
                'Device admin rights granted to unknown app',
                'Banking app credentials shared',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-[#94A3B8]">
                  <AlertTriangle size={10} className="text-red-400 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
