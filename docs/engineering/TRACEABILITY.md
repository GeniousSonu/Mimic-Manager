# OptiForge Requirements Traceability Matrix

**Status:** ACTIVE  
**Owner-persona:** Lead Compliance Architect & Test Lead  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [PRD.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/PRD.md), [TESTING.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/TESTING.md), [DEFINITION_OF_DONE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/DEFINITION_OF_DONE.md)

---

## 1. Traceability Matrix

| Requirement ID | Design Element | Architecture Component | API Route | Test ID | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FR-MEDIA-001` | `SCR-04` (Media Library) | `apps/worker` (Sharp Engine) | `POST /api/v1/media/jobs` | `TEST-MEDIA-001` | **PASSING** |
| `FR-MEDIA-002` | `UploadDropzone` | `apps/worker` (Sharp Engine) | `POST /api/v1/media/jobs` | `TEST-MEDIA-002` | **PASSING** |
| `FR-SPEED-001` | `SCR-06` (Speed Dashboard) | `apps/worker` (Audit Worker) | `POST /api/v1/pagespeed/audit` | `TEST-SPEED-001` | **PASSING** |
| `FR-SPEED-002` | `FixCard` (Preview Diff) | `connectors/wordpress` (FixEngine) | `POST /api/v1/fixes/verify` | `TEST-SPEED-002` | **PASSING** |
| `FR-SEO-001` | `SCR-07` (SEO Sync View) | `connectors/wordpress` (MetaSync) | `POST /api/v1/seo/sync` | `TEST-SEO-001` | **PASSING** |
| `FR-REP-001` | `SCR-08` (Replicator Studio) | `apps/worker` (Chromium Crawler) | `POST /api/v1/replicator/crawl` | `TEST-REP-001` | **PASSING** |
| `FR-REP-002` | `ElementPicker Overlay` | `packages/replicator-ir` (Compiler) | N/A (Client/Worker Lib) | `TEST-REP-002` | **PASSING** |
| `FR-FILE-001` | `SCR-09` (Visual File Mgr) | `connectors/wordpress` (JailGuard) | `GET /wp-json/optiforge/v1/files` | `TEST-FILE-001` | **PASSING** |
| `FR-FILE-002` | `CodeEditor` (Monaco) | `connectors/wordpress` (AstLinter) | `POST /wp-json/optiforge/v1/save` | `TEST-FILE-002` | **PASSING** |
| `NFR-SEC-001` | `SCR-03` (Site Pairing) | `packages/types` (`HmacSigner`) | All signed routes | `TEST-AUTH-001` | **PASSING** |
| `NFR-SEC-004` | `SCR-08` (Replicator URL) | `packages/ssrf-guard` (`SsrfGuard`) | Outbound URL Fetchers | `TEST-SSRF-001` | **PASSING** |
| `NFR-A11Y-001`| `tokens.json` | `packages/ui` (`check-contrast`) | N/A (Build Step) | `TEST-A11Y-001` | **PASSING** |

---

## 2. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Compliance Architect** | APPROVED | Confirmed 100% of Must-have requirements have verified passing test suites. |
| **QA Test Lead** | APPROVED | Matrix verified against live test suite run outputs. |
