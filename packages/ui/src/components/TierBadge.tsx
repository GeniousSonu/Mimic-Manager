import React from 'react';
import { clsx } from 'clsx';
import { ShieldCheck, AlertTriangle, Info } from 'lucide-react';

export type TierLevel = 'safe' | 'moderate' | 'guided';

export interface TierBadgeProps {
  tier: TierLevel;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps): React.ReactElement {
  const configs = {
    safe: {
      label: 'Safe',
      icon: ShieldCheck,
      classes: 'bg-[#2FBF8F]/15 border-[#2FBF8F]/40 text-[#2FBF8F]'
    },
    moderate: {
      label: 'Moderate',
      icon: AlertTriangle,
      classes: 'bg-[#F5A524]/15 border-[#F5A524]/40 text-[#F5A524]'
    },
    guided: {
      label: 'Guided',
      icon: Info,
      classes: 'bg-[#4DA3FF]/15 border-[#4DA3FF]/40 text-[#4DA3FF]'
    }
  };

  const config = configs[tier];
  const Icon = config.icon;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none',
        config.classes,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
};
