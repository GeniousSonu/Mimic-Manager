'use client';

import React, { useState } from 'react';
import { 
  ScoreGauge, 
  TierBadge, 
  FixCard, 
  BeforeAfterSlider, 
  Button 
} from '@mimic-manager/ui';
import { 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  RotateCcw, 
  Sparkles, 
  Activity, 
  Layers, 
  X, 
  CheckCircle2, 
  Play, 
  Clock 
} from 'lucide-react';

interface FixItem {
  id: string;
  tier: 'safe' | 'moderate' | 'guided';
  title: string;
  description: string;
  impactRange: string;
  risks: string[];
  status: 'available' | 'applied' | 'reverted' | 'failed';
  verificationEvidence?: {
    diffScreenshotUrl?: string;
    consoleErrorsCount: number;
    visualDiffPercent: number;
  };
}

const INITIAL_FIXES: FixItem[] = [
  {
    id: 'FIX-PERF-001',
    tier: 'safe',
    title: 'DNS Preconnect & Prefetch',
    description: 'Pre-resolves DNS and establishes TCP/TLS handshakes early for Google Fonts and third-party CDNs.',
    impactRange: '150ms – 300ms FCP reduction',
    risks: [],
    status: 'applied',
    verificationEvidence: {
      consoleErrorsCount: 0,
      visualDiffPercent: 0.0,
    },
  },
  {
    id: 'FIX-PERF-002',
    tier: 'safe',
    title: 'Missing Image Dimensions',
    description: 'Injects width, height, and CSS aspect-ratio on image tags missing dimensions to eliminate layout shifts.',
    impactRange: 'CLS 0.22 → 0.01 reduction',
    risks: [],
    status: 'applied',
    verificationEvidence: {
      consoleErrorsCount: 0,
      visualDiffPercent: 0.0,
    },
  },
  {
    id: 'FIX-PERF-003',
    tier: 'safe',
    title: 'Font-Display Swap',
    description: 'Forces font-display: swap on @font-face rules and Google Fonts queries to eliminate Flash of Invisible Text (FOIT).',
    impactRange: '200ms – 400ms LCP reduction',
    risks: ['Minor font swap reflow (FOUT) on slow mobile connections'],
    status: 'available',
  },
  {
    id: 'FIX-PERF-004',
    tier: 'moderate',
    title: 'Non-Critical Script Deferral',
    description: 'Appends defer to scripts in <head> while preserving jQuery, inline dependencies, and opt-out scripts.',
    impactRange: '600ms – 1.1s Total Blocking Time',
    risks: ['Plugins with unisolated inline jQuery document.ready calls may break if not queued'],
    status: 'available',
    verificationEvidence: {
      consoleErrorsCount: 0,
      visualDiffPercent: 0.2,
    },
  },
  {
    id: 'FIX-PERF-005',
    tier: 'moderate',
    title: 'Lazy-Load Below-The-Fold Iframes',
    description: 'Appends loading="lazy" to embedded YouTube videos, Google Maps, and external widget iframes.',
    impactRange: '300KB – 1.2MB initial transfer reduction',
    risks: [],
    status: 'available',
  },
  {
    id: 'FIX-PERF-006',
    tier: 'guided',
    title: 'Critical CSS Inlining',
    description: 'Extracts above-the-fold viewport styles and inlines them directly in <head>, loading external stylesheets asynchronously.',
    impactRange: '800ms – 1.4s LCP reduction',
    risks: ['Dynamic page builders may require custom viewport capture per template'],
    status: 'available',
  },
];

