import ConsoleDashboard from '@/components/ConsoleDashboard';

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleDashboard>{children}</ConsoleDashboard>;
}
