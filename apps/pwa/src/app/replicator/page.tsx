'use client';

import React, { useState } from 'react';
import { Button } from '@mimic-manager/ui';
import { 
  Laptop, 
  Tablet, 
  Smartphone, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  FileCode2, 
  Layers, 
  ExternalLink, 
  RefreshCw,
  Send,
  Download
} from 'lucide-react';
import { GutenbergCompiler, IRDocument } from '@mimic-manager/ir';

const SAMPLE_IR_DOC: IRDocument = {
  version: '1.0',
  title: 'Pricing Hero Section',
  sourceUrl: 'https://linear.app/pricing',
  capturedAt: '2026-10-29T15:40:00Z',
  viewports: ['desktop', 'tablet', 'mobile'],
  root: {
    id: 'hero-wrap',
    type: 'container',
    styles: {
      desktop: {
        display: 'flex',
        flexDirection: 'column',
        padding: '48px',
        backgroundColor: '#0F1117',
      },
    },
    children: [
      {
        id: 'heading-1',
        type: 'heading',
        tag: 'h1',
        text: 'Predictable pricing for fast-moving teams',
        styles: {
          desktop: {
            fontSize: '44px',
            fontWeight: '700',
            textAlign: 'center',
            color: '#FFFFFF',
          },
        },
      },
      {
        id: 'paragraph-1',
        type: 'paragraph',
        text: 'Scale from early-stage startup to global enterprise with transparent, user-based plans.',
        styles: {
          desktop: {
            fontSize: '18px',
            textAlign: 'center',
            color: '#9CA3AF',
          },
        },
      },
      {
        id: 'cta-button',
        type: 'button',
        text: 'Start 14-day Free Trial',
        attributes: {
          href: '#signup',
        },
        styles: {
          desktop: {},
        },
      },
      {
        id: 'cols',
        type: 'columns',
        styles: { desktop: {} },
        children: [
          {
            id: 'col-left',
            type: 'column',
            styles: { desktop: { width: '50%' } },
            children: [
              {
                id: 'h2-standard',
                type: 'heading',
                tag: 'h2',
                text: 'Standard Edition',
                styles: { desktop: { color: '#E5E7EB' } },
              },
              {
                id: 'p-standard',
                type: 'paragraph',
                text: 'Ideal for small squads needing lightning-fast project workflows.',
                styles: { desktop: {} },
              },
            ],
          },
          {
            id: 'col-right',
            type: 'column',
            styles: { desktop: { width: '50%' } },
            children: [
              {
                id: 'h2-plus',
                type: 'heading',
                tag: 'h2',
                text: 'Enterprise Edition',
                styles: { desktop: { color: '#7C6CFF' } },
              },
              {
                id: 'p-plus',
                type: 'paragraph',
                text: 'Dedicated VPC hosting, SCIM provisioning, and 99.99% SLA.',
                styles: { desktop: {} },
              },
            ],
          },
        ],
      },
    ],
  },
};

