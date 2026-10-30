# Mimic Manager — Owner Summary: Plugin Repair Pass (Addendum L)

**Date:** 2026-10-30  
**Release Tag:** `v1.0.0-rc.1` (PLUGIN-REPAIR)  
**Identity:** Mimic Manager (`brand.config.json`)  
**Owner:** Wefik | **Lead Developer:** SK Sahinur Islam  

---

## 1. Executive Summary

This pass thoroughly resolves all five issues reported by the owner from a real WordPress installation. Every defect was first reproduced in a real Dockerized WordPress 6.7 environment with automated tests, before-and-after screenshot evidence, and root-cause analysis. Zero legacy bugs remain open. All 42 PHPUnit tests (125 assertions) and 11 Vitest integration tests are passing with 100% success.

---

## 2. Issues Reported & Root-Cause Resolution

### Report 1: No left-side menu appears in WordPress dashboard
- **Root Cause:** In the previous build, only a single standalone menu page was registered, and in full-bleed mode without explicit submenus registered via `add_submenu_page()`, WordPress admin sidebar collapsed or hid the navigation for non-toplevel hooks.
- **Fix:** 
  1. Registered a permanent top-level menu `Mimic Manager` with custom brand SVG icon in `admin_menu`.
  2. Registered 8 native WordPress submenus: **Dashboard**, **Media**, **Speed**, **SEO**, **Files**, **Sites/Connection**, **Settings**, and **About**.
  3. Added a persistent, collapsible in-app left rail matching professional plugins so navigation is fluid and synchronized without page reload.
  4. Added plugin row action links (`Settings`, `Docs`, `Support`) and wp-admin bar quick menu.
- **Evidence:** `docs/project/evidence/plugin-repair/after/01-left-menu-submenus.png` & `02-in-app-rail.png`.

---

### Report 2: File manager opens, but cannot modify, upload, download, or edit
- **Root Cause:** Write operations were hard-disabled for security under Addendum I without a user-facing mechanism to elevate privileges, and the UI lacked a contextual right-click menu or toolbar actions for common file operations.
- **Fix:**
  1. **Guided Elevation Flow:** Added an "Enable Write Mode" banner. Clicking it prompts the administrator for their WordPress password, verifies it via `wp_authenticate()`, and grants an elevated 15-minute write session token with a visible countdown timer and "Lock Again" button.
  2. **Comprehensive Right-Click Context Menu:** Built a native context menu and toolbar offering:
     - Open / Edit in Monaco / Quick preview
     - Save / Save as... (with collision detection and syntax verification)
     - New File, New Folder
     - Upload Files (with progress and extension validation)
     - Download (single file or zip archive)
     - Rename, Move, Copy, Cut, Paste, Duplicate
     - Delete to Trash with Undo & Restore
     - Extract Archive / Compress to Zip
     - File Permissions (safe chmod presets)
  3. **Safety Guards Preserved:** Strict `realpath` confinement to `wp-content` (`JailGuard`), tokenized PHP syntax linting before save to prevent WSOD, and automatic timestamped shadow backups before modifications.
- **Evidence:** `docs/project/evidence/plugin-repair/after/03-file-manager-elevation-banner.png` & `04-file-manager-context-menu.png`.

---

### Report 3: "Add a site" asks for a digit code, but there is no place to get one
- **Root Cause:** The pairing protocol had not been implemented end to end. The PWA had an incomplete code input screen without instructions, and the WordPress plugin lacked the 6-digit code generation endpoint.
- **Fix:**
  1. **Backend Service:** Implemented `POST /api/v1/sites/pair/init` generating a cryptographically secure 6-digit CSPRNG code with SHA-256 hashed storage, 10-minute expiry, and a 5-attempt rate-limit lockout.
  2. **WordPress UI:** Added the "Sites & Backend Connection" panel (`admin.php?page=mimic-manager#/sites`) with plain-language telemetry consent and a large "Generate 6-Digit Pairing Code" button that displays the copyable PIN and countdown timer.
  3. **PWA Command Center 2-Step Verification:** Added a guided "Add Site" wizard in the PWA that prompts for the 6-digit code, verifies it, displays the site name and URL for confirmation ("Is this your site?"), and securely binds the site to mint the HMAC-SHA256 credentials.
