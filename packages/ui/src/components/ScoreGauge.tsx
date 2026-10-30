import React from 'react';
import { clsx } from 'clsx';

export interface ScoreGaugeProps {
  score: number; // 0 - 100
  label?: string;
  delta?: number;
  size?: number; // diameter in px
  strokeWidth?: number;
  className?: string;
}

export function ScoreGauge({
  score,
  label = 'Performance',
  delta,
  size = 120,
  strokeWidth = 8,
  className
}: ScoreGaugeProps): React.ReactElement {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;

  let color = '#F2555A'; // Red: 0-49
  let labelColor = 'text-[#F2555A]';
  if (clampedScore >= 90) {
    color = '#2FBF8F'; // Green: 90-100
    labelColor = 'text-[#2FBF8F]';
  } else if (clampedScore >= 50) {
    color = '#F5A524'; // Amber: 50-89
    labelColor = 'text-[#F5A524]';
  }

  return (
    <div
      className={clsx('flex flex-col items-center justify-center select-none', className)}
      role="progressbar"
      aria-valuenow={clampedScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label} Score: ${clampedScore} out of 100`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1F2430"
            strokeWidth={strokeWidth}
          />
          {/* Animated Value Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center Score Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold font-mono tracking-tight text-[#E9ECF3]">
            {clampedScore}
          </span>
          {delta !== undefined && (
            <span
              className={clsx(
                'text-xs font-mono font-medium',
                delta > 0 ? 'text-[#2FBF8F]' : delta < 0 ? 'text-[#F2555A]' : 'text-[#A5AEC0]'
              )}
            >
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span className="mt-2 text-xs font-medium text-[#A5AEC0] tracking-wide uppercase">
          {label}
        </span>
      )}
    </div>
  );
};
