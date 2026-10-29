# Mimic Manager Brand Identity & Visual Assets Specification

**Product:** Mimic Manager  
**Owner:** Wefik (https://www.wefik.in)  
**Created by:** SK Sahinur Islam (https://www.genioussonu.me/plugin/mimic-manager)  
**Status:** ACTIVE  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1.0.0-rc.1  
**Related-docs:** [DESIGN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN.md), [TOKENS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/TOKENS.md), [TRADEMARKS.md](file:///home/dayshift/Pictures/Mimic%20Manager/TRADEMARKS.md)

---

## 1. Brand Philosophy & Identity

- **Product Name:** **Mimic Manager**
  - Always write as two words: "Mimic Manager".
  - Never write as one word in prose (do NOT use "MimicManager" in body text; "MimicManager" is reserved for PascalCase code symbols like PHP class names).
  - Never write in all-caps ("MIMIC MANAGER") except in environment variables or constant prefixes (`MIMIC_MANAGER_`).
- **Owner Lockup:** "A Wefik project" or "A Wefik product", linking to `https://www.wefik.in`.
- **Creator Credit:** "Created and lead-authored by SK Sahinur Islam".
- **Tagline:** "Optimize media, speed, and SEO for every site you manage, with proof and undo."
- **Tone of Voice:** Precise, calm, authoritative, transparent, and completely devoid of hype or artificial marketing claims.

---

## 2. Geometric Mark & Construction Rules

The Mimic Manager mark represents convergence of faceted media optimization, code execution, and replication intelligence:
- **Vector Grid:** 32×32 pixel coordinate grid with 2.5px stroke width and rounded joins.
- **Minimum Clear Space:** 50% of the mark's total height on all four sides. No typography, icons, or UI borders may encroach into this clear space.
- **Minimum Size:** 16×16px (favicon), 24×24px (app left rail), 48×48px (onboarding modal).
- **Brand Accent:** `#7C6CFF` (Electric Violet / Indigo Accent token).

### SVG Mark Reference (`packages/ui/brand/mark.svg`)
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="#7C6CFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 10 L16 3 L28 10 L28 22 L16 29 L4 22 Z" />
  <path d="M16 3 L16 29" />
  <path d="M4 10 L28 22" />
  <path d="M28 10 L4 22" />
</svg>
```

---

## 3. Co-Branding & Lockup Guidelines

When displaying the Mimic Manager mark alongside Wefik:
1. **Horizontal Co-Brand Lockup:**
   `[Mark] Mimic Manager · A Wefik product`
   - Separation dot: `#2A3040` (border token)
   - Secondary text: `#A5AEC0` (muted foreground)
2. **Footer Display:**
   `Mimic Manager v{version} · Created by SK Sahinur Islam · A Wefik product` (with link to https://www.wefik.in)
3. **Dark / Light Variants:**
   - Dark theme (Default): Mark in `#7C6CFF`, typography in `#E9ECF3` on canvas `#0A0C10`.
   - Light theme / print reports: Mark in `#6052E0`, typography in `#1A1D24` on `#FFFFFF`.

---

## 4. Do and Don't Gallery

| DO | DON'T |
|---|---|
| Use "Mimic Manager" with a space in documentation and UI | Never spell with typos or as a single unspaced word in body prose |
| Maintain 50% clear space around the vector mark | Never skew, rotate, or apply dropshadows to the SVG mark |
| Credit Wefik and SK Sahinur Islam in attribution footers | Never claim individual ownership over official release binaries |
| Use `pnpm brand:rename "<New Name>"` for agency white-label | Never manually edit derived brand identifiers across codebase |

---

## 5. Fork Policy and Trademark Notice

Per [TRADEMARKS.md](file:///home/dayshift/Pictures/Mimic%20Manager/TRADEMARKS.md):
- Anyone may fork the open-source codebase under AGPL-3.0 and GPL-2.0+.
- Forks **MUST rename** the product to a distinct, non-confusing name using `pnpm brand:rename "<Your Brand>"`.
- Forks **MUST replace or remove** the official Mimic Manager and Wefik visual logos.
- Underlying copyright notices (`Copyright (c) 2026 Wefik. Created by SK Sahinur Islam.`) must remain intact in all source headers and the `NOTICE` file.
