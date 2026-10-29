'use client';

import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  FileCode,
  ArrowRight
} from 'lucide-react';
import { Button } from '@mimic-manager/ui';

interface SeoGapItem {
  id: string;
  urlPath: string;
  postTitle: string;
  sourceOfTruth: string;
  missingField: 'meta_description' | 'canonical_url' | 'structured_data';
  proposedValue: string;
  status: 'pending' | 'applied';
}

export default function SeoPage() {
  const [items, setItems] = useState<SeoGapItem[]>([
    {
      id: 'seo_01',
      urlPath: '/blog/summer-fashion-guide-2026',
      postTitle: '2026 Sustainable Summer Fashion Guide',
      sourceOfTruth: 'Yoast SEO (_yoast_wpseo_metadesc)',
      missingField: 'meta_description',
      proposedValue: 'Discover sustainable summer fashion trends for 2026 with ethical linen shirts and eco-friendly accessories.',
      status: 'pending'
    },
    {
      id: 'seo_02',
      urlPath: '/products/ceramic-coffee-mug',
      postTitle: 'Handcrafted Blue Ceramic Coffee Mug',
      sourceOfTruth: 'Yoast SEO (_yoast_wpseo_canonical)',
      missingField: 'canonical_url',
      proposedValue: 'https://store.local/products/ceramic-coffee-mug',
      status: 'pending'
    }
  ]);

  const [previewItem, setPreviewItem] = useState<SeoGapItem | null>(null);

  const handleApply = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'applied' } : item))
    );
    setPreviewItem(null);
  };

  const handleRevert = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'pending' } : item))
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1F2430]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E9ECF3]">SEO Engine &amp; Gap Fill</h1>
          <p className="text-xs text-[#A5AEC0] mt-0.5">
            Plugin-aware metadata gap filling. Automatically detects Yoast SEO and writes to native post-meta fields with duplicate schema prevention.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-[#7C6CFF]/15 border border-[#7C6CFF]/30 text-[#7C6CFF]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Managed by Yoast SEO 23.8
          </span>
        </div>
      </div>

      {/* Summary KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-[#10131A] border border-[#2A3040]">
          <span className="text-xs text-[#A5AEC0] block">Meta Descriptions Missing</span>
          <div className="mt-1 flex items-baseline gap-2 font-mono">
            <span className="text-xl font-bold text-[#F5A524]">
              {items.filter((i) => i.missingField === 'meta_description' && i.status === 'pending').length}
            </span>
            <span className="text-xs text-[#747E92]">Detected across 240 posts</span>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-[#10131A] border border-[#2A3040]">
          <span className="text-xs text-[#A5AEC0] block">Duplicate Schema Protection</span>
          <div className="mt-1 flex items-baseline gap-2 font-mono">
            <span className="text-xl font-bold text-[#2FBF8F]">Active</span>
            <span className="text-xs text-[#747E92]">0 Search Console Conflicts</span>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-[#10131A] border border-[#2A3040]">
          <span className="text-xs text-[#A5AEC0] block">Atomic Changelog Logged</span>
          <div className="mt-1 flex items-baseline gap-2 font-mono">
            <span className="text-xl font-bold text-[#E9ECF3]">
              {items.filter((i) => i.status === 'applied').length}
            </span>
            <span className="text-xs text-[#2FBF8F]">1-Click Reversible</span>
          </div>
        </div>
      </div>

      {/* Gap Fill Table */}
      <div className="rounded-lg bg-[#10131A] border border-[#2A3040] overflow-hidden">
        <div className="p-4 border-b border-[#1F2430] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#E9ECF3]">Detected SEO Metadata Gaps</h3>
          <span className="text-xs text-[#747E92]">Single Source of Truth: Native Post Meta</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0A0C10] text-[#747E92] font-mono border-b border-[#1F2430]">
              <tr>
                <th className="p-3">Page / Article</th>
                <th className="p-3">Missing Attribute</th>
                <th className="p-3">Source of Truth Key</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2430] text-[#E9ECF3]">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="p-3">
                    <span className="font-medium text-[#E9ECF3] block">{item.postTitle}</span>
                    <span className="font-mono text-[#747E92] text-[11px]">{item.urlPath}</span>
                  </td>
                  <td className="p-3 font-mono text-[#F5A524]">{item.missingField}</td>
                  <td className="p-3 font-mono text-[#A5AEC0]">{item.sourceOfTruth}</td>
                  <td className="p-3">
                    {item.status === 'applied' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#2FBF8F]/15 border border-[#2FBF8F]/30 text-[#2FBF8F]">
                        <CheckCircle2 className="w-3 h-3" />
                        Applied
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F5A524]/15 border border-[#F5A524]/30 text-[#F5A524]">
                        <AlertTriangle className="w-3 h-3" />
                        Pending Fill
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {item.status === 'applied' ? (
                      <button
                        onClick={() => handleRevert(item.id)}
                        className="inline-flex items-center gap-1 text-xs text-[#A5AEC0] hover:text-white"
                      >
                        <RotateCcw className="w-3 h-3 text-[#F5A524]" />
                        <span>Revert</span>
                      </button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => setPreviewItem(item)}>
                        Review &amp; Apply
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan / Diff Modal Before Apply */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl bg-[#10131A] border border-[#2A3040] shadow-2xl p-6">
            <h3 className="text-base font-bold text-[#E9ECF3] mb-1">
              Plan &amp; Diff: Populate {previewItem.missingField}
            </h3>
            <p className="text-xs text-[#A5AEC0] mb-4">
              Review proposed change before saving to WordPress post-meta. User-authored fields are never overwritten.
            </p>

            <div className="p-3.5 rounded bg-[#0A0C10] border border-[#2A3040] space-y-2 text-xs font-mono mb-4">
              <div className="text-[#747E92]">Target Post: {previewItem.postTitle}</div>
              <div className="text-[#747E92]">Database Key: {previewItem.sourceOfTruth}</div>
              <div className="pt-2 border-t border-[#1F2430]">
                <span className="text-[#F2555A] block">- Previous State: [EMPTY]</span>
                <span className="text-[#2FBF8F] block mt-1">+ Proposed State: "{previewItem.proposedValue}"</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPreviewItem(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => handleApply(previewItem.id)}>
                Confirm &amp; Write to WordPress
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
