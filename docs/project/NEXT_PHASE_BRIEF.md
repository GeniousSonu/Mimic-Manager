# Next Phase Brief: P2 SEO Engine

## What just finished
- **Phase 1: Media + AI Metadata + Command Center MVP** is 100% complete and verified.
- Next.js 16 PWA Command Center built and verified static prerendering across all 9 routes (`docs/project/evidence/P1/pwa-build.log`).
- First Load JS is ~108 kB, far below our 170 kB budget.
- 6-digit site pairing flow, Media optimizer BeforeAfterSlider, and Alt-Text review queue with keyboard shortcuts (A/E/R) delivered.
- Ollama vision model integration with heuristic EXIF/IPTC fallback implemented and tested in `apps/worker`.
- WordPress connector picture rewriter and attachment hooks tested and passing 8/8 tests in PHPUnit.

## State of the repo
- **Commit:** Clean, tracking `origin/main`.
- **Test Counts:** 8/8 monorepo test suites passing (76 SSRF vectors, 6 API tests, 5 worker tests, 1 E2E roundtrip, 8 PHPUnit tests, 30 contrast pairs).
- **Open Defects:** 0 critical, 0 high, 0 medium.
- **Known Gaps:** Documented in `KNOWN_GAPS.md`.

## What this phase must deliver (P2: SEO Engine)
- Requirements: `FR-SEO-001`, `FR-SEO-002`, `NFR-PERF-001`.
- Architecture: `connectors/wordpress/src/Seo/MetaSync.php` writing into Yoast/Rank Math/SEOPress post-meta.
- Duplicate Schema.org JSON-LD graph avoidance filter.
- Command Center PWA SEO Gap Fill screen (`/seo`, `SCR-07`).
- Changelog rollback recording in `wp_optiforge_changelog`.

## Entry checklist
- [x] P1 exit verified with green test output (`docs/project/evidence/P1/`).
- [x] SEO architecture and adapter specification verified in `docs/architecture/SEO_ADAPTERS.md`.
- [x] Zero open regressions from P-1, P0, P1.

## Ordered task list
- **P2-T01:** Create `connectors/wordpress/src/Seo/MetaSync.php` supporting Yoast, Rank Math, and SEOPress post-meta keys.
- **P2-T02:** Create `connectors/wordpress/src/Seo/SchemaFilter.php` for duplicate JSON-LD detection and graph enrichment.
- **P2-T03:** Write PHPUnit tests in `connectors/wordpress/tests/SeoTest.php` covering meta synchronization and schema deduplication.
- **P2-T04:** Implement SEO Gap Fill dashboard in `apps/pwa/src/app/seo/page.tsx` (`SCR-07`) with plan/diff review before apply and 1-click restore.
- **P2-T05:** Run audit, record evidence, and advance to Phase 3.

## Copy-paste resume prompt for a fresh session
`Read AGENTS.md and docs/project/NEXT_PHASE_BRIEF.md, run the B2 session start protocol, then continue with RUN_MODE=continue-all.`
