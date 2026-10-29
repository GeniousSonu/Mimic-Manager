'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCheck, RefreshCw, Undo2 } from 'lucide-react';
import { Button, ReviewQueueCard } from '@mimic-manager/ui';

interface QueueItem {
  id: string;
  thumbnailUrl: string;
  filename: string;
  suggestedAlt: string;
  confidence: number;
  provider: string;
  contextText: string;
}

export default function AltTextQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([
    {
      id: 'alt_01',
      thumbnailUrl:
        "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150'%3E%3Crect fill='%231f2430' width='200' height='150'/%3E%3Ctext fill='%237c6cff' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EMug Image%3C/text%3E%3C/svg%3E",
      filename: 'ceramic-coffee-mug-blue.jpg',
      suggestedAlt: 'Handcrafted dark blue ceramic coffee mug with glazed handle on rustic wooden tabletop',
      confidence: 0.94,
      provider: 'Ollama Vision (Llama-3.2)',
      contextText: 'Product Title: Artisan Blue Coffee Mug'
    },
    {
      id: 'alt_02',
      thumbnailUrl:
        "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150'%3E%3Crect fill='%231f2430' width='200' height='150'/%3E%3Ctext fill='%232fbf8f' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EHero Banner%3C/text%3E%3C/svg%3E",
      filename: 'hero-summer-collection.jpg',
      suggestedAlt: 'Two models wearing vibrant linen summer shirts walking along a sunny beach boardwalk',
      confidence: 0.88,
      provider: 'Ollama Vision (Llama-3.2)',
      contextText: 'Article: 2026 Sustainable Summer Fashion Guide'
    }
  ]);

  const [activeIndex, setActiveIndex] = useState(0);

  const handleAccept = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEdit = (id: string, currentAlt: string) => {
    const updated = prompt('Edit Alt-Text:', currentAlt);
    if (updated !== null && updated.trim()) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, suggestedAlt: updated.trim() } : item))
      );
    }
  };

  const handleReject = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleBulkAccept = () => {
    setItems([]);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1F2430]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E9ECF3]">Alt-Text Review Queue</h1>
          <p className="text-xs text-[#A5AEC0] mt-0.5">
            Rapid human triage of AI vision-generated image descriptions. Press <kbd className="font-mono bg-[#161A23] px-1 py-0.5 rounded border border-[#2A3040]">A</kbd> to accept, <kbd className="font-mono bg-[#161A23] px-1 py-0.5 rounded border border-[#2A3040]">E</kbd> to edit, <kbd className="font-mono bg-[#161A23] px-1 py-0.5 rounded border border-[#2A3040]">R</kbd> to reject.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CheckCheck className="w-3.5 h-3.5 text-[#2FBF8F]" />}
              onClick={handleBulkAccept}
            >
              Accept All High Confidence (&gt; 90%)
            </Button>
          )}
        </div>
      </div>

      {/* Queue Items Stack */}
      {items.length === 0 ? (
        <div className="p-12 rounded-lg bg-[#10131A] border border-[#2A3040] flex flex-col items-center text-center space-y-3">
          <Sparkles className="w-8 h-8 text-[#2FBF8F]" />
          <h3 className="text-sm font-semibold text-[#E9ECF3]">Review Queue Clear!</h3>
          <p className="text-xs text-[#747E92] max-w-sm">
            All images in your media library have verified accessible alt-text. Newly uploaded images will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} onClick={() => setActiveIndex(index)}>
              <ReviewQueueCard
                id={item.id}
                thumbnailUrl={item.thumbnailUrl}
                filename={item.filename}
                suggestedAlt={item.suggestedAlt}
                confidence={item.confidence}
                provider={item.provider}
                contextText={item.contextText}
                onAccept={handleAccept}
                onEdit={handleEdit}
                onReject={handleReject}
                isActive={index === activeIndex}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
