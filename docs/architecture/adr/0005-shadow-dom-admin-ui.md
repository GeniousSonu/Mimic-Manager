# ADR-0005: Shadow DOM Mounting for WordPress Admin UI

**Status:** APPROVED  
**Date:** 2026-10-29  
**Owner-persona:** Lead UI/UX Engineer & WordPress Architect  
**Related-docs:** [WP_ADMIN_INTEGRATION_UX.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/WP_ADMIN_INTEGRATION_UX.md), [WORDPRESS_PLUGIN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/WORDPRESS_PLUGIN.md)

---

## Context
WordPress admin pages frequently suffer from severe CSS collisions. Global WordPress core admin styles, conflicting admin themes, and third-party plugin stylesheets mutate standard HTML elements (`button`, `input`, `table`), destroying modern web application design systems.

---

## Decision
We mount the OptiForge React application inside an isolated **Shadow DOM root** (`attachShadow({ mode: 'open' })`) with design tokens and scoped CSS stylesheets injected directly inside the shadow boundary.

---

## Alternatives Considered
1. **iframe Embedding:** Complete isolation, but introduces complex cross-frame communication, URL routing desynchronization, and broken modal overlays.
2. **Aggressive CSS Reset / BEM Prefixing:** Fragile; cannot prevent third-party plugins using `!important` on generic selectors like `input[type="text"]`.

---

## Consequences
- **Positive:** Total style encapsulation; zero CSS leakage in or out; design system tokens and theme modes (dark/light) render with 100% pixel fidelity.
- **Negative:** Popovers, tooltips, and modals must mount within the shadow container rather than `document.body`.

---

## Verification
Visual regression test in Storybook and WordPress admin mock confirms zero style contamination when paired with aggressive legacy WP admin stylesheets.
