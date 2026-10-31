'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Phone, Link as LinkIcon, Smartphone, Brain, AlertTriangle,
  Building2, Landmark, CreditCard, Radio, Users, UserCheck,
  ShieldCheck, TrendingUp, Zap, Lock, Eye, BarChart3,
  CheckCircle2, ArrowRight, ChevronDown, ChevronUp,
  Mail, MessageSquare,
  Activity, Globe, Database, Server, PlayCircle,
  Shield
} from 'lucide-react';
import {
  Badge, Button, Card, SectionHeader, MetricCard, Input, Textarea, Select
} from '@/components/ui';
import { cn } from '@/lib/utils';

// ─── Capabilities ─────────────────────────────────────────────────────────────
const capabilities = [
  {
    num: '01', icon: Phone, color: '#3B82F6',
    title: 'Call Intelligence',
    description:
      'Analyze consent-based audio or conversation transcripts to identify impersonation, urgency, threats, fear, and social-engineering patterns across Hindi, Punjabi, and Hinglish.',
  },
  {
    num: '02', icon: LinkIcon, color: '#06D6F0',
    title: 'Link Intelligence',
    description:
      'Analyze suspicious URLs, UPI deep links, redirects, and domains. Cross-reference with available threat-intelligence reputation sources.',
  },
  {
    num: '03', icon: Smartphone, color: '#0D9488',
    title: 'Device Guardian',
    description:
      'Evaluate permitted device-risk evidence, remote-access application indicators, and suspicious permission combinations to assess device compromise risk.',
  },
  {
    num: '04', icon: Brain, color: '#8B5CF6',
    title: 'Scam Prediction',
    description:
      'Correlate call, link, and device signals to estimate the likelihood of the next scam stage and predict potential UPI fraud before authorization.',
  },
  {
    num: '05', icon: AlertTriangle, color: '#F59E0B',
    title: 'Safety Intervention',
    description:
      'Present actionable warnings and a simulated pre-authorization safety hold in the current web prototype, guiding users to confirm or pause before proceeding.',
  },
];

// ─── How It Works ─────────────────────────────────────────────────────────────
const steps = [
  {
    num: '01', title: 'Capture Security Signals',
    desc: 'Collect consent-based conversation transcripts, user-submitted suspicious URLs, and device-risk evidence through the UPI Sentinel interface.',
    icon: Activity,
  },
  {
    num: '02', title: 'AI-Powered Analysis',
    desc: 'Each signal type is independently analyzed by dedicated AI agents — Call Intelligence, Link Intelligence, and Device Guardian.',
    icon: Brain,
  },
  {
    num: '03', title: 'Scam Pattern Correlation',
    desc: 'The Scam Prediction agent correlates results across all three signal types to identify known social-engineering attack patterns.',
    icon: Globe,
  },
  {
    num: '04', title: 'Risk Prediction and User Alert',
    desc: 'The Explanation agent generates a clear, human-readable risk assessment with confidence levels and evidence-based reasoning.',
    icon: AlertTriangle,
  },
  {
    num: '05', title: 'Human Confirmation and Protective Guidance',
    desc: 'The Safety Intervention agent presents the risk to the user and provides protective recommendations, requiring explicit human confirmation.',
    icon: ShieldCheck,
  },
];

// ─── Industries ────────────────────────────────────────────────────────────────
const industries = [
  { icon: Landmark, title: 'Banking', desc: 'Detect account takeover patterns and social-engineering attacks targeting bank customers.' },
  { icon: Zap, title: 'Fintech', desc: 'Protect digital finance users from scam journeys leading to unauthorized transfers.' },
  { icon: CreditCard, title: 'UPI Platforms', desc: 'Add an intelligence layer to identify high-risk sessions before authorization.' },
  { icon: Radio, title: 'Telecom', desc: 'Correlate suspicious call patterns with financial transaction risk signals.' },
  { icon: Building2, title: 'Financial Institutions', desc: 'Enterprise fraud intelligence with API integration for risk teams.' },
  { icon: Users, title: 'Individual Users', desc: 'Personal protection for anyone who makes UPI payments.' },
  { icon: UserCheck, title: 'Families', desc: 'Protect elderly and less tech-savvy family members from scam calls.' },
  { icon: Eye, title: 'Security Teams', desc: 'Fraud investigation and security analytics dashboards.' },
];

