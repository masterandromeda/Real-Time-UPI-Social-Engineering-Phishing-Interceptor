'use client';

import { useState } from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert, Info, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, RiskScoreRing } from '@/components/ui';
import { cn } from '@/lib/utils';

const DEMO_SCENARIOS = [
  {
    id: 'medium',
    label: 'Medium Risk — Call from Unknown Number',
    riskLevel: 'medium' as const,
    score: 42,
    reason: 'Caller claimed to be from bank. Urgency language detected in transcript.',
    evidence: [
      'Transcript: "Your account will be blocked in 2 hours"',
      'Unknown caller number',
      'Request for OTP mentioned',
    ],
    recommended: 'Do not share OTP or PIN with any caller. Real banks never ask for these over phone calls.',
    isSimulated: true,
  },
  {
    id: 'high',
    label: 'High Risk — Suspicious URL + Call',
    riskLevel: 'high' as const,
    score: 72,
    reason: 'Phishing URL delivered during call. Domain registered recently. Remote-access app requested.',
    evidence: [
      'URL: sbi-secure-update[.]xyz (suspicious domain)',
      'Domain age: 3 days',
      'AnyDesk installation requested',
    ],
    recommended: 'Do not click the link. Do not install any app. Disconnect the call. Report to bank immediately.',
    isSimulated: true,
  },
  {
    id: 'critical',
    label: 'Critical Risk — Active Scam in Progress',
    riskLevel: 'critical' as const,
    score: 91,
    reason: 'All three risk signals confirmed. Screen sharing active. Payment authorization pressure detected.',
    evidence: [
      'Remote access app running with screen share',
      'Multiple phishing URL redirects detected',
      'Caller applying extreme urgency: "Pay NOW or lose money"',
    ],
    recommended: 'STOP IMMEDIATELY. Disconnect internet. Remove remote-access app. Contact bank fraud helpline.',
    isSimulated: true,
  },
];

