# Mimic Manager Performance Fix Registry

**Status:** ACTIVE  
**Owner-persona:** Lead Web Performance Engineer & Security Auditor  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [FIX_AUTHORING_GUIDE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/FIX_AUTHORING_GUIDE.md), [ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md), [USER_STORIES.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/USER_STORIES.md)

---

## 1. Overview & Tier Definitions

Mimic Manager organizes all performance fixes into three tiers:
- **Safe Tier (Green):** Non-breaking changes that can be applied with zero risk of breaking JavaScript runtime or layout (e.g. DNS preconnect, image dimensions, font-display swap).
- **Moderate Tier (Yellow):** Behavioral optimizations that delay or reorder non-critical assets (e.g. defer non-critical JS, lazy load below-the-fold iframes). Requires automated headless verification before committing.
- **Guided Tier (Blue):** Structural modifications (e.g. CSS critical extraction, removing unused scripts) requiring human review and explicit administrator confirmation.

---

## 2. Complete Fix Registry Table

| Fix ID | Tier | Title & What It Changes | Detection Logic | Verification Method | Revert Method | Conflicts | Lighthouse Audits |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `FIX-PERF-001` | Safe | **DNS Preconnect / Prefetch for Third-Party CDNs**<br>Injects `<link rel="preconnect">` for discovered domains. | Scans rendered HTML for third-party scripts/fonts (`fonts.googleapis.com`, `cdn.jsdelivr.net`). | Playwright checks header presence; zero JS error check. | Removes injected `<link>` tags from HTML head filter. | Perfmatters preconnect. | `uses-rel-preconnect` |
| `FIX-PERF-002` | Safe | **Missing Image Width / Height Attributes**<br>Appends missing `width` and `height` to prevent CLS. | Parses `<img>` tags lacking explicit dimensions; inspects attachment metadata. | Playwright verifies CLS score delta ≤ 0.00; checks layout. | Restores original `<img>` markup from changelog. | Autoptimize image resize. | `unsized-images`, `cumulative-layout-shift` |
| `FIX-PERF-003` | Safe | **Font-Display Swap**<br>Adds `font-display: swap` to local `@font-face` blocks. | Greps active theme and child CSS for `@font-face` without `font-display`. | Playwright verifies zero FOIT; checks text visibility. | Replaces CSS snippet with original definition. | OMGF / Local Google Fonts. | `font-display` |
| `FIX-PERF-004` | Moderate | **Non-Critical Script Deferral**<br>Adds `defer` attribute to non-essential scripts. | Identifies enqueued scripts not on the jQuery/core whitelist. | Headless Playwright run: checks console for runtime errors + pixel diff. | Strips `defer` attribute from enqueued handles. | WP Rocket delay JS, NitroPack. | `render-blocking-resources` |
| `FIX-PERF-005` | Moderate | **Lazy Load Below-the-Fold Iframes**<br>Appends `loading="lazy"` to YouTube and Maps iframes. | Scans post content for `<iframe>` without native lazy attribute. | Playwright scrolls page; verifies iframe loads on scroll. | Removes `loading="lazy"` attribute. | Native WP embed filters. | `offscreen-images` |
| `FIX-PERF-006` | Guided | **Critical CSS Inlining**<br>Extracts above-the-fold CSS and defers the main stylesheet. | Audits viewport styles via Playwright coverage API. | Pixel-by-pixel diff test; auto-revert if delta > 1.0%. | Restores standard render-blocking `<link rel="stylesheet">`. | Autoptimize inline CSS. | `render-blocking-resources`, `largest-contentful-paint` |

---

## 3. Verification & Auto-Revert Rules

Prior to marking any Moderate or Guided fix as active:
1. The worker spins up an isolated Chromium instance and renders the page with the proposed fix injected.
2. If any of the following triggers occur, the fix is **automatically reverted** and flagged in the changelog:
   - Any uncaught JavaScript runtime error or console error.
   - Layout visual diff exceeding **1.0%** threshold compared to the baseline screenshot.
   - Any HTTP 4xx or 5xx response code on critical asset requests.

---

## 4. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Principal Web Performance Engineer** | APPROVED | Confirmed strict separation of tiers and safe fallback handling for jQuery-dependent legacy WordPress themes. |
| **QA Test Architect** | APPROVED | Validated headless Playwright 1.0% diff threshold and automated console error capture before committing any moderate fix. |
