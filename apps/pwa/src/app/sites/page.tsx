'use client';

import React, { useState } from 'react';
import {
  Globe,
  Plus,
  ShieldCheck,
  RefreshCw,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { Button } from '@mimic-manager/ui';

export default function SitesPage() {
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [siteName, setSiteName] = useState('');
  const [pairingStatus, setPairingStatus] = useState<'idle' | 'pairing' | 'success' | 'error'>('idle');

  const handlePairSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setPairingStatus('pairing');

    try {
      const res = await fetch('/api/v1/sites/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pairingCode,
          homeUrl: siteUrl,
          name: siteName || siteUrl,
          environment: 'production'
        })
      });

      if (!res.ok) throw new Error('Pairing failed');
      setPairingStatus('success');
      setTimeout(() => {
        setIsPairingModalOpen(false);
        setPairingStatus('idle');
      }, 1500);
    } catch {
      setPairingStatus('error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1F2430]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E9ECF3]">Connected Sites</h1>
          <p className="text-xs text-[#A5AEC0] mt-0.5">
            Manage paired WordPress connectors, cryptographic secrets, and sync health.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsPairingModalOpen(true)}
        >
          Pair New WordPress Site
        </Button>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Site Card 1 */}
        <div className="p-5 rounded-lg bg-[#10131A] border border-[#2A3040] hover:border-[#626D85] transition-all space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-[#7C6CFF]/15 border border-[#7C6CFF]/30 flex items-center justify-center text-[#7C6CFF]">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#E9ECF3]">Production Store</h3>
                <a
                  href="https://store.local"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-[#747E92] hover:text-[#7C6CFF] flex items-center gap-1"
                >
                  <span>https://store.local</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#2FBF8F]/15 border border-[#2FBF8F]/40 text-[#2FBF8F]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2FBF8F]" />
              Healthy
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-[#A5AEC0] pt-2 border-t border-[#1F2430]">
            <div className="flex items-center justify-between">
              <span>Environment:</span>
              <span className="text-[#E9ECF3] font-mono">Production</span>
            </div>
            <div className="flex items-center justify-between">
              <span>WordPress Version:</span>
              <span className="text-[#E9ECF3] font-mono">6.7.0 (PHP 8.2)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Detected SEO:</span>
              <span className="text-[#7C6CFF] font-medium">Yoast SEO 23.8</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Circuit Breaker:</span>
              <span className="text-[#2FBF8F] font-mono">Closed (Healthy)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-[#1F2430]">
            <Button variant="secondary" size="sm" className="w-full text-xs" leftIcon={<RefreshCw className="w-3 h-3" />}>
              Test Ping
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" title="Rotate Secret" leftIcon={<Key className="w-3 h-3" />}>
              Rotate
            </Button>
          </div>
        </div>
      </div>

      {/* 6-Digit Pairing Modal */}
      {isPairingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl bg-[#10131A] border border-[#2A3040] shadow-2xl p-6 relative">
            <button
              onClick={() => setIsPairingModalOpen(false)}
              className="absolute top-4 right-4 text-[#747E92] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7C6CFF] mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Config Pairing</span>
            </div>
            <h2 className="text-lg font-bold text-[#E9ECF3]">Connect WordPress Connector</h2>
            <p className="text-xs text-[#A5AEC0] mt-1 leading-relaxed">
              Open your WordPress admin, navigate to <strong>Mimic Manager &gt; Overview</strong>, and enter the 6-digit one-time code generated by the plugin.
            </p>

            <form onSubmit={handlePairSite} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A5AEC0] mb-1.5">
                  WordPress Site Canonical URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-[#0A0C10] border border-[#2A3040] text-sm text-[#E9ECF3] focus:outline-none focus:border-[#7C6CFF] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A5AEC0] mb-1.5">
                  6-Digit Verification PIN
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="849201"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value)}
                  className="w-full h-12 px-3 rounded-md bg-[#0A0C10] border border-[#2A3040] text-center text-xl font-mono tracking-widest text-[#E9ECF3] focus:outline-none focus:border-[#7C6CFF]"
                />
              </div>

              {pairingStatus === 'error' && (
                <div className="p-3 rounded-md bg-[#F2555A]/10 border border-[#F2555A]/30 text-xs text-[#F2555A] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Pairing failed. Verify PIN validity or check if clock skew exceeds 300s.</span>
                </div>
              )}

              {pairingStatus === 'success' && (
                <div className="p-3 rounded-md bg-[#2FBF8F]/10 border border-[#2FBF8F]/30 text-xs text-[#2FBF8F] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Site successfully paired! Shared HMAC secret provisioned.</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPairingModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={pairingStatus === 'pairing'}
                  disabled={pairingStatus === 'success'}
                >
                  Authorize &amp; Connect
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
