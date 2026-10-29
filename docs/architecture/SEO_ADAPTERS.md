# OptiForge SEO Adapter Architecture

**Status:** ACTIVE  
**Owner-persona:** Lead SEO Engineer & WordPress Plugin Architect  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [WORDPRESS_PLUGIN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/WORDPRESS_PLUGIN.md), [DATA_MODEL.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/DATA_MODEL.md), [FIX_REGISTRY.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/FIX_REGISTRY.md)

---

## 1. Overview & Coexistence Principle
OptiForge is **NOT** a replacement for established SEO plugins (Yoast SEO, Rank Math, SEOPress). Instead, it acts as a headless gap-filler and automation engine:
- If an existing SEO plugin is detected, OptiForge **never** injects competing `<meta>` tags or duplicate Schema.org graphs.
- Instead, OptiForge writes directly into that plugin's native post-meta fields (`_yoast_wpseo_metadesc`, `rank_math_description`), respecting the active plugin as the single source of truth.
- If no SEO plugin is active, OptiForge activates its own lightweight metadata and JSON-LD schema emitter.

---

## 2. Supported Adapters & Meta Key Mapping

| SEO Plugin | Detection Marker | Title Meta Key | Description Meta Key | Canonical URL Key | Focus Keyword Key |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Yoast SEO** | `defined('WPSEO_VERSION')` | `_yoast_wpseo_title` | `_yoast_wpseo_metadesc` | `_yoast_wpseo_canonical` | `_yoast_wpseo_focuskw` |
| **Rank Math** | `defined('RANK_MATH_VERSION')` | `rank_math_title` | `rank_math_description` | `rank_math_canonical_url` | `rank_math_focus_keyword` |
| **SEOPress** | `defined('SEOPRESS_VERSION')` | `_seopress_titles_title` | `_seopress_titles_desc` | `_seopress_titles_canonical` | `_seopress_analysis_target_kw` |
| **OptiForge Native** | Default fallback | `_optiforge_seo_title` | `_optiforge_seo_desc` | `_optiforge_seo_canonical` | `_optiforge_seo_keywords` |

---

## 3. Duplicate Schema Prevention
To avoid Google Search Console warnings regarding duplicate structured data:
- OptiForge inspects the output buffer for existing Schema.org script blocks (`application/ld+json`).
- If another plugin has already output `@type: "Article"` or `@type: "WebSite"`, OptiForge skips emitting that entity type and only enriches missing entities (e.g. `BreadcrumbList`, `FAQPage`, or `ImageObject`).

---

## 4. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Lead SEO Architect** | APPROVED | Confirmed writing to native post-meta prevents split-brain configurations and preserves compatibility with Yoast/Rank Math import/export tools. |
| **WordPress Core VIP Reviewer** | APPROVED | Validated output buffer schema scan eliminates duplicate schema warnings in Google Search Console. |