// ─── Pricing ──────────────────────────────────────────────────────────────────
const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Essential protection for individual users.',
    features: ['5 URL analyses per day', 'Transcript analysis (text only)', 'Basic risk assessment', 'Safety intervention alerts', 'Single device'],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '₹499',
    period: 'per month',
    description: 'Advanced protection with full feature access.',
    features: ['Unlimited URL analyses', 'Audio transcript analysis', 'Advanced scam prediction', 'Device-risk analysis', 'Priority alerts', 'Family protection (up to 5)', 'Session history'],
    cta: 'Start Professional',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'Full-platform deployment for banks and fintech.',
    features: ['API integration', 'Bulk event processing', 'Business analytics dashboard', 'Agent monitoring', 'SLA guarantees', 'Dedicated support', 'Custom reporting', 'Authorized PSP integrations'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: 'How does UPI Sentinel detect scams?',
    a: 'UPI Sentinel analyzes three types of signals — consent-based conversation transcripts, user-submitted suspicious URLs, and device-risk evidence. AI agents process each signal type independently, then a Scam Prediction agent correlates results to estimate the likelihood of a scam in progress.',
  },
  {
    q: 'Can it analyze phishing calls?',
    a: 'Yes. The Call Intelligence module can analyze conversation transcripts provided by the user or consent-based audio uploads. It detects impersonation language, urgency and fear tactics, and social-engineering patterns in Hindi, Punjabi, and Hinglish.',
  },
  {
    q: 'How does link intelligence work?',
    a: 'When you submit a suspicious URL, UPI Sentinel checks domain age, redirect chains, UPI deep-link structure, and cross-references with available threat intelligence sources like URLhaus and VirusTotal (when configured). It provides a risk score with an explanation.',
  },
  {
    q: 'How does device-risk analysis work?',
    a: 'Users can submit evidence about their device state — such as indicators of remote-access applications, suspicious permission grants, or unusual activity. UPI Sentinel evaluates this evidence. It does not automatically inspect installed applications from a standard browser context.',
  },
  {
    q: 'Does it monitor phone calls automatically?',
    a: 'No. UPI Sentinel does not silently monitor phone calls, SMS, WhatsApp, or any other application. All call analysis is consent-based — you explicitly provide a transcript or audio recording for analysis.',
  },
  {
    q: 'Does it automatically block UPI transactions?',
    a: 'No. UPI Sentinel cannot block or freeze actual UPI transactions. It provides protective warnings and a simulated pre-authorization safety hold in the current web prototype to guide user decisions. Actual payment blocking requires authorized integration with payment processors.',
  },
  {
    q: 'How is user privacy protected?',
    a: 'All analysis is performed on submitted data only. Conversation transcripts and evidence are processed for security analysis and are not shared with third parties. In future production deployments, full privacy controls and data handling policies will be published.',
  },
  {
    q: 'Can banks and fintech companies integrate it?',
    a: 'Yes. UPI Sentinel is designed for authorized B2B integration via REST APIs and WebSocket events. Banks, fintech platforms, and UPI payment providers can integrate risk signals into their existing fraud-prevention workflows.',
  },
  {
    q: 'What happens after a high-risk detection?',
    a: 'The Safety Intervention agent triggers an alert with a clear explanation, evidence summary, and recommended action. Users are prompted to confirm whether they want to proceed or pause the session. In the current prototype, the safety hold is simulated.',
  },
  {
    q: 'Is human confirmation required?',
    a: 'Yes, by design. UPI Sentinel follows a human-in-the-loop model. All protective actions require explicit user confirmation. The system provides intelligence and recommendations — the final decision always remains with the user.',
  },
];

// ─── Live Protection Input Types ──────────────────────────────────────────────
const inputTypes = [
  {
    icon: Phone, title: 'Conversation Input',
    items: ['User-provided transcript', 'Consent-based audio upload', 'Browser microphone (when authorized)', 'Hindi / Punjabi / Hinglish support'],
    color: '#3B82F6',
  },
  {
    icon: LinkIcon, title: 'Link Input',
    items: ['User-submitted URL', 'UPI deep link analysis', 'Redirect chain inspection', 'Threat-intelligence lookup'],
    color: '#06D6F0',
  },
  {
    icon: Smartphone, title: 'Device-Risk Input',
    items: ['Device-risk evidence', 'Remote-access app indicators', 'Permission-risk indicators', 'User-provided signals'],
    color: '#0D9488',
  },
  {
    icon: PlayCircle, title: 'Demo Simulator',
    items: ['Clearly labelled simulated events', 'Controlled scam journeys', 'Sample call/link/device scenarios', '⚠ Visible Demo Mode label'],
    color: '#8B5CF6',
  },
];

