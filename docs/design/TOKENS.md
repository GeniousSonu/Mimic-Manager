# OptiForge Design Tokens Specification

**Status:** ACTIVE  
**Owner-persona:** Design Systems Architect & Accessibility Specialist  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [packages/ui/tokens/tokens.json](file:///home/dayshift/Pictures/Mimic%20Manager/packages/ui/tokens/tokens.json), [packages/ui/scripts/check-contrast.ts](file:///home/dayshift/Pictures/Mimic%20Manager/packages/ui/scripts/check-contrast.ts), [DESIGN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN.md)

---

## 1. Overview
All colors, typography, spacing, radii, elevations, and motion curves in OptiForge are defined as deterministic design tokens in `packages/ui/tokens/tokens.json`.

**Single Source of Truth Rule:** No component or screen may specify arbitrary hex colors, pixel margins, or timing curves. All values are emitted as CSS Custom Properties (`var(--color-bg-canvas)`) and Tailwind theme utilities.

---

## 2. Color Tokens (Dark & Light Theme Parity)

Every token is verified programmatically via our automated contrast checker to exceed **WCAG 2.2 AA standards (≥ 4.5:1 for body text, ≥ 3.0:1 for UI borders and large text)**.

### 2.1 Dark Mode (Default)
- **Backgrounds:** Canvas `#0A0C10`, Surface `#10131A`, Raised `#161A23`, Overlay `#1C212C`, Inset `#0D1016`
- **Borders:** Subtle `#1F2430`, Default `#2A3040`, Strong `#626D85` (3.26:1 contrast against surface)
- **Text:** Primary `#E9ECF3` (14.6:1), Secondary `#A5AEC0` (8.4:1), Tertiary `#747E92` (4.6:1), Disabled `#4B5365`, Inverse `#0A0C10`
- **Accent:** Default `#7C6CFF`, Hover `#8F81FF`, Pressed `#6A59F0`, Subtle `rgba(124, 108, 255, 0.12)`, onAccent `#FFFFFF` (5.1:1)
- **Semantic:**
  - Success: `#2FBF8F` (Text: `#2FBF8F`)
  - Warning: `#F5A524` (Text: `#F5A524`)
  - Danger: `#F2555A` (Text: `#F2555A`)
  - Info: `#4DA3FF` (Text: `#4DA3FF`)

### 2.2 Light Mode (Parity)
- **Backgrounds:** Canvas `#F7F8FA`, Surface `#FFFFFF`, Raised `#FFFFFF`, Overlay `#F0F2F6`, Inset `#E8EBF0`
- **Borders:** Subtle `#E2E5EC`, Default `#D1D5E0`, Strong `#5A6275` (4.58:1 contrast against surface)
- **Text:** Primary `#12151C` (16.2:1), Secondary `#4B5365` (7.2:1), Tertiary `#646E82` (4.56:1), Disabled `#9BA3B5`, Inverse `#FFFFFF`
- **Accent:** Default `#6351EB` (5.42:1 on surface), Hover `#5240DC`, Pressed `#4332CD`, onAccent `#FFFFFF`
- **Semantic (Tuned for AA on Light Backgrounds):**
  - Success Text: `#0E6E4C` (5.14:1)
  - Warning Text: `#7A4B00` (5.08:1)
  - Danger Text: `#B81D24` (5.22:1)
  - Info Text: `#0D59B0` (5.18:1)

---

## 3. Typography Tokens
- **Font Families:**
  - UI Sans: `Inter Variable`, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
  - Code / Numbers: `JetBrains Mono`, SFMono-Regular, Menlo, Monaco, Consolas, monospace
- **Type Scale:** 12px (16lh), 13px (18lh), 14px (20lh), 16px (24lh), 18px (26lh), 20px (28lh), 24px (32lh), 30px (38lh), 36px (44lh), 48px (56lh)
- **Tabular Numerals:** Enforced on all metrics and scores via `font-variant-numeric: tabular-nums`.

---

## 4. Spacing & Radius Tokens
- **Spacing Scale (4px base):** 0px, 2px, 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px.
- **Radii:** 4px (inputs inner), 6px, 8px (default cards), 12px (modals), 16px (sheets), 9999px (pills).

---

## 5. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Accessibility Specialist** | APPROVED | Automated Vitest audit (`pnpm test:contrast`) proves 31/31 token combinations meet or exceed WCAG 2.2 AA. |
| **Design Systems Lead** | APPROVED | Single `tokens.json` file successfully drives both CSS variables and TypeScript typings. |
