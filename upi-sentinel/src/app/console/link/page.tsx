'use client';

import { useState } from 'react';
import { Link as LinkIcon, Search, AlertTriangle, CheckCircle2, Info, Shield, Loader2, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, Input, EmptyState } from '@/components/ui';
import { cn, getRiskBg, formatRiskScore } from '@/lib/utils';
import {
  analyzeLink,
  pollUntilComplete,
  extractRiskAssessment,
  extractLinkResult,
  type BackendEvent,
  type RiskPayload,
  type LinkResultPayload,
} from '@/lib/api';

function StatusBadge({ status }: {
  status: 'clean' | 'malicious' | 'suspicious' | 'unavailable' | 'pending' | 'not_configured' | 'error';
}) {
  const configs: Record<string, string> = {
    clean: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    malicious: 'bg-red-500/10 border-red-500/30 text-red-400',
    suspicious: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    unavailable: 'bg-slate-700/30 border-slate-600/30 text-slate-500',
    pending: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    not_configured: 'bg-slate-700/30 border-slate-600/30 text-slate-500',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
  };
  const labels: Record<string, string> = {
    clean: 'Clean',
    malicious: 'Malicious',
    suspicious: 'Suspicious',
    unavailable: 'Unavailable',
    pending: 'Pending',
    not_configured: 'Not Configured',
    error: 'Error',
  };
  return (
    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', configs[status] ?? configs.unavailable)}>
      {labels[status] ?? status}
    </span>
  );
}

type AnalysisState =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'polling'; analysisId: string; events: BackendEvent[] }
  | { phase: 'complete'; risk: RiskPayload | null; link: LinkResultPayload | null; events: BackendEvent[] }
  | { phase: 'error'; message: string };