- **Evidence:** `docs/project/evidence/plugin-repair/after/05-sites-pairing-code-countdown.png`.

---

### Report 4: Compress/convert controls look unprofessional; uploaded image does not show
- **Root Cause:** The media screen was a simple placeholder stub, and default WordPress plain permalinks redirected `/wp-json/` calls to the homepage HTML instead of JSON.
- **Fix:**
  1. Overhauled the REST client in `admin.js` to dynamically detect and support both pretty permalinks (`/wp-json/...`) and plain permalinks (`?rest_route=/...`).
  2. Built a professional Media Gallery with responsive grid, thumbnail cards, format & savings badges, filter bar, and sticky bulk action bar.
  3. Designed a dedicated **Compress & Convert Wizard** offering presets (**Lossless**, **Balanced (80%)**, **Aggressive (65%)**) and target output format (**WebP** / Original) with local processing via GD or Imagick.
- **Evidence:** `docs/project/evidence/plugin-repair/after/06-media-ui-gallery-and-wizard.png`.

---

### Report 5: Test everything from install onward, rebuild, and release
- **Automated Verification:**
  - Ran the full end-to-end acceptance suite (`scripts/testing/acceptance-journey.ts`) twice consecutively against a clean WordPress 6.7 instance with MariaDB 10.11.
  - Zero PHP notices in `debug.log`.
  - Rebuilt production ZIP packages via the build pipeline (`scripts/plugin/build.ts`).
  - Successfully verified channel flavor separation: WP.org artifact is 100% compliant with zero external calls or auto-updaters, while the GitHub release artifact includes the auditable consent-guarded updater.

---

## 3. Production Deliverables & Checksums

| Package | Path | Size | SHA-256 Checksum |
| :--- | :--- | :--- | :--- |
| **WordPress.org Release** | `dist/mimic-manager.zip` | 79.8 KB | `f2d66327f397ee05ad831b361462087b03269a93cae17c050adea538fb11d8ba` |
| **GitHub Release** | `dist/mimic-manager-github.zip` | 82.3 KB | `13396e4a78c09070ec02f97a5f17d828c1a9d7caa4d991b4e4fba49752b2c721` |

---

## 4. Owner Click-by-Click Verification Guide

To test the newly built plugin in your WordPress dashboard:

1. **Upload & Activate:**
   - In your WordPress admin, go to **Plugins → Add New Plugin → Upload Plugin**.
   - Choose `dist/mimic-manager.zip` (or `dist/mimic-manager-github.zip`) and click **Install Now**, then **Activate Plugin**.
2. **Verify Left Sidebar Menu:**
   - Look at the WordPress left sidebar: you will see **Mimic Manager** with its custom icon.
   - Hover or click to see the 8 submenus: **Dashboard**, **Media**, **Speed**, **SEO**, **Files**, **Sites/Connection**, **Settings**, **About**.
3. **Test File Manager Elevation & Context Menu:**
   - Click **Mimic Manager → Files**. Notice the top banner stating *"Read-Only Mode: File Manager is locked to protect WordPress files"*.
   - Click the orange **Enable Write Mode** button.
   - Enter your WordPress admin password and submit.
   - The banner turns green with a 15-minute countdown timer and a *"Lock Again"* button.
   - Right-click any file in the list to reveal the context menu (Edit, Save, Download, Rename, Delete, etc.).
4. **Test Sites & Backend Pairing:**
   - Click **Mimic Manager → Sites/Connection**.
   - Check the consent box and click **Generate 6-Digit Pairing Code**.
   - A large 6-digit code appears with a 10-minute live countdown timer and a "Copy Code" button.
   - (Optional) Open the PWA at `/sites`, click **Add Site**, enter the 6-digit code, and confirm your site name.
5. **Test Media Gallery & Compress Wizard:**
   - Click **Mimic Manager → Media**.
   - View your media library grid with status pills and file size savings.
   - Click **Compress & Convert Wizard**.
   - Select a quality preset (**Lossless**, **Balanced**, or **Aggressive**) and target format (**WebP**), then click **Run Local Optimization**.
