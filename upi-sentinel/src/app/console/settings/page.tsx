'use client';

import { useState } from 'react';
import { Settings, User, Bell, Shield, Database, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'profile', label: 'User Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'session', label: 'Session', icon: Database },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
          <Settings size={15} className="text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F8FAFC]">Settings</p>
          <p className="text-xs text-[#94A3B8]">Manage your profile, preferences, and security settings</p>
        </div>
      </div>

      <div className="flex gap-6 flex-col md:flex-row">
        {/* Tab nav */}
        <div className="md:w-44 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all',
                    activeTab === tab.id
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                      : 'text-[#94A3B8] hover:bg-[#080F20]',
                  )}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader><CardTitle>User Profile</CardTitle></CardHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-[#080F20] border border-[#1E2D47]">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#F8FAFC]">Demo User</p>
                    <p className="text-xs text-[#64748B]">demo@upi-sentinel.example</p>
                  </div>
                  <Badge variant="demo" size="sm" className="ml-auto">Demo</Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Display Name" placeholder="Your name" defaultValue="Demo User" />
                  <Input label="Email" type="email" placeholder="Email address" defaultValue="demo@upi-sentinel.example" />
                </div>
                <Input label="Organization" placeholder="Company / Institution" />
                <Button variant="gradient" size="md" disabled>
                  <Save size={13} />
                  Save Changes (Requires Backend)
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
              <div className="space-y-4">
                {[
                  { label: 'High-risk alerts', desc: 'Notify when risk score exceeds 70', enabled: true },
                  { label: 'Critical incidents', desc: 'Immediate alert for critical risk detections', enabled: true },
                  { label: 'Agent failures', desc: 'Alert when an agent fails execution', enabled: false },
                  { label: 'Session summaries', desc: 'Email summary after monitoring sessions', enabled: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#1E2D47] last:border-0">
                    <div>
                      <p className="text-xs font-medium text-[#F8FAFC]">{item.label}</p>
                      <p className="text-[10px] text-[#64748B]">{item.desc}</p>
                    </div>
                    <div className={cn(
                      'w-8 h-4 rounded-full border transition-colors cursor-pointer',
                      item.enabled ? 'bg-blue-600 border-blue-500' : 'bg-[#1E2D47] border-[#2D4060]',
                    )} />
                  </div>
                ))}
                <p className="text-[10px] text-[#64748B]">Notification delivery requires backend integration</p>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader><CardTitle>Security Preferences</CardTitle></CardHeader>
              <div className="space-y-4">
                <div className="rounded-lg bg-[#080F20] border border-[#1E2D47] p-4 space-y-2">
                  <p className="text-xs font-semibold text-[#F8FAFC]">Authentication</p>
                  <p className="text-xs text-[#94A3B8]">Authentication is managed by the backend. No credentials are stored in the frontend.</p>
                </div>
                <div className="rounded-lg bg-[#080F20] border border-[#1E2D47] p-4 space-y-2">
                  <p className="text-xs font-semibold text-[#F8FAFC]">API Access</p>
                  <p className="text-xs text-[#94A3B8]">API keys and tokens are backend-managed. Never stored in browser storage or frontend code.</p>
                </div>
                <div className="rounded-lg bg-[#080F20] border border-[#1E2D47] p-4 space-y-2">
                  <p className="text-xs font-semibold text-[#F8FAFC]">Data Privacy</p>
                  <p className="text-xs text-[#94A3B8]">All analysis data is processed consent-based. Privacy controls will be fully configured in Phase 2.</p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'session' && (
            <Card>
              <CardHeader><CardTitle>Session Settings</CardTitle></CardHeader>
              <div className="space-y-4">
                {[
                  { label: 'Session Timeout', value: '30 minutes' },
                  { label: 'Auto-save Analysis', value: 'Enabled (backend required)' },
                  { label: 'Demo Mode', value: 'Active (no backend)' },
                  { label: 'Max Events per Session', value: '100 (configurable)' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-[#1E2D47] last:border-0">
                    <span className="text-xs text-[#94A3B8]">{item.label}</span>
                    <span className="text-xs text-[#64748B]">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
