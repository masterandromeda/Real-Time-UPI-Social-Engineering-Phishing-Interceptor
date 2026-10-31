'use client';

import { useState } from 'react';
import { FileText, Download, Filter, Search, Info, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';

const REPORT_TYPES = [
  { id: 'incident', label: 'Incident Report', icon: '🚨', desc: 'Detailed report for each detected scam incident' },
  { id: 'session', label: 'Session Report', icon: '📋', desc: 'Full monitoring session log with agent activities' },
  { id: 'audit', label: 'Security Audit Log', icon: '🔍', desc: 'Complete audit trail of all system actions' },
  { id: 'agent', label: 'Agent Execution Log', icon: '🤖', desc: 'Detailed logs of all agent executions and outputs' },
  { id: 'analytics', label: 'Analytics Report', icon: '📊', desc: 'Business intelligence and trend analysis' },
];

const EXPORT_FORMATS = ['PDF', 'JSON', 'CSV'];

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('PDF');
  const [search, setSearch] = useState('');

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
          <FileText size={15} className="text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F8FAFC]">Reports & Audit Logs</p>
          <p className="text-xs text-[#94A3B8]">Generate and export security reports, incident logs, and audit trails</p>
        </div>
      </div>

      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-[#080F20] border border-[#1E2D47]">
        <Info size={13} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#94A3B8]">
          Report generation requires backend integration. Downloads will be available once security events
          have been processed and stored. No exports are generated in the current frontend-only state.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Report types */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Report Types</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id === selectedType ? '' : type.id)}
                  className={cn(
                    'w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
                    type.id === selectedType
                      ? 'bg-blue-500/10 border-blue-500/25'
                      : 'bg-[#080F20] border-[#1E2D47] hover:border-[#2D4060]',
                  )}
                >
                  <span className="text-xl flex-shrink-0">{type.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#F8FAFC]">{type.label}</p>
                    <p className="text-[10px] text-[#64748B]">{type.desc}</p>
                  </div>
                  {type.id === selectedType && <Badge variant="default" size="sm">Selected</Badge>}
                </button>
              ))}
            </div>
          </Card>

          {/* Audit log */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Security Audit History</CardTitle>
              <Badge variant="status">No records</Badge>
            </CardHeader>
            <EmptyState
              icon={<FileText size={18} />}
              title="No Audit Records"
              description="Security events, agent executions, and user actions will appear here once the backend is connected and events are processed."
            />
          </Card>
        </div>

        {/* Export panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Generate Report</CardTitle></CardHeader>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#64748B] mb-2">Export Format</p>
                <div className="flex gap-2">
                  {EXPORT_FORMATS.map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setSelectedFormat(fmt)}
                      className={cn(
                        'flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all',
                        selectedFormat === fmt
                          ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                          : 'bg-[#080F20] border-[#1E2D47] text-[#94A3B8]',
                      )}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-[#64748B] mb-2">Date Range</p>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 px-2 py-1.5 text-xs bg-[#080F20] border border-[#1E2D47] rounded-lg text-[#94A3B8] focus:outline-none focus:border-blue-500/50"
                  />
                  <input
                    type="date"
                    className="flex-1 px-2 py-1.5 text-xs bg-[#080F20] border border-[#1E2D47] rounded-lg text-[#94A3B8] focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <Button
                variant="secondary"
                size="md"
                className="w-full"
                disabled
              >
                <Download size={13} />
                Generate & Download
              </Button>
              <p className="text-[10px] text-[#64748B] text-center">
                Downloads require backend integration. No data available.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Reports</CardTitle></CardHeader>
            <div className="py-6 text-center">
              <FileText size={20} className="text-[#64748B] mx-auto mb-2" />
              <p className="text-xs text-[#64748B]">No reports generated yet</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
