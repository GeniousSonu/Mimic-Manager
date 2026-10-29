# User Stories and Acceptance Criteria

**Status:** ACTIVE  
**Owner-persona:** Lead Product Architect & QA Lead  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v0.1.0-alpha  
**Related-docs:** [PRD.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/PRD.md), [PERSONAS_AND_JTBD.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/PERSONAS_AND_JTBD.md), [docs/engineering/TRACEABILITY.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/TRACEABILITY.md)

---

## 1. Media Optimization Pillar

### `US-MED-01`: Automatic Async Image Optimization on Upload
- **As a** WordPress content editor,
- **I want** uploaded images to be converted into WebP/AVIF asynchronously in the background,
- **So that** my editor never freezes and visitors automatically receive lightweight modern image formats.

**Acceptance Criteria (Given / When / Then):**
- **Scenario 1: Successful background variant generation**
  - **Given** an uncompressed JPEG image is uploaded to WordPress media library,
  - **When** WordPress finishes storing the original master file,
  - **Then** an Action Scheduler task is registered, original bytes are pushed to Mimic Manager API, the worker produces WebP and AVIF variants, delivers them via signed webhook, and WordPress updates attachment metadata with variant URLs.
- **Scenario 2: Remote backend unavailable (Circuit Breaker fallback)**
  - **Given** the Mimic Manager backend is offline or unresponsive,
  - **When** an image is uploaded,
  - **Then** the plugin falls back to local GD/Imagick WebP compression, wp-admin remains fast (< 5ms overhead), and no fatal error is thrown.

---

### `US-MED-02`: Bulk Media Library Optimization
- **As an** agency developer taking over a legacy site,
- **I want** to scan the entire media library and bulk-optimize uncompressed images,
- **So that** I can reclaim disk space and improve mobile PageSpeed scores across the whole domain.

**Acceptance Criteria:**
- **Scenario 1: Estimated savings calculation**
  - **Given** a library with 500 uncompressed images,
  - **When** the user launches the Bulk Wizard,
  - **Then** the system calculates estimated savings (e.g. "~142 MB potential reduction") before running.
- **Scenario 2: Resumable chunked processing**
  - **Given** an active bulk run of 500 images,
  - **When** the browser tab is closed or server restarts,
  - **Then** the queue persists in Action Scheduler and resumes seamlessly from the last completed file.

---

## 2. AI Metadata Pillar

### `US-AI-01`: Contextual Alt-Text Generation
- **As an** accessibility-focused publisher,
- **I want** images to receive screen-reader-friendly alt text generated using the surrounding post title and headings,
- **So that** I achieve WCAG 2.2 accessibility compliance without writing descriptions manually.

**Acceptance Criteria:**
- **Scenario 1: Empty alt text auto-fill**
  - **Given** an image attached to post "Modern Kitchen Renovation Guide",
  - **When** the AI metadata processor runs,
  - **Then** it generates descriptive alt text (e.g., "White marble kitchen countertop with stainless steel fixtures") ≤ 125 characters and saves it to post-meta.
- **Scenario 2: Existing alt text preservation**
  - **Given** an image with existing hand-written alt text "Custom heirloom dining table",
  - **When** the AI processor runs,
  - **Then** it leaves the existing alt text untouched unless the user explicitly chose "Overwrite Existing".

---

## 3. Speed & Core Web Vitals Pillar

### `US-SPD-01`: One-Click Safe Speed Fixes
- **As a** non-technical site owner,
- **I want** to click "Optimize Safe" to resolve layout shift issues instantly,
- **So that** my Core Web Vitals improve without any chance of breaking my theme.

**Acceptance Criteria:**
- **Scenario 1: Missing image dimensions injection**
  - **Given** page HTML containing `<img>` tags without `width` and `height`,
  - **When** the Safe Fix runs,
  - **Then** it injects intrinsic `width` and `height` attributes matching natural image aspect ratios.

### `US-SPD-02`: Playwright Verification & Auto-Revert on Moderate Fixes
- **As an** agency director,
- **I want** aggressive script deferral tested by a headless browser before going live,
- **So that** broken scripts or payment gateways are caught and rolled back automatically.

**Acceptance Criteria:**
- **Scenario 1: Reverting when JavaScript crashes**
  - **Given** a script deferral fix applied to a preview session,
  - **When** Playwright renders the page and detects `Uncaught TypeError: $ is not a function`,
  - **Then** the fix is rejected, the prior state is restored, and an incident report with console logs is shown in the dashboard.
