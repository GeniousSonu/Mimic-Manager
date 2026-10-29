# ADR-0013: Strict 4px Spacing Grid and Arbitrary Value Prohibition

- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** Without strict architectural enforcement, UI code accumulates arbitrary pixel values (`p-[13px]`, `margin-top: 17px`, `text-[#e2e2e2]`), causing visual noise, misaligned elements, broken responsive scaling, and design degradation.
- **Decision:**
  1. Spacing and layout across all components are strictly locked to a 4px mathematical grid:
     `0 (0px), 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px), 16 (64px), 20 (80px), 24 (96px)`.
  2. Radii, font sizes, line heights, elevation shadows, and motion timing curves are drawn exclusively from `packages/ui/tokens/tokens.json`.
  3. Automated linting scripts scan source stylesheets and components during CI and fail the build if arbitrary inline hex colors or non-grid pixel spacings are detected without a documented justification comment.
  4. Palette surfaces are strictly enforced: Deep Space (`#0A0A0B`), Graphite (`#161618`), Electric Cyan (`#00E5FF`), and Neon Violet (`#7B61FF`).
- **Alternatives Considered:**
  1. *Unrestricted Tailwind Utility Classes:* Allows arbitrary `p-[...]` and `m-[...]` values that erode design system coherence.
  2. *8px Base Grid Only:* Too coarse for compact high-density data tables and file manager tree nodes.
- **Consequences:**
  - *Positive:* 100% visual harmony, pixel-perfect alignment, and zero design drift.
  - *Negative:* Developers must use predefined token steps rather than arbitrary pixel tweaks.
- **Verification:** Automated linting script fails on intentionally injected arbitrary values (`p-[13px]`, `color: #ff00ea`) and passes on compliant code.
