'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Phone, Link as LinkIcon, Smartphone, Brain, AlertTriangle } from 'lucide-react';
import { Button, Badge } from '@/components/ui';

// Simple canvas-free SVG orbit visualization
const agents = [
  { id: 'call', label: 'Call Intelligence', icon: Phone, angle: 0, color: '#3B82F6' },
  { id: 'link', label: 'Link Intelligence', icon: LinkIcon, angle: 72, color: '#06D6F0' },
  { id: 'device', label: 'Device Guardian', icon: Smartphone, angle: 144, color: '#0D9488' },
  { id: 'predict', label: 'Scam Prediction', icon: Brain, angle: 216, color: '#8B5CF6' },
  { id: 'intervene', label: 'Safety Intervention', icon: AlertTriangle, angle: 288, color: '#F59E0B' },
];

function AgentOrbit() {
  const radius = 110;
  const cx = 160;
  const cy = 160;

  return (
    <div className="relative w-80 h-80 mx-auto">
      <svg
        viewBox="0 0 320 320"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        {/* Outer rings */}
        <circle cx={cx} cy={cy} r={radius + 20} fill="none" stroke="rgba(59,130,246,0.08)" strokeWidth="1" strokeDasharray="4 4" className="animate-[spin_20s_linear_infinite]" />
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={radius - 30} fill="none" stroke="rgba(6,214,240,0.08)" strokeWidth="1" strokeDasharray="2 6" />

        {/* Agent connection lines */}
        {agents.map((agent) => {
          const rad = (agent.angle * Math.PI) / 180;
          const ax = cx + radius * Math.cos(rad);
          const ay = cy + radius * Math.sin(rad);
          return (
            <line
              key={agent.id}
              x1={cx} y1={cy}
              x2={ax} y2={ay}
              stroke={agent.color}
              strokeWidth="0.5"
              strokeOpacity="0.25"
              strokeDasharray="3 3"
            />
          );
        })}

        {/* Scanning arc */}
        <path
          d={`M ${cx} ${cy} L ${cx + radius + 15} ${cy}`}
          stroke="#3B82F6"
          strokeWidth="1.5"
          strokeOpacity="0.6"
          className="origin-[160px_160px] animate-[spin_3s_linear_infinite]"
          style={{ transformOrigin: '160px 160px' }}
        />

        {/* Agent nodes */}
        {agents.map((agent) => {
          const rad = (agent.angle * Math.PI) / 180;
          const ax = cx + radius * Math.cos(rad);
          const ay = cy + radius * Math.sin(rad);
          return (
            <g key={agent.id}>
              <circle cx={ax} cy={ay} r={18} fill={`${agent.color}15`} stroke={agent.color} strokeWidth="1" strokeOpacity="0.5" />
              <circle cx={ax} cy={ay} r={3} fill={agent.color} opacity="0.8" />
            </g>
          );
        })}
      </svg>

      {/* Central node */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/40 animate-pulse-ring">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-blue-500/10 animate-pulse" />
        </div>
      </div>

      {/* Agent labels */}
      {agents.map((agent) => {
        const rad = (agent.angle * Math.PI) / 180;
        const lx = cx + (radius + 38) * Math.cos(rad);
        const ly = cy + (radius + 38) * Math.sin(rad);
        const percentX = (lx / 320) * 100;
        const percentY = (ly / 320) * 100;
        const Icon = agent.icon;
        return (
          <div
            key={agent.id}
            className="absolute flex flex-col items-center"
            style={{
              left: `${percentX}%`,
              top: `${percentY}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${agent.color}20`, border: `1px solid ${agent.color}40` }}
            >
              <Icon size={13} style={{ color: agent.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center grid-pattern overflow-hidden pt-16">
      {/* Ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="space-y-6">
            <div>
              <Badge variant="default" size="sm" className="mb-4 font-mono tracking-widest">
                ⚡ AI-NATIVE SCAM INTELLIGENCE
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-[#F8FAFC]">
                Stop Digital Scams{' '}
                <span className="gradient-text">Before They Become</span>{' '}
                Financial Losses.
              </h1>
            </div>

            <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed max-w-xl">
              An AI-powered security intelligence platform that identifies social-engineering signals,
              analyzes suspicious links, correlates device-risk indicators, and helps prevent UPI scams
              before payment authorization.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/console">
                <Button variant="gradient" size="lg" className="w-full sm:w-auto group">
                  Start Free Protection
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <a href="#capabilities">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Explore Capabilities
                </Button>
              </a>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-4 pt-2">
              {[
                { label: 'Consent-Based Analysis', color: 'text-emerald-400' },
                { label: 'Privacy-First', color: 'text-blue-400' },
                { label: 'Enterprise-Ready', color: 'text-cyan-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs text-[#64748B]">
                  <span className={`w-1 h-1 rounded-full ${item.color} bg-current`} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right visual */}
          <div className="flex justify-center lg:justify-end animate-float">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl scale-150" />
              <div className="relative bg-[#0B1224] border border-[#1E2D47] rounded-3xl p-8 glow-blue">
                <AgentOrbit />

                {/* Agent labels below */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {agents.slice(0, 3).map((agent) => {
                    const Icon = agent.icon;
                    return (
                      <div key={agent.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#080F20] border border-[#1E2D47]">
                        <Icon size={10} style={{ color: agent.color }} />
                        <span className="text-[9px] text-[#94A3B8] truncate">{agent.label.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
