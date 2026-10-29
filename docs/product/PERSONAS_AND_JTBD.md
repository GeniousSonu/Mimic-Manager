# Personas and Jobs-to-be-Done (JTBD)

**Status:** ACTIVE  
**Owner-persona:** Lead UX Researcher & Product Architect  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v0.1.0-alpha  
**Related-docs:** [PRD.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/PRD.md), [COMPETITIVE_ANALYSIS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/COMPETITIVE_ANALYSIS.md), [docs/design/UX_SPEC.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/UX_SPEC.md)

---

## 1. Five Primary Personas

### Persona 1: Alex — Freelance WordPress Developer
- **Demographics & Context:** 29, builds 15–20 bespoke WordPress sites annually for SMBs. Uses modern tools (LocalWP, Tailwind, ACF, Vite). Works on macOS and Linux.
- **Pains:**
  - Clients upload 15 MB uncompressed PNGs straight from iPhones, tanking mobile performance.
  - Spend 4 hours per project manually configuring WebP plugins, filling alt text, and adjusting script deferrals.
  - Constant anxiety that a plugin update or aggressive script deferral will break a contact form or Stripe checkout while on vacation.
- **Goals:** Set-and-forget media optimization; zero client-facing site crashes; clean, exportable before/after performance audit to prove value to clients.
- **Success Definition:** Handing off a site with an 95+ PageSpeed score that stays fast even when the client uploads raw photos.

### Persona 2: Samantha — Agency Technical Director
- **Demographics & Context:** 38, oversees maintenance retainers for 45 client WordPress and WooCommerce websites. Manages a team of 4 junior developers.
- **Pains:**
  - SaaS credit fatigue: paying $120/month across ShortPixel and Imagify across multiple client domains, with unexpected bill spikes.
  - No single pane of glass: logging into 45 separate wp-admin panels to inspect plugin updates and health status.
  - Junior devs making manual CSS edits on staging that break mobile navigation.
- **Goals:** Centralized multi-site dashboard (PWA); automated regression alerts; scheduled weekly optimization reports with custom white-label branding.
- **Success Definition:** Cutting monthly SaaS subscription costs to $0 while saving 10 hours of team maintenance time every week.

### Persona 3: Marcus — Non-Technical E-Commerce Site Owner
- **Demographics & Context:** 46, operates a WooCommerce apparel shop with 1,200 products. Uses Windows 11 and an Android phone.
- **Pains:**
  - Overwhelmed by technical jargon ("TTFB", "render-blocking resources", "canonical tags").
  - Afraid to touch performance settings after a caching plugin once broke the cart and caused $3,000 in lost orders.
  - Hundreds of product images have missing or generic alt text ("IMG_4021.jpg"), harming Google Image search visibility.
- **Goals:** Single-click "Safe" optimization that guarantees never to break checkout; automated product-aware alt text; clear, plain-language explanations.
- **Success Definition:** Increasing organic search traffic by 25% without hiring an expensive SEO consultant.

### Persona 4: Elena — Core Web Vitals & Performance Consultant
- **Demographics & Context:** 34, hired to fix failing Core Web Vitals (LCP, INP, CLS) for high-traffic publishers and agencies. Expert in DevTools, WebPageTest, and Chrome UX Report.
- **Pains:**
  - Generic caching plugins treat optimization as a blunt hammer (e.g. delaying all JS), causing terrible INP (Interaction to Next Paint).
  - Lack of scientific verification: plugins claim "100% optimized" while Lighthouse lab data regresses.
- **Goals:** Tiered fix architecture with surgical precision; automated Playwright preview verification with visual regression diffs (pixelmatch); RUM field data collection.
- **Success Definition:** Verifiable LCP reduction (< 1.8s) and zero CLS shifts (< 0.02) verified by automated browser runs before deploy.

### Persona 5: David — Self-Hosting & Open Source Enthusiast
- **Demographics & Context:** 27, runs unRAID and Docker homelabs, hosts personal blogs and community sites. Values digital sovereignty, GPL, and privacy.
- **Pains:**
  - Proprietary plugins phoning home with telemetry or locking essential features behind remote cloud license verification.
  - High memory usage and complex multi-container dependencies that crash on modest VPS instances (2 GB RAM).
- **Goals:** 100% Free and Open Source software (FOSS); zero telemetry; lightweight Docker Compose deployment; local AI (Ollama) support.
- **Success Definition:** A fully self-contained optimization brain running entirely on his private server with zero external dependencies.

---

## 2. Jobs-to-be-Done (JTBD) Framework

### Pillar 1: Media Optimization
- **JTBD-MED-01:** *When* a content editor uploads a high-resolution raw image, *I want* OptiForge to automatically convert it to WebP/AVIF in the background without blocking the upload, *so I can* keep page load times fast while keeping the master original safe for future edits.
- **JTBD-MED-02:** *When* taking over an established site with 5,000 legacy images, *I want* to run a resumable bulk optimization with disk space savings estimates, *so I can* reclaim server storage and improve Core Web Vitals without crashing the hosting server.

### Pillar 2: AI Image Alt-Text & Metadata
- **JTBD-AI-01:** *When* publishing a blog post or product with multiple images, *I want* local AI to generate contextual, screen-reader-friendly alt text based on the surrounding article headings, *so I can* achieve accessibility compliance (WCAG 2.2) and search rankings without writing descriptions manually.
- **JTBD-AI-02:** *When* reviewing AI-generated metadata, *I want* a rapid keyboard-driven review queue, *so I can* quickly accept, edit, or reject descriptions before they are applied.

### Pillar 3: PageSpeed Engine & Tiered Verification
- **JTBD-SPD-01:** *When* auditing site performance, *I want* to apply safe fixes (image dimensions, native lazy loading, font-display) with one click, *so I can* eliminate Cumulative Layout Shift (CLS) instantly.
- **JTBD-SPD-02:** *When* applying aggressive script deferrals or CSS stripping, *I want* a headless browser to test the page in preview mode first and automatically revert if console errors or visual glitches occur, *so I can* maximize speed without ever breaking user checkout or forms.

### Pillar 4: SEO Gap Fill
- **JTBD-SEO-01:** *When* managing a site with Yoast or Rank Math installed, *I want* OptiForge to write missing meta descriptions and focus tags directly into their native fields, *so I can* fix SEO gaps without introducing duplicate meta tags or conflicting plugins.
- **JTBD-SEO-02:** *When* a structured data audit runs, *I want* OptiForge to verify rendered HTML before injecting schema, *so I can* prevent search engines from penalizing the site for duplicate `Organization` or `WebSite` JSON-LD blocks.

### Pillar 5: UI Replicator
- **JTBD-REP-01:** *When* redesigning a section of a site I own, *I want* to click a hero section on a live screenshot and extract its layout into clean native Gutenberg blocks, *so I can* recreate sections in seconds without manual HTML/CSS coding.

### Pillar 6: Visual File Manager
- **JTBD-FM-01:** *When* inspecting theme templates or debugging an issue, *I want* an OS-grade file manager inside WordPress with syntax checking and automatic backups, *so I can* safely edit code without risking a White Screen of Death (WSOD).