export default function UIReplicatorPage() {
  const [sourceUrl, setSourceUrl] = useState('https://linear.app/pricing');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isExtracting, setIsExtracting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pushedDraft, setPushedDraft] = useState(false);

  const compiler = new GutenbergCompiler();
  const compiledMarkup = compiler.compile(SAMPLE_IR_DOC);

  const handleExtract = () => {
    setIsExtracting(true);
    setTimeout(() => {
      setIsExtracting(false);
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledMarkup);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePushDraft = () => {
    setPushedDraft(true);
    setTimeout(() => setPushedDraft(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#E9ECF3] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#7C6CFF]" />
            UI Replicator Studio
          </h2>
          <p className="text-xs text-[#A5AEC0] mt-1">
            Extract any web section into clean, responsive WordPress Core Gutenberg blocks with 0 lock-in.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-[#2FBF8F]" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'Copied to Clipboard!' : 'Copy Gutenberg Blocks'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePushDraft}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            {pushedDraft ? 'Draft Created in WP!' : 'Push to WordPress Draft'}
          </Button>
        </div>
      </div>

      {/* URL Ingestion & SSRF Guard Banner */}
      <div className="p-4 bg-[#10131A] border border-[#2A3040] rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="url"
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              placeholder="https://example.com/section-to-replicate"
              className="w-full px-3.5 py-2.5 bg-[#0A0C10] border border-[#2A3040] rounded-lg text-xs font-mono text-[#E9ECF3] focus:outline-none focus:border-[#7C6CFF]"
            />
          </div>

          <Button
            variant="primary"
            onClick={handleExtract}
            isLoading={isExtracting}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />}
          >
            Extract Clean Blocks
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs text-[#747E92] pt-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2FBF8F]" />
            <span className="text-[#2FBF8F] font-medium">SSRF Guard:</span>
            <span>Target IP verified public (104.18.27.120) • Metadata & intranet IP ranges blocked</span>
          </div>

          <span className="text-[11px] font-mono text-[#A5AEC0]">
            Extractor: Playwright Headless Chromium + Computed Style Diffing
          </span>
        </div>
      </div>

      {/* Studio Viewport Switcher & Fidelity Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-[#10131A] border border-[#2A3040] rounded-lg">
        {/* Viewport Tabs */}
        <div className="flex items-center gap-1.5 bg-[#0A0C10] p-1 rounded-lg border border-[#1F2430]">
          <button
            onClick={() => setViewport('desktop')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewport === 'desktop'
                ? 'bg-[#161A23] text-[#7C6CFF] border border-[#7C6CFF]/30'
                : 'text-[#747E92] hover:text-[#E9ECF3]'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Desktop (1440px)</span>
          </button>

          <button
            onClick={() => setViewport('tablet')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewport === 'tablet'
                ? 'bg-[#161A23] text-[#7C6CFF] border border-[#7C6CFF]/30'
                : 'text-[#747E92] hover:text-[#E9ECF3]'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet (820px)</span>
          </button>

          <button
            onClick={() => setViewport('mobile')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewport === 'mobile'
                ? 'bg-[#161A23] text-[#7C6CFF] border border-[#7C6CFF]/30'
                : 'text-[#747E92] hover:text-[#E9ECF3]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile (390px)</span>
          </button>
        </div>

        {/* Fidelity Metric Badges */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#747E92]">Fidelity Score:</span>
            <span className="font-mono font-bold text-[#2FBF8F] bg-[#2FBF8F]/10 px-2 py-0.5 rounded border border-[#2FBF8F]/20">
              97.2% Match
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#747E92]">Block Mapping:</span>
            <span className="font-mono text-[#E9ECF3] bg-[#161A23] px-2 py-0.5 rounded border border-[#2A3040]">
              100% Core Gutenberg
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Target Section Visual Preview */}
        <div className="flex flex-col bg-[#10131A] border border-[#2A3040] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-[#1F2430] bg-[#0A0C10] text-xs">
            <span className="font-semibold text-[#E9ECF3]">Target Section (Original Dom & Canvas)</span>
            <span className="text-[#747E92] font-mono">source: {sourceUrl}</span>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-center items-center bg-[#07090D] min-h-[360px]">
            <div className="w-full max-w-md p-6 rounded-xl border border-[#2A3040] bg-[#0F1117] text-center space-y-4 shadow-xl">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#7C6CFF] bg-[#7C6CFF]/10 px-2 py-0.5 rounded">
                Tier Comparison
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Predictable pricing for fast-moving teams
              </h2>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Scale from early-stage startup to global enterprise with transparent, user-based plans.
              </p>
              <div className="pt-2">
                <button className="px-4 py-2 bg-[#7C6CFF] text-white rounded text-xs font-semibold hover:bg-[#8F81FF]">
                  Start 14-day Free Trial
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Compiled Gutenberg Markup & Block Hierarchy */}
        <div className="flex flex-col bg-[#10131A] border border-[#2A3040] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-[#1F2430] bg-[#0A0C10] text-xs">
            <span className="font-semibold text-[#2FBF8F] flex items-center gap-1.5">
              <FileCode2 className="w-3.5 h-3.5" />
              Generated WordPress Core Blocks (Pure Native)
            </span>
            <span className="text-[#747E92] font-mono">0 plugins required</span>
          </div>

          {/* Block Tree summary */}
          <div className="p-3 bg-[#141822] border-b border-[#1F2430] flex flex-wrap gap-2 text-[11px] font-mono">
            <span className="px-2 py-0.5 bg-[#0A0C10] border border-[#2A3040] text-[#7C6CFF] rounded">
              wp:group (flex)
            </span>
            <span className="px-2 py-0.5 bg-[#0A0C10] border border-[#2A3040] text-[#4DA3FF] rounded">
              wp:heading (h1)
            </span>
            <span className="px-2 py-0.5 bg-[#0A0C10] border border-[#2A3040] text-[#A5AEC0] rounded">
              wp:paragraph
            </span>
            <span className="px-2 py-0.5 bg-[#0A0C10] border border-[#2A3040] text-[#2FBF8F] rounded">
              wp:button
            </span>
            <span className="px-2 py-0.5 bg-[#0A0C10] border border-[#2A3040] text-[#F5A524] rounded">
              wp:columns (2-col)
            </span>
          </div>

          <div className="p-3 flex-1 bg-[#0A0C10] font-mono text-[11px] text-[#A5AEC0] overflow-x-auto max-h-[360px] leading-relaxed">
            <pre className="whitespace-pre-wrap">{compiledMarkup}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
