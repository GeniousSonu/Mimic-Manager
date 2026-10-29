# OptiForge Design Principles

**Status:** ACTIVE  
**Owner-persona:** Design Director & Principal UI/UX Architect  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [DESIGN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN.md), [UX_SPEC.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/UX_SPEC.md), [COMPONENTS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/COMPONENTS.md)

---

## 1. Core Principles

The design of OptiForge reflects professional craft on par with Linear, Vercel, and Raycast. Every screen, component, and interaction is governed by eight foundational principles:

### 1. Calm Confidence
- **Rule:** Dark-first, restrained, high signal-to-noise ratio. Zero decorative gradients or distracting banner animations.
- **DO:** Use subtle 1px border contrasts (`#2A3040`) and soft inner highlights (`inset 0 1px 0 rgba(255,255,255,0.04)`) to separate surfaces.
- **DON'T:** Use gaudy neon gradients, rainbow badges, or unnecessary pulsing lights.

### 2. Show, Don't Claim
- **Rule:** Provide concrete evidence, before/after comparisons, and visual diffs rather than marketing adjectives.
- **DO:** Display a split BeforeAfterSlider showing the 240KB JPEG alongside the 48KB AVIF with exact byte savings.
- **DON'T:** Show a badge saying "Blazing Fast Optimization" without metrics.

### 3. Safe by Default, Powerful on Demand
- **Rule:** Every potentially breaking or destructive operation requires the **Preview → Apply → Undo** triad.
- **DO:** Show a live preview modal demonstrating exact CSS and script changes, followed by a persistent 10-second Undo toast.
- **DON'T:** Apply non-critical script deferral directly to production without a preview or rollback mechanism.

### 4. One Primary Action Per View
- **Rule:** Every screen must feature exactly one prominent, unmistakably styled primary action button.
- **DO:** Make "Run Full Audit" the sole primary button on the Speed dashboard; secondary filters are ghost or outline buttons.
- **DON'T:** Place three competing saturated purple buttons next to each other.

### 5. Progressive Disclosure
- **Rule:** Casual site owners see high-level summary cards; power users can expand to inspect granular AST diffs and raw logs.
- **DO:** Show "Speed Score: 92 (+14)" with an expandable "Inspect 6 Applied Fixes" drawer.
- **DON'T:** Overwhelm the user with 50 raw HTTP timing breakdown rows by default.

### 6. Instant Feel
- **Rule:** Sub-100ms response to user input; optimistic UI state updates accompanied by purposeful skeleton loading states.
- **DO:** Update toggle switches and checkbox states immediately while syncing asynchronously in the background.
- **DON'T:** Lock the UI with a full-screen loading spinner while waiting for a network roundtrip.

### 7. Honest Numbers
- **Rule:** Display confidence intervals and measured ranges; never make false guarantees like "100% Guaranteed Score".
- **DO:** Show "Estimated LCP reduction: 400ms – 700ms (High Confidence)".
- **DON'T:** Claim "Guaranteed 100/100 PageSpeed Score".

### 8. Accessible & Keyboard-First by Construction
- **Rule:** Every feature is fully operable via keyboard shortcuts (`⌘K`, `A/E/R`, `Esc`, `Tab`) and exceeds WCAG 2.2 AA standards.
- **DO:** Ensure visible 2px focus rings (`#7C6CFF`) with 2px offset on all interactive elements.
- **DON'T:** Suppress focus outlines (`outline: none`) without an explicit focus-visible replacement.

---

## 2. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Design Director** | APPROVED | Confirmed concrete Do/Don't pairings align with Raycast/Linear pro-tool aesthetic. |
| **Accessibility Specialist** | APPROVED | Validated keyboard-first focus guarantees and WCAG 2.2 AA compliance rules. |
