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

---

## 4. UI/UX V2 Refactor Pillar (Addendum I: `PLUGIN-UI-V2`)

### `UX-V2-001`: Single Top-Level Menu & Legacy URL Redirection
- **As a** WordPress site administrator,
- **I want** exactly one clean top-level menu item (`mimic-manager`) with legacy submenu URLs redirected,
- **So that** my wp-admin sidebar is uncluttered while existing bookmarks continue working seamlessly.
- **Acceptance Criteria:**
  - `admin_menu` registers only `mimic-manager` (slug from `brand.config.json`).
  - Accessing legacy `admin.php?page=mimic-manager-media` or similar redirects to `admin.php?page=mimic-manager#/media` via HTTP 302 or client routing.

### `UX-V2-002`: HashRouter SPA Shell Navigation
- **As a** site administrator,
- **I want** internal navigation via hash routes (`#/dashboard`, `#/media`, `#/speed`, `#/seo`, `#/files`, `#/settings`, `#/about`),
- **So that** WordPress maintains control over the admin URL path while the SPA handles instant view transitions without reloading.
- **Acceptance Criteria:**
  - Route changes update window hash without document reloading.
  - Unknown routes render a branded 404 view within the app shell.

### `UX-V2-003`: Zero Document Navigation / Full Reload
- **As a** user navigating the plugin interface,
- **I want** seamless sub-100ms view switching,
- **So that** the application feels like a modern native tool with zero full-page reloads.
- **Acceptance Criteria:**
  - Navigating between views produces 0 `framenavigated` events on main frame and 0 network requests of type `document`.

### `UX-V2-004`: Server-Authoritative Capabilities & Nonce Security
- **As a** security officer,
- **I want** client routing to be purely cosmetic with server-side authorization enforcement,
- **So that** low-privilege users cannot perform administrative actions even if they manipulate the client state.
- **Acceptance Criteria:**
  - Every REST endpoint verifies nonces and `current_user_can('manage_options')` or relevant capability.
  - REST requests with insufficient capabilities are rejected with HTTP 403 Forbidden.

### `UX-V2-005`: Unsaved Changes Guard
- **As a** developer editing code in the file manager,
- **I want** a confirmation prompt if I try to leave with unsaved changes,
- **So that** my edits are never accidentally lost.
- **Acceptance Criteria:**
  - Attempting to switch routes or close tab when the editor is dirty prompts with verb-labeled buttons: "Save", "Discard", "Keep editing".
  - On WordPress session expiry, a calm re-login banner is displayed while in-memory draft is preserved.

### `UX-V2-006`: UI Preference Store & Background Task Polling
- **As an** administrator running bulk operations,
- **I want** task statuses to persist across internal route changes,
- **So that** long-running compressions or scans remain visible in a compact header indicator.
- **Acceptance Criteria:**
  - Non-sensitive UI preferences (theme, view mode, sidebar state) persist in `localStorage` under `mm_` prefix.
  - Background task status polls with exponential backoff and pauses when the browser tab is hidden.

### `UX-V2-007`: Full-Bleed CSS Breakout (`mm-fullbleed`)
- **As a** user,
- **I want** a full-bleed interface that eliminates wp-admin container margins,
- **So that** the workspace maximizes available screen real estate without double scrollbars.
- **Acceptance Criteria:**
  - Body class `mm-fullbleed` is applied strictly on `mimic-manager` screen via `admin_body_class`.
  - Margins and padding on `#wpcontent`, `#wpbody-content`, and `.wrap` are removed; `#wpfooter` is hidden; WP admin bar and left menu remain fully functional.
  - Height equals `100dvh - var(--wp-admin--admin-bar--height, 32px)`.

### `UX-V2-008`: Collapsible WordPress Notices Tray
- **As an** administrator,
- **I want** third-party and core WordPress notices organized cleanly,
- **So that** critical notices remain accessible without breaking the full-bleed app layout.
- **Acceptance Criteria:**
  - Admin notices outside `#mimic-manager-root` are collected into a collapsible "WordPress notices (N)" tray in the shell header.

### `UX-V2-009`: Full-Screen Toggle & Hostile CSS Isolation
- **As a** user with legacy preferences,
- **I want** to toggle between full-bleed and standard wp-admin padding,
- **So that** I have control over display density.
- **Acceptance Criteria:**
  - "Exit full-screen" toggle toggles the full-bleed class and saves preference in `localStorage`.
  - Injected hostile styles (`* { box-sizing: content-box !important; }`) do not degrade the application UI.