export default function LinkIntelligencePage() {
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [state, setState] = useState<AnalysisState>({ phase: 'idle' });

  const isLoading = state.phase === 'submitting' || state.phase === 'polling';

  function validateUrl(value: string) {
    if (!value.trim()) return 'URL is required';
    try {
      new URL(value.trim());
      return '';
    } catch {
      if (value.startsWith('upi://')) return '';
      return 'Enter a valid URL (https://...) or UPI deep link (upi://)';
    }
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    const err = validateUrl(url);
    if (err) { setUrlError(err); return; }
    if (isLoading) return;
    setUrlError('');

    setState({ phase: 'submitting' });
    try {
      const { analysis_id } = await analyzeLink({ url: url.trim(), is_demo: false });
      setState({ phase: 'polling', analysisId: analysis_id, events: [] });

      const allEvents = await pollUntilComplete(
        analysis_id,
        (events) => setState({ phase: 'polling', analysisId: analysis_id, events }),
        30_000,
        600,
      );

      const risk = extractRiskAssessment(allEvents);
      const link = extractLinkResult(allEvents);
      setState({ phase: 'complete', risk, link, events: allEvents });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to backend';
      setState({ phase: 'error', message: msg });
    }
  }

  function reset() {
    setState({ phase: 'idle' });
    setUrlError('');
  }

  const isUpi = url.startsWith('upi://');
  const riskData = state.phase === 'complete' ? state.risk : null;
  const linkData = state.phase === 'complete' ? state.link : null;

  // Build reputation rows from actual results
  const reputationRows = riskData ? [
    {
      id: 'urlhaus',
      name: 'URLhaus',
      status: (linkData?.urlhaus_status ?? 'not_configured') as 'clean' | 'malicious' | 'suspicious' | 'unavailable' | 'pending' | 'not_configured' | 'error',
      note: linkData?.urlhaus_status === 'not_configured' ? 'API key required' : 'Live result',
    },
    {
      id: 'virustotal',
      name: 'VirusTotal',
      status: (linkData?.virustotal_status ?? 'not_configured') as 'clean' | 'malicious' | 'suspicious' | 'unavailable' | 'pending' | 'not_configured' | 'error',
      note: linkData?.virustotal_status === 'not_configured' ? 'API key required' : 'Live result',
    },
    {
      id: 'safe_browsing',
      name: 'Google Safe Browsing',
      status: 'not_configured' as const,
      note: 'Not integrated',
    },
  ] : [
    { id: 'urlhaus', name: 'URLhaus', status: 'not_configured' as const, note: 'Configure in Integrations' },
    { id: 'virustotal', name: 'VirusTotal', status: 'not_configured' as const, note: 'Configure in Integrations' },
    { id: 'safe_browsing', name: 'Google Safe Browsing', status: 'not_configured' as const, note: 'Not integrated' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center flex-shrink-0">
          <LinkIcon size={15} className="text-cyan-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F8FAFC]">Link Intelligence</p>
          <p className="text-xs text-[#94A3B8]">Analyze suspicious URLs, UPI deep links, and redirect chains</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submit URL for Analysis</CardTitle>
            </CardHeader>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <Input
                label="Suspicious URL or UPI Deep Link"
                placeholder="https://suspicious-site.example.com or upi://pay?..."
                value={url}
                onChange={(e) => { setUrl(e.target.value); setUrlError(''); }}
                error={urlError}
                hint="Enter any URL you received in a scam call, SMS, or message for analysis."
                disabled={isLoading}
              />
              {isUpi && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/15">
                  <Info size={12} className="text-blue-400" />
                  <p className="text-xs text-blue-300/70">UPI deep link detected — will analyze payment parameters and recipient</p>
                </div>
              )}
              <div className="flex gap-3">
                <Button type="submit" variant="gradient" size="md" loading={isLoading} disabled={!url.trim()}>
                  <Search size={13} />
                  {isLoading ? 'Analyzing...' : 'Analyze Link'}
                </Button>
                {(state.phase === 'complete' || state.phase === 'error') && (
                  <Button type="button" variant="secondary" size="md" onClick={reset}>
                    New Analysis
                  </Button>
                )}
              </div>
            </form>
          </Card>

          {/* Polling progress */}
          {state.phase === 'polling' && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis in Progress</CardTitle>
                <Badge variant="status">{state.events.length} events</Badge>
              </CardHeader>
              <div className="space-y-2">
                {state.events.slice(-4).map((ev) => (
                  <div key={ev.event_id} className="flex items-center gap-2 text-xs text-[#94A3B8] py-1 border-b border-[#1E2D47] last:border-0">
                    <Loader2 size={10} className="text-cyan-400 animate-spin flex-shrink-0" />
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

          {/* Reputation sources */}
          <Card>
            <CardHeader>
              <CardTitle>Threat Intelligence Sources</CardTitle>
              <Badge variant="status">{state.phase === 'complete' ? 'Results' : 'Integration Required'}</Badge>
            </CardHeader>
            <div className="space-y-3">
              {reputationRows.map((source) => (
                <div key={source.id} className="flex items-center justify-between py-2 border-b border-[#1E2D47] last:border-0">
                  <div>
                    <p className="text-xs font-medium text-[#94A3B8]">{source.name}</p>
                    <p className="text-[10px] text-[#64748B]">{source.note}</p>
                  </div>
                  <StatusBadge status={source.status} />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#64748B] mt-3 pt-2 border-t border-[#1E2D47]">
              Reputation results are real when integrations are configured. Results are never fabricated.
            </p>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              {state.phase === 'complete' && riskData && (
                <Badge variant='demo'>
                  {riskData.risk_level.toUpperCase()}
                </Badge>
              )}
            </CardHeader>

            {state.phase === 'idle' && (
              <EmptyState
                icon={<LinkIcon size={18} />}
                title="No Analysis Yet"
                description="Submit a URL to begin analysis."
              />
            )}

            {state.phase === 'submitting' && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 size={24} className="text-cyan-400 animate-spin" />
                <p className="text-xs text-[#94A3B8]">Submitting to backend…</p>
              </div>
            )}

            {state.phase === 'polling' && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 size={24} className="text-cyan-400 animate-spin" />
                <p className="text-xs text-[#94A3B8]">Analyzing link…</p>
                <p className="text-[10px] text-[#64748B]">ID: {state.analysisId.slice(0, 8)}…</p>
              </div>
            )}

            {state.phase === 'error' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/20">
                  <XCircle size={13} className="text-red-400" />
                  <div>
                    <p className="text-xs font-semibold text-red-300">Analysis Failed</p>
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
                      <Shield size={13} />
                      <div>
                        <p className="text-xs font-semibold capitalize">{riskData.risk_level} Risk</p>
                        <p className="text-[10px]">Link score: {formatRiskScore(riskData.link_risk_score)}/100</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {[
                        { label: 'Risk Score', value: `${formatRiskScore(riskData.link_risk_score)}/100` },
                        { label: 'Domain', value: linkData?.domain ?? '—' },
                        { label: 'UPI Deep Link', value: linkData?.is_upi_deep_link ? '✓ Yes' : '✗ No' },
                        { label: 'HTTPS', value: url.startsWith('https') ? '✓ Yes' : url.startsWith('http') ? '✗ No' : '—' },
                        {
                          label: 'Threat Categories',
                          value: linkData?.threat_categories?.length
                            ? linkData.threat_categories.join(', ')
                            : 'None detected',
                        },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between py-1.5 border-b border-[#1E2D47] last:border-0">
                          <span className="text-xs text-[#94A3B8]">{item.label}</span>
                          <span className={cn('text-xs font-medium',
                            item.value.includes('✓') ? 'text-emerald-400' :
                            item.value.includes('✗') ? 'text-red-400' : 'text-[#F8FAFC]',
                          )}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {linkData?.summary && (
                      <div className="rounded-lg bg-[#080F20] border border-[#1E2D47] p-3">
                        <p className="text-[10px] text-[#64748B] mb-1">Analysis Summary</p>
                        <p className="text-xs text-[#94A3B8] leading-relaxed">{linkData.summary}</p>
                      </div>
                    )}

                    {linkData?.recommended_action && (
                      <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/15 p-3">
                        <p className="text-[10px] text-cyan-400 mb-1">Recommended Action</p>
                        <p className="text-xs text-[#F8FAFC] leading-relaxed">{linkData.recommended_action}</p>
                      </div>
                    )}
                  </>
                )}

                {!riskData && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/8 border border-amber-500/20">
                    <AlertTriangle size={13} className="text-amber-400" />
                    <div>
                      <p className="text-xs font-semibold text-amber-300">No Risk Assessment</p>
                      <p className="text-[10px] text-[#94A3B8]">Analysis completed but no risk event received.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader><CardTitle>Analysis Checks</CardTitle></CardHeader>
            <ul className="space-y-2">
              {[
                'Domain registration age',
                'HTTPS certificate validation',
                'UPI deep link parameter analysis',
                'Redirect chain inspection',
                'URLhaus reputation (when configured)',
                'VirusTotal lookup (when configured)',
                'Suspicious TLD patterns',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-[#94A3B8]">
                  <CheckCircle2 size={11} className="text-cyan-400 flex-shrink-0" />
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
