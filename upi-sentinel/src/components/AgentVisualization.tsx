'use client';

import { useState } from 'react';
import { Shield, Phone, Link as LinkIcon, Smartphone, Brain, AlertTriangle, Cpu, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentStatus } from '@/lib/types';

const AGENTS = [
  { id: 'orchestrator', label: 'Orchestrator', icon: Cpu, angle: -90, color: '#3B82F6', ring: 0 },
  { id: 'call_intelligence', label: 'Call Intel', icon: Phone, angle: -30, color: '#06D6F0', ring: 1 },
  { id: 'link_intelligence', label: 'Link Intel', icon: LinkIcon, angle: 30, color: '#0D9488', ring: 1 },
  { id: 'device_guardian', label: 'Device Guard', icon: Smartphone, angle: 90, color: '#8B5CF6', ring: 1 },
  { id: 'scam_prediction', label: 'Prediction', icon: Brain, angle: 150, color: '#F59E0B', ring: 1 },
  { id: 'explanation', label: 'Explanation', icon: MessageSquare, angle: 210, color: '#EC4899', ring: 1 },
  { id: 'safety_intervention', label: 'Intervention', icon: AlertTriangle, angle: 270, color: '#EF4444', ring: 1 },
];

interface AgentVizProps {
  agentStatuses?: Record<string, AgentStatus>;
  className?: string;
  size?: 'sm' | 'lg';
}

export default function AgentVisualization({ agentStatuses = {}, className, size = 'lg' }: AgentVizProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const isLarge = size === 'lg';
  const svgSize = isLarge ? 340 : 240;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const outerRadius = isLarge ? 120 : 85;
  const innerRadius = isLarge ? 75 : 53;

  function toXY(angleDeg: number, r: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-32 h-32 bg-blue-500/8 rounded-full blur-3xl" />
      </div>

      <svg
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        width={svgSize}
        height={svgSize}
        className="relative z-10"
        aria-label="UPI Sentinel Agent Visualization"
      >
        {/* Background rings */}
        <circle cx={cx} cy={cy} r={outerRadius + 25} fill="none" stroke="rgba(59,130,246,0.05)" strokeWidth="1" strokeDasharray="3 5" />
        <circle cx={cx} cy={cy} r={outerRadius} fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={innerRadius} fill="none" stroke="rgba(6,214,240,0.08)" strokeWidth="1" strokeDasharray="2 4" />
        <circle cx={cx} cy={cy} r={30} fill="rgba(59,130,246,0.05)" stroke="rgba(59,130,246,0.2)" strokeWidth="1" />

        {/* Scanning beam */}
        <line
          x1={cx} y1={cy}
          x2={cx + outerRadius + 20} y2={cy}
          stroke="#3B82F6"
          strokeWidth="1"
          strokeOpacity="0.5"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: 'spin 4s linear infinite',
          }}
        />

        {/* Agent connection lines */}
        {AGENTS.filter((a) => a.ring === 1).map((agent) => {
          const status = agentStatuses[agent.id] ?? 'idle';
          const active = status === 'running' || status === 'queued';
          const pos = toXY(agent.angle, outerRadius);
          return (
            <line
              key={agent.id}
              x1={cx} y1={cy}
              x2={pos.x} y2={pos.y}
              stroke={agent.color}
              strokeWidth={active ? '1' : '0.5'}
              strokeOpacity={active ? '0.5' : '0.15'}
              strokeDasharray={active ? '0' : '3 3'}
            />
          );
        })}

        {/* Agent nodes */}
        {AGENTS.filter((a) => a.ring === 1).map((agent) => {
          const status = agentStatuses[agent.id] ?? 'idle';
          const active = status === 'running';
          const completed = status === 'completed';
          const failed = status === 'failed';
          const pos = toXY(agent.angle, outerRadius);
          const nodeR = isLarge ? 18 : 13;
          const Icon = agent.icon;

          return (
            <g
              key={agent.id}
              onMouseEnter={() => setHovered(agent.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Pulse ring for active */}
              {active && (
                <circle cx={pos.x} cy={pos.y} r={nodeR + 5} fill="none" stroke={agent.color} strokeWidth="1" strokeOpacity="0.4"
                  style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
                />
              )}
              <circle
                cx={pos.x} cy={pos.y}
                r={nodeR}
                fill={`${agent.color}15`}
                stroke={failed ? '#EF4444' : completed ? '#10B981' : agent.color}
                strokeWidth={active ? '1.5' : '1'}
                strokeOpacity={active ? '0.9' : '0.4'}
              />
              {/* Label below node */}
              {isLarge && (
                <text
                  x={pos.x}
                  y={pos.y + nodeR + 11}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="7"
                  fontFamily="inherit"
                >
                  {agent.label}
                </text>
              )}
              {/* Status dot */}
              <circle
                cx={pos.x + nodeR - 4}
                cy={pos.y - nodeR + 4}
                r={3}
                fill={
                  active ? '#3B82F6' :
                  completed ? '#10B981' :
                  failed ? '#EF4444' :
                  status === 'queued' ? '#F59E0B' :
                  '#374151'
                }
              />
            </g>
          );
        })}

        {/* Orchestrator — at top */}
        {(() => {
          const agent = AGENTS[0];
          const status = agentStatuses[agent.id] ?? 'idle';
          const active = status === 'running';
          const pos = toXY(agent.angle, innerRadius - 15);
          return (
            <g key="orch">
              {active && (
                <circle cx={pos.x} cy={pos.y} r={14} fill="none" stroke="#3B82F6" strokeWidth="1" strokeOpacity="0.4"
                  style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
                />
              )}
              <circle cx={pos.x} cy={pos.y} r={10} fill="rgba(59,130,246,0.15)" stroke="#3B82F6" strokeWidth="1" strokeOpacity="0.5" />
              <circle cx={pos.x + 6} cy={pos.y - 6} r={3} fill={active ? '#3B82F6' : '#374151'} />
            </g>
          );
        })()}
      </svg>

      {/* Central Shield */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          <div
            className={cn(
              'rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-blue-500/30',
              isLarge ? 'w-14 h-14' : 'w-10 h-10',
            )}
          >
            <Shield className="text-white" size={isLarge ? 26 : 18} />
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-blue-500/10 animate-pulse-ring" />
        </div>
      </div>

      {/* Hovered agent tooltip */}
      {hovered && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#0B1224] border border-[#1E2D47] rounded-lg px-3 py-1.5 z-20 pointer-events-none whitespace-nowrap">
          <p className="text-xs text-[#F8FAFC] font-medium">
            {AGENTS.find((a) => a.id === hovered)?.label}
          </p>
          <p className="text-[10px] text-[#64748B] capitalize">
            {agentStatuses[hovered] ?? 'idle'}
          </p>
        </div>
      )}
    </div>
  );
}
