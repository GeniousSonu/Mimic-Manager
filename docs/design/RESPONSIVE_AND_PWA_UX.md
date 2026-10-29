# OptiForge Responsive & Progressive Web App (PWA) UX Specification

**Status:** ACTIVE  
**Owner-persona:** Mobile Web Specialist & PWA Architect  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [DESIGN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN.md), [SCREEN_INVENTORY.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/SCREEN_INVENTORY.md)

---

## 1. Responsive Breakpoints & Viewport Verification
OptiForge views are built mobile-first and tested against 6 canonical viewports:
- **360px:** Small Mobile (Samsung Galaxy S8, compact Android).
- **390px:** Standard Modern Mobile (iPhone 13/14/15/16).
- **768px:** Tablet Portrait (iPad Mini, tablet devices).
- **1024px:** Tablet Landscape / Small Desktop (iPad Pro, small laptops).
- **1440px:** Standard Desktop (MacBook Pro, pro monitors).
- **1920px:** High-Density Desktop (Ultra-wide, full HD).

---

## 2. Progressive Web App (PWA) Capabilities

### 2.1 Web App Manifest & App Shortcuts
The PWA manifest (`manifest.json`) defines native app-like launch shortcuts:
- `Optimize Images`: Directly opens the standalone image drag-and-drop converter.
- `Run Audit`: Triggers an immediate mobile Lighthouse audit on the primary site.
- `Alt-Text Queue`: Jumps straight to the image accessibility review queue.

### 2.2 OS Share Target Integration
On Android and ChromeOS, OptiForge registers as an OS **Share Target** for `image/*` MIME types. Users can share an image directly from Google Photos or their native camera into OptiForge for immediate WebP/AVIF compression.

### 2.3 Offline Experience & App Shell Caching
- **App Shell Cache:** Static assets, icons, and shell HTML are cached via Workbox.
- **Offline Mode:** If network connection drops, the dashboard displays the last-known audit and queue states with an amber banner: *"Viewing cached offline data from 14 minutes ago"*.

---

## 3. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Mobile Web Specialist** | APPROVED | Confirmed bottom tab bar navigation (< 768px) and safe-area inset support on iPhone notched displays. |
| **PWA Engineer** | APPROVED | Validated OS Share Target integration and manifest shortcut actions. |
