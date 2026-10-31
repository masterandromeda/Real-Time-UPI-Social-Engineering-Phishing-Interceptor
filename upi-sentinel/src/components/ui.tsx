import * as React from 'react';
import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/lib/types';
import { getRiskBg } from '@/lib/utils';

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'risk' | 'demo' | 'status';
  riskLevel?: RiskLevel;
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', riskLevel, size = 'sm', children, ...props }: BadgeProps) {
  const base = 'inline-flex items-center font-medium rounded-full border';
  const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-3 py-1 text-sm' };

  const variants = {
    default: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    outline: 'bg-transparent border-[#1E2D47] text-[#94A3B8]',
    risk: riskLevel ? getRiskBg(riskLevel) : '',
    demo: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    status: 'bg-slate-800/50 border-slate-700/50 text-slate-400',
  };

  return (
    <span className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed gap-2';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50',
    gradient: 'btn-gradient text-white',
    secondary: 'bg-[#101A30] hover:bg-[#131F35] text-[#F8FAFC] border border-[#1E2D47] hover:border-blue-500/40',
    ghost: 'bg-transparent hover:bg-[#101A30] text-[#94A3B8] hover:text-[#F8FAFC]',
    outline: 'bg-transparent border border-blue-500/40 text-blue-400 hover:bg-blue-500/10',
    danger: 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30',
  };

  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glow?: boolean;
}

export function Card({ className, hoverable = false, glow = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[#1E2D47] bg-[#0B1224] p-4',
        hoverable && 'card-hover cursor-pointer',
        glow && 'glow-blue',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm font-semibold text-[#F8FAFC] tracking-wide', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-[#64748B]', className)} {...props}>
      {children}
    </p>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ className, label, error, hint, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-[#94A3B8]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full px-3 py-2 text-sm bg-[#080F20] border border-[#1E2D47] rounded-lg text-[#F8FAFC] placeholder-[#64748B]',
          'focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30',
          'transition-colors duration-200',
          error && 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/30',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-[#64748B]">{hint}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ className, label, error, hint, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-[#94A3B8]">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'w-full px-3 py-2 text-sm bg-[#080F20] border border-[#1E2D47] rounded-lg text-[#F8FAFC] placeholder-[#64748B] resize-none',
          'focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30',
          'transition-colors duration-200',
          error && 'border-red-500/60',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-[#64748B]">{hint}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ className, label, options, id, ...props }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-[#94A3B8]">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          'w-full px-3 py-2 text-sm bg-[#080F20] border border-[#1E2D47] rounded-lg text-[#F8FAFC]',
          'focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30',
          'transition-colors duration-200',
          className,
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#080F20]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Separator ────────────────────────────────────────────────────────────────
export function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('h-px bg-[#1E2D47]', className)} {...props} />;
}

// ─── Progress ─────────────────────────────────────────────────────────────────
interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  color?: string;
  label?: string;
  showValue?: boolean;
}

export function Progress({ value, max = 100, className, color, label, showValue = false }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barColor = color ?? (pct >= 75 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : pct >= 25 ? 'bg-yellow-500' : 'bg-emerald-500');

  return (
    <div className={cn('space-y-1', className)}>
      {(label || showValue) && (
        <div className="flex justify-between text-xs text-[#94A3B8]">
          {label && <span>{label}</span>}
          {showValue && <span>{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div className="h-1.5 bg-[#080F20] rounded-full overflow-hidden border border-[#1E2D47]">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton rounded-md', className)} {...props} />;
}

// ─── Status Indicator ─────────────────────────────────────────────────────────
interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'warning' | 'demo' | 'loading';
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusIndicator({ status, label, size = 'sm', className }: StatusIndicatorProps) {
  const dotMap = {
    online: 'bg-emerald-400 shadow-emerald-400/50',
    offline: 'bg-slate-600',
    warning: 'bg-amber-400 shadow-amber-400/50',
    demo: 'bg-blue-400 shadow-blue-400/50',
    loading: 'bg-amber-400 animate-pulse shadow-amber-400/50',
  };
  const textMap = {
    online: 'text-emerald-400',
    offline: 'text-slate-500',
    warning: 'text-amber-400',
    demo: 'text-blue-400',
    loading: 'text-amber-400',
  };
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className={cn('rounded-full shadow-sm', dotSize, dotMap[status], (status === 'online' || status === 'demo') && 'animate-pulse')} />
      {label && <span className={cn('font-medium', textSize, textMap[status])}>{label}</span>}
    </div>
  );
}

// ─── Risk Score Ring ──────────────────────────────────────────────────────────
interface RiskScoreRingProps {
  score: number;
  size?: number;
  label?: string;
  className?: string;
}

export function RiskScoreRing({ score, size = 80, label, className }: RiskScoreRingProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);
  const color = score >= 75 ? '#EF4444' : score >= 50 ? '#F97316' : score >= 25 ? '#F59E0B' : '#10B981';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1E2D47" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-sm font-bold text-[#F8FAFC]">{score}</div>
        {label && <div className="text-[9px] text-[#64748B] leading-tight">{label}</div>}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
interface SectionHeaderProps {
  number?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({ number, title, subtitle, className }: SectionHeaderProps) {
  return (
    <div className={cn('text-center space-y-3', className)}>
      {number && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
          {number}
        </div>
      )}
      <h2 className="text-3xl md:text-4xl font-bold text-[#F8FAFC]">{title}</h2>
      {subtitle && (
        <p className="text-[#94A3B8] max-w-2xl mx-auto text-base leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-[#101A30] border border-[#1E2D47] flex items-center justify-center mb-4 text-[#64748B]">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-[#F8FAFC] mb-1">{title}</h3>
      <p className="text-xs text-[#64748B] max-w-xs leading-relaxed mb-4">{description}</p>
      {action}
    </div>
  );
}

// ─── KPI Metric Card ──────────────────────────────────────────────────────────
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { direction: 'up' | 'down' | 'neutral'; label: string };
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'cyan';
  isDemo?: boolean;
  className?: string;
}

export function MetricCard({ title, value, subtitle, icon, trend, color = 'blue', isDemo = false, className }: MetricCardProps) {
  const colorMap = {
    blue: { icon: 'text-blue-400 bg-blue-500/10', accent: 'text-blue-400', border: 'border-blue-500/20' },
    emerald: { icon: 'text-emerald-400 bg-emerald-500/10', accent: 'text-emerald-400', border: 'border-emerald-500/20' },
    amber: { icon: 'text-amber-400 bg-amber-500/10', accent: 'text-amber-400', border: 'border-amber-500/20' },
    red: { icon: 'text-red-400 bg-red-500/10', accent: 'text-red-400', border: 'border-red-500/20' },
    cyan: { icon: 'text-cyan-400 bg-cyan-500/10', accent: 'text-cyan-400', border: 'border-cyan-500/20' },
  };
  const c = colorMap[color];

  return (
    <div className={cn('rounded-xl border bg-[#0B1224] p-4 relative overflow-hidden', c.border, className)}>
      {isDemo && (
        <div className="absolute top-2 right-2">
          <Badge variant="demo" size="sm">DEMO</Badge>
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#64748B] font-medium truncate mb-1">{title}</p>
          <p className={cn('text-2xl font-bold', c.accent)}>{value}</p>
          {subtitle && <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>}
          {trend && (
            <div className={cn('flex items-center gap-1 mt-1.5 text-xs', trend.direction === 'up' ? 'text-emerald-400' : trend.direction === 'down' ? 'text-red-400' : 'text-slate-400')}>
              <span>{trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '—'}</span>
              <span>{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center ml-3 flex-shrink-0', c.icon)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
