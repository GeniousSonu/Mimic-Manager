'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Sparkles,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileImage,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Button, ScoreGauge } from '@mimic-manager/ui';

export default function OverviewPage() {
  const [undoToast, setUndoToast] = useState<{ visible: boolean; action: string }>({
    visible: false,
    action: ''
  });

  const handleUndo = (actionName: string) => {
    setUndoToast({ visible: true, action: actionName });
    setTimeout(() => {
      setUndoToast({ visible: false, action: '' });
    }, 10000); // 10s undo window per Addendum A §A3.7
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Undo Toast Notification */}
      {undoToast.visible && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center justify-between gap-4 p-4 rounded-lg bg-[#161A23] border border-[#2FBF8F] text-[#E9ECF3] shadow-2xl animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#2FBF8F]" />
            <span>Reverted "{undoToast.action}" back to original state.</span>
          </div>
          <button
            onClick={() => setUndoToast({ visible: false, action: '' })}
            className="text-xs text-[#A5AEC0] hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Welcome & Primary Action */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#1F2430]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E9ECF3]">Optimization Overview</h1>
          <p className="text-xs text-[#A5AEC0] mt-0.5">
            Production Store (WordPress 6.7, PHP 8.2) &bull; All automated guards active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/media">
            <Button variant="secondary" size="sm" leftIcon={<FileImage className="w-3.5 h-3.5" />}>
              Open Media Library
            </Button>
          </Link>
          <Link href="/speed">
            <Button variant="primary" size="sm" leftIcon={<Zap className="w-3.5 h-3.5" />}>
              Run Full Audit
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Bytes Saved */}
        <div className="p-4 rounded-lg bg-[#10131A] border border-[#2A3040] hover:border-[#626D85] transition-all">
          <div className="flex items-center justify-between text-xs text-[#A5AEC0]">
            <span>Total Bytes Saved</span>
            <TrendingUp className="w-4 h-4 text-[#2FBF8F]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#E9ECF3]">1.42 GB</span>
            <span className="text-xs font-medium text-[#2FBF8F] font-mono">-68%</span>
          </div>
          <p className="mt-1 text-[11px] text-[#747E92]">Across 8,420 media files</p>
        </div>

        {/* Card 2: Mobile PageSpeed Score */}
        <div className="p-4 rounded-lg bg-[#10131A] border border-[#2A3040] hover:border-[#626D85] transition-all">
          <div className="flex items-center justify-between text-xs text-[#A5AEC0]">
            <span>Mobile PageSpeed</span>
            <Zap className="w-4 h-4 text-[#4DA3FF]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#2FBF8F]">94</span>
            <span className="text-xs font-medium text-[#2FBF8F] font-mono">+26 pts</span>
          </div>
          <p className="mt-1 text-[11px] text-[#747E92]">Core Web Vitals passing (LCP 1.4s)</p>
        </div>

        {/* Card 3: SEO Gap Fill */}
        <div className="p-4 rounded-lg bg-[#10131A] border border-[#2A3040] hover:border-[#626D85] transition-all">
          <div className="flex items-center justify-between text-xs text-[#A5AEC0]">
            <span>SEO Meta Gaps</span>
            <Sparkles className="w-4 h-4 text-[#F5A524]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#E9ECF3]">12</span>
            <span className="text-xs font-medium text-[#F5A524] font-mono">Pending</span>
          </div>
          <p className="mt-1 text-[11px] text-[#747E92]">Synced with Yoast post-meta</p>
        </div>

        {/* Card 4: Verification Rate */}
        <div className="p-4 rounded-lg bg-[#10131A] border border-[#2A3040] hover:border-[#626D85] transition-all">
          <div className="flex items-center justify-between text-xs text-[#A5AEC0]">
            <span>Headless Verifications</span>
            <CheckCircle2 className="w-4 h-4 text-[#2FBF8F]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#E9ECF3]">100%</span>
            <span className="text-xs font-medium text-[#2FBF8F] font-mono">0 Breakages</span>
          </div>
          <p className="mt-1 text-[11px] text-[#747E92]">Automatic rollback active</p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Next Best Action & Recent Changes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Best Action Card */}
          <div className="p-5 rounded-lg bg-gradient-to-br from-[#161A23] to-[#10131A] border border-[#7C6CFF]/40 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7C6CFF]">
              <Sparkles className="w-4 h-4" />
              <span>Recommended Next Best Action</span>
            </div>
            <h3 className="mt-2 text-base font-semibold text-[#E9ECF3]">
              Convert 42 uncompressed hero banners to AVIF
            </h3>
            <p className="mt-1 text-xs text-[#A5AEC0] leading-relaxed">
              Large uncompressed JPEG hero images are currently responsible for 72% of total homepage payload. Converting to AVIF will reduce Largest Contentful Paint (LCP) by an estimated 450ms.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Link href="/media">
                <Button variant="primary" size="sm">
                  Run Bulk Batch Now
                </Button>
              </Link>
              <span className="text-xs font-mono text-[#747E92]">Est. duration: ~18s</span>
            </div>
          </div>

          {/* Recent Mutations & Changelog with Undo */}
          <div className="rounded-lg bg-[#10131A] border border-[#2A3040]">
            <div className="p-4 border-b border-[#1F2430] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#E9ECF3]">Recent Optimizations &amp; Changes</h3>
                <p className="text-xs text-[#747E92]">Every mutation is recorded with atomic 1-click restore.</p>
              </div>
              <span className="text-xs font-mono text-[#A5AEC0]">Atomic Rollback Engine</span>
            </div>

            <div className="divide-y divide-[#1F2430]">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#2FBF8F]/10 border border-[#2FBF8F]/20 flex items-center justify-center text-[#2FBF8F]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-[#E9ECF3]">
                      Non-Critical Script Deferral applied
                    </h4>
                    <p className="text-[11px] text-[#747E92]">
                      Lighthouse Mobile Score +6 pts &bull; 0 console errors verified
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUndo('Non-Critical Script Deferral')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#A5AEC0] hover:text-[#E9ECF3] bg-[#161A23] border border-[#2A3040] hover:border-[#626D85] rounded transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#F5A524]" />
                  <span>Undo</span>
                </button>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#7C6CFF]/10 border border-[#7C6CFF]/20 flex items-center justify-center text-[#7C6CFF]">
                    <FileImage className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-[#E9ECF3]">
                      Media batch conversion (128 products)
                    </h4>
                    <p className="text-[11px] text-[#747E92]">
                      WebP &amp; AVIF variants created &bull; Saved 48.2 MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUndo('Media Batch 128')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#A5AEC0] hover:text-[#E9ECF3] bg-[#161A23] border border-[#2A3040] hover:border-[#626D85] rounded transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#F5A524]" />
                  <span>Undo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Score Gauge & Health Status */}
        <div className="space-y-6">
          {/* Lighthouse Score Gauge Card */}
          <div className="p-6 rounded-lg bg-[#10131A] border border-[#2A3040] flex flex-col items-center text-center">
            <h3 className="text-xs font-semibold text-[#A5AEC0] uppercase tracking-wider mb-4">
              Current Mobile Lab Score
            </h3>
            <ScoreGauge score={94} delta={26} size={140} strokeWidth={10} />
            <div className="mt-6 w-full grid grid-cols-2 gap-2 text-left pt-4 border-t border-[#1F2430]">
              <div className="p-2 rounded bg-[#0A0C10] border border-[#1F2430]">
                <span className="text-[10px] text-[#747E92] block">LCP</span>
                <span className="text-xs font-mono font-semibold text-[#2FBF8F]">1.4s</span>
              </div>
              <div className="p-2 rounded bg-[#0A0C10] border border-[#1F2430]">
                <span className="text-[10px] text-[#747E92] block">CLS</span>
                <span className="text-xs font-mono font-semibold text-[#2FBF8F]">0.01</span>
              </div>
              <div className="p-2 rounded bg-[#0A0C10] border border-[#1F2430]">
                <span className="text-[10px] text-[#747E92] block">INP</span>
                <span className="text-xs font-mono font-semibold text-[#2FBF8F]">82ms</span>
              </div>
              <div className="p-2 rounded bg-[#0A0C10] border border-[#1F2430]">
                <span className="text-[10px] text-[#747E92] block">Total Blocking</span>
                <span className="text-xs font-mono font-semibold text-[#2FBF8F]">40ms</span>
              </div>
            </div>
          </div>

          {/* Connected Site Health Summary */}
          <div className="p-4 rounded-lg bg-[#10131A] border border-[#2A3040] space-y-3">
            <h4 className="text-xs font-semibold text-[#E9ECF3]">Connection &amp; Circuit Breaker</h4>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A5AEC0]">State:</span>
              <span className="text-[#2FBF8F] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2FBF8F]" />
                Connected (Healthy)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A5AEC0]">Circuit Breaker:</span>
              <span className="text-[#2FBF8F] font-mono">Closed (0 Failures)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A5AEC0]">Queue Latency:</span>
              <span className="text-[#E9ECF3] font-mono">14ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
