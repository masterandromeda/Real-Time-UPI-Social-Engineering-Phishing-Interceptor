'use client';

import { useState } from 'react';
import {
  HelpCircle, Book, MessageCircle, ChevronDown, ChevronUp,
  ExternalLink, Mail, Shield
} from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: 'How do I start a monitoring session?',
    a: 'Navigate to Live Agent Monitor, click "Start Monitoring Session", select your input types, and begin submitting data for analysis.',
  },
  {
    q: 'What data can I submit for analysis?',
    a: 'You can submit: (1) conversation transcripts via Call Intelligence, (2) suspicious URLs via Link Intelligence, (3) device-risk evidence via Device Guardian, or use the Demo Simulator.',
  },
  {
    q: 'Why does nothing happen when I click Analyze?',
    a: 'The AI analysis engine requires the backend to be running. In the current prototype, analysis will return a "Backend Not Connected" state. This is expected — backend is Phase 2.',
  },
  {
    q: 'Is any real data being collected?',
    a: 'No. In demo mode, no data is sent to any server. The frontend-only prototype does not have a backend connection.',
  },
  {
    q: 'How does the Scam Prediction work?',
    a: 'Input risk scores from the three signal modules. The Scam Prediction engine correlates them using a weighted formula: 40% call + 35% link + 25% device = correlated risk.',
  },
  {
    q: 'How do I integrate with my bank system?',
    a: 'Business integrations are planned for Phase 2. Once the backend is implemented, authorized API integration documentation will be provided. See API & Integrations for planned connection points.',
  },
];

const DOCS = [
  { title: 'Product Overview', desc: 'Understanding UPI Sentinel capabilities and architecture' },
  { title: 'Quick Start Guide', desc: 'Get started with monitoring sessions and data analysis' },
  { title: 'API Reference', desc: 'REST API and WebSocket endpoints (Phase 2)' },
  { title: 'Agent Documentation', desc: 'How the seven-agent system works' },
  { title: 'Integration Guide', desc: 'Authorized bank and PSP integration patterns' },
  { title: 'Privacy & Data Policy', desc: 'How user data is handled and protected' },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
          <HelpCircle size={15} className="text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F8FAFC]">Help & Support</p>
          <p className="text-xs text-[#94A3B8]">Documentation, FAQ, and contact information</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* FAQ */}
        <div>
          <h2 className="text-sm font-semibold text-[#F8FAFC] mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border border-[#1E2D47] bg-[#0B1224] overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-xs font-medium text-[#F8FAFC] hover:bg-[#101A30] transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp size={13} className="text-[#64748B] ml-3 flex-shrink-0" />
                    : <ChevronDown size={13} className="text-[#64748B] ml-3 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-3 border-t border-[#1E2D47]">
                    <p className="text-xs text-[#94A3B8] leading-relaxed pt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Docs + Contact */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <Badge variant="status">Coming in Phase 2</Badge>
            </CardHeader>
            <div className="space-y-2">
              {DOCS.map((doc) => (
                <div key={doc.title} className="flex items-start gap-2.5 py-2 border-b border-[#1E2D47] last:border-0">
                  <Book size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-[#94A3B8]">{doc.title}</p>
                    <p className="text-[10px] text-[#64748B]">{doc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Contact Support</CardTitle></CardHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#080F20] border border-[#1E2D47]">
                <Mail size={14} className="text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[#F8FAFC]">Email Support</p>
                  <p className="text-[10px] text-[#64748B]">support@upi-sentinel.example (placeholder)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#080F20] border border-[#1E2D47]">
                <MessageCircle size={14} className="text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[#F8FAFC]">Live Chat</p>
                  <p className="text-[10px] text-[#64748B]">Available after backend deployment</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#080F20] border border-[#1E2D47]">
                <Shield size={14} className="text-violet-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[#F8FAFC]">Security Disclosure</p>
                  <p className="text-[10px] text-[#64748B]">security@upi-sentinel.example (placeholder)</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
