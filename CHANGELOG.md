# Changelog

All notable changes to the OptiForge (Mimic Manager) platform will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0-rc.1] - 2026-10-29

### Added
- **Phase 1 Media Optimization & AI Metadata (MVP):**
  - Next.js 15.5 Command Center shell (`apps/pwa`) with 13 prerendered routes and lightweight bundle footprint (< 130 kB).
  - 6-digit site pairing protocol and HMAC-signed handshake.
  - Interactive Before/After slider and multi-tier bulk media compression.
  - Alt-Text review queue with keyboard triage (`A/E/R`) and Ollama vision integration with heuristic EXIF/IPTC fallback.
  - WordPress Action Scheduler background tasks and picture rewriter.
- **Phase 2 SEO Engine:**
  - Plugin-aware `MetaSync` adapter supporting Yoast, Rank Math, SEOPress with strict zero-overwrite rule.
  - Output buffer `SchemaFilter` eliminating duplicate Schema.org definitions.
  - SEO Gap Fill dashboard (`SCR-07`) with diff preview modal and 1-click restore.
- **Phase 3 PageSpeed Engine:**
  - Tiered Fix Registry (`Safe`, `Moderate`, `Guided`) with 6 Core Web Vitals fixes.
  - Headless Preview Verifier enforcing 0 JS error tolerance and <= 1.0% visual difference threshold.
  - Auto-revert coordinator on regression with 10s undo window.
  - PageSpeed Engine Command Center view (`SCR-06`).
- **Phase 4 UI Replicator:**
  - Package `@mimic-manager/ir` with multi-viewport Intermediate Representation schema.
  - Native WordPress Core Gutenberg Block compiler (group, columns, heading, paragraph, button, image, list).
  - Replicator Studio view (`SCR-08`) with 3-viewport responsive switcher and visual fidelity inspector.
- **Phase 5 Visual File Manager:**
  - Sandboxed `JailGuard` filesystem jail strictly contained within `wp-content/`.
  - Path traversal and null byte injection defenses with sensitive file blacklists.
  - Pre-save `PhpAstLinter` syntax checks preventing WSOD.
  - `ShadowBackup` manager with timestamped backup creation and 1-click restore.
  - Visual File Manager view (`SCR-09`) with code editor, syntax indicator, and sudo re-auth modal.
- **Phase 6 Hardening & Release Engineering:**
  - End-to-end Requirements Traceability Matrix updated with 100% test mappings.
  - Full state audit and monorepo regression sweeps verified clean.

## [0.1.0-alpha] - 2026-10-29

### Added
- **Phase -1 Documentation Suite:**
  - Product specifications: PRD, Personas & JTBD, User Stories with Given/When/Then, Competitive Analysis, Roadmap, Glossary, Success Metrics, Pricing & Sustainability, Red Team Reviews.
  - Architecture specifications: C4 System Architecture, Data Model (MongoDB & WP DDL), REST API & OpenAPI 3.1, Events & Signed Webhooks, Queues & Workers, Storage Pipeline, WordPress Plugin Blueprint, Fix Registry, Fix Authoring Guide, Connector Authoring Guide, Replicator IR, Visual File Manager Design, AI Vision Providers, SEO Adapters, Observability, Performance Budgets, Scaling & Capacity, Compatibility Matrix, and 5 foundational ADRs.
  - Security suite: STRIDE Threat Model, Security Architecture, SSRF Guard with DNS Pinning, File Manager Security (CVE-2020-25213 defense), Privacy Policy, Data Retention, Penetration Test Review, Incident Response Playbook, Supply Chain Security.
  - Design system specifications: Master Design System (`DESIGN.md`), Design Principles, Brand Identity & SVG mark, Components Catalog, Design Tokens (`tokens.json`), Motion Spec, Iconography Spec, Content Style Guide & 4-part error formula, WCAG 2.2 AA Accessibility Spec, i18n & RTL Spec, Responsive & PWA UX Spec, WordPress Admin Shadow DOM Integration Spec, Design QA Checklist, Design Critique Log with 100-point rubric scores, Usability Test Plan, and interactive HTML wireframe prototype.
  - Engineering & operations documentation: Development Guide, Coding Standards, Testing Strategy, CI/CD Pipeline, Release Process, Definition of Done, Traceability Matrix, Self-Hosting Guide, Configuration Reference, Operational Runbooks, Backup & Disaster Recovery, Upgrade & Migration Guide, Troubleshooting Manual, Android TWA Packaging Guide, WordPress.org Submission Checklist.
- **Design Tokens & Programmatic Contrast Checker:**
  - Automated WCAG 2.2 AA contrast checker in `@optiforge/ui` (`pnpm test:contrast`), validating 31/31 token pairs (100% green).
- **Phase 0 Monorepo Foundations & Spikes:**
  - `@optiforge/types` with Zod schemas, error codes, and HMAC signer with cross-language test vectors.
  - `@optiforge/ssrf-guard` with DNS pinning and 76 attack vector test suite.
  - `apps/api` with Fastify 5 + NestJS 12 modular monolith, raw body capture, and HMAC authentication guard.
  - `apps/worker` with Sharp 0.35 libvips image processor and signed webhook dispatcher.
  - `connectors/wordpress` with PHP PSR-4 library, HMAC signer, and PHPUnit test suite.
  - Cross-system end-to-end integration test (`e2e/roundtrip.test.ts`).
