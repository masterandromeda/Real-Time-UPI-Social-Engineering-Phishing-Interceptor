'use client';

import { useState, useEffect } from 'react';
import { Puzzle, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, StatusIndicator } from '@/components/ui';
import { cn } from '@/lib/utils';
import { getIntegrationsStatus, API_BASE } from '@/lib/api';

interface BackendIntegration {
  id: string;
  name: string;
  purpose: string;
  connectionStatus: string;
  configurationStatus: string;
  lastChecked: string | null;
  docsUrl: string | null;
}

const STATIC_INTEGRATIONS = [
  {
    id: 'sarvam',
    backendId: 'sarvam_ai',
    name: 'Sarvam AI',
    purpose: 'Multilingual speech-to-text and natural language understanding for Hindi, Punjabi, and Hinglish conversation analysis.',
    docsUrl: 'https://sarvam.ai',
    category: 'AI',
    icon: '🧠',
  },
  {
    id: 'urlhaus',
    backendId: 'urlhaus',
    name: 'URLhaus',
    purpose: 'Open-source threat intelligence feed for known malicious URLs and phishing domains.',
    docsUrl: 'https://urlhaus.abuse.ch',
    category: 'Threat Intel',
    icon: '🔗',
  },
  {
    id: 'virustotal',
    backendId: 'virustotal',
    name: 'VirusTotal',
    purpose: 'URL and file reputation scanning across 70+ antivirus engines and security vendors.',
    docsUrl: 'https://www.virustotal.com',
    category: 'Threat Intel',
    icon: '🛡️',
  },
  {
    id: 'openai',
    backendId: 'openai',
    name: 'OpenAI / LLM',
    purpose: 'Large language model for explanation generation and risk description (explanation layer only — risk scores are deterministic).',
    docsUrl: 'https://platform.openai.com',
    category: 'AI',
    icon: '🤖',
  },
  {
    id: 'bank_psp',
    backendId: null,
    name: 'Bank / PSP Integration',
    purpose: 'Authorized integration with banking systems and payment service providers for event-driven fraud signals.',
    docsUrl: null,
    category: 'Business',
    icon: '🏦',
    planned: true,
  },
];

const categoryColors: Record<string, string> = {
  AI: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  'Threat Intel': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  Business: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

export default function IntegrationsPage() {
  const [backendData, setBackendData] = useState<BackendIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      setLoading(true);
      const data = await getIntegrationsStatus();
      if (data) {
        setBackendData(data.integrations ?? []);
        setLastFetched(new Date(data.timestamp).toLocaleTimeString('en-IN'));
      }
      setLoading(false);
    }
    fetchStatus();
  }, []);

  function getBackendStatus(backendId: string | null) {
    if (!backendId) return null;
    return backendData.find((b) => b.id === backendId) ?? null;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
          <Puzzle size={15} className="text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F8FAFC]">API & Integrations</p>
          <p className="text-xs text-[#94A3B8]">Configure external services and API connections</p>
        </div>
        {loading && <Loader2 size={14} className="ml-auto text-blue-400 animate-spin" />}
        {!loading && lastFetched && (
          <span className="ml-auto text-[10px] text-[#64748B]">Last checked: {lastFetched}</span>
        )}
      </div>

      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
        <AlertTriangle size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-300/80">
          <span className="font-semibold">Security Notice:</span> API keys and secrets are never stored in frontend code.
          All credentials are configured server-side in the backend environment. No credentials appear here.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {STATIC_INTEGRATIONS.map((integration) => {
          const live = getBackendStatus(integration.backendId ?? null);
          const connStatus = live?.connectionStatus ?? 'disconnected';
          const configStatus = live?.configurationStatus ?? 'not_configured';
          const isConnected = connStatus === 'connected';
          const isConfigured = configStatus === 'configured';

          return (
            <Card key={integration.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{integration.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#F8FAFC]">{integration.name}</p>
                      {'planned' in integration && integration.planned && (
                        <Badge variant="status" size="sm">Planned</Badge>
                      )}
                    </div>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', categoryColors[integration.category] ?? '')}>
                      {integration.category}
                    </span>
                  </div>
                </div>
                <StatusIndicator
                  status={loading ? 'loading' : isConnected ? 'online' : 'offline'}
                  label={loading ? 'Checking…' : isConnected ? 'Connected' : 'Disconnected'}
                  size="sm"
                />
              </div>

              <p className="text-xs text-[#94A3B8] leading-relaxed mb-3">{integration.purpose}</p>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-lg bg-[#080F20] border border-[#1E2D47] px-2.5 py-2">
                  <p className="text-[9px] text-[#64748B]">Connection</p>
                  <p className={cn('text-xs',
                    loading ? 'text-[#64748B]' :
                    isConnected ? 'text-emerald-400' : 'text-[#94A3B8]',
                  )}>
                    {loading ? '…' : isConnected ? 'Connected' : 'Not Connected'}
                  </p>
                </div>
                <div className="rounded-lg bg-[#080F20] border border-[#1E2D47] px-2.5 py-2">
                  <p className="text-[9px] text-[#64748B]">Configuration</p>
                  <p className={cn('text-xs',
                    loading ? 'text-[#64748B]' :
                    isConfigured ? 'text-emerald-400' : 'text-[#94A3B8]',
                  )}>
                    {loading ? '…' : isConfigured ? 'Configured' : 'Not Configured'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={'planned' in integration && integration.planned}
                  title={isConfigured ? 'API key configured server-side' : 'Configure in backend .env'}
                >
                  {'planned' in integration && integration.planned
                    ? 'Coming Soon'
                    : isConfigured
                    ? 'Configured ✓'
                    : 'Configure in .env'}
                </Button>
                {integration.docsUrl && (
                  <a
                    href={integration.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-400 hover:underline"
                  >
                    Docs <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>WebSocket & REST API</CardTitle></CardHeader>
        <div className="space-y-3">
          {[
            { label: 'REST API Base URL', value: `${API_BASE}/api/v1`, note: 'Backend running on port 8001' },
            { label: 'WebSocket — Analysis', value: `${API_BASE.replace(/^http/, 'ws')}/ws/analysis/{id}`, note: 'Per-analysis real-time events' },
            { label: 'WebSocket — Agents', value: `${API_BASE.replace(/^http/, 'ws')}/ws/agents`, note: 'Global agent event stream' },
            { label: 'API Version', value: 'v1', note: 'Subject to change' },
            { label: 'API Docs', value: `${API_BASE}/api/docs`, note: 'FastAPI Swagger UI' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#1E2D47] last:border-0">
              <div>
                <p className="text-xs font-medium text-[#94A3B8]">{item.label}</p>
                <p className="text-[10px] text-[#64748B]">{item.note}</p>
              </div>
              <code className="text-xs text-blue-400 bg-[#080F20] border border-[#1E2D47] px-2 py-0.5 rounded font-mono truncate max-w-[200px]">
                {item.value}
              </code>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