const riskConfig = {
  low: { color: '#10B981', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', icon: ShieldCheck, label: 'Low Risk' },
  medium: { color: '#F59E0B', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', icon: AlertTriangle, label: 'Medium Risk' },
  high: { color: '#F97316', bg: 'bg-orange-500/10 border-orange-500/30', text: 'text-orange-400', icon: ShieldAlert, label: 'High Risk' },
  critical: { color: '#EF4444', bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', icon: AlertTriangle, label: 'Critical Risk' },
};

export default function SafetyInterventionPage() {
  const [scenario, setScenario] = useState<typeof DEMO_SCENARIOS[0] | null>(null);
  const [holdActive, setHoldActive] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  function loadScenario(s: typeof DEMO_SCENARIOS[0]) {
    setScenario(s);
    setHoldActive(false);
    setAcknowledged(false);
  }

  function activateHold() {
    setHoldActive(true);
  }

  function acknowledge() {
    setAcknowledged(true);
    setHoldActive(false);
  }

  const cfg = scenario ? riskConfig[scenario.riskLevel] : null;
  const RiskIcon = cfg?.icon ?? ShieldCheck;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/15">
        <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={15} className="text-red-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F8FAFC]">Safety Intervention</p>
          <p className="text-xs text-[#94A3B8]">Protective warnings and simulated pre-authorization safety holds</p>
        </div>
        <Badge variant="demo" className="ml-auto">SIMULATED HOLDS</Badge>
      </div>

      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-[#080F20] border border-[#1E2D47]">
        <Info size={13} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#94A3B8]">
          <span className="font-medium text-[#F8FAFC]">Important:</span> Safety holds shown here are
          <span className="text-amber-400 font-medium"> simulated in this web prototype only</span>. UPI Sentinel cannot block or freeze
          actual UPI transactions without authorized integration with payment processors. Safety holds are protective
          guidance tools — final decisions always rest with the user.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Demo Scenarios */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Demo Scenarios</CardTitle>
              <Badge variant="demo">SIMULATED</Badge>
            </CardHeader>
            <p className="text-xs text-[#94A3B8] mb-3">
              Select a scenario to see what a safety intervention looks like:
            </p>
            <div className="space-y-2">
              {DEMO_SCENARIOS.map((s) => {
                const c = riskConfig[s.riskLevel];
                return (
                  <button
                    key={s.id}
                    onClick={() => loadScenario(s)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg border transition-all text-xs',
                      scenario?.id === s.id
                        ? `${c.bg} ${c.text}`
                        : 'bg-[#080F20] border-[#1E2D47] text-[#94A3B8] hover:border-[#2D4060]',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{s.label}</span>
                      <span className={cn('font-bold capitalize', c.text)}>{s.riskLevel}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-[#64748B] mt-3 pt-2 border-t border-[#1E2D47]">
              In production, interventions are triggered automatically by the Safety Intervention Agent.
            </p>
          </Card>
        </div>

        {/* Intervention Panel */}
        <div className="lg:col-span-2 space-y-4">
          {!scenario ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#101A30] border border-[#1E2D47] flex items-center justify-center mb-4">
                  <Eye size={24} className="text-[#64748B]" />
                </div>
                <h3 className="text-sm font-semibold text-[#F8FAFC] mb-2">No Active Intervention</h3>
                <p className="text-xs text-[#64748B] max-w-xs">
                  Select a demo scenario to see the safety intervention interface, or connect the backend
                  for real-time intervention triggers.
                </p>
              </div>
            </Card>
          ) : (
            <>
              {/* Risk Alert */}
              <div className={cn('rounded-xl border p-5', cfg!.bg)}>
                <div className="flex items-start gap-3">
                  <RiskIcon size={24} className={cfg!.text} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={cn('text-base font-bold', cfg!.text)}>{cfg!.label} Detected</h3>
                      <Badge variant="demo" size="sm">SIMULATED</Badge>
                    </div>
                    <p className="text-sm text-[#F8FAFC]/80 leading-relaxed">{scenario.reason}</p>
                  </div>
                  <RiskScoreRing score={scenario.score} size={72} label="Risk" />
                </div>
              </div>

              {/* Evidence */}
              <Card>
                <CardHeader><CardTitle>Evidence Summary</CardTitle></CardHeader>
                <ul className="space-y-2">
                  {scenario.evidence.map((ev, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#94A3B8] py-1.5 border-b border-[#1E2D47] last:border-0">
                      <AlertTriangle size={11} className={cfg!.text + ' mt-0.5 flex-shrink-0'} />
                      {ev}
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Recommended action */}
              <Card>
                <CardHeader><CardTitle>Recommended Protective Action</CardTitle></CardHeader>
                <div className="px-4 py-3 rounded-lg bg-[#080F20] border border-[#1E2D47]">
                  <p className="text-sm text-[#F8FAFC] leading-relaxed">{scenario.recommended}</p>
                </div>
              </Card>

              {/* Safety hold + user confirmation */}
              <Card>
                <CardHeader>
                  <CardTitle>Safety Hold</CardTitle>
                  <Badge variant="demo">SIMULATED</Badge>
                </CardHeader>

                {!holdActive && !acknowledged && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#94A3B8]">
                      Activate a simulated pre-authorization safety hold. In production, this would pause
                      the payment flow pending user confirmation. This prototype simulates the interface only.
                    </p>
                    <Button variant="danger" size="md" onClick={activateHold}>
                      <ShieldAlert size={13} />
                      Activate Simulated Safety Hold
                    </Button>
                  </div>
                )}

                {holdActive && !acknowledged && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-center">
                      <AlertTriangle size={24} className="text-red-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-red-400 mb-1">⚠ SIMULATED SAFETY HOLD ACTIVE</p>
                      <p className="text-xs text-[#94A3B8]">
                        This is a simulated protective hold. In a real integration, payment authorization
                        would be paused here pending your explicit confirmation.
                      </p>
                    </div>
                    <p className="text-xs font-medium text-[#F8FAFC]">Do you want to proceed?</p>
                    <div className="flex gap-3">
                      <Button variant="danger" size="md" onClick={acknowledge} className="flex-1">
                        <XCircle size={13} />
                        Cancel Transaction (Recommended)
                      </Button>
                      <Button variant="secondary" size="md" onClick={acknowledge} className="flex-1">
                        <CheckCircle2 size={13} />
                        Proceed Anyway (I understand the risk)
                      </Button>
                    </div>
                  </div>
                )}

                {acknowledged && (
                  <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-4 text-center">
                    <CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-emerald-400 mb-1">Safety Hold Acknowledged</p>
                    <p className="text-xs text-[#94A3B8]">User confirmation received. Simulated hold released.</p>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
