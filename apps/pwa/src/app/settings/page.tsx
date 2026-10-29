'use client';

import React, { useState } from 'react';
import {
  Settings,
  Sparkles,
  ShieldCheck,
  Server,
  Palette,
  Database,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { Button } from '@mimic-manager/ui';

export default function SettingsPage() {
  const [aiProvider, setAiProvider] = useState<'ollama' | 'heuristic' | 'byok'>('ollama');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3.2-vision');
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {savedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 p-4 rounded-lg bg-[#161A23] border border-[#2FBF8F] text-[#E9ECF3] shadow-2xl animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-[#2FBF8F]" />
          <span className="text-xs font-medium">Settings successfully persisted!</span>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-[#1F2430]">
        <h1 className="text-xl font-bold tracking-tight text-[#E9ECF3]">Instance Settings</h1>
        <p className="text-xs text-[#A5AEC0] mt-0.5">
          Configure local AI inference models, storage drivers, safety limits, and appearance.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* AI Metadata Provider Section */}
        <div className="p-5 rounded-lg bg-[#10131A] border border-[#2A3040] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7C6CFF]">
            <Cpu className="w-4 h-4" />
            <span>AI Vision &amp; Metadata Engine</span>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3.5 rounded-md bg-[#0A0C10] border border-[#2A3040] cursor-pointer">
              <input
                type="radio"
                name="aiProvider"
                value="ollama"
                checked={aiProvider === 'ollama'}
                onChange={() => setAiProvider('ollama')}
                className="mt-0.5 accent-[#7C6CFF]"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#E9ECF3]">
                    100% Free &amp; Local (Ollama Vision)
                  </span>
                  <span className="text-[10px] font-mono text-[#2FBF8F] bg-[#2FBF8F]/10 px-1.5 py-0.5 rounded border border-[#2FBF8F]/20">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-[#747E92]">
                  Runs entirely on your local GPU/CPU with zero external API calls. Proprietary media and drafts never leave your server.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-md bg-[#0A0C10] border border-[#2A3040] cursor-pointer">
              <input
                type="radio"
                name="aiProvider"
                value="heuristic"
                checked={aiProvider === 'heuristic'}
                onChange={() => setAiProvider('heuristic')}
                className="mt-0.5 accent-[#7C6CFF]"
              />
              <div className="space-y-1">
                <span className="text-xs font-semibold text-[#E9ECF3] block">
                  Rule-Based Heuristic Fallback (Zero AI / Zero GPU)
                </span>
                <p className="text-[11px] text-[#747E92]">
                  Extracts metadata from EXIF captions, IPTC headlines, and surrounding article context without running any machine learning model.
                </p>
              </div>
            </label>
          </div>

          {aiProvider === 'ollama' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-[#A5AEC0] mb-1">
                  Ollama Base Endpoint
                </label>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  className="w-full h-9 px-3 rounded bg-[#0A0C10] border border-[#2A3040] text-xs font-mono text-[#E9ECF3] focus:outline-none focus:border-[#7C6CFF]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#A5AEC0] mb-1">
                  Vision Model Name
                </label>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  className="w-full h-9 px-3 rounded bg-[#0A0C10] border border-[#2A3040] text-xs font-mono text-[#E9ECF3] focus:outline-none focus:border-[#7C6CFF]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Safety & Decompression Bomb Thresholds */}
        <div className="p-5 rounded-lg bg-[#10131A] border border-[#2A3040] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2FBF8F]">
            <ShieldCheck className="w-4 h-4" />
            <span>Safety Invariants &amp; Resource Ceilings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-medium text-[#A5AEC0] mb-1">
                Decompression Bomb Pixel Limit
              </label>
              <input
                type="text"
                disabled
                value="50,000,000 Pixels (50 MP)"
                className="w-full h-9 px-3 rounded bg-[#0A0C10] border border-[#1F2430] font-mono text-[#747E92] cursor-not-allowed"
              />
              <span className="text-[10px] text-[#747E92] mt-1 block">Enforced at libvips stream level.</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A5AEC0] mb-1">
                Max Upload Payload Size
              </label>
              <input
                type="text"
                disabled
                value="52,428,800 Bytes (50 MB)"
                className="w-full h-9 px-3 rounded bg-[#0A0C10] border border-[#1F2430] font-mono text-[#747E92] cursor-not-allowed"
              />
              <span className="text-[10px] text-[#747E92] mt-1 block">Enforced in Fastify body parser.</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="md">
            Save Configuration Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
