# Architecture Decision Records (ADRs)

## Index of Decisions

- [ADR-0001: Monorepo Tooling & Structure](#adr-0001-monorepo-tooling--structure)
- [ADR-0002: Backend API Framework (NestJS + Fastify)](#adr-0002-backend-api-framework-nestjs--fastify)
- [ADR-0003: Queue Engine & Primary Storage (BullMQ, Redis, MongoDB)](#adr-0003-queue-engine--primary-storage-bullmq-redis-mongodb)
- [ADR-0004: Channel Security: Dual HMAC-SHA256 with Replay Prevention](#adr-0004-channel-security-dual-hmac-sha256-with-replay-prevention)
- [ADR-0005: SSRF Defense: Pinning Resolver and Multi-Hop IP Guard](#adr-0005-ssrf-defense-pinning-resolver-and-multi-hop-ip-guard)
- [ADR-0006: WordPress Plugin Async Pull Architecture & Circuit Breaker](#adr-0006-wordpress-plugin-async-pull-architecture--circuit-breaker)
- [ADR-0007: Image Processing Pipeline & Decompression Bomb Mitigations](#adr-0007-image-processing-pipeline--decompression-bomb-mitigations)
- [ADR-0008: Tiered Fix Registry with Playwright Preview Verification](#adr-0008-tiered-fix-registry-with-playwright-preview-verification)
- [ADR-0009: Pluggable AI Metadata Architecture with Offline Heuristic Fallback](#adr-0009-pluggable-ai-metadata-architecture-with-offline-heuristic-fallback)
- [ADR-0010: UI Replicator Intermediate Representation (IR) Pipeline](#adr-0010-ui-replicator-intermediate-representation-ir-pipeline)
- [ADR-0011: WordPress File Manager Security Model & Path Jail](#adr-0011-wordpress-file-manager-security-model--path-jail)
- [ADR-0012: Open Source Dual Licensing (AGPL-3.0 & GPL-2.0+)](#adr-0012-open-source-dual-licensing-agpl-30--gpl-20)

---

### ADR-0001: Monorepo Tooling & Structure
- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** The system contains a TypeScript backend API, a background worker, a Next.js PWA, a WordPress React admin UI, shared TypeScript libraries (`types`, `ssrf-guard`, `fixes`, `ir`, `sdk`), and a WordPress PHP plugin.
- **Decision:** Use `pnpm` workspaces (v12.x) and Turborepo. Strict isolation with `onlyBuiltDependencies` allowlist prevents malicious postinstall execution.
- **Consequences:** Ultra-fast link builds, shared TypeScript schemas, zero duplication of types between API, worker, and frontend.

---

### ADR-0002: Backend API Framework (NestJS + Fastify)
- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** High-throughput REST API with OpenAPI 3.1 generation, SSE streaming for real-time progress, and strict zod-based validation.
- **Decision:** Use NestJS 12 with Fastify (`@nestjs/platform-fastify` 12.3.2, Fastify 5.12.7).
- **Consequences:** Fastify delivers 2x-3x request throughput compared to Express while maintaining NestJS dependency injection and modularity.

---

### ADR-0003: Queue Engine & Primary Storage (BullMQ, Redis, MongoDB)
- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** Asynchronous background processing for media optimization, scraping, Lighthouse audits, and AI generation requires reliable job distribution, retry backoff, and dead-letter queues.
- **Decision:** Use BullMQ (v6.5+) over Redis 7 for queues; MongoDB 7 via Mongoose 9 for primary state and job metadata persistence.
- **Consequences:** Independent scalability of API and worker processes; transactional job state transitions in Redis; structured audit and metadata documents in MongoDB.

---

### ADR-0004: Channel Security: Dual HMAC-SHA256 with Replay Prevention
- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** Both the WordPress connector and the backend API communicate over untrusted networks. Requests must be authenticated without transmitting master credentials.
- **Decision:** Implement bidirectional HMAC-SHA256 request signing:
  - Signature over: `method + "\n" + path + "\n" + sha256(rawBody) + "\n" + timestamp + "\n" + nonce`
  - Max timestamp skew: ±300 seconds (5 minutes).
  - Nonces cached in Redis with a 10-minute TTL to block replay attacks.
  - Constant-time signature comparison (`crypto.timingSafeEqual` in Node, `hash_equals` in PHP).
  - Versioned site secrets with a 24-hour overlapping grace period during rotation.
- **Consequences:** Complete protection against man-in-the-middle tampering, forgery, and replay attacks.

---

### ADR-0005: SSRF Defense: Pinning Resolver and Multi-Hop IP Guard
- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** Outbound fetching for URL scraping, Lighthouse audits, webhook delivery, and Replicator captures makes the backend a prime target for Server-Side Request Forgery (SSRF) and DNS rebinding attacks.
- **Decision:** Package `packages/ssrf-guard` enforces custom DNS resolution before opening any socket. IP addresses are validated against private, loopback, link-local (including AWS/GCP metadata `169.254.169.254`), CGNAT, and IPv6 multicast ranges. Sockets connect directly to validated pinned IPs. Every redirect hop is re-validated. Playwright contexts intercept all network requests through the same guard.
- **Consequences:** Complete mitigation of SSRF, DNS rebinding, and cloud credential exfiltration.

---

### ADR-0006: WordPress Plugin Async Pull Architecture & Circuit Breaker
- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** Media uploads inside WordPress must never freeze the admin UI or time out during external HTTP operations. Sites may be behind NAT, firewalls, or on localhost.
- **Decision:**
  1. Uploads are accepted immediately by WordPress; optimization tasks are dispatched to Action Scheduler.
  2. The plugin pushes the original file bytes directly to the backend API (`POST /api/v1/media/jobs`).
  3. The worker processes the image, places the variant in temporary object storage, and fires an HMAC-signed webhook `job.completed`.
  4. The WordPress plugin pulls down the optimized variant, checks SHA-256 checksum, moves it atomically into place, updates metadata, and records the previous state in ChangeLog.
  5. A circuit breaker pattern opens after 3 consecutive failures, disabling external calls and falling back to local GD/Imagick without throwing fatal errors.
- **Consequences:** Rock-solid reliability, zero wp-admin latency impact, works seamlessly behind NAT/firewalls.

---

### ADR-0007: Image Processing Pipeline & Decompression Bomb Mitigations
- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** Processing arbitrary user images introduces risks of decompression bombs, corrupt ICC profiles, malicious SVGs, and OOM kills.
- **Decision:**
  - Sharp 0.35 with libvips.
  - Hard limit on dimensions: `limitInputPixels: 268402689` (16384x16384) and max file size 50 MB.
  - Sniff file types via magic bytes (never file extensions).
  - SVGO with aggressive sanitization (strip scripts, event handlers, external entities, foreignObject).
  - Strip EXIF and GPS tags by default; retain valid ICC color profiles.
  - If output byte size is not smaller than original, discard output and report original as optimal.
- **Consequences:** Immune to malicious image attacks; strictly non-regressive media compression.

---

### ADR-0008: Tiered Fix Registry with Playwright Preview Verification
- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** Speed optimization plugins frequently break production sites by blindly deferring scripts or stripping CSS.
- **Decision:** Group all speed fixes into Safe, Moderate, and Guided tiers. Every Moderate fix must implement the 5-method `Fix` interface: `detect`, `plan`, `apply`, `verify`, `revert`. Playwright verifies the fix in an isolated signed preview mode before production activation. If JavaScript console errors occur or visual regression exceeds tolerance (pixelmatch), the fix is automatically aborted or reverted.
- **Consequences:** Eliminates silent site breakage, builds unbreakable user trust.

---

### ADR-0009: Pluggable AI Metadata Architecture with Offline Heuristic Fallback
- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** Image alt-text generation must be free and self-hostable by default, but allow optional external models. It must never fail if offline.
- **Decision:** Implement `AiProvider` interface with three drivers:
  1. `OllamaProvider`: Default self-hosted vision model (e.g. moondream / qwen2-vl).
  2. `OpenAICompatibleProvider`: User-provided endpoint and key (e.g. OpenAI, OpenRouter, Groq).
  3. `HeuristicProvider`: Zero-network fallback extracting context from post title, nearby headings, surrounding text, and file slug.
  Non-empty existing alt text is strictly preserved unless an explicit overwrite flag is passed.
- **Consequences:** 100% free and open-source functionality with graceful offline degradation.

---

### ADR-0010: UI Replicator Intermediate Representation (IR) Pipeline
- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** Copying rendered sections directly into Gutenberg or builder JSON leads to invalid styles and fragile DOM structures.
- **Decision:** Extract rendered DOM into a multi-viewport Intermediate Representation (`packages/ir`):
  - Captures DOM tree with computed styles diffed against user-agent defaults across 3 viewports (1440px, 820px, 390px).
  - Consolidates inline styles into scoped CSS variables and responsive classes.
  - Compiles IR through pluggable adapters: first to Clean HTML/CSS, then to native WordPress Core Gutenberg Blocks (`@wordpress/blocks` round-trip validated).
- **Consequences:** Generates clean, responsive, valid Gutenberg blocks rather than bloated arbitrary HTML.

---

### ADR-0011: WordPress File Manager Security Model & Path Jail
- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** WordPress file editors are infamous for Remote Code Execution (RCE) vulnerabilities.
- **Decision:**
  - Jailed to `wp-content` by default using strict `realpath()` and symlink inspection.
  - Deny access to sensitive files (`wp-config.php`, `.htaccess`, `.env`, SQL dumps).
  - Respect `DISALLOW_FILE_EDIT` and `DISALLOW_FILE_MODS`.
  - Require short-lived re-authentication (sudo mode) before write/delete actions.
  - Execute syntax checking (`php -l`) prior to saving any PHP file to prevent White Screen of Death (WSOD).
  - File operations remain strictly local to WordPress REST endpoints; file contents are never proxied through the Node backend.
- **Consequences:** Eliminates RCE risks and protects site availability.

---

### ADR-0012: Open Source Dual Licensing (AGPL-3.0 & GPL-2.0+)
- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** WordPress.org plugin directory requires GPLv2 or later compatible licensing. The backend, workers, and PWA command center require protection against proprietary cloud SaaS lockouts.
- **Decision:**
  - Monorepo backend (`apps/api`, `apps/worker`, `apps/pwa`, `packages/*`): GNU Affero General Public License v3.0 (`AGPL-3.0-only`).
  - WordPress Plugin (`connectors/wordpress`): GNU General Public License v2.0 or later (`GPL-2.0-or-later`).
- **Consequences:** 100% open-source compliance; full compatibility with WordPress.org submission standards.

---

### GATE APPROVAL: Phase 0 Foundations & Spikes
- **Status:** APPROVED: Phase 0 (2026-10-29)
- **Evidence:** 
  - Verified local environment: Ubuntu 26.04, Node v22.23.2, pnpm 12.16.1, Docker 29.9.1, PHP 8.2.29, Composer 2.10.3.
  - Verified current stable library versions (NestJS 12, Fastify 5, BullMQ 6.5, Mongoose 9.11, Sharp 0.35, Playwright 1.64, Next.js 16.4, Action Scheduler 4.2).
  - Red-team review executed with 10 concrete failure modes analyzed and mitigations planned (raw body buffer preservation, custom undici DNS pinning dispatcher, jemalloc memory tuning, SVG entity limits, Action Scheduler batching).
  - Scope locked: Monorepo, SSRF guard, cross-language HMAC test vectors, NestJS Fastify API, Sharp BullMQ worker, WordPress plugin skeleton with signed roundtrip.

---

### GATE APPROVAL: Phase 1 Media & AI Metadata (MVP)
- **Status:** APPROVED: Phase 1 (2026-10-29)
- **Evidence:**
  - Red-team mitigations integrated: Image downscaling for Ollama, strict `limitInputPixels` and magic bytes validation, non-blocking upload with Action Scheduler, local GD/Imagick fallback with capability detection, and reversible ChangeLog storage.

