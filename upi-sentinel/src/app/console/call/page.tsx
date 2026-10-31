'use client';

import { useState } from 'react';
import { Phone, Upload, Mic, Globe, Play, AlertTriangle, CheckCircle2, Info, MicOff, Loader2, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, Input, Textarea, Select, EmptyState, Progress } from '@/components/ui';
import { cn, getRiskBg, getRiskColor, formatRiskScore, formatConfidence } from '@/lib/utils';
import {
  analyzeCall,
  pollUntilComplete,
  extractRiskAssessment,
  extractCallResult,
  type BackendEvent,
  type RiskPayload,
  type CallResultPayload,
} from '@/lib/api';

const LANG_OPTIONS = [
  { value: 'auto', label: 'Auto-Detect' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'punjabi', label: 'Punjabi' },
  { value: 'hinglish', label: 'Hinglish (Hindi + English)' },
  { value: 'english', label: 'English' },
];

const INPUT_MODES = [
  { id: 'transcript', label: 'Text Transcript', icon: Globe },
  { id: 'audio', label: 'Audio Upload', icon: Upload },
  { id: 'mic', label: 'Microphone', icon: Mic },
];

type AnalysisState =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'polling'; analysisId: string; events: BackendEvent[] }
  | { phase: 'complete'; risk: RiskPayload | null; call: CallResultPayload | null; events: BackendEvent[] }
  | { phase: 'error'; message: string };

