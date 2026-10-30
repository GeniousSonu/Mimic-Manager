'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  ShieldCheck,
  RefreshCw,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  X,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Button } from '@mimic-manager/ui';

interface SiteItem {
  siteId: string;
  name: string;
  url: string;
  secretVersion: number;
  createdAt: string;
}

interface SiteCandidate {
  sessionId: string;
  siteUrl: string;
  name: string;
  pluginVersion: string;
}

export default function SitesPage() {
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [candidate, setCandidate] = useState<SiteCandidate | null>(null);
  const [pairingStatus, setPairingStatus] = useState<'idle' | 'verifying' | 'confirming' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const loadSites = async () => {
    try {
      const res = await fetch('/api/v1/sites');
      if (res.ok) {
        const data = await res.json();
        setSites(data);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPairingStatus('verifying');
    setErrorMessage('');

    try {
      const res = await fetch('/api/v1/sites/pair/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pairingCode: pairingCode.trim(),
          siteUrl: siteUrl ? siteUrl.trim() : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Invalid or expired pairing code.');
      }

      const data = await res.json();
      setCandidate(data);
      setPairingStatus('idle');
    } catch (err: any) {
      setPairingStatus('error');
      setErrorMessage(err.message || 'Verification failed. Please check the 6-digit code.');
    }
  };

  const handleConfirmPairing = async (confirm: boolean) => {
    if (!candidate) return;
    setPairingStatus('confirming');
    setErrorMessage('');

    try {
      const res = await fetch('/api/v1/sites/pair/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: candidate.sessionId,
          confirm,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to confirm pairing.');
      }

      if (confirm) {
        setPairingStatus('success');
        await loadSites();
        setTimeout(() => {
          setIsPairingModalOpen(false);
          setCandidate(null);
          setPairingCode('');
          setSiteUrl('');
          setPairingStatus('idle');
        }, 1500);
      } else {
        setCandidate(null);
        setPairingStatus('idle');
      }
    } catch (err: any) {
      setPairingStatus('error');
      setErrorMessage(err.message || 'Pairing confirmation failed.');
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
          onClick={() => {
            setCandidate(null);
            setPairingCode('');
            setErrorMessage('');
            setIsPairingModalOpen(true);
          }}
        >
          Pair New WordPress Site
        </Button>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.length === 0 ? (
          <div className="col-span-full p-8 rounded-lg bg-[#10131A] border border-[#2A3040] text-center space-y-3">
            <Globe className="w-10 h-10 text-[#626D85] mx-auto" />
            <h3 className="text-sm font-semibold text-[#E9ECF3]">No Sites Connected Yet</h3>
            <p className="text-xs text-[#A5AEC0] max-w-md mx-auto">
              Install the Mimic Manager WordPress plugin, open <strong>Mimic Manager → Sites/Connection</strong>, and generate a pairing code to link your site.
            </p>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsPairingModalOpen(true)}
            >
              Add First Site
            </Button>
          </div>
        ) : (
          sites.map((site) => (
            <div key={site.siteId} className="p-5 rounded-lg bg-[#10131A] border border-[#2A3040] hover:border-[#626D85] transition-all space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-md bg-[#7C6CFF]/15 border border-[#7C6CFF]/30 flex items-center justify-center text-[#7C6CFF]">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#E9ECF3]">{site.name}</h3>
                    <p className="text-xs text-[#A5AEC0] font-mono">{site.url}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2FBF8F]/15 text-[#2FBF8F] border border-[#2FBF8F]/30">
                  Connected
                </span>
              </div>
              <div className="text-xs text-[#747E92] flex items-center justify-between pt-2 border-t border-[#1F2430]">
                <span>Key Ver: v{site.secretVersion}</span>
                <span className="font-mono text-[10px]">{site.siteId}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pairing Modal */}
      {isPairingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl bg-[#10131A] border border-[#2A3040] shadow-2xl p-6 relative">
            <button
              onClick={() => setIsPairingModalOpen(false)}
              className="absolute top-4 right-4 text-[#747E92] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7C6CFF] mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Two-Way Encrypted Pairing</span>
            </div>
            <h2 className="text-lg font-bold text-[#E9ECF3]">Connect WordPress Site</h2>

            {/* Step-by-Step Instructions */}
            <div className="my-4 p-3 rounded-lg bg-[#0A0C10] border border-[#1F2430] space-y-2 text-xs text-[#A5AEC0]">
              <div className="font-semibold text-[#E9ECF3] flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#7C6CFF]" />
                <span>How to get your 6-digit code:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Log in to your WordPress admin dashboard.</li>
                <li>Go to <strong>Mimic Manager → Sites/Connection</strong> in the left menu.</li>
                <li>Ensure consent is checked and click <strong>Generate pairing code</strong>.</li>
                <li>Enter the 6-digit verification code below.</li>
              </ol>
            </div>

            {!candidate ? (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#A5AEC0] mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    placeholder="123456"
                    value={pairingCode}
                    onChange={(e) => setPairingCode(e.target.value)}
                    className="w-full h-12 px-3 rounded-md bg-[#0A0C10] border border-[#2A3040] text-center text-2xl font-mono tracking-widest text-[#E9ECF3] focus:outline-none focus:border-[#7C6CFF]"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A5AEC0] mb-1.5">
                    Optional: Site URL Cross-Check
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-[#0A0C10] border border-[#2A3040] text-sm text-[#E9ECF3] focus:outline-none focus:border-[#7C6CFF] font-mono"
                  />
                </div>

                {pairingStatus === 'error' && (
                  <div className="p-3 rounded-md bg-[#F2555A]/10 border border-[#F2555A]/30 text-xs text-[#F2555A] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
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
                    isLoading={pairingStatus === 'verifying'}
                  >
                    Verify Code
                  </Button>
                </div>
              </form>
            ) : (
              /* Confirmation Screen ("Is this your site?") */
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 rounded-lg bg-[#7C6CFF]/10 border border-[#7C6CFF]/30 space-y-2">
                  <div className="text-xs font-semibold text-[#7C6CFF] uppercase tracking-wider">
                    Confirm Site Identity
                  </div>
                  <div className="text-base font-bold text-[#E9ECF3]">{candidate.name}</div>
                  <div className="text-xs text-[#A5AEC0] font-mono break-all">{candidate.siteUrl}</div>
                  <div className="text-[11px] text-[#747E92]">Plugin Version: {candidate.pluginVersion}</div>
                </div>

                <p className="text-xs text-[#A5AEC0]">
                  Please confirm that this is your WordPress site before connecting. Clicking confirm will provision a cryptographically secure shared HMAC secret.
                </p>

                {pairingStatus === 'success' && (
                  <div className="p-3 rounded-md bg-[#2FBF8F]/10 border border-[#2FBF8F]/30 text-xs text-[#2FBF8F] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Site successfully paired! Key provisioned to connector.</span>
                  </div>
                )}

                {pairingStatus === 'error' && (
                  <div className="p-3 rounded-md bg-[#F2555A]/10 border border-[#F2555A]/30 text-xs text-[#F2555A] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleConfirmPairing(false)}
                    disabled={pairingStatus === 'confirming'}
                  >
                    Not My Site (Cancel)
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleConfirmPairing(true)}
                    isLoading={pairingStatus === 'confirming'}
                    disabled={pairingStatus === 'success'}
                  >
                    Confirm &amp; Connect Site
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