// ─── Section Components ───────────────────────────────────────────────────────

function CapabilitiesSection() {
  return (
    <section id="capabilities" className="py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          number="CORE CAPABILITIES"
          title="Five Innovations That Protect Users"
          subtitle="UPI Sentinel focuses on identifying the social-engineering attack journey that leads to a transaction — intervening before authorization."
          className="mb-16"
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.num}
                className={cn(
                  'group rounded-xl border border-[#1E2D47] bg-[#0B1224] p-6 card-hover',
                  i === 0 && 'lg:col-span-2',
                  i === 4 && 'sm:col-span-2 lg:col-span-1',
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cap.color}15`, border: `1px solid ${cap.color}30` }}
                  >
                    <Icon size={18} style={{ color: cap.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-[#64748B]">{cap.num}</span>
                      <h3 className="text-sm font-semibold text-[#F8FAFC]">{cap.title}</h3>
                    </div>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">{cap.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LiveProtectionSection() {
  return (
    <section id="live-protection" className="py-24 px-4 sm:px-6 bg-[#080F20]">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          number="LIVE PROTECTION"
          title="Hybrid Real-Time Monitoring"
          subtitle="Combine consent-based live input with controlled demonstration scenarios in one unified experience."
          className="mb-16"
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {inputTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.title}
                className="rounded-xl border border-[#1E2D47] bg-[#0B1224] p-5 card-hover"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${type.color}15`, border: `1px solid ${type.color}30` }}
                >
                  <Icon size={18} style={{ color: type.color }} />
                </div>
                <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3">{type.title}</h3>
                <ul className="space-y-1.5">
                  {type.items.map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-xs text-[#94A3B8]">
                      <span className="mt-0.5 w-1 h-1 rounded-full bg-[#3B82F6] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="text-center">
          <Link href="/console/monitoring">
            <Button variant="gradient" size="lg">
              <PlayCircle size={16} />
              Open Live Protection Console
            </Button>
          </Link>
          <p className="text-xs text-[#64748B] mt-3">Demo Mode available — all simulated events are clearly labelled</p>
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const metrics = [
    { label: 'Overall Risk Score', value: '—', note: 'Waiting for events' },
    { label: 'Call Risk Level', value: '—', note: 'No session active' },
    { label: 'Link Risk Level', value: '—', note: 'No URL submitted' },
    { label: 'Device Risk Level', value: '—', note: 'No evidence provided' },
    { label: 'AI Confidence', value: '—', note: 'Backend not connected' },
  ];

  return (
    <section id="dashboard-preview" className="py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          number="COMMAND CENTER"
          title="Executive Security Dashboard"
          subtitle="A professional command center giving security teams complete visibility over scam detection, agent activity, and risk assessments."
          className="mb-16"
        />
        <div className="rounded-2xl border border-[#1E2D47] bg-[#0B1224] overflow-hidden glow-blue">
          {/* Dashboard header bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1E2D47] bg-[#080F20]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#1E2D47]" />
              <div className="w-3 h-3 rounded-full bg-[#1E2D47]" />
              <div className="w-3 h-3 rounded-full bg-[#1E2D47]" />
              <span className="ml-2 text-xs text-[#64748B] font-mono">upi-sentinel.console</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
              Backend Not Connected — Demo Preview
            </div>
          </div>

          <div className="p-6">
            {/* Preview label */}
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="demo">PREVIEW DATA</Badge>
              <span className="text-xs text-[#64748B]">Connect backend to see live security events</span>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-lg border border-[#1E2D47] bg-[#080F20] p-3">
                  <p className="text-[10px] text-[#64748B] mb-1">{m.label}</p>
                  <p className="text-xl font-bold text-[#94A3B8]">{m.value}</p>
                  <p className="text-[9px] text-[#64748B] mt-0.5">{m.note}</p>
                </div>
              ))}
            </div>

            {/* Bottom panels */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 rounded-lg border border-[#1E2D47] bg-[#080F20] p-4">
                <p className="text-xs font-semibold text-[#94A3B8] mb-3">Security Event Timeline</p>
                <div className="space-y-2">
                  {['Waiting for security events...', 'Start a monitoring session to begin', 'Or submit data to analyze'].map((msg, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-[#1E2D47] last:border-0">
                      <div className="w-1 h-8 rounded-full bg-[#1E2D47]" />
                      <p className="text-xs text-[#64748B]">{msg}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-[#1E2D47] bg-[#080F20] p-4">
                <p className="text-xs font-semibold text-[#94A3B8] mb-3">Agent Activity</p>
                <div className="space-y-2">
                  {['Orchestrator', 'Call Intel', 'Link Intel', 'Device Guard', 'Prediction'].map((agent) => (
                    <div key={agent} className="flex items-center justify-between py-1">
                      <span className="text-xs text-[#94A3B8]">{agent}</span>
                      <Badge variant="status" size="sm">Idle</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center mt-6">
          <Link href="/console">
            <Button variant="gradient" size="lg">
              Open Command Center <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-[#080F20]">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          number="HOW IT WORKS"
          title="Five Steps to Scam Prevention"
          subtitle="A clear pipeline from signal capture to protective intervention — keeping users informed and in control at every step."
          className="mb-16"
        />
        <div className="relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/30 to-transparent" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                    <Icon size={20} className="text-white" />
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#080F20] border border-[#3B82F6]/40 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-[#3B82F6]">{i + 1}</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-[#F8FAFC] mb-2">{step.title}</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function BusinessImpactSection() {
  return (
    <section id="business-impact" className="py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          number="BUSINESS IMPACT"
          title="Protect Users. Earn Trust. Reduce Losses."
          subtitle="UPI Sentinel enables earlier scam detection, better customer awareness, and faster security investigation."
          className="mb-16"
        />
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            {
              title: 'B2C — Individual Protection',
              desc: 'Personal and family protection subscriptions. Help individuals and less tech-savvy users recognize scam patterns before they authorize payments.',
              items: ['Personal scam detection', 'Family protection', 'Premium subscription'],
              color: '#3B82F6',
              icon: Users,
            },
            {
              title: 'B2B — Enterprise Integration',
              desc: 'Authorized integrations for banks, fintech platforms, telecom providers, and payment processors to add an AI intelligence layer to fraud prevention.',
              items: ['Bank integrations', 'Fintech APIs', 'Telecom partnerships'],
              color: '#06D6F0',
              icon: Building2,
              highlighted: true,
            },
            {
              title: 'Enterprise — Analytics & Ops',
              desc: 'Full enterprise platform with security analytics, fraud-risk dashboards, agent performance monitoring, and audit logging.',
              items: ['Risk analytics', 'Security reporting', 'API access'],
              color: '#8B5CF6',
              icon: BarChart3,
            },
          ].map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.title}
                className={cn(
                  'rounded-xl border p-6 card-hover',
                  tier.highlighted
                    ? 'border-[#06D6F0]/30 bg-gradient-to-b from-[#0B1224] to-[#080F20]'
                    : 'border-[#1E2D47] bg-[#0B1224]',
                )}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${tier.color}15`, border: `1px solid ${tier.color}30` }}
                >
                  <Icon size={18} style={{ color: tier.color }} />
                </div>
                <h3 className="text-sm font-semibold text-[#F8FAFC] mb-2">{tier.title}</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">{tier.desc}</p>
                <ul className="space-y-1.5">
                  {tier.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-[#94A3B8]">
                      <CheckCircle2 size={12} style={{ color: tier.color }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Industries */}
        <h3 className="text-xl font-bold text-[#F8FAFC] text-center mb-8">Who UPI Sentinel Serves</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {industries.map((ind) => {
            const Icon = ind.icon;
            return (
              <div key={ind.title} className="rounded-xl border border-[#1E2D47] bg-[#0B1224] p-4 card-hover text-center">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
                  <Icon size={18} className="text-blue-400" />
                </div>
                <h4 className="text-xs font-semibold text-[#F8FAFC] mb-1">{ind.title}</h4>
                <p className="text-[10px] text-[#64748B] leading-relaxed">{ind.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 bg-[#080F20]">
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          number="PRICING"
          title="Choose Your Protection Level"
          subtitle="Transparent, flexible pricing. Upgrade or downgrade at any time. Enterprise plans are fully configurable."
          className="mb-16"
        />
        <div className="grid sm:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'rounded-xl border p-6 flex flex-col',
                plan.highlighted
                  ? 'border-blue-500/40 bg-gradient-to-b from-blue-500/5 to-[#0B1224] glow-blue'
                  : 'border-[#1E2D47] bg-[#0B1224]',
              )}
            >
              {plan.highlighted && (
                <div className="mb-3">
                  <Badge variant="default" size="sm">Most Popular</Badge>
                </div>
              )}
              <h3 className="text-lg font-bold text-[#F8FAFC]">{plan.name}</h3>
              <div className="mt-2 mb-1">
                <span className="text-3xl font-bold text-[#F8FAFC]">{plan.price}</span>
                {plan.period !== 'contact us' && (
                  <span className="text-xs text-[#64748B] ml-1">/{plan.period}</span>
                )}
              </div>
              <p className="text-xs text-[#94A3B8] mb-5">{plan.description}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-[#94A3B8]">
                    <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/console">
                <Button
                  variant={plan.highlighted ? 'gradient' : 'secondary'}
                  size="md"
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-[#64748B] mt-6">
          Prices shown are indicative. Final pricing will be determined based on usage, integrations, and deployment requirements.
        </p>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <SectionHeader
          number="FAQ"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about how UPI Sentinel works, its privacy approach, and what it can and cannot do."
          className="mb-12"
        />
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-[#1E2D47] bg-[#0B1224] overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-[#F8FAFC] hover:bg-[#101A30] transition-colors"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                <span>{faq.q}</span>
                {openIndex === i ? (
                  <ChevronUp size={16} className="text-[#64748B] flex-shrink-0 ml-4" />
                ) : (
                  <ChevronDown size={16} className="text-[#64748B] flex-shrink-0 ml-4" />
                )}
              </button>
              {openIndex === i && (
                <div className="px-5 pb-4 border-t border-[#1E2D47]">
                  <p className="text-sm text-[#94A3B8] leading-relaxed pt-4">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Work email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.message.trim()) e.message = 'Message is required';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    // Backend not connected — show unavailable state
    setErrors({ _form: 'Contact form submission requires backend integration. Please email us directly.' });
  }

  return (
    <section id="contact" className="py-24 px-4 sm:px-6 bg-[#080F20]">
      <div className="max-w-2xl mx-auto">
        <SectionHeader
          number="CONTACT"
          title="Talk to Our Team"
          subtitle="Have a question about integrations, enterprise deployment, or a demonstration? We're ready to help."
          className="mb-12"
        />
        <div className="rounded-xl border border-[#1E2D47] bg-[#0B1224] p-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Name"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={errors.name}
              />
              <Input
                label="Work Email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={errors.email}
              />
            </div>
            <Input
              label="Company / Organization"
              placeholder="Your bank, fintech, or organization"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
            <Textarea
              label="Message"
              placeholder="Tell us about your use case, integration needs, or questions..."
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              error={errors.message}
            />
            {errors._form && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3">
                <p className="text-xs text-amber-400">{errors._form}</p>
              </div>
            )}
            <Button type="submit" variant="gradient" size="lg" className="w-full">
              <MessageSquare size={16} />
              Talk to Us
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="border-t border-[#1E2D47] bg-[#030712] py-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                <Shield size={16} className="text-white" />
              </div>
              <span className="font-bold text-[#F8FAFC]">UPI Sentinel</span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed max-w-xs">
              AI-native predictive scam interception platform. Detect early. Intercept before authorization.
              Protect every user.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2">
              {['Capabilities', 'Live Protection', 'How It Works', 'Open Console'].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="text-xs text-[#64748B] hover:text-[#F8FAFC] transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Business</h4>
            <ul className="space-y-2">
              {['Business Impact', 'Pricing', 'API & Integrations', 'Enterprise'].map((item) => (
                <li key={item}>
                  <a href="#business-impact" className="text-xs text-[#64748B] hover:text-[#F8FAFC] transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Support</h4>
            <ul className="space-y-2">
              {['FAQ', 'Contact', 'Help & Support', 'Documentation'].map((item) => (
                <li key={item}>
                  <a href="#faq" className="text-xs text-[#64748B] hover:text-[#F8FAFC] transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[#1E2D47] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#64748B]">
            © 2024 UPI Sentinel. All rights reserved. Hackathon project — frontend demonstration only.
          </p>
          <p className="text-xs text-[#64748B]">
            Not affiliated with NPCI, Google Pay, PhonePe, Paytm, or any UPI payment provider.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export { CapabilitiesSection, LiveProtectionSection, DashboardPreview, HowItWorksSection, BusinessImpactSection, PricingSection, FAQSection, ContactSection, FooterSection };
