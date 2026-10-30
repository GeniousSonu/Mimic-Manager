import React, { useState } from 'react';
import { clsx } from 'clsx';
import { TierBadge, TierLevel } from './TierBadge.js';
import { ChevronDown, ChevronUp, Eye, CheckCircle2, RotateCcw, ShieldAlert } from 'lucide-react';

export interface FixCardProps {
  id: string;
  tier: TierLevel;
  title: string;
  description: string;
  impactRange: string; // e.g. "400ms – 700ms LCP reduction"
  risks?: string[];
  status: 'available' | 'applied' | 'reverted' | 'failed';
  verificationEvidence?: {
    diffScreenshotUrl?: string;
    consoleErrorsCount: number;
    visualDiffPercent: number;
  };
  onPreview: (id: string) => void;
  onApply: (id: string) => void;
  onRevert: (id: string) => void;
}

export function FixCard({
  id,
  tier,
  title,
  description,
  impactRange,
  risks = [],
  status,
  verificationEvidence,
  onPreview,
  onApply,
  onRevert
}: FixCardProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col p-4 rounded-lg border border-[#2A3040] bg-[#10131A] hover:border-[#626D85] transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <TierBadge tier={tier} />
          <h4 className="text-sm font-semibold text-[#E9ECF3]">{title}</h4>
        </div>
        <span className="text-xs font-mono font-medium text-[#2FBF8F] bg-[#2FBF8F]/10 px-2 py-0.5 rounded border border-[#2FBF8F]/20">
          {impactRange}
        </span>
      </div>

      <p className="mt-2 text-xs text-[#A5AEC0] leading-relaxed">{description}</p>

      {/* Expandable Evidence / Risk Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[#1F2430] text-xs space-y-2">
          {risks.length > 0 && (
            <div className="bg-[#F5A524]/10 p-2.5 rounded border border-[#F5A524]/20 text-[#F5A524] space-y-1">
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Known Potential Risks:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-[#E9ECF3]">
                {risks.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>
          )}

          {verificationEvidence && (
            <div className="bg-[#0A0C10] p-2.5 rounded border border-[#1F2430] text-xs font-mono text-[#A5AEC0] space-y-1">
              <div className="text-[#E9ECF3] font-sans font-medium">Automated Verification:</div>
              <div>Runtime JS Errors: {verificationEvidence.consoleErrorsCount} (0 expected)</div>
              <div>Visual Shift Diff: {verificationEvidence.visualDiffPercent.toFixed(2)}% (&lt; 1.0% limit)</div>
            </div>
          )}
        </div>
      )}

      {/* Actions Toolbar */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1F2430]">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-xs text-[#747E92] hover:text-[#E9ECF3]"
        >
          <span>{isExpanded ? 'Hide Details' : 'View Details & Evidence'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPreview(id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#161A23] border border-[#2A3040] text-[#E9ECF3] hover:bg-[#1C212C] text-xs font-medium rounded transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-[#4DA3FF]" />
            <span>Preview Diff</span>
          </button>

          {status === 'applied' ? (
            <button
              onClick={() => onRevert(id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F2555A]/15 border border-[#F2555A]/40 text-[#F2555A] hover:bg-[#F2555A]/25 text-xs font-medium rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Revert</span>
            </button>
          ) : (
            <button
              onClick={() => onApply(id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7C6CFF] text-white hover:bg-[#8F81FF] text-xs font-medium rounded transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply Fix</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
