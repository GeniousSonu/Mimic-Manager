# Changelog

All notable changes to the OptiForge (Mimic Manager) platform will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

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
