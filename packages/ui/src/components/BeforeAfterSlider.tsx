import React, { useState, useRef, useCallback } from 'react';
import { clsx } from 'clsx';

export interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Original',
  afterLabel = 'Optimized',
  className
}: BeforeAfterSliderProps): React.ReactElement {
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100%
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !e.touches[0]) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPosition((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative select-none overflow-hidden rounded-lg border border-[#2A3040] bg-[#0A0C10] shadow-inner',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* Before Image (Background layer) */}
      <img
        src={beforeSrc}
        alt={beforeLabel}
        className="w-full h-auto object-cover pointer-events-none block"
      />

      {/* After Image (Clipped overlay layer) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={afterSrc}
          alt={afterLabel}
          className="w-full h-full object-cover pointer-events-none block"
        />
      </div>

      {/* Badges */}
      <span className="absolute top-3 left-3 bg-[#10131A]/80 backdrop-blur-sm border border-[#2A3040] text-[#E9ECF3] text-xs font-mono px-2 py-0.5 rounded">
        {afterLabel} ({sliderPosition.toFixed(0)}%)
      </span>
      <span className="absolute top-3 right-3 bg-[#10131A]/80 backdrop-blur-sm border border-[#2A3040] text-[#A5AEC0] text-xs font-mono px-2 py-0.5 rounded">
        {beforeLabel}
      </span>

      {/* Draggable Divider Handle */}
      <div
        role="slider"
        aria-label="Image comparison slider"
        aria-valuenow={sliderPosition}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C6CFF]"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-[#2A3040] shadow-md flex items-center justify-center">
          <svg
            className="w-3.5 h-3.5 text-[#0A0C10]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="8 4 4 12 8 20" />
            <polyline points="16 4 20 12 16 20" />
          </svg>
        </div>
      </div>
    </div>
  );
};
