/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

import React from 'react';
import { clsx } from 'clsx';

export interface AnimatedLogoProps {
  size?: number | string;
  className?: string;
  animated?: boolean;
  interactive?: boolean;
  withGlow?: boolean;
}

export function AnimatedLogo({
  size = 32,
  className,
  animated = true,
  interactive = true,
  withGlow = true,
}: AnimatedLogoProps): React.ReactElement {
  return (
    <div
      className={clsx(
        'relative inline-flex items-center justify-center select-none group',
        interactive && 'cursor-pointer',
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* Ambient Gold Glow Halo */}
      {withGlow && (
        <div
          className={clsx(
            'absolute inset-0 rounded-full blur-xl pointer-events-none transition-all duration-700',
            animated && 'animate-pulse',
            'bg-gradient-to-tr from-[#FF9A00]/20 via-[#FFB000]/30 to-[#FFF16B]/20',
            'group-hover:scale-125 group-hover:from-[#FF9A00]/40 group-hover:to-[#FFF16B]/40'
          )}
        />
      )}

      {/* SVG Icon Artwork with CSS Micro-Animations */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1024 1024"
        fill="none"
        className="w-full h-full relative z-10 drop-shadow-[0_4px_12px_rgba(255,176,0,0.2)] transition-transform duration-500 group-hover:scale-105"
      >
        <title>Mimic Manager</title>
        <defs>
          <linearGradient id="mmTopFace" x1="220" y1="170" x2="800" y2="550" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF16B" />
            <stop offset=".22" stopColor="#FFC928" />
            <stop offset=".52" stopColor="#FFB000" />
            <stop offset=".78" stopColor="#FF8A00" />
            <stop offset="1" stopColor="#E96800" />
          </linearGradient>
          <linearGradient id="mmTopSide" x1="250" y1="365" x2="760" y2="570" gradientUnits="userSpaceOnUse">
            <stop stopColor="#B95800" />
            <stop offset=".28" stopColor="#FFB51B" />
            <stop offset=".55" stopColor="#F17B00" />
            <stop offset=".78" stopColor="#C75B00" />
            <stop offset="1" stopColor="#8B3500" />
          </linearGradient>
          <linearGradient id="mmMidFace" x1="180" y1="450" x2="830" y2="710" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFB51B" />
            <stop offset=".3" stopColor="#FF9A00" />
            <stop offset=".62" stopColor="#FF8200" />
            <stop offset="1" stopColor="#D95B00" />
          </linearGradient>
          <linearGradient id="mmMidSide" x1="240" y1="625" x2="760" y2="790" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A84900" />
            <stop offset=".3" stopColor="#F88A00" />
            <stop offset=".58" stopColor="#D96700" />
            <stop offset="1" stopColor="#793000" />
          </linearGradient>
          <linearGradient id="mmBaseFace" x1="190" y1="620" x2="820" y2="900" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D96500" />
            <stop offset=".28" stopColor="#FF8700" />
            <stop offset=".58" stopColor="#D85A00" />
            <stop offset="1" stopColor="#873400" />
          </linearGradient>
          <linearGradient id="mmGlass" x1="365" y1="315" x2="670" y2="680" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF7D8" stopOpacity=".76" />
            <stop offset=".32" stopColor="#FFD994" stopOpacity=".42" />
            <stop offset=".68" stopColor="#FFB54A" stopOpacity=".18" />
            <stop offset="1" stopColor="#7A3900" stopOpacity=".28" />
          </linearGradient>
          <linearGradient id="mmGlassEdge" x1="360" y1="300" x2="650" y2="710" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFCE8" stopOpacity=".96" />
            <stop offset=".45" stopColor="#FFD87B" stopOpacity=".75" />
            <stop offset="1" stopColor="#FF8B00" stopOpacity=".48" />
          </linearGradient>
          <linearGradient id="mmInnerDark" x1="350" y1="270" x2="690" y2="560" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8C3C00" />
            <stop offset=".5" stopColor="#4C2100" />
            <stop offset="1" stopColor="#A84A00" />
          </linearGradient>
          <radialGradient id="mmSpark" cx="0" cy="0" r="1" gradientTransform="translate(-2 -3) rotate(60) scale(7)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFDE3" />
            <stop offset=".36" stopColor="#FFE96A" />
            <stop offset="1" stopColor="#FF9A00" />
          </radialGradient>
          <filter id="mmShadow" x="80" y="100" width="864" height="850" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="17" />
          </filter>
          <filter id="mmGlow" x="0" y="0" width="1024" height="1024" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Soft grounding shadow */}
        <g className={clsx(animated && 'transition-all duration-700 ease-in-out', 'group-hover:scale-95 group-hover:opacity-30')}>
          <path d="M174 710 512 520 850 710 512 914Z" fill="#1C0B00" opacity=".46" filter="url(#mmShadow)" />
        </g>

        {/* Base Frame */}
        <g className="transition-transform duration-500 ease-out group-hover:translate-y-2">
          <path d="M512 621 838 805Q855 815 838 829L538 1000Q512 1015 486 1000L186 829Q169 815 186 805Z" fill="#6C2A00" opacity=".82" />
          <path d="M512 584 838 768Q855 778 838 792L538 963Q512 978 486 963L186 792Q169 778 186 768Z" fill="url(#mmBaseFace)" stroke="#FF9A20" strokeWidth="3" />
          <path d="M512 635 765 778 512 923 259 778Z" fill="#311400" stroke="#A64B00" strokeWidth="3" />
          <path d="M512 648 746 780 512 913 278 780Z" fill="#180B03" opacity=".84" />
          <path d="M512 584 838 768Q855 778 838 792L538 963Q512 978 486 963L186 792Q169 778 186 768Z" stroke="#FFB04A" strokeOpacity=".58" strokeWidth="2" />
        </g>

        {/* Middle Frame */}
        <g className="transition-transform duration-500 ease-out group-hover:translate-y-0">
          <path d="M512 432 837 616Q856 627 837 641L538 812Q512 827 486 812L187 641Q168 627 187 616Z" fill="#793000" />
          <path d="M512 394 837 578Q856 589 837 603L538 774Q512 789 486 774L187 603Q168 589 187 578Z" fill="url(#mmMidFace)" stroke="#FFB13A" strokeWidth="3" />
          <path d="M512 448 759 588 512 728 265 588Z" fill="url(#mmInnerDark)" stroke="#C35B00" strokeWidth="3" />
          <path d="M512 465 733 590 512 715 291 590Z" fill="#241000" opacity=".9" />
          <path d="M512 394 837 578Q856 589 837 603L538 774Q512 789 486 774L187 603Q168 589 187 578Z" stroke="#FFC15A" strokeOpacity=".7" strokeWidth="2" />
        </g>

        {/* Translucent Glass Core */}
        <g className="transition-all duration-700 ease-out group-hover:opacity-90">
          <path d="M512 234 837 418Q856 429 837 443L538 614Q512 629 486 614L187 443Q168 429 187 418Z" fill="url(#mmTopSide)" stroke="#A64A00" strokeWidth="2" />
          <path d="M512 284 774 433 512 582 250 433Z" fill="#3C1A00" opacity=".94" />
          <path d="M512 300 747 434 512 568 277 434Z" fill="#1E0D00" opacity=".94" />

          <path d="M365 300Q365 287 378 280L497 213Q512 205 527 213L646 280Q659 287 659 300V565Q659 579 646 587L527 655Q512 664 497 655L378 587Q365 579 365 565Z" fill="url(#mmGlass)" stroke="url(#mmGlassEdge)" strokeWidth="3" />
          <path d="M365 300 512 385 659 300 659 565Q659 579 646 587L527 655Q512 664 497 655L378 587Q365 579 365 565Z" fill="#FFC45A" fillOpacity=".12" />
          <path d="M365 300 512 385 659 300M365 300 365 565M659 300 659 565" stroke="#FFF3C9" strokeOpacity=".72" strokeWidth="2.5" />
          <path d="M378 587 512 510 646 587M512 385V510" stroke="#FFE4A1" strokeOpacity=".48" strokeWidth="2" />
          <path d="M384 307 512 233 640 307" stroke="#FFFFFF" strokeOpacity=".55" strokeWidth="2" />
        </g>

        {/* Top Gold Frame (Floats upward on hover) */}
        <g className={clsx('transition-transform duration-500 ease-out group-hover:-translate-y-4', animated && 'motion-safe:animate-bounce-subtle')}>
          <path d="M501 137Q512 131 523 137L839 316Q860 328 839 350L535 523Q512 536 489 523L185 350Q164 338 185 316ZM512 198 271 335 512 472 753 335Z" fill="url(#mmTopFace)" fillRule="evenodd" stroke="#FFC84A" strokeWidth="3" strokeLinejoin="round" />
          <path d="M185 316 489 489Q512 502 535 489L839 316 839 350Q860 362 839 374L535 547Q512 560 489 547L185 374Q164 362 185 350Z" fill="url(#mmTopSide)" stroke="#E67A00" strokeWidth="2" />
          <path d="M185 316 489 489Q512 502 535 489L839 316" stroke="#FFF17C" strokeWidth="5" strokeLinecap="round" opacity=".94" />
          <path d="M271 335 512 472 753 335" stroke="#FFDF65" strokeWidth="3" strokeLinecap="round" opacity=".78" />
        </g>

        {/* Sparkling Diamond Glints */}
        <g filter="url(#mmGlow)" className={clsx(animated && 'animate-pulse transition-opacity duration-300', 'group-hover:opacity-100')}>
          <circle cx="412" cy="310" r="5" fill="url(#mmSpark)" />
          <circle cx="612" cy="310" r="5" fill="url(#mmSpark)" />
          <circle cx="512" cy="385" r="7" fill="url(#mmSpark)" />
          <circle cx="440" cy="500" r="4.5" fill="url(#mmSpark)" />
          <circle cx="584" cy="500" r="4.5" fill="url(#mmSpark)" />
          <circle cx="512" cy="602" r="5" fill="url(#mmSpark)" />
        </g>
        <g fill="none" strokeLinecap="round">
          <path d="M188 317Q174 329 190 340" stroke="#FFF27D" strokeWidth="3" opacity=".9" />
          <path d="M836 317Q850 329 834 340" stroke="#FF9E17" strokeWidth="3" opacity=".9" />
          <path d="M188 578Q174 590 190 601" stroke="#FFB343" strokeWidth="2.5" opacity=".7" />
          <path d="M836 578Q850 590 834 601" stroke="#FF8A12" strokeWidth="2.5" opacity=".7" />
        </g>
      </svg>
    </div>
  );
};

AnimatedLogo.displayName = 'AnimatedLogo';
