'use client';

import { BarChart3, TrendingUp, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, EmptyState } from '@/components/ui';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

const SAMPLE_EVENTS = [
  { month: 'May', events: 0, threats: 0 },
  { month: 'Jun', events: 0, threats: 0 },
  { month: 'Jul', events: 0, threats: 0 },
  { month: 'Aug', events: 0, threats: 0 },
  { month: 'Sep', events: 0, threats: 0 },
  { month: 'Oct', events: 0, threats: 0 },
];

const RISK_DIST = [
  { name: 'Low', value: 0, color: '#10B981' },
  { name: 'Medium', value: 0, color: '#F59E0B' },
  { name: 'High', value: 0, color: '#F97316' },
  { name: 'Critical', value: 0, color: '#EF4444' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0B1224] border border-[#1E2D47] rounded-lg p-3 shadow-xl">
        <p className="text-xs font-semibold text-[#F8FAFC] mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
          <BarChart3 size={15} className="text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F8FAFC]">Business Analytics</p>
          <p className="text-xs text-[#94A3B8]">Security event trends, risk distribution, and agent performance</p>
        </div>
        <Badge variant="demo" className="ml-auto">NO DATA YET</Badge>
      </div>

      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-[#080F20] border border-[#1E2D47]">
        <Info size={13} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#94A3B8]">
          Charts below show the analytics structure. Actual data will populate once security events are processed via the backend.
          All values shown are zero — no sample data is fabricated.
        </p>
      </div>

      {/* Event trend chart */}
      <Card>
        <CardHeader>
          <CardTitle>Security Event Trends</CardTitle>
          <Badge variant="status">No data</Badge>
        </CardHeader>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={SAMPLE_EVENTS} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D47" />
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="events" name="Events" fill="#3B82F6" radius={[3, 3, 0, 0]} fillOpacity={0.7} />
              <Bar dataKey="threats" name="Threats" fill="#EF4444" radius={[3, 3, 0, 0]} fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Risk distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <Badge variant="status">No data</Badge>
          </CardHeader>
          <div className="h-48 flex items-center justify-center">
            <div className="text-center">
              <PieChart width={160} height={160}>
                <Pie data={[{ value: 1 }]} cx={75} cy={75} innerRadius={45} outerRadius={65}
                  fill="#1E2D47" dataKey="value" stroke="none" />
              </PieChart>
              <p className="text-xs text-[#64748B] mt-2">No events to distribute</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {RISK_DIST.map((r) => (
              <div key={r.name} className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                {r.name}: {r.value}
              </div>
            ))}
          </div>
        </Card>

        {/* Agent performance */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
            <Badge variant="status">No executions</Badge>
          </CardHeader>
          <div className="space-y-3">
            {['Call Intelligence', 'Link Intelligence', 'Device Guardian', 'Scam Prediction', 'Orchestrator'].map((agent) => (
              <div key={agent} className="space-y-1">
                <div className="flex justify-between text-xs text-[#94A3B8]">
                  <span>{agent}</span>
                  <span className="text-[#64748B]">0 executions</span>
                </div>
                <div className="h-1 bg-[#1E2D47] rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