export default function PageSpeedEnginePage() {
  const [fixes, setFixes] = useState<FixItem[]>(INITIAL_FIXES);
  const [selectedFixForPreview, setSelectedFixForPreview] = useState<FixItem | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'safe' | 'moderate' | 'guided'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const appliedCount = fixes.filter(f => f.status === 'applied').length;
  const currentPerformanceScore = Math.min(98, 54 + appliedCount * 8);

  const handleApply = (id: string) => {
    setFixes(prev =>
      prev.map(fix =>
        fix.id === id
          ? {
              ...fix,
              status: 'applied',
              verificationEvidence: {
                consoleErrorsCount: 0,
                visualDiffPercent: 0.15,
              },
            }
          : fix
      )
    );
    showToast(`Fix ${id} applied successfully and verified clean.`);
  };

  const handleRevert = (id: string) => {
    setFixes(prev =>
      prev.map(fix =>
        fix.id === id
          ? {
              ...fix,
              status: 'reverted',
            }
          : fix
      )
    );
    showToast(`Fix ${id} reverted. Changes rolled back cleanly.`);
  };

  const handlePreview = (id: string) => {
    const target = fixes.find(f => f.id === id);
    if (target) {
      setSelectedFixForPreview(target);
    }
  };

  const simulateAutoRevertFailure = () => {
    showToast('Simulating test failure: JS error detected on page reload. Auto-reverting FIX-PERF-004...');
    setTimeout(() => {
      setFixes(prev =>
        prev.map(fix =>
          fix.id === 'FIX-PERF-004'
            ? { ...fix, status: 'reverted' }
            : fix
        )
      );
      showToast('AUTO-REVERT COMPLETE: FIX-PERF-004 restored to baseline safely. 0 errors remaining.');
    }, 1500);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const filteredFixes = fixes.filter(fix => {
    if (activeTab === 'all') return true;
    return fix.tier === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#161A23] border border-[#2FBF8F]/50 rounded-lg shadow-xl text-xs text-[#E9ECF3] animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[#2FBF8F]" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-[#747E92] hover:text-[#E9ECF3]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#E9ECF3] flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#F5A524]" />
            PageSpeed Optimization Engine
          </h2>
          <p className="text-xs text-[#A5AEC0] mt-1">
            Automated, tiered performance fixes with headless preview verification and instant rollback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={simulateAutoRevertFailure}
            className="border-[#F2555A]/30 text-[#F2555A] hover:bg-[#F2555A]/10"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Simulate Auto-Revert
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              fixes.filter(f => f.tier === 'safe').forEach(f => handleApply(f.id));
              showToast('All Safe-tier fixes applied and verified.');
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            Apply All Safe Fixes
          </Button>
        </div>
      </div>

      {/* Conflict Detection Banner */}
      <div className="flex items-start gap-3 p-3.5 bg-[#F5A524]/10 border border-[#F5A524]/20 rounded-lg text-xs text-[#F5A524]">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <span className="font-semibold text-[#E9ECF3]">Plugin Awareness Active:</span>
          <p className="text-[#A5AEC0]">
            No conflicting caching plugins detected on active WordPress target. Mimic Manager output filters are active.
          </p>
        </div>
      </div>

      {/* Core Audits & Web Vitals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-[#10131A] border border-[#2A3040] rounded-lg flex items-center gap-4">
          <ScoreGauge score={currentPerformanceScore} label="Performance" size={72} />
          <div>
            <div className="text-xs text-[#747E92]">Lighthouse Score</div>
            <div className="text-sm font-semibold text-[#E9ECF3]">
              {currentPerformanceScore >= 90 ? 'Fast & Optimized' : 'Needs Optimization'}
            </div>
            <div className="text-[11px] text-[#2FBF8F] font-mono mt-0.5">
              +{currentPerformanceScore - 54} pts gained
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#10131A] border border-[#2A3040] rounded-lg flex items-center gap-4">
          <ScoreGauge score={98} label="Accessibility" size={72} />
          <div>
            <div className="text-xs text-[#747E92]">WCAG 2.2 AA</div>
            <div className="text-sm font-semibold text-[#E9ECF3]">Compliant</div>
            <div className="text-[11px] text-[#747E92] font-mono mt-0.5">0 critical violations</div>
          </div>
        </div>

        <div className="p-4 bg-[#10131A] border border-[#2A3040] rounded-lg flex items-center gap-4">
          <ScoreGauge score={96} label="Best Practices" size={72} />
          <div>
            <div className="text-xs text-[#747E92]">Web Standards</div>
            <div className="text-sm font-semibold text-[#E9ECF3]">Passing</div>
            <div className="text-[11px] text-[#2FBF8F] font-mono mt-0.5">Modern protocols</div>
          </div>
        </div>

        <div className="p-4 bg-[#10131A] border border-[#2A3040] rounded-lg flex items-center gap-4">
          <ScoreGauge score={100} label="SEO Health" size={72} />
          <div>
            <div className="text-xs text-[#747E92]">Search Engine</div>
            <div className="text-sm font-semibold text-[#E9ECF3]">Perfect Indexing</div>
            <div className="text-[11px] text-[#2FBF8F] font-mono mt-0.5">No schema duplicates</div>
          </div>
        </div>
      </div>

      {/* Core Web Vitals Diagnostic Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3.5 bg-[#10131A] border border-[#2A3040] rounded-lg">
          <div className="flex items-center justify-between text-xs text-[#747E92]">
            <span className="font-semibold text-[#E9ECF3]">Largest Contentful Paint (LCP)</span>
            <span className="font-mono text-[#2FBF8F] bg-[#2FBF8F]/10 px-1.5 py-0.5 rounded">Good</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#E9ECF3]">1.7s</span>
            <span className="text-xs font-mono text-[#747E92] line-through">3.4s baseline</span>
            <span className="text-xs font-mono text-[#2FBF8F]">-50%</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#10131A] border border-[#2A3040] rounded-lg">
          <div className="flex items-center justify-between text-xs text-[#747E92]">
            <span className="font-semibold text-[#E9ECF3]">Interaction to Next Paint (INP)</span>
            <span className="font-mono text-[#2FBF8F] bg-[#2FBF8F]/10 px-1.5 py-0.5 rounded">Good</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#E9ECF3]">95ms</span>
            <span className="text-xs font-mono text-[#747E92] line-through">180ms baseline</span>
            <span className="text-xs font-mono text-[#2FBF8F]">-47%</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#10131A] border border-[#2A3040] rounded-lg">
          <div className="flex items-center justify-between text-xs text-[#747E92]">
            <span className="font-semibold text-[#E9ECF3]">Cumulative Layout Shift (CLS)</span>
            <span className="font-mono text-[#2FBF8F] bg-[#2FBF8F]/10 px-1.5 py-0.5 rounded">Good</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#E9ECF3]">0.01</span>
            <span className="text-xs font-mono text-[#747E92] line-through">0.22 baseline</span>
            <span className="text-xs font-mono text-[#2FBF8F]">-95%</span>
          </div>
        </div>
      </div>

      {/* Tier Filter Tabs */}
      <div className="flex items-center justify-between border-b border-[#2A3040] pb-2">
        <div className="flex items-center gap-2">
          {(['all', 'safe', 'moderate', 'guided'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === tab
                  ? 'bg-[#7C6CFF] text-white'
                  : 'text-[#A5AEC0] hover:text-[#E9ECF3] hover:bg-[#161A23]'
              }`}
            >
              {tab.toUpperCase()} ({fixes.filter(f => tab === 'all' || f.tier === tab).length})
            </button>
          ))}
        </div>

        <div className="text-xs text-[#747E92]">
          {appliedCount} of {fixes.length} active
        </div>
      </div>

      {/* Tiered Fixes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFixes.map(fix => (
          <FixCard
            key={fix.id}
            id={fix.id}
            tier={fix.tier}
            title={fix.title}
            description={fix.description}
            impactRange={fix.impactRange}
            risks={fix.risks}
            status={fix.status}
            verificationEvidence={fix.verificationEvidence}
            onPreview={handlePreview}
            onApply={handleApply}
            onRevert={handleRevert}
          />
        ))}
      </div>

      {/* Preview Diff Modal */}
      {selectedFixForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-[#10131A] border border-[#2A3040] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-[#1F2430]">
              <div className="flex items-center gap-3">
                <TierBadge tier={selectedFixForPreview.tier} />
                <h3 className="text-sm font-semibold text-[#E9ECF3]">
                  Preview & Verification: {selectedFixForPreview.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFixForPreview(null)}
                className="text-[#747E92] hover:text-[#E9ECF3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between bg-[#161A23] p-3 rounded-lg border border-[#2A3040] text-xs">
                <div className="space-y-0.5">
                  <div className="text-[#E9ECF3] font-medium">Headless Verification Telemetry</div>
                  <div className="text-[#747E92]">Playwright Chromium isolate • 1280x800 desktop viewport</div>
                </div>
                <div className="flex items-center gap-4 font-mono">
                  <span className="text-[#2FBF8F]">0 JS console errors</span>
                  <span className="text-[#2FBF8F]">Visual diff: 0.12% (&lt; 1.0%)</span>
                </div>
              </div>

              {/* Before/After Comparison Demo */}
              <div className="border border-[#2A3040] rounded-lg overflow-hidden bg-[#0A0C10] p-4 text-center">
                <div className="text-xs text-[#747E92] mb-3">
                  Visual Diff Inspection (Slide to compare Original vs Optimized page render)
                </div>
                <div className="max-w-xl mx-auto">
                  <BeforeAfterSlider
                    beforeSrc="/placeholder-before.svg"
                    afterSrc="/placeholder-after.svg"
                    beforeLabel="Baseline Page"
                    afterLabel="Optimized Page"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-[#1F2430] bg-[#0A0C10]">
              <Button variant="secondary" size="sm" onClick={() => setSelectedFixForPreview(null)}>
                Close Preview
              </Button>
              {selectedFixForPreview.status !== 'applied' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleApply(selectedFixForPreview.id);
                    setSelectedFixForPreview(null);
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Apply This Fix
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
