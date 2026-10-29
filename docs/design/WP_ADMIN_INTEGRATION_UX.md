# Mimic Manager WordPress Admin Integration UX Specification

**Status:** ACTIVE  
**Owner-persona:** Lead WordPress Architect & Admin UX Designer  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [DESIGN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN.md), [WORDPRESS_PLUGIN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/WORDPRESS_PLUGIN.md)

---

## 1. WordPress Admin Menu & Routing Structure

Mimic Manager integrates cleanly into the standard WordPress administration menu:
- **Top-Level Menu:** `Mimic Manager` (Dashicon: `dashicons-performance` or custom SVG).
- **Sub-Menu Pages:**
  - `Overview` (`admin.php?page=mimic-manager`)
  - `Media Library` (`admin.php?page=mimic-manager-media`)
  - `PageSpeed Engine` (`admin.php?page=mimic-manager-speed`)
  - `SEO Sync` (`admin.php?page=mimic-manager-seo`)
  - `Visual File Manager` (`admin.php?page=mimic-manager-files`)
  - `Settings` (`admin.php?page=mimic-manager-settings`)

---

## 2. Shadow DOM Mounting Architecture
The embedded React application renders inside an isolated Shadow DOM root:
```html
<div id="mimic-manager-admin-root">
  <!-- #shadow-root (open) -->
  <link rel="stylesheet" href="mimic-manager-tokens.css">
  <link rel="stylesheet" href="mimic-manager-components.css">
  <div class="mimic-manager-theme-dark mimic-manager-density-compact">
    <!-- React Component Tree Mounts Here -->
  </div>
</div>
```
- **Complete Isolation:** Standard WordPress admin styles (`wp-admin.css`, custom admin color schemes, aggressive third-party plugin stylesheets) cannot penetrate into the shadow root.
- **Zero Style Leakage:** Mimic Manager's Tailwind and token styles cannot bleed out or distort the WordPress top header or left sidebar.

---

## 3. Native WordPress Media Library Enhancements
In addition to the standalone dashboard, Mimic Manager natively hooks into the WordPress Media Library (`upload.php` list mode):
- Adds an **"Optimization Status"** column showing format badge (`WebP`, `AVIF`, or `Original`).
- Adds a **"Savings"** column showing percentage and byte delta (e.g. `68% (-340 KB)`).
- Provides a quick action dropdown: `[ Re-optimize | View Originals | Prune ]`.

---

## 4. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **WordPress VIP Architect** | APPROVED | Confirmed Shadow DOM isolation completely eliminates styling conflicts with popular admin themes like Slate or Modern. |
| **Admin UX Designer** | APPROVED | Native list table columns provide seamless day-to-day workflow without requiring full dashboard navigation. |
