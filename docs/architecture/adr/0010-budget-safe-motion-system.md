# ADR-0010: Budget-Safe Motion System and Perceived Route Timing

- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** Animation in high-density professional web applications can easily cause performance degradation, bundle bloat, long tasks (> 50ms), and input latency. Heavy animation libraries often exceed 100 KB gzipped and block user interactions when using exiting transition modes (`mode="wait"`). Furthermore, accessibility mandates that users with vestibular disorders or `prefers-reduced-motion` must receive zero jarring motion.
- **Decision:**
  1. Motion is governed by strict tokens defined in `TOKENS.md` and `MOTION.md`: fast (90ms), base (140ms), slow (220ms), with `cubic-bezier(0.2, 0, 0, 1)` easing.
  2. Animations are strictly restricted to GPU-composited properties (`transform` and `opacity`). Animating layout properties (`width`, `height`, `margin`, `padding`, `top`, `left`) is strictly prohibited.
  3. Route and view transitions cross-fade with a subtle 10px upward offset over ≤ 140ms. The incoming view renders immediately without waiting for old content to exit; user clicks and keyboard navigation are never blocked.
  4. Animations are completely disabled during virtualized 10,000-row data grid scrolling and drag-and-drop operations.
  5. The motion system respects `prefers-reduced-motion: reduce` and provides an in-app "Reduce motion" override in Settings → Appearance. Under reduced motion, all position translations are eliminated and transitions are limited to subtle opacity changes (≤ 120ms).
- **Alternatives Considered:**
  1. *Full Framer Motion with Exit Blocking (`mode="wait"`):* Increases perceived transition latency past the 100ms threshold and adds unnecessary bundle weight.
  2. *Unconstrained CSS Animations:* Leads to ad-hoc durations, timing curves, and layout shifts (CLS).
- **Consequences:**
  - *Positive:* Snappy native software feel (< 100ms perceived route transition); zero long tasks (> 50ms); 100% WCAG 2.2 AA motion compliance; bundle budget preserved (< 250 KB gz).
  - *Negative:* Animations are subtle and restrained rather than cinematic or decorative.
- **Verification:** Playwright performance trace confirms zero long tasks > 50ms caused by route animations, and headless Chrome verification under reduced motion verifies zero translation transforms.
