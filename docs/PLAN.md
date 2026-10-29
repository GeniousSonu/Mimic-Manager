# Master Implementation Plan: Mimic Manager

**Operating Model:** Autonomous engineering loop:
`PLAN → RED-TEAM REVIEW → REVISE → GATE-APPROVE → BUILD → SELF-TEST → FIX → PHASE EXIT REPORT`

---

## Phase Breakdown & Gates

### Phase 0: Foundations & Risk Spikes
- **Objective:** Establish the monorepo, CI/CD toolchain, cross-language cryptographic primitives (HMAC-SHA256 in TS & PHP), hardened SSRF guard, and complete one end-to-end signed roundtrip.
- **Components:**
  1. Monorepo root setup (`pnpm-workspace.yaml`, `turbo.json`, root `package.json`, `.gitignore`).
  2. Core packages: `packages/types` (Zod schemas, shared contracts), `packages/ssrf-guard` (with comprehensive unit tests), `packages/config` (TypeScript, ESLint, Vitest configs).
  3. Shared HMAC signing libraries: TypeScript (`apps/api` / `packages/sdk`) and PHP (`connectors/wordpress`).
  4. Docker Compose infrastructure (`docker-compose.yml` for Mongo, Redis, MinIO).
  5. Minimal NestJS API (`apps/api`) with Fastify adapter, health check, HMAC verification guard, and OpenAPI 3.1 documentation.
  6. Minimal Sharp worker (`apps/worker`) connected via BullMQ.
  7. WordPress plugin skeleton (`connectors/wordpress`) with Composer autoload, Action Scheduler, HMAC client, and a signed roundtrip test.
- **Approval Gate Criteria:**
  - Cross-language HMAC test vectors pass in both TypeScript and PHP.
  - SSRF test suite passes with 60+ malicious bypass attempts blocked.
  - End-to-end roundtrip succeeds: Plugin posts image bytes → Worker optimizes → Webhook notifies plugin → Plugin stores variant and verifies checksum.

---

### Phase 1: Media Optimization & AI Metadata (MVP)
- **Objective:** Production-ready image conversion, bulk optimization, AI alt-text generation, and PWA dashboard.
- **Components:**
  1. Media Engine: Sharp conversions (WebP, AVIF, JPEG, PNG), SVG sanitization, animated GIF to WebP, quality presets, decompression bomb guard.
  2. WordPress Connector Media Module: Non-blocking upload intercept, Action Scheduler background queue, local GD/Imagick fallback, picture tag / `wp_get_attachment_image` filters, ChangeLog logging.
  3. AI Metadata Engine: `AiProvider` interface with Ollama (default local), OpenAI-compatible (custom key/endpoint), and Heuristic fallback.
  4. Command Center (PWA): Next.js App Router, Tailwind + shadcn/ui, site pairing flow, media dashboard, review queue for AI alt-text, standalone drag-and-drop file converter.
- **Approval Gate Criteria:**
  - 1,000-image batch test executed without memory leak or worker crash.
  - Existing non-empty alt text is never overwritten.
  - Circuit breaker test: backend killed mid-job; wp-admin remains responsive (< 5ms overhead) and switches to local compression.
  - Plugin Check validation passes with 0 fatal errors.

---

### Phase 2: SEO Engine & Gap Fill
- **Objective:** Plugin-aware SEO auditing, gap-filling, and reversible changes.
- **Components:**
  1. SEO Crawler & Auditor: Sitemap & internal link parser, heading hierarchy check, canonical tag inspection, duplicate title detection, OpenGraph verification.
  2. Adapter Layer: Native adapters for Yoast SEO, Rank Math, SEOPress, and All in One SEO (AIOSEO) that read and write directly to their post-meta keys.
  3. Structured Data Generator: Schema.org generator (WebSite, Organization, Article, BreadcrumbList, WooCommerce Product) with duplicate prevention logic.
  4. ChangeLog & Revert Engine:authoritative undo log in WordPress custom table, single-click restoration of any field.
- **Approval Gate Criteria:**
  - Adapter test matrix verified against all 4 SEO plugins.
  - Zero duplicate schemas injected on pages already containing JSON-LD.
  - User-edited fields are flagged and never overwritten by subsequent scans.

---

### Phase 3: PageSpeed Engine & Verified Fixes
- **Objective:** Tiered performance fixes with Playwright-backed automated verification and instant rollback.
- **Components:**
  1. PSI API & Local Lighthouse Runner (Playwright Chromium).
  2. Fix Registry Contract: `detect`, `plan`, `apply`, `verify`, `revert`.
  3. Safe Tier: Image dimensions, lazy loading, `fetchpriority="high"` on LCP, `font-display: swap`, Google Fonts local self-hosting, emoji script removal.
  4. Moderate Tier: Deferred JavaScript, interaction-delayed scripts, critical CSS generation via Playwright.
  5. Verification Pipeline: Playwright preview testing with console error monitoring, visual diff comparison (pixelmatch), and automatic revert if regression detected.
  6. RUM collector: Tiny (< 2 KB) web-vitals client script and time-series aggregation.
- **Approval Gate Criteria:**
  - Every registered fix implements the complete 5-method contract with unit tests.
  - A synthetic breaking script injection is automatically detected and rolled back by the verification pipeline.

---

### Phase 4: UI Replicator
- **Objective:** Safe, legal extraction of web sections into clean Intermediate Representation (IR) and Gutenberg blocks.
- **Components:**
  1. Scraper & Sandbox: Isolated Playwright container, multi-viewport capture (1440px, 820px, 390px), DOM traversal cap.
  2. IR Normalizer: Style diffing against UA defaults, CSS variable abstraction, responsive media queries.
  3. Gutenberg Adapter: Clean compilation to WordPress core blocks, round-trip validated with `@wordpress/blocks`.
  4. Visual Picker: Screenshot element map with clickable section selection in PWA.
  5. Ethics & Security: Terms of service acknowledgment, robots.txt compliance, placeholder image mode.
- **Approval Gate Criteria:**
  - Scraped test fixtures compile to valid Gutenberg blocks with 0 validation errors.
  - Hostile test pages (infinite loops, recursive DOMs, SSRF attempts) are safely contained by sandbox.

---

### Phase 5: Visual File Manager
- **Objective:** Secure, OS-like browser file manager for WordPress with syntax-checked code editing.
- **Components:**
  1. Read-Only Browser: Virtualized grid/list views, breadcrumbs, search, image thumbnails.
  2. Path Jail & Permissions: Strict canonical root verification (`wp-content`), rejection of traversal and symlink escapes, short-lived sudo mode elevation.
  3. Code Editor: Monaco editor integration, pre-save `php -l` syntax check, pre-flight timestamped backups, optimistic locking.
- **Approval Gate Criteria:**
  - 100% pass on path-jail fuzzing suite (traversal, URL encoding, null bytes, unicode).
  - Attempting to save a syntax-broken PHP file is blocked before touching disk.
  - Complete penetration test report (`docs/SECURITY_REVIEW.md`) with 0 high/critical vulnerabilities.

---

### Phase 6: Hardening, Release & Open Source Distribution
- **Objective:** Production polish, documentation, multi-platform verification, and packaging.
- **Components:**
  1. Documentation: `SELF_HOSTING.md`, `SECURITY.md`, `PRIVACY.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`.
  2. Fresh-install automation: `scripts/verify-fresh-install.sh`.
  3. WordPress.org compliance: i18n `.pot` generation, `readme.txt` validator, clean asset licensing.
  4. Automated build & release pipeline with CycloneDX SBOM and signed releases.
