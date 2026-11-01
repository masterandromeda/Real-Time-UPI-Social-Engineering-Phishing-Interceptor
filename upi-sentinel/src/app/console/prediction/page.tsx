'use client';

import { useState } from 'react';
import { Brain, Phone, Link as LinkIcon, Smartphone, AlertTriangle, Play, Info, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, Progress, RiskScoreRing } from '@/components/ui';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { API_BASE } from '@/lib/api';

const SCAM_STAGES = [
  { id: 'initial_contact', label: 'Initial Contact', desc: 'First contact established' },
  { id: 'trust_building', label: 'Trust Building', desc: 'Building victim confidence' },
  { id: 'urgency_creation', label: 'Urgency Creation', desc: 'Creating time pressure' },
  { id: 'link_delivery', label: 'Link Delivery', desc: 'Phishing URL delivered' },
  { id: 'device_compromise', label: 'Device Compromise', desc: 'Remote access requested' },
  { id: 'authorization_pressure', label: 'Authorization Pressure', desc: 'Payment being pushed' },
  { id: 'payment_extraction', label: 'Payment Extraction', desc: 'UPI transfer initiated' },
];

function SignalInput({
  label, icon: Icon, color, score, setScore, href, placeholder,
}: {
  label: string; icon: React.ElementType; color: string;
  score: number; setScore: (v: number) => void; href: string; placeholder: string;
}) {
  return (
    <div className="rounded-xl border border-[#1E2D47] bg-[#0B1224] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
            <Icon size={13} style={{ color }} />
          </div>
          <span className="text-xs font-semibold text-[#F8FAFC]">{label}</span>
        </div>
        <Link href={href} className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5">
          Analyze <ChevronRight size={10} />
        </Link>
      </div>
      <p className="text-[10px] text-[#64748B] mb-3">{placeholder}</p>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-[#64748B]">Manual Risk Score</span>
          <span style={{ color }} className="font-semibold">{score}/100</span>
        </div>
        <input
          type="range" min={0} max={100} value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="w-full accent-blue-500 cursor-pointer"
          aria-label={`${label} risk score`}
        />
        <div className="flex justify-between text-[9px] text-[#64748B]">
          <span>Low</span><span>Medium</span><span>High</span><span>Critical</span>
        </div>
      </div>
    </div>
  );
}

interface PredictionResult {
  correlated_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  predicted_stage: string;
  confidence: number;
  explanation: string;
}

export default function ScamPredictionPage() {
  const [callScore, setCallScore] = useState(0);
  const [linkScore, setLinkScore] = useState(0);
  const [deviceScore, setDeviceScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayScore = result?.correlated_score ?? Math.round(callScore * 0.4 + linkScore * 0.35 + deviceScore * 0.25);
  const displayLevel = result?.risk_level ?? (
    displayScore >= 75 ? 'critical' :
    displayScore >= 50 ? 'high' :
    displayScore >= 25 ? 'medium' : 'low'
  );

  const riskColors = {
    critical: '#EF4444', high: '#F97316', medium: '#F59E0B', low: '#10B981',
  };

  async function handlePredict() {
    if (callScore === 0 && linkScore === 0 && deviceScore === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/prediction/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_risk_score: callScore,
          link_risk_score: linkScore,
          device_risk_score: deviceScore,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as PredictionResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backend not available');
      // Still show local estimate on error
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/5 border border-violet-500/15">
        <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0">
          <Brain size={15} className="text-violet-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F8FAFC]">Scam Prediction</p>
          <p className="text-xs text-[#94A3B8]">Correlate signals across all three risk channels</p>
        </div>
      </div>

      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-[#080F20] border border-[#1E2D47]">
        <Info size={13} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#94A3B8]">
          <span className="font-medium text-[#F8FAFC]">How to use:</span> Run individual analyses in Call Intelligence, Link Intelligence,
          and Device Guardian first. Then use the scores here to correlate signals. Or enter manual scores for a quick estimate.
          The backend will automatically correlate scores when connected.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Signal inputs */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-[#F8FAFC]">Input Risk Signals</h2>

          <SignalInput
            label="Call Intelligence" icon={Phone} color="#3B82F6"
            score={callScore} setScore={setCallScore} href="/console/call"
            placeholder="Risk score from Call Intelligence analysis, or manual estimate (0=no risk, 100=maximum risk)"
          />
          <SignalInput
            label="Link Intelligence" icon={LinkIcon} color="#06D6F0"
            score={linkScore} setScore={setLinkScore} href="/console/link"
            placeholder="Risk score from Link Intelligence analysis, or manual estimate"
          />
          <SignalInput
            label="Device Guardian" icon={Smartphone} color="#0D9488"
            score={deviceScore} setScore={setDeviceScore} href="/console/device"
            placeholder="Risk score from Device Guardian assessment, or manual estimate"
          />

          {error && (
            <p className="text-xs text-amber-400">⚠ Backend unavailable — showing local estimate</p>
          )}
          <Button
            variant="gradient" size="md"
            disabled={(callScore === 0 && linkScore === 0 && deviceScore === 0) || loading}
            onClick={handlePredict}
            className="w-full sm:w-auto"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Brain size={13} />}
            {loading ? 'Analyzing…' : 'Correlate and Predict'}
          </Button>
        </div>

        {/* Correlation visualization & results */}
        <div className="space-y-4">
          {/* Score ring */}
          <Card>
            <CardHeader>
              <CardTitle>Correlated Risk Score</CardTitle>
              {result && <Badge variant="status">BACKEND</Badge>}
            </CardHeader>
            <div className="flex flex-col items-center py-4">
              <RiskScoreRing score={displayScore} size={100} label="Risk Score" />
              <div className="mt-3 text-center">
                <p
                  className="text-sm font-bold capitalize"
                  style={{ color: riskColors[displayLevel] }}
                >
                  {displayLevel} Risk
                </p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {result ? `Confidence: ${Math.round(result.confidence * 100)}%` : 'Weighted: 40% call, 35% link, 25% device'}
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              <Progress label="Call (40%)" value={callScore} color="bg-blue-500" showValue />
              <Progress label="Link (35%)" value={linkScore} color="bg-cyan-500" showValue />
              <Progress label="Device (25%)" value={deviceScore} color="bg-teal-500" showValue />
            </div>
          </Card>

          {result?.explanation && (
            <Card>
              <CardHeader><CardTitle>AI Explanation</CardTitle></CardHeader>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{result.explanation}</p>
            </Card>
          )}

          {/* Scam stage */}
          <Card>
            <CardHeader>
              <CardTitle>Predicted Scam Stage</CardTitle>
              {result ? <Badge variant="status">BACKEND</Badge> : (result === null && displayScore > 0) ? <Badge variant="demo">ESTIMATED</Badge> : null}
            </CardHeader>
            {displayScore === 0 && !result ? (
              <p className="text-xs text-[#64748B] py-4 text-center">Run correlation to see predicted stage</p>
            ) : (
              <div className="space-y-1.5">
                {SCAM_STAGES.map((stage, i) => {
                  const stageScore = (i / (SCAM_STAGES.length - 1)) * 100;
                  const active = result
                    ? stage.id === result.predicted_stage
                    : (displayScore >= stageScore && displayScore < stageScore + (100 / SCAM_STAGES.length) + 10);
                  const past = result
                    ? SCAM_STAGES.findIndex((s) => s.id === result.predicted_stage) > i
                    : displayScore > stageScore + (100 / SCAM_STAGES.length);
                  return (
                    <div
                      key={stage.id}
                      className={cn(
                        'flex items-start gap-2 px-3 py-2 rounded-lg text-xs transition-all',
                        active ? 'bg-red-500/10 border border-red-500/25 text-red-400' :
                        past ? 'bg-[#080F20] text-[#64748B]' : 'text-[#64748B]',
                      )}
                    >
                      <div className={cn('w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0', active ? 'bg-red-400' : past ? 'bg-[#374151]' : 'bg-[#1E2D47]')} />
                      <div>
                        <p className={cn('font-medium', active ? 'text-red-400' : 'text-inherit')}>{stage.label}</p>
                        <p className="text-[10px] opacity-70">{stage.desc}</p>
                      </div>
                    </div>
                  );
                })}
                <p className="text-[10px] text-[#64748B] mt-2 pt-2 border-t border-[#1E2D47]">
                  {result ? '✓ Stage predicted by backend AI' : '⚠ Stage prediction is approximate. Connect backend for AI-powered analysis.'}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