### `UX-V2-010`: Design Tokens (Deep Space & Graphite Palette)
- **As a** design reviewer,
- **I want** a dark-first aesthetic with `#0A0A0B` canvas, `#161618` graphite surfaces, and Cyan `#00E5FF` / Violet `#7B61FF` accents,
- **So that** the visual presentation is refined, modern, and passes WCAG 2.2 AA contrast checks.
- **Acceptance Criteria:**
  - Contrast checker passes all pairs (text ≥ 4.5:1, UI boundaries ≥ 3.0:1).
  - Inter and JetBrains Mono fonts self-hosted locally with zero CDN calls.

### `UX-V2-011`: Dashboard Redesign with Compact Badges Strip
- **As a** site administrator,
- **I want** an information-dense dashboard with a compact status badge strip,
- **So that** I can assess server and optimization readiness at a single glance without oversized cards.
- **Acceptance Criteria:**
  - Compact status badges: `● Imagick active`, `● GD available`, `● WebP supported`, `● Local-only`.
  - Metrics grid with savings sparkline, images status, speed delta, and SEO severities.

### `UX-V2-012`: 3-Pane File Manager Layout
- **As an** engineer managing site files,
- **I want** a 3-pane layout (tree, data grid, details inspector),
- **So that** I can browse, inspect, and edit files efficiently.
- **Acceptance Criteria:**
  - Resizable left tree (200px - 400px), sticky action bar, virtualized data grid, and collapsible right inspector.

### `UX-V2-013`: Jailed Tree & Locked Core Nodes
- **As a** security administrator,
- **I want** the file tree jailed to `wp-content` with core directories locked,
- **So that** critical core files cannot be accessed or corrupted.
- **Acceptance Criteria:**
  - Default root is `wp-content`. `wp-admin` and `wp-includes` appear as locked core nodes with a lock badge and cannot be expanded without advanced mode and re-auth.
  - Path traversal attempts return 403 Forbidden.

### `UX-V2-014`: Action Bar with Honest Disabled States
- **As a** user in read-only mode,
- **I want** write buttons to clearly explain why they are disabled,
- **So that** I never click a button that silently does nothing.
- **Acceptance Criteria:**
  - New File, New Folder, Upload, Rename, Delete display a tooltip explaining read-only status and how to enable write mode.

### `UX-V2-015`: Multi-Select Virtualized Data Grid
- **As an** administrator managing thousands of uploads,
- **I want** a high-performance virtualized grid with multi-selection support,
- **So that** I can sort, select, and inspect large directories smoothly at 60 fps.
- **Acceptance Criteria:**
  - Single click, Ctrl/Cmd+click, Shift+click, and Ctrl/Cmd+A multi-selection supported.
  - Status bar updates selection summary ("N selected, X MB").

### `UX-V2-016`: Sandboxed Editor Overlay with Syntax Linting
- **As a** developer editing theme files,
- **I want** a slide-over code editor with pre-save PHP syntax checks,
- **So that** my code is validated before saving and cannot trigger a WSOD.
- **Acceptance Criteria:**
  - Opens text files (`.php`, `.js`, `.css`, `.json`, etc.) in a sliding modal panel.
  - PHP syntax check executes before commit; syntax errors block save and display line errors.
  - Shadow backup created before every save with 1-click restore.

### `UX-V2-017`: Breadcrumb Path Bar & Details Inspector
- **As a** user navigating deep folders,
- **I want** a breadcrumb path bar with copy button and a detailed file inspector,
- **So that** I have full visibility into file path, size, permissions, and hash.
- **Acceptance Criteria:**
  - Breadcrumbs stay in sync with URL hash (`#/files?path=...`).
  - Details inspector displays full path, permissions, sha256 hash on demand, and image dimensions.

### `UX-V2-018`: Unified Views Harmonization
- **As a** user switching between tools,
- **I want** Media, Speed, SEO, Settings, and About views to follow identical design tokens and density,
- **So that** the entire plugin feels cohesive.
- **Acceptance Criteria:**
  - All views render inside the SPA shell with consistent headers, compact cards, and zero full-page reloads.

### `UX-V2-019`: Accessibility, i18n & Performance Gates
- **As an** accessibility evaluator,
- **I want** full keyboard navigation, visible focus rings, and proper ARIA landmarks,
- **So that** the interface is accessible to all users.
- **Acceptance Criteria:**
  - WCAG 2.2 AA compliant focus rings (3:1 contrast), roving tabindex in tree and grid.
  - Initial JS bundle < 250 KB gz excluding lazy Monaco.

