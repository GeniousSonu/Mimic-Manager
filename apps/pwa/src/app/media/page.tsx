'use client';

import React, { useState } from 'react';
import {
  FileImage,
  UploadCloud,
  CheckCircle2,
  Sliders,
  Sparkles,
  Layers,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { Button, BeforeAfterSlider } from '@mimic-manager/ui';

export default function MediaPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [targetFormats, setTargetFormats] = useState<{ webp: boolean; avif: boolean }>({
    webp: true,
    avif: true
  });
  const [quality, setQuality] = useState(82);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1F2430]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E9ECF3]">Media Optimizer</h1>
          <p className="text-xs text-[#A5AEC0] mt-0.5">
            Non-destructive WebP &amp; AVIF conversion with original file preservation and decompression bomb protection.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Sliders className="w-3.5 h-3.5" />}
            onClick={() => {
              setWizardStep(1);
              setIsWizardOpen(true);
            }}
          >
            Launch Bulk Optimization Wizard
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-[#10131A] border border-[#2A3040]">
          <span className="text-xs text-[#A5AEC0] block">Media Library Footprint</span>
          <div className="mt-1 flex items-baseline gap-2 font-mono">
            <span className="text-xl font-bold text-[#E9ECF3]">4.2 GB</span>
            <span className="text-xs text-[#2FBF8F]">&rarr; 1.34 GB Optimized</span>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-[#10131A] border border-[#2A3040]">
          <span className="text-xs text-[#A5AEC0] block">Active Next-Gen Formats</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#2FBF8F]/15 border border-[#2FBF8F]/40 text-[#2FBF8F]">
              WebP Active
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#7C6CFF]/15 border border-[#7C6CFF]/40 text-[#7C6CFF]">
              AVIF Active
            </span>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-[#10131A] border border-[#2A3040]">
          <span className="text-xs text-[#A5AEC0] block">Original Backups</span>
          <div className="mt-1 flex items-baseline gap-2 font-mono">
            <span className="text-xl font-bold text-[#E9ECF3]">100% Retained</span>
            <span className="text-xs text-[#747E92]">wp-content/uploads/orig</span>
          </div>
        </div>
      </div>

      {/* Before / After Quality Live Comparison Slider */}
      <div className="p-5 rounded-lg bg-[#10131A] border border-[#2A3040] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#E9ECF3]">Visual Fidelity &amp; Compression Comparison</h3>
            <p className="text-xs text-[#747E92]">
              Drag the divider or use arrow keys to inspect pixel sharpness between original JPEG (248 KB) and AVIF (42 KB).
            </p>
          </div>
          <span className="text-xs font-mono text-[#2FBF8F] bg-[#2FBF8F]/10 px-2 py-0.5 rounded border border-[#2FBF8F]/20">
            -83% File Size Reduction
          </span>
        </div>

        <div className="max-w-2xl mx-auto py-2">
          <BeforeAfterSlider
            beforeSrc="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect fill='%231f2430' width='800' height='450'/%3E%3Ctext fill='%23e9ecf3' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EOriginal JPEG (248 KB)%3C/text%3E%3C/svg%3E"
            afterSrc="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect fill='%2310131a' width='800' height='450'/%3E%3Ctext fill='%232fbf8f' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EConverted AVIF (42 KB)%3C/text%3E%3C/svg%3E"
            beforeLabel="Original JPEG (248 KB)"
            afterLabel="AVIF (42 KB)"
          />
        </div>
      </div>

      {/* Media Library Items Table */}
      <div className="rounded-lg bg-[#10131A] border border-[#2A3040] overflow-hidden">
        <div className="p-4 border-b border-[#1F2430] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#E9ECF3]">Optimized Media Files</h3>
          <span className="text-xs text-[#747E92]">Showing 4 of 8,420 items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0A0C10] text-[#747E92] font-mono border-b border-[#1F2430]">
              <tr>
                <th className="p-3">Thumbnail / Name</th>
                <th className="p-3">Original Size</th>
                <th className="p-3">Optimized Size</th>
                <th className="p-3">Savings</th>
                <th className="p-3">Formats</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2430] text-[#E9ECF3]">
              <tr>
                <td className="p-3 font-medium flex items-center gap-2.5">
                  <FileImage className="w-4 h-4 text-[#7C6CFF]" />
                  <span>hero-spring-banner.jpg</span>
                </td>
                <td className="p-3 font-mono text-[#A5AEC0]">1.8 MB</td>
                <td className="p-3 font-mono text-[#E9ECF3]">242 KB</td>
                <td className="p-3 font-mono text-[#2FBF8F]">-86%</td>
                <td className="p-3 font-mono text-xs">WebP, AVIF</td>
                <td className="p-3 text-right">
                  <button className="text-xs text-[#A5AEC0] hover:text-white flex items-center gap-1 ml-auto">
                    <RotateCcw className="w-3 h-3 text-[#F5A524]" />
                    <span>Restore</span>
                  </button>
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium flex items-center gap-2.5">
                  <FileImage className="w-4 h-4 text-[#7C6CFF]" />
                  <span>product-ceramic-mug.png</span>
                </td>
                <td className="p-3 font-mono text-[#A5AEC0]">840 KB</td>
                <td className="p-3 font-mono text-[#E9ECF3]">168 KB</td>
                <td className="p-3 font-mono text-[#2FBF8F]">-80%</td>
                <td className="p-3 font-mono text-xs">WebP, AVIF</td>
                <td className="p-3 text-right">
                  <button className="text-xs text-[#A5AEC0] hover:text-white flex items-center gap-1 ml-auto">
                    <RotateCcw className="w-3 h-3 text-[#F5A524]" />
                    <span>Restore</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Optimization Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl bg-[#10131A] border border-[#2A3040] shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2430]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#7C6CFF]">
                <Layers className="w-4 h-4" />
                <span>Bulk Media Optimization Wizard &bull; Step {wizardStep} of 3</span>
              </div>
              <button onClick={() => setIsWizardOpen(false)} className="text-[#747E92] hover:text-white">
                ✕
              </button>
            </div>

            {wizardStep === 1 && (
              <div className="py-4 space-y-4">
                <h3 className="text-sm font-semibold text-[#E9ECF3]">Step 1: Choose Formats &amp; Target Quality</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-md bg-[#0A0C10] border border-[#2A3040] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={targetFormats.webp}
                      onChange={(e) => setTargetFormats({ ...targetFormats, webp: e.target.checked })}
                      className="accent-[#7C6CFF]"
                    />
                    <div>
                      <span className="text-xs font-semibold text-[#E9ECF3] block">Generate WebP Variants</span>
                      <span className="text-[11px] text-[#747E92]">Universal support across 98% of all web browsers.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-md bg-[#0A0C10] border border-[#2A3040] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={targetFormats.avif}
                      onChange={(e) => setTargetFormats({ ...targetFormats, avif: e.target.checked })}
                      className="accent-[#7C6CFF]"
                    />
                    <div>
                      <span className="text-xs font-semibold text-[#E9ECF3] block">Generate AVIF Variants</span>
                      <span className="text-[11px] text-[#747E92]">Next-gen AV1 compression; up to 30% smaller than WebP.</span>
                    </div>
                  </label>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#A5AEC0]">Target Quality Preset:</span>
                    <span className="font-mono text-[#E9ECF3]">{quality}% (Balanced)</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="95"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-[#7C6CFF]"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button variant="primary" size="sm" onClick={() => setWizardStep(2)} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Proceed to Estimation
                  </Button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="py-4 space-y-4">
                <h3 className="text-sm font-semibold text-[#E9ECF3]">Step 2: Workload Estimation</h3>
                <div className="p-4 rounded-md bg-[#0A0C10] border border-[#2A3040] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#A5AEC0]">Images to Process:</span>
                    <span className="font-mono text-[#E9ECF3]">1,840 images</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A5AEC0]">Estimated Disk Savings:</span>
                    <span className="font-mono text-[#2FBF8F]">~420 MB (62%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A5AEC0]">Estimated Duration:</span>
                    <span className="font-mono text-[#E9ECF3]">~45 seconds</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setWizardStep(1)}>
                    Back
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setWizardStep(3)}>
                    Start Optimization
                  </Button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="py-6 flex flex-col items-center text-center space-y-4">
                <CheckCircle2 className="w-10 h-10 text-[#2FBF8F]" />
                <h3 className="text-base font-bold text-[#E9ECF3]">Optimization Dispatched!</h3>
                <p className="text-xs text-[#A5AEC0] max-w-sm">
                  Background worker is generating WebP &amp; AVIF variants using Sharp libvips. Progress is tracked live in the Job Queues tab.
                </p>
                <Button variant="secondary" size="sm" onClick={() => setIsWizardOpen(false)}>
                  Close Wizard
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
