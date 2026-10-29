# OptiForge Brand Identity & Visual Assets Specification

**Status:** ACTIVE  
**Owner-persona:** Brand Designer & Creative Director  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [DESIGN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN.md), [TOKENS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/TOKENS.md)

---

## 1. Brand Philosophy & Working Name
- **Name:** **OptiForge** (Configurable via `brand.config.ts` for full white-label agency installations).
- **Tone of Voice:** Precise, calm, direct, supportive, and completely devoid of hype or marketing fluff.
- **Value Proposition:** The headless site optimization engine that unifies speed, media, SEO, and visual replication with automated verification and atomic rollback.

---

## 2. Geometric Mark & Construction Rules
The OptiForge mark represents dual anvil/forge geometric facets converging with precision light rays:
- **Grid:** Constructed on a 32×32 pixel vector grid with 2.5px stroke and round caps.
- **Minimum Clear Space:** Equal to 50% of the mark's height on all four sides.
- **Minimum Digital Size:** 16×16px (favicon), 24×24px (app header).

### SVG Mark Reference
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="#7C6CFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 10 L16 3 L28 10 L28 22 L16 29 L4 22 Z" />
  <path d="M16 3 L16 29" />
  <path d="M4 10 L28 22" />
  <path d="M28 10 L4 22" />
</svg>
```

---

## 3. PWA Icons & Favicon Suite
- `favicon.ico`: Multi-res (16x16, 32x32, 48x48).
- `icon-192.png`: 192x192 square icon for Android homescreen.
- `icon-512.png`: 512x512 splash screen icon.
- `icon-maskable.png`: 512x512 with safe-area padding for Android adaptive icons.

---

## 4. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Creative Director** | APPROVED | Minimalist geometric SVG mark scales crisply down to 16px favicon without blur. |
| **Frontend Lead** | APPROVED | Confirmed single `brand.config.ts` entry point enables 100% white-label agency branding. |
