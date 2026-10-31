'use client';

import { useState } from 'react';
import { Building2, Search, Plus, MoreHorizontal, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, Input, EmptyState, StatusIndicator } from '@/components/ui';
import { cn } from '@/lib/utils';

const ORG_DEMO = [
  { id: 1, name: 'Demo Bank Ltd', type: 'Banking', status: 'active', events: 0, plan: 'Enterprise', joined: '2024-01' },
  { id: 2, name: 'QuickPay Fintech', type: 'Fintech', status: 'active', events: 0, plan: 'Professional', joined: '2024-02' },
  { id: 3, name: 'SecureUPI Platform', type: 'UPI Platform', status: 'pending', events: 0, plan: 'Enterprise', joined: '2024-03' },
];

export default function OrganizationsPage() {
  const [search, setSearch] = useState('');

  const filtered = ORG_DEMO.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.type.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
          <Building2 size={15} className="text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F8FAFC]">Organizations</p>
          <p className="text-xs text-[#94A3B8]">Manage business accounts and API access</p>
        </div>
        <Badge variant="demo" className="ml-auto">PREVIEW DATA</Badge>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#080F20] border border-[#1E2D47] rounded-lg text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-blue-500/50"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="gradient" size="md">
          <Plus size={13} />
          Add Organization
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E2D47]">
                {['Organization', 'Type', 'Status', 'Events', 'Plan', 'Joined'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((org) => (
                <tr key={org.id} className="border-b border-[#1E2D47] last:border-0 hover:bg-[#080F20] transition-colors">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Building2 size={12} className="text-blue-400" />
                      </div>
                      <span className="text-xs font-medium text-[#F8FAFC]">{org.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-[#94A3B8]">{org.type}</span>
                  </td>
                  <td className="px-3 py-3">
                    <StatusIndicator
                      status={org.status === 'active' ? 'online' : 'warning'}
                      label={org.status === 'active' ? 'Active' : 'Pending'}
                      size="sm"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-[#94A3B8]">{org.events} (preview)</span>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant="default" size="sm">{org.plan}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-[#64748B]">{org.joined}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-[#64748B]">No organizations match your search</div>
          )}
        </div>
        <p className="text-[10px] text-[#64748B] mt-3 pt-2 border-t border-[#1E2D47] px-3 pb-2">
          Preview data — connect backend to manage real organizations
        </p>
      </Card>
    </div>
  );
}
