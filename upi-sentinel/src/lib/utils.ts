import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RiskLevel, AgentStatus, ConnectionStatus } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'critical': return 'text-red-400';
    case 'high': return 'text-orange-400';
    case 'medium': return 'text-amber-400';
    case 'low': return 'text-emerald-400';
  }
}

export function getRiskBg(level: RiskLevel): string {
  switch (level) {
    case 'critical': return 'bg-red-500/10 border-red-500/30 text-red-400';
    case 'high': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
    case 'medium': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    case 'low': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  }
}

export function getRiskGlow(level: RiskLevel): string {
  switch (level) {
    case 'critical': return 'shadow-red-500/20';
    case 'high': return 'shadow-orange-500/20';
    case 'medium': return 'shadow-amber-500/20';
    case 'low': return 'shadow-emerald-500/20';
  }
}

export function getAgentStatusColor(status: AgentStatus): string {
  switch (status) {
    case 'running': return 'text-blue-400';
    case 'completed': return 'text-emerald-400';
    case 'failed': return 'text-red-400';
    case 'queued': return 'text-amber-400';
    case 'waiting': return 'text-cyan-400';
    case 'idle': return 'text-slate-500';
  }
}

export function getAgentStatusDot(status: AgentStatus): string {
  switch (status) {
    case 'running': return 'bg-blue-400 animate-pulse';
    case 'completed': return 'bg-emerald-400';
    case 'failed': return 'bg-red-400';
    case 'queued': return 'bg-amber-400 animate-pulse';
    case 'waiting': return 'bg-cyan-400 animate-pulse';
    case 'idle': return 'bg-slate-600';
  }
}

export function getConnectionStatusColor(status: ConnectionStatus): string {
  switch (status) {
    case 'connected': return 'text-emerald-400';
    case 'connecting': return 'text-amber-400';
    case 'demo': return 'text-blue-400';
    case 'disconnected': return 'text-slate-500';
  }
}

export function getConnectionDot(status: ConnectionStatus): string {
  switch (status) {
    case 'connected': return 'bg-emerald-400 animate-pulse';
    case 'connecting': return 'bg-amber-400 animate-pulse';
    case 'demo': return 'bg-blue-400 animate-pulse';
    case 'disconnected': return 'bg-slate-600';
  }
}

export function formatRiskScore(score: number): string {
  return score.toFixed(0);
}

export function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(0)}%`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function riskScoreToLevel(score: number): RiskLevel {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}
