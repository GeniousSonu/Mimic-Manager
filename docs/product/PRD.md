# Product Requirements Document (PRD): OptiForge

**Status:** ACTIVE  
**Owner-persona:** Lead Product Architect  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v0.1.0-alpha  
**Related-docs:** [PERSONAS_AND_JTBD.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/PERSONAS_AND_JTBD.md), [COMPETITIVE_ANALYSIS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/COMPETITIVE_ANALYSIS.md), [docs/architecture/ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md), [docs/design/DESIGN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN.md)

---

## 1. Summary and Vision

Website performance, search engine optimization, media management, and section extraction are plagued by fragmented, expensive, and fragile tooling. Web developers and agency owners must maintain dozens of single-purpose plugins that conflict with each other, charge recurring credit fees, and silently break site functionality when aggressive script deferrals or style removals are applied.

**OptiForge** is a self-hostable, headless optimization brain with thin CMS connectors (WordPress first) and a centralized PWA command center. Our core promise is **Unification plus Verification**: a single operational surface where every media conversion is lossless or optimal, every speed fix is tested in an isolated browser preview and automatically reverted upon regression, and every SEO gap is filled collaboratively without duplicating existing plugin data.

---

## 2. Goals and Explicit Non-Goals

### Measurable Goals
1. **Zero-Broken-Sites Guarantee:** 100% of Moderate speed fixes (script deferral, critical CSS) are verified by headless Playwright testing prior to live activation, with automated rollback on console errors or visual diffs > 1%.
2. **True FOSS Sovereignty:** 100% free functionality with zero paid service dependencies, no license keys, and zero telemetry by default.
3. **Sub-10-Minute Activation:** A new user can launch the stack via Docker Compose, pair a WordPress site via a 6-digit code, and optimize their first image within 10 minutes.
4. **Zero Latency wp-admin Footprint:** Front-end overhead of the connector plugin is strictly < 5ms median with zero additional database queries on cached paths.

### Explicit Non-Goals
1. **Full-Page Caching & CDN:** OptiForge will not build a custom full-page HTML cache or CDN edge network. Battle-tested tools (Cloudflare, LiteSpeed, WP Rocket) excel at this; OptiForge provides purge hooks and guided integration instructions instead.
2. **Server Infrastructure Mutation:** OptiForge will never automatically edit host server files (`/etc/nginx/nginx.conf`, Apache virtual hosts). Guided copy-paste configuration snippets are provided with safety notices.
3. **Proprietary Monetization / Paywalls:** No paid tiers, usage limits, or locked premium features.

---

## 3. User Personas

Detailed persona profiles and context are documented in [PERSONAS_AND_JTBD.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/PERSONAS_AND_JTBD.md):
- **Alex (Freelance WordPress Dev):** Values automated background media compression and before/after client reports.
- **Samantha (Agency Technical Director):** Values multi-site management (40+ sites), scheduled monitoring, and $0 recurring SaaS costs.
- **Marcus (Non-Technical WooCommerce Owner):** Values one-click safe optimization that guarantees never to break checkout.
- **Elena (Core Web Vitals Consultant):** Values granular fix registries, Playwright visual regression diffs, and RUM metrics.
- **David (Self-Hosting & Privacy Enthusiast):** Values Docker self-hosting, local Ollama AI integration, and zero telemetry.

---

## 4. Jobs-to-be-Done (JTBD)

