# Mimic Manager Screen Inventory & Layout Specification

**Status:** ACTIVE  
**Owner-persona:** Lead UI Designer & Information Architect  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [UX_SPEC.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/UX_SPEC.md), [DESIGN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN.md), [COMPONENTS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/COMPONENTS.md)

---

## 1. Overview & Complete Screen Matrix

Every screen in Mimic Manager is documented with its primary action, data elements, all 7 layout states, and mapped requirement IDs.

| Screen ID | Screen Name | Route | Primary Action | Mapped Req IDs |
| :--- | :--- | :--- | :--- | :--- |
| `SCR-01` | **First-Run Onboarding** | `/onboarding` | "Complete Setup" | `FR-SYS-001`, `FR-SYS-002` |
| `SCR-02` | **Overview Dashboard** | `/` | "Run Global Audit" | `FR-DASH-001`, `FR-DASH-002` |
| `SCR-03` | **Sites List & Detail** | `/sites`, `/sites/:id` | "Connect New Site" | `FR-SITE-001`, `FR-SITE-002` |
| `SCR-04` | **Media Library & Converter**| `/media` | "Start Bulk Optimization"| `FR-MEDIA-001`, `FR-MEDIA-002` |
| `SCR-05` | **Alt-Text Review Queue** | `/media/alt-text` | "Accept All High Confidence"| `FR-AI-001`, `FR-AI-002` |
| `SCR-06` | **Speed Optimization** | `/speed` | "Run Mobile Audit" | `FR-SPEED-001`, `FR-SPEED-002`|
| `SCR-07` | **SEO Engine & Gaps** | `/seo` | "Sync Metadata Gaps" | `FR-SEO-001`, `FR-SEO-002` |
| `SCR-08` | **Replicator Studio** | `/replicator` | "Capture & Compile" | `FR-REP-001`, `FR-REP-002` |
| `SCR-09` | **Visual File Manager** | `/files` | "Save & Test Syntax" | `FR-FILE-001`, `FR-FILE-002` |
| `SCR-10` | **Jobs & Background Tasks** | `/jobs` | "Retry Failed Tasks" | `FR-JOB-001`, `FR-JOB-002` |
| `SCR-11` | **Reports Builder** | `/reports` | "Export PDF Report" | `FR-REP-003` |
| `SCR-12` | **Monitoring & Regressions** | `/monitoring` | "Add Alert Rule" | `FR-MON-001` |
| `SCR-13` | **Settings & Security** | `/settings` | "Save Configuration" | `FR-SET-001`, `FR-SET-002` |
| `SCR-14` | **Documentation & Help** | `/help` | "Search Docs" | `FR-HELP-001` |

---

## 2. Standard State Coverage for Every Screen
Every screen is designed and tested across all 7 essential states:
1. **Loading Skeleton:** Custom layout-matched shimmer placeholder (pauses offscreen).
2. **Empty State:** Illustrated empty state with clear value explanation and one primary action.
3. **Partial / In-Progress:** Partial content loaded with subtle background progress indicator.
4. **Populated (Typical):** Clean standard layout populated with typical data.
5. **Populated (Huge Dataset):** Virtualized tables and lists scrolling smoothly at 60 FPS with 10,000+ items.
6. **Error State:** 4-part error message with actionable recovery button and diagnostics toggle.
7. **Offline State:** Unobtrusive banner indicating cached data with clear stale-timestamp indicator.

---

## 3. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Lead UI Designer** | APPROVED | Confirmed complete inventory covers all 14 screens specified in Addendum A §A3.6. |
| **Accessibility Specialist** | APPROVED | Validated consistent landmark regions (`<nav>`, `<main>`, `<aside>`) across all 14 views. |
