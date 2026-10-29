import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { Check, Edit3, X, Sparkles } from 'lucide-react';

export interface ReviewQueueCardProps {
  id: string;
  thumbnailUrl: string;
  filename: string;
  suggestedAlt: string;
  confidence: number; // 0.0 - 1.0
  provider?: string;
  contextText?: string;
  onAccept: (id: string) => void;
  onEdit: (id: string, newAlt: string) => void;
  onReject: (id: string) => void;
  isActive?: boolean;
}

export const ReviewQueueCard: React.FC<ReviewQueueCardProps> = ({
  id,
  thumbnailUrl,
  filename,
  suggestedAlt,
  confidence,
  provider = 'Ollama Vision',
  contextText,
  onAccept,
  onEdit,
  onReject,
  isActive = false
}) => {
  const percent = Math.round(confidence * 100);

  // Global keyboard shortcuts when card is active: A (Accept), E (Edit), R (Reject)
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        onAccept(id);
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        onEdit(id, suggestedAlt);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onReject(id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, isActive, suggestedAlt, onAccept, onEdit, onReject]);

  return (
    <div
      className={clsx(
        'flex flex-col md:flex-row gap-4 p-4 rounded-lg border bg-[#10131A] transition-all',
        isActive ? 'border-[#7C6CFF] ring-1 ring-[#7C6CFF]' : 'border-[#2A3040] hover:border-[#626D85]'
      )}
    >
      {/* Thumbnail */}
      <div className="w-full md:w-36 h-28 flex-shrink-0 bg-[#0A0C10] rounded border border-[#1F2430] overflow-hidden flex items-center justify-center">
        <img
          src={thumbnailUrl}
          alt={suggestedAlt}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-mono text-[#A5AEC0] truncate">{filename}</span>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#7C6CFF]" />
              <span className="text-[#E9ECF3]">{percent}% confidence</span>
              <span className="text-[#747E92]">({provider})</span>
            </div>
          </div>
          <p className="text-sm font-medium text-[#E9ECF3] bg-[#0A0C10] p-2.5 rounded border border-[#1F2430] italic">
            "{suggestedAlt}"
          </p>
          {contextText && (
            <span className="text-xs text-[#747E92] mt-1.5 block truncate">
              Context: {contextText}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1F2430]">
          <button
            onClick={() => onAccept(id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2FBF8F]/15 border border-[#2FBF8F]/40 text-[#2FBF8F] hover:bg-[#2FBF8F]/25 text-xs font-medium rounded transition-colors"
            title="Accept alt-text (Key: A)"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept [A]</span>
          </button>
          <button
            onClick={() => onEdit(id, suggestedAlt)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#161A23] border border-[#2A3040] text-[#E9ECF3] hover:bg-[#1C212C] text-xs font-medium rounded transition-colors"
            title="Edit alt-text (Key: E)"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit [E]</span>
          </button>
          <button
            onClick={() => onReject(id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F2555A]/15 border border-[#F2555A]/40 text-[#F2555A] hover:bg-[#F2555A]/25 text-xs font-medium rounded transition-colors ml-auto"
            title="Reject alt-text (Key: R)"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reject [R]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