Refer to [PERSONAS_AND_JTBD.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/PERSONAS_AND_JTBD.md#2-jobs-to-be-done-jtbd-framework) for complete job stories across all 6 product pillars.

---

## 5. Functional Requirements (FR)

### Pillar 1: Media Optimization Engine

#### `FR-MEDIA-001`: Non-Blocking Background Upload Intercept
- **Priority:** Must Have (P0)
- **Rationale:** Intercepting image uploads synchronously freezes the wp-admin editor on large images or slow networks.
- **User Story:** As an author, when I upload an image to WordPress, the upload completes immediately while optimization runs asynchronously.
- **Acceptance Criteria:**
  - *Given* an image upload in wp-admin,
  - *When* `wp_generate_attachment_metadata` fires,
  - *Then* an optimization task is enqueued to Action Scheduler, the master original file is preserved unaltered, and control returns to the UI in < 200ms.
- **Failure Behavior:** If the background queue fails, the original image continues to be served; the site never experiences broken media links.
- **Design Ref:** [SCREEN_INVENTORY.md#media-library](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/SCREEN_INVENTORY.md)
- **Arch Ref:** [ARCHITECTURE.md#media-pipeline](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md)

#### `FR-MEDIA-002`: Multi-Format Generation & Quality Presets
- **Priority:** Must Have (P0)
- **Rationale:** Modern browsers require WebP and AVIF variants for optimal Core Web Vitals (LCP).
- **User Story:** As a developer, I want WebP and AVIF variants generated with configurable quality presets (`lossless`, `high`, `balanced`, `aggressive`).
- **Acceptance Criteria:**
  - *Given* a supported input format (JPEG, PNG, GIF, SVG, HEIC, TIFF),
  - *When* the Sharp worker executes,
  - *Then* it generates the requested variant; if the output file size is not smaller than the original, the original is retained and flagged as "already optimal".
- **Failure Behavior:** Fall back to local GD/Imagick if the remote backend is unreachable.

#### `FR-MEDIA-003`: Reversible Variant Delivery & Restore
- **Priority:** Must Have (P0)
- **Rationale:** Content creators must always have the freedom to restore original master assets without quality loss.
- **User Story:** As an editor, I want a single-click "Restore Original" button on any optimized media item.
- **Acceptance Criteria:**
  - *Given* an optimized media item,
  - *When* clicking "Restore Original",
  - *Then* variant links are cleared from database metadata and the original master image is restored.

---

### Pillar 2: AI Metadata & Alt-Text Engine

#### `FR-AI-001`: Context-Aware Alt-Text Generation
- **Priority:** Must Have (P0)
- **Rationale:** Alt text generated solely from pixels lacks context; knowing the article title and surrounding text produces accurate, accessible descriptions.
- **User Story:** As a blogger, I want local AI to generate alt text using both image pixels and the post title.
- **Acceptance Criteria:**
  - *Given* an image associated with a blog post,
  - *When* the AI worker runs,
  - *Then* it evaluates the image alongside the post heading, outputs a descriptive alt string ≤ 125 characters, and never overwrites existing non-empty alt text.

#### `FR-AI-002`: Review Queue with Keyboard Shortcuts
- **Priority:** Should Have (P1)
- **Rationale:** AI descriptions must be human-verifiable before wide deployment.
- **User Story:** As an SEO manager, I want to review suggested alt text in a rapid queue with keyboard shortcuts (`A` = Accept, `E` = Edit, `R` = Reject).
- **Design Ref:** [SCREEN_INVENTORY.md#alt-text-queue](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/SCREEN_INVENTORY.md)

---

### Pillar 3: PageSpeed Engine & Tiered Verification

#### `FR-SPEED-001`: Tiered Fix Classification
- **Priority:** Must Have (P0)
- **Rationale:** Lumping all performance optimizations together leads to broken sites.
- **User Story:** As an engineer, I want fixes split into Safe (auto-apply), Moderate (preview & verify), and Guided (manual instructions).
- **Acceptance Criteria:**
  - Safe fixes (image dimensions, native lazy loading, font-display: swap) can be applied in one click.
  - Moderate fixes (defer JS, critical CSS) require headless browser verification before live activation.

#### `FR-SPEED-002`: Playwright Preview Verification & Auto-Revert
- **Priority:** Must Have (P0)
- **Rationale:** This is OptiForge's primary differentiator: eliminating the fear of broken sites.
- **User Story:** As a site owner, I want any script optimization that causes a JavaScript console error to be reverted immediately.
- **Acceptance Criteria:**
  - *Given* a Moderate fix applied in signed preview mode,
  - *When* Playwright renders the page and detects an uncaught JS exception or visual diff > 1%,
  - *Then* the fix is aborted, the prior state is restored, and an incident report with screenshots is displayed in the UI.

---

### Pillar 4: SEO Gap Fill Engine

#### `FR-SEO-001`: Plugin-Aware Post-Meta Adapter
- **Priority:** Must Have (P0)
- **Rationale:** Incompatible SEO tag injection harms search engine rankings.
- **User Story:** As a developer with Yoast or Rank Math active, I want OptiForge to write into their existing post-meta fields rather than generating conflicting tags.
- **Acceptance Criteria:**
  - *Given* Yoast SEO, Rank Math, SEOPress, or AIOSEO active on the site,
  - *When* OptiForge generates missing meta descriptions,
  - *Then* it writes directly to their specific meta keys and marks the record in ChangeLog.

#### `FR-SEO-002`: Duplicate Schema Prevention
- **Priority:** Must Have (P0)
- **Rationale:** Multiple conflicting JSON-LD blocks for Organization or WebSite confuse search indexers.
- **Acceptance Criteria:**
  - Rendered HTML is parsed; if a schema type is already present, OptiForge suppresses its own output for that type.

---

### Pillar 5: UI Replicator

#### `FR-REP-001`: Interactive Screenshot Section Picker
- **Priority:** Should Have (P1)
- **Rationale:** Typing CSS selectors is tedious and prone to error.
- **User Story:** As a designer, I want to click a visual bounding box on a rendered page screenshot to extract a section.
- **Acceptance Criteria:**
  - The UI presents a rendered screenshot with hoverable DOM bounding boxes; clicking a box selects that node tree for IR extraction.

#### `FR-REP-002`: Multi-Viewport IR to Clean Gutenberg Blocks
- **Priority:** Should Have (P1)
- **Rationale:** Direct CSS-to-block mapping produces invalid, unmaintainable code.
- **Acceptance Criteria:**
  - The scraper captures styles at 1440px, 820px, and 390px, normalizes them into Intermediate Representation (IR), and compiles them to native WordPress core blocks (Group, Columns, Heading, Paragraph).

---

### Pillar 6: Visual File Manager

#### `FR-FM-001`: Jailed Filesystem Operations
- **Priority:** Must Have (P0)
- **Rationale:** Unrestricted file managers are prime targets for Remote Code Execution (RCE).
- **Acceptance Criteria:**
  - Operations are jailed strictly to `wp-content` using `realpath()`. Direct access to `wp-config.php`, `.env`, and `.htaccess` is blocked. Executable uploads (`.php`, `.phtml`) are rejected.

#### `FR-FM-002`: Pre-Save PHP Syntax Linting
- **Priority:** Must Have (P0)
- **Rationale:** A single missing semicolon in `functions.php` causes a fatal White Screen of Death (WSOD).
- **Acceptance Criteria:**
  - Prior to writing any PHP file to disk, the file is linted via `php -l` (or bundled parser); if a syntax error is detected, the save is aborted and the line error is flagged in Monaco editor.

---

## 6. Non-Functional Requirements (NFR)

| ID | Category | Target Metric | Verification Test |
|---|---|---|---|
| **NFR-PERF-001** | Frontend WP Overhead | < 5 ms median overhead on page delivery | k6 benchmark test |
| **NFR-PERF-002** | PWA Lighthouse Score | ≥ 95 Performance, ≥ 95 A11y, 100 Best Practices | Lighthouse CI audit |
| **NFR-PERF-003** | Batch Image Processing | 1,000 images processed without worker OOM (RSS < 512MB) | Load testing script |
| **NFR-SEC-001** | SSRF Defense | 100% block rate across 60+ attack vectors (cloud metadata, rebinding) | `packages/ssrf-guard` test suite |
| **NFR-SEC-002** | Channel Cryptography | Bidirectional HMAC-SHA256, max skew 300s, 0 replay tolerance | Cross-language test suite |
| **NFR-A11Y-001** | Accessibility | Zero critical or serious axe violations (WCAG 2.2 AA) | Automated axe-core CI gate |
| **NFR-REL-001** | Fault Tolerance | Breaker trips after 3 failures; wp-admin never throws fatal error | Chaos injection test |

---

## 7. Core User Flows

1. **Site Pairing Flow:** Admin installs plugin → PWA displays 6-digit code → Admin enters code in wp-admin → Mutual HMAC secrets exchanged → Connection verified.
2. **One-Click Speed Optimization:** User selects URL → OptiForge audits → Safe fixes applied instantly → Moderate fixes previewed with Playwright → Verification passed → Live activation with Undo toast.
3. **Bulk Image Optimization:** Admin opens Media Optimizer → System calculates potential savings → Admin selects quality preset → Action Scheduler pulls variants in background → Progress streamed via SSE → Completion summary with per-file restore.

---

## 8. Release Scope

- **Phase 0 (Foundations):** Monorepo, SSRF guard, cross-language HMAC, minimal Fastify API, Sharp worker, signed roundtrip. *(COMPLETED)*
- **Phase 1 (MVP):** Media Engine, local GD fallback, AI metadata with Ollama/Heuristic, Next.js PWA command center, pairing flow.
- **Phase 2 (SEO):** Audit crawler, Yoast/Rank Math/SEOPress adapters, ChangeLog table, structured data generator.
- **Phase 3 (PageSpeed):** PSI/Lighthouse engine, Safe tier fixes, Playwright verification pipeline with auto-revert.
- **Phase 4 (UI Replicator):** Multi-viewport scraper, IR normalization, Gutenberg block adapter, visual element picker.
- **Phase 5 (File Manager):** Read-only browser → file operations → Monaco code editor with pre-save AST linting.
- **Phase 6 (Hardening & Release):** Penetration test audit, WordPress.org submission packaging, documentation complete.

---

## 9. Risks and Key Assumptions

- **Assumption:** WordPress hosts allow outbound HTTP calls to the self-hosted OptiForge backend. *Mitigation: Support local-only fallback mode in the plugin if remote networking is firewalled.*
- **Assumption:** Playwright Chromium container can run with minimal memory overhead. *Mitigation: Strict container memory limits (1.5 GB), single context per job, aggressive browser recycling.*

---

## 10. Open Questions

1. *Should PDF rasterization be bundled in Phase 1 or deferred?* **Decision:** Deferred to Phase 7 due to Ghostscript licensing and container weight; focus on raster images and SVGs.
2. *Will WooCommerce checkout preview test require mocked payment gateways?* **Decision:** Yes, Playwright preview runs will detect WooCommerce and test with Stripe test tokens or standard cash-on-delivery mode to prevent live transactions.

---

## 11. Local Success Metrics (Zero Telemetry)

- **Time to First Value:** < 10 minutes from `docker compose up` to first optimized image.
- **Fix Auto-Revert Accuracy:** > 99% of synthetic breaking script injections caught and rolled back before production impact.
- **Crash-Free Sessions:** 100% crash-free wp-admin page loads regardless of backend downtime.

---

## 12. Legal and Ethical Guardrails

- **UI Replicator Policy:** Explicit terms of service acceptance required on first run acknowledging extraction is limited to user-owned sites.
- **AI Disclosure:** Clearly document when and where local or cloud AI models are invoked in compliance with WordPress.org external services guidelines.