export default function CallIntelligencePage() {
  const [inputMode, setInputMode] = useState<'transcript' | 'audio' | 'mic'>('transcript');
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('auto');
  const [state, setState] = useState<AnalysisState>({ phase: 'idle' });

  const isLoading = state.phase === 'submitting' || state.phase === 'polling';

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!transcript.trim() || isLoading) return;

    setState({ phase: 'submitting' });
    try {
      const { analysis_id } = await analyzeCall({
        transcript: transcript.trim(),
        language: language === 'auto' ? undefined : language,
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
      const call = extractCallResult(allEvents);
      setState({ phase: 'complete', risk, call, events: allEvents });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to backend';
      setState({ phase: 'error', message: msg });
    }
  }

  function reset() {
    setState({ phase: 'idle' });
  }

  const riskData = state.phase === 'complete' ? state.risk : null;
  const callData = state.phase === 'complete' ? state.call : null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
          <Phone size={15} className="text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F8FAFC]">Call Intelligence</p>
          <p className="text-xs text-[#94A3B8]">Analyze consent-based transcripts for social-engineering patterns</p>
        </div>
        <Badge variant="demo" className="ml-auto">CONSENT-BASED ONLY</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Input Source</CardTitle>
            </CardHeader>

            {/* Mode selector */}
            <div className="flex gap-2 mb-5">
              {INPUT_MODES.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setInputMode(mode.id as typeof inputMode)}
                    disabled={isLoading}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      inputMode === mode.id
                        ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                        : 'bg-[#080F20] border-[#1E2D47] text-[#94A3B8] hover:border-[#2D4060]',
                    )}
                  >
                    <Icon size={12} />
                    {mode.label}
                  </button>
                );
              })}
            </div>

            {inputMode === 'transcript' && (
              <form onSubmit={handleAnalyze} className="space-y-4">
                <Select
                  label="Language"
                  options={LANG_OPTIONS}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isLoading}
                />
                <Textarea
                  label="Conversation Transcript"
                  placeholder="Paste the conversation transcript here. Include all speaker turns. The analysis will identify impersonation patterns, urgency tactics, fear indicators, and other social-engineering signals..."
                  rows={10}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  hint="Provide a transcript you have consent to analyze. Do not include personal financial credentials."
                  disabled={isLoading}
                />
                <div className="flex gap-3">
                  <Button type="submit" variant="gradient" size="md" loading={isLoading} disabled={!transcript.trim()}>
                    <Play size={13} />
                    {isLoading ? 'Analyzing...' : 'Start Analysis'}
                  </Button>
                  {(state.phase === 'complete' || state.phase === 'error') && (
                    <Button type="button" variant="secondary" size="md" onClick={reset}>
                      New Analysis
                    </Button>
                  )}
                </div>
              </form>
            )}

            {inputMode === 'audio' && (
              <div className="space-y-4">
                <div className="rounded-xl border-2 border-dashed border-[#1E2D47] hover:border-blue-500/30 transition-colors p-8 text-center cursor-pointer">
                  <Upload size={24} className="text-[#64748B] mx-auto mb-3" />
                  <p className="text-sm text-[#94A3B8]">Upload audio file</p>
                  <p className="text-xs text-[#64748B] mt-1">Supported: MP3, WAV, M4A, OGG (max 50MB)</p>
                  <p className="text-xs text-amber-400 mt-2">⚠ Audio upload requires Sarvam AI integration</p>
                </div>
                <Button variant="secondary" size="md" disabled>
                  Audio Analysis — Sarvam AI Integration Required
                </Button>
              </div>
            )}

            {inputMode === 'mic' && (
              <div className="space-y-4">
                <div className="rounded-xl bg-[#080F20] border border-[#1E2D47] p-8 text-center">
                  <MicOff size={24} className="text-[#64748B] mx-auto mb-3" />
                  <p className="text-sm text-[#94A3B8]">Browser Microphone Input</p>
                  <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                    This feature requires explicit microphone permission and Sarvam AI backend integration.
                  </p>
                </div>
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
                  <Info size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-300/70">
                    Microphone analysis requires backend STT service (Sarvam AI) to be configured.
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Polling progress */}
          {state.phase === 'polling' && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis in Progress</CardTitle>
                <Badge variant="status">
                  {state.events.length} events
                </Badge>
              </CardHeader>
              <div className="space-y-2">
                {state.events.slice(-5).map((ev) => (
                  <div
                    key={ev.event_id}
                    className="flex items-center gap-2 text-xs text-[#94A3B8] py-1 border-b border-[#1E2D47] last:border-0"
                  >
                    <Loader2 size={10} className="text-blue-400 animate-spin flex-shrink-0" />
                    <span className="font-mono text-[#64748B]">{ev.event_type}</span>
                    {ev.agent_id && <span className="text-blue-400">{ev.agent_id}</span>}
                    <span className={cn(
                      'ml-auto text-[10px] px-1.5 py-0.5 rounded',
                      ev.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      ev.status === 'running' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-[#101A30] text-[#64748B]',
                    )}>{ev.status}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Results Panel */}
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
                icon={<Phone size={18} />}
                title="No Analysis Yet"
                description="Provide a transcript and click Start Analysis."
              />
            )}

            {state.phase === 'submitting' && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 size={24} className="text-blue-400 animate-spin" />
                <p className="text-xs text-[#94A3B8]">Submitting to backend…</p>
              </div>
            )}

            {state.phase === 'polling' && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 size={24} className="text-blue-400 animate-spin" />
                <p className="text-xs text-[#94A3B8]">AI agents analyzing…</p>
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
                <p className="text-[10px] text-[#64748B]">
                  Ensure the backend is running on port 8001 and try again.
                </p>
              </div>
            )}

            {state.phase === 'complete' && (
              <div className="space-y-3">
                {riskData && (
                  <>
                    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border', getRiskBg(riskData.risk_level))}>
                      <AlertTriangle size={13} />
                      <div>
                        <p className="text-xs font-semibold capitalize">{riskData.risk_level} Risk Detected</p>
                        <p className="text-[10px]">Score: {formatRiskScore(riskData.overall_score)}/100</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {[
                        { label: 'Risk Score', value: `${formatRiskScore(riskData.call_risk_score)}/100` },
                        {
                          label: 'Impersonation',
                          value: callData?.impersonation_detected ? '⚠ Detected' : '✓ Not Detected',
                        },
                        {
                          label: 'Urgency Signals',
                          value: callData?.urgency_indicators?.length
                            ? `${callData.urgency_indicators.length} found`
                            : 'None',
                        },
                        {
                          label: 'Fear Indicators',
                          value: callData?.fear_indicators?.length
                            ? `${callData.fear_indicators.length} found`
                            : 'None',
                        },
                        {
                          label: 'Confidence',
                          value: formatConfidence(riskData.ai_confidence),
                        },
                        {
                          label: 'Scam Category',
                          value: riskData.scam_category?.replace(/_/g, ' ') ?? '—',
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex justify-between py-1.5 border-b border-[#1E2D47] last:border-0"
                        >
                          <span className="text-xs text-[#94A3B8]">{item.label}</span>
                          <span className={cn('text-xs font-medium',
                            item.value.includes('⚠') ? 'text-amber-400' :
                            item.value.includes('✓') ? 'text-emerald-400' : 'text-[#F8FAFC]',
                          )}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {riskData.explanation && (
                      <div className="rounded-lg bg-[#080F20] border border-[#1E2D47] p-3">
                        <p className="text-[10px] text-[#64748B] mb-1">Risk Explanation</p>
                        <p className="text-xs text-[#94A3B8] leading-relaxed whitespace-pre-wrap">{riskData.explanation}</p>
                      </div>
                    )}

                    {callData?.recommended_action && (
                      <div className="rounded-lg bg-blue-500/5 border border-blue-500/15 p-3">
                        <p className="text-[10px] text-blue-400 mb-1">Recommended Action</p>
                        <p className="text-xs text-[#F8FAFC] leading-relaxed">{callData.recommended_action}</p>
                      </div>
                    )}

                    {/* Suspicious phrases / evidence */}
                    {riskData.contributing_signals.length > 0 && (
                      <div>
                        <p className="text-[10px] text-[#64748B] mb-1.5">Contributing Signals</p>
                        {riskData.contributing_signals
                          .filter((s) => s.evidence.length > 0)
                          .map((sig) => (
                            <div key={sig.signal} className="mb-2">
                              <p className="text-[10px] text-blue-400 mb-1 capitalize">
                                {sig.signal.replace(/_/g, ' ')} — {formatRiskScore(sig.weighted_contribution)} pts
                              </p>
                              {sig.evidence.map((ev) => (
                                <div key={ev} className="flex items-start gap-1.5 text-[10px] text-[#94A3B8] mb-0.5">
                                  <span className="text-amber-400 mt-0.5">•</span>
                                  <span>{ev}</span>
                                </div>
                              ))}
                            </div>
                          ))}
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

          {/* Indicators guide */}
          <Card>
            <CardHeader>
              <CardTitle>What We Detect</CardTitle>
            </CardHeader>
            <ul className="space-y-2">
              {[
                'Bank/authority impersonation',
                'Urgency and pressure tactics',
                'Fear-based language patterns',
                'Suspicious request phrases',
                'Social-engineering signals',
                'Hindi / Punjabi / Hinglish patterns',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-[#94A3B8]">
                  <CheckCircle2 size={11} className="text-blue-400 flex-shrink-0" />
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
