# OptiForge Product Roadmap

**Status:** ACTIVE  
**Owner-persona:** Lead Product Architect  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v0.1.0-alpha  
**Related-docs:** [PRD.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/PRD.md), [docs/project/PLAN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/project/PLAN.md)

---

## Release Horizons

```mermaid
gantt
    title OptiForge Engineering Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 0 (Done)
    Foundations, HMAC, SSRF Guard, Fastify API, Sharp Worker :done, p0, 2026-10-29, 2026-10-29
    section Phase -1 (Done)
    Doc Suite, Design Tokens, Contrast Audit, Wireframes :done, pm1, 2026-10-29, 2026-10-29
    section Phase 1 (MVP)
    Media Engine, Ollama AI, PWA Shell, Site Pairing :active, p1, 2026-10-30, 2026-11-15
    section Phase 2 (SEO)
    Crawler, Yoast/RankMath Adapters, ChangeLog :p2, 2026-11-16, 2026-11-30
    section Phase 3 (Speed)
    PSI/Lighthouse, Safe Fixes, Playwright Auto-Revert :p3, 2026-12-01, 2026-12-20
    section Phase 4 (Replicator)
    Multi-Viewport IR, Gutenberg Block Adapter :p4, 2027-01-05, 2027-01-25
    section Phase 5 (Files)
    Jailed File Browser, Monaco Editor, Pre-Save AST Lint :p5, 2027-02-01, 2027-02-20
    section Phase 6 (Release)
    Penetration Test, WCG 2.2 AAA, WordPress.org Deploy :p6, 2027-03-01, 2027-03-15
```

---

## Milestones Details

### Milestone 1: v0.2.0-beta (Phase 1 MVP)
- Target: Full Media Optimization (WebP/AVIF) + Local GD fallback.
- Contextual AI Alt-Text generation via Ollama (moondream / qwen2-vl) + Heuristic fallback.
- Dark-first PWA dashboard with 6-digit site pairing and live job streaming.

### Milestone 2: v0.4.0-beta (Phase 2 & 3: SEO + Speed Engine)
- Plugin-aware SEO gap fill with Yoast, Rank Math, SEOPress adapters.
- Safe-tier speed fixes (dimensions, lazy loading, font-display).
- Moderate-tier fixes with Playwright preview verification and automated rollback.

### Milestone 3: v0.6.0-beta (Phase 4: UI Replicator)
- Multi-viewport DOM Intermediate Representation (IR).
- Gutenberg Core block compilation with roundtrip `@wordpress/blocks` validation.
- Interactive section picker on live rendered screenshots.

### Milestone 4: v0.8.0-beta (Phase 5: Visual File Manager)
- Jailed filesystem navigator (`wp-content` boundary).
- Monaco code editor with pre-save `php -l` syntax check and automatic rollback backups.

### Milestone 5: v1.0.0-ga (Phase 6: Hardening & Distribution)
- Independent penetration testing audit (`docs/security/SECURITY_REVIEW.md`).
- WordPress.org official plugin directory submission.
- Zero-downtime containerized self-hosting script.
