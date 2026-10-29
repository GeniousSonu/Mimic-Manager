# OptiForge Design QA Checklist & Verification Protocol

**Status:** ACTIVE  
**Owner-persona:** Design QA Lead & Design Systems Auditor  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [DESIGN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN.md), [DESIGN_CRITIQUE_LOG.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN_CRITIQUE_LOG.md), [ACCESSIBILITY.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/ACCESSIBILITY.md)

---

## 1. Automated & Manual Design Quality Gates

Before any screen or component is approved for release, it must pass every item on this checklist:

### 1.1 Pixel Alignment & Tokens
- [ ] Strictly adheres to the **4px base grid** for all spacing and margins.
- [ ] Zero arbitrary color or sizing values in Tailwind or CSS; all use token references.
- [ ] Optical alignment of icons matches baseline typography.
- [ ] Consistent radii: 4px inner, 8px card, 12px modal, 16px sheet.

### 1.2 Contrast & Accessibility
- [ ] Programmatic contrast passes WCAG 2.2 AA (≥ 4.5:1 text, ≥ 3.0:1 borders/focus).
- [ ] Focus ring is visible on all interactive elements (`2px accent`, `2px offset`).
- [ ] Minimum touch target size ≥ 44×44px on mobile viewports.
- [ ] No color-only meaning; all badges include icons and explicit text.

### 1.3 State Completeness
- [ ] Screen renders properly across all 7 standard states: Loading skeleton, Empty, Partial, Populated, Huge dataset (10k items), Error, and Offline.

### 1.4 Trust & Safety Patterns
- [ ] All mutations implement the **Preview → Apply → Undo** triad.
- [ ] Toast notification provides persistent Undo button (≥ 10 seconds).
- [ ] Mutating production sites displays red/amber cautionary environment badge.

---

## 2. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Design Systems Auditor** | APPROVED | Checklist ensures no visual or accessibility regressions escape into PR builds. |
| **QA Lead** | APPROVED | Confirmed checklist items are incorporated into automated Playwright smoke tests. |
