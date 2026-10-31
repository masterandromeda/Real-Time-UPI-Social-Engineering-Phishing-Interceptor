'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield, LayoutDashboard, Activity, Phone, Link as LinkIcon,
  Smartphone, Brain, AlertTriangle, Building2, BarChart3,
  Puzzle, CreditCard, FileText, Settings, HelpCircle,
  ChevronLeft, ChevronRight, Bell, User, Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, StatusIndicator } from '@/components/ui';
import { checkHealth, type HealthResponse } from '@/lib/api';

const navGroups = [
  {
    label: 'BUSINESS CONSOLE',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/console' },
      { id: 'monitoring', label: 'Live Agent Monitor', icon: Activity, href: '/console/monitoring' },
    ],
  },
  {
    label: 'SECURITY MODULES',
    items: [
      { id: 'call', label: 'Call Intelligence', icon: Phone, href: '/console/call' },
      { id: 'link', label: 'Link Intelligence', icon: LinkIcon, href: '/console/link' },
      { id: 'device', label: 'Device Guardian', icon: Smartphone, href: '/console/device' },
      { id: 'prediction', label: 'Scam Prediction', icon: Brain, href: '/console/prediction' },
      { id: 'intervention', label: 'Safety Intervention', icon: AlertTriangle, href: '/console/intervention' },
    ],
  },
  {
    label: 'BUSINESS MANAGEMENT',
    items: [
      { id: 'organizations', label: 'Organizations', icon: Building2, href: '/console/organizations' },
      { id: 'analytics', label: 'Business Analytics', icon: BarChart3, href: '/console/analytics' },
      { id: 'integrations', label: 'API & Integrations', icon: Puzzle, href: '/console/integrations' },
      { id: 'billing', label: 'Subscription & Billing', icon: CreditCard, href: '/console/billing' },
      { id: 'reports', label: 'Reports & Audit Logs', icon: FileText, href: '/console/reports' },
    ],
  },
];

const bottomNav = [
  { id: 'settings', label: 'Settings', icon: Settings, href: '/console/settings' },
  { id: 'support', label: 'Help & Support', icon: HelpCircle, href: '/console/support' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose?: () => void;
}

function Sidebar({ collapsed, onToggle, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/console') return pathname === '/console';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-[#080F20] border-r border-[#1E2D47] transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-14 px-3 border-b border-[#1E2D47]', collapsed ? 'justify-center' : 'gap-2.5')}>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center flex-shrink-0">
          <Shield size={14} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-[#F8FAFC] truncate">UPI Sentinel</p>
            <p className="text-[9px] text-[#64748B] truncate">Security Console</p>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[9px] font-semibold text-[#64748B] tracking-widest uppercase">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5 px-1.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={onMobileClose}
                      className={cn(
                        'flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                        active
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                          : 'text-[#94A3B8] hover:bg-[#101A30] hover:text-[#F8FAFC]',
                        collapsed && 'justify-center px-2',
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={15} className="flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-[#1E2D47] py-2 px-1.5 space-y-0.5">
        {bottomNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                active
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  : 'text-[#94A3B8] hover:bg-[#101A30] hover:text-[#F8FAFC]',
                collapsed && 'justify-center px-2',
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={15} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs text-[#64748B] hover:bg-[#101A30] hover:text-[#94A3B8] transition-colors',
            collapsed && 'justify-center',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}

// ─── Page title map ───────────────────────────────────────────────────────────
const pageTitles: Record<string, string> = {
  '/console': 'Overview',
  '/console/monitoring': 'Live Agent Monitor',
  '/console/call': 'Call Intelligence',
  '/console/link': 'Link Intelligence',
  '/console/device': 'Device Guardian',
  '/console/prediction': 'Scam Prediction',
  '/console/intervention': 'Safety Intervention',
  '/console/organizations': 'Organizations',
  '/console/analytics': 'Business Analytics',
  '/console/integrations': 'API & Integrations',
  '/console/billing': 'Subscription & Billing',
  '/console/reports': 'Reports & Audit Logs',
  '/console/settings': 'Settings',
  '/console/support': 'Help & Support',
};

// ─── Console Layout ────────────────────────────────────────────────────────────
export default function ConsoleDashboard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthChecking, setHealthChecking] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pageTitle = pageTitles[pathname] ?? 'Console';

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Poll /health every 15 seconds
  useEffect(() => {
    let mounted = true;

    async function poll() {
      setHealthChecking(true);
      const result = await checkHealth();
      if (mounted) {
        setHealth(result);
        setHealthChecking(false);
        timerRef.current = setTimeout(poll, 15_000);
      }
    }

    poll();
    return () => {
      mounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const backendConnected = health?.status === 'ok';
  const headerStatus = healthChecking
    ? 'loading'
    : backendConnected
    ? 'online'
    : 'offline';
  const headerLabel = healthChecking
    ? 'Checking…'
    : backendConnected
    ? `Backend v${health!.version}`
    : 'Backend Not Connected';

  return (
    <div className="flex h-screen overflow-hidden bg-[#030712]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-56">
            <Sidebar collapsed={false} onToggle={() => {}} onMobileClose={() => setMobileMenuOpen(false)} />
          </div>
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-[#1E2D47] bg-[#080F20] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-[#94A3B8] hover:text-white p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <h1 className="text-sm font-semibold text-[#F8FAFC]">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System status */}
            <StatusIndicator
              status={headerStatus}
              label={headerLabel}
              size="sm"
              className="hidden md:flex"
            />

            {/* Demo mode badge — only show when backend not connected */}
            {!backendConnected && (
              <Badge variant="demo" size="sm" className="hidden sm:inline-flex">DEMO MODE</Badge>
            )}

            {/* Notifications */}
            <button
              className="relative p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#101A30] transition-colors"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="Notifications"
            >
              <Bell size={16} />
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#64748B]" />
            </button>

            {/* Profile */}
            <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#101A30] transition-colors">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <User size={12} className="text-white" />
              </div>
              <span className="hidden sm:block text-xs text-[#94A3B8]">Demo User</span>
            </button>
          </div>
        </header>

        {/* Notification dropdown */}
        {notificationsOpen && (
          <div className="absolute right-4 top-14 z-40 w-72 bg-[#0B1224] border border-[#1E2D47] rounded-xl shadow-xl shadow-black/30 p-4">
            <p className="text-xs font-semibold text-[#F8FAFC] mb-3">Notifications</p>
            <div className="text-center py-6">
              <Bell size={20} className="text-[#64748B] mx-auto mb-2" />
              <p className="text-xs text-[#64748B]">No notifications</p>
              <p className="text-[10px] text-[#64748B] mt-1">Connect backend to receive security alerts</p>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
