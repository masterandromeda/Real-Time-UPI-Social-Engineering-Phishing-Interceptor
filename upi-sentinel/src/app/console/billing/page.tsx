'use client';

import { CreditCard, CheckCircle2, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Essential protection for individuals.',
    features: [
      '5 URL analyses per day',
      'Text transcript analysis',
      'Basic risk assessment',
      'Safety intervention alerts',
      'Single device',
    ],
    cta: 'Current Plan',
    current: true,
    highlighted: false,
    color: '#64748B',
  },
  {
    name: 'Professional',
    price: '₹499',
    period: 'per month',
    description: 'Full feature access for power users.',
    features: [
      'Unlimited URL analyses',
      'Audio transcript analysis',
      'Advanced scam prediction',
      'Device-risk analysis',
      'Family protection (up to 5)',
      'Priority alerts',
      'Session history',
    ],
    cta: 'Upgrade to Professional',
    current: false,
    highlighted: true,
    color: '#3B82F6',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'Full-platform deployment for organizations.',
    features: [
      'API integration',
      'Bulk event processing',
      'Business analytics',
      'SLA guarantees',
      'Dedicated support',
      'Custom reporting',
      'Authorized PSP integrations',
      'White-label options',
    ],
    cta: 'Contact Sales',
    current: false,
    highlighted: false,
    color: '#8B5CF6',
  },
];

export default function BillingPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
          <CreditCard size={15} className="text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F8FAFC]">Subscription & Billing</p>
          <p className="text-xs text-[#94A3B8]">Manage your plan and payment information</p>
        </div>
        <Badge variant="demo" className="ml-auto">DEMO MODE</Badge>
      </div>

      {/* Current plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
        </CardHeader>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-lg font-bold text-[#F8FAFC]">Free Plan</p>
            <p className="text-xs text-[#94A3B8]">Demo mode — billing system requires backend integration</p>
          </div>
          <div className="ml-auto">
            <Badge variant="status">Demo</Badge>
          </div>
        </div>
        <p className="text-xs text-[#64748B] mt-3 pt-2 border-t border-[#1E2D47]">
          No actual billing records exist. Subscription management requires backend implementation.
        </p>
      </Card>

      {/* Plan cards */}
      <div>
        <h2 className="text-sm font-semibold text-[#F8FAFC] mb-4">Available Plans</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'rounded-xl border p-5 flex flex-col',
                plan.highlighted
                  ? 'border-blue-500/40 bg-gradient-to-b from-blue-500/5 to-[#0B1224]'
                  : plan.current
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-[#1E2D47] bg-[#0B1224]',
              )}
            >
              {plan.current && <Badge variant="status" size="sm" className="mb-2 self-start bg-emerald-500/10 border-emerald-500/20 text-emerald-400">Current</Badge>}
              {plan.highlighted && <Badge variant="default" size="sm" className="mb-2 self-start">Recommended</Badge>}
              <h3 className="text-base font-bold text-[#F8FAFC]">{plan.name}</h3>
              <div className="mt-1 mb-1">
                <span className="text-2xl font-bold" style={{ color: plan.color }}>{plan.price}</span>
                {plan.period !== 'contact us' && <span className="text-xs text-[#64748B] ml-1">/{plan.period}</span>}
              </div>
              <p className="text-xs text-[#94A3B8] mb-4">{plan.description}</p>
              <ul className="space-y-1.5 mb-4 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-[#94A3B8]">
                    <CheckCircle2 size={10} style={{ color: plan.color }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.current ? 'secondary' : plan.highlighted ? 'gradient' : 'secondary'}
                size="sm"
                disabled={plan.current}
                className="w-full"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#64748B] mt-4 text-center">
          Prices are indicative. Billing functionality requires backend integration.
        </p>
      </div>
    </div>
  );
}
