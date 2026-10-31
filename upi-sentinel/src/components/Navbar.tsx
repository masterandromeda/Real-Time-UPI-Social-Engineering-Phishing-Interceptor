'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Shield, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

const navLinks = [
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Live Protection', href: '#live-protection' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Business Impact', href: '#business-impact' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[#030712]/90 backdrop-blur-md border-b border-[#1E2D47]/80 shadow-lg shadow-black/20'
          : 'bg-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Shield className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <div>
              <span className="text-[#F8FAFC] font-bold text-base tracking-tight">UPI Sentinel</span>
              <span className="hidden sm:block text-[10px] text-[#64748B] leading-none">Predictive Scam Interceptor</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-1.5 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition-colors rounded-md hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="hidden lg:flex items-center gap-2">
            <Link href="/console">
              <Button variant="secondary" size="sm">Open Console</Button>
            </Link>
            <Link href="/console">
              <Button variant="gradient" size="sm">Free Assessment</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 text-[#94A3B8] hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#030712]/95 backdrop-blur-md border-b border-[#1E2D47]">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-2.5 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition-colors rounded-md hover:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-[#1E2D47]">
              <Link href="/console" onClick={() => setMobileOpen(false)}>
                <Button variant="secondary" size="md" className="w-full">Open Console</Button>
              </Link>
              <Link href="/console" onClick={() => setMobileOpen(false)}>
                <Button variant="gradient" size="md" className="w-full">Free Assessment</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
