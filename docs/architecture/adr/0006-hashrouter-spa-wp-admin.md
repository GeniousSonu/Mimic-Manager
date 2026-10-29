# ADR-0006: HashRouter SPA Navigation for WordPress Admin Shell

- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** In WordPress wp-admin, WordPress core completely owns the URL path (`/wp-admin/admin.php`) and primary query parameters (`page=mimic-manager`). If a Single Page Application (SPA) uses HTML5 History API (`BrowserRouter`), routing conflicts occur with wp-admin query handling, bookmarking breaks without server rewrites, and navigating between views risks sending unexpected document requests to WordPress core.
- **Decision:** We use React Router with `HashRouter` (`window.location.hash`). Supported internal routes: `#/dashboard`, `#/media`, `#/speed`, `#/seo`, `#/files`, `#/settings`, `#/about`. Any unrecognized hash renders a branded 404 screen inside the shell. Legacy submenu URLs (`admin.php?page=mimic-manager-media`, etc.) automatically redirect to the unified top-level menu with the matching internal hash (`admin.php?page=mimic-manager#/media`).
- **Alternatives Considered:**
  1. *BrowserRouter / HTML5 History API:* Requires custom server-side rewrite rules in `.htaccess`/nginx, desynchronizes with wp-admin native menus, and breaks on subfolder installations.
  2. *Traditional Multi-Page wp-admin Submenus:* Causes full document reloads on every navigation, re-evaluating PHP hooks, re-fetching assets, and destroying client-side background task progress.
- **Consequences:**
  - *Positive:* 100% client-side instant view switching (< 100ms); zero document reloads; background tasks (bulk optimization, scans) survive route transitions; bookmarks and deep links function out of the box across all WordPress hosts.
  - *Negative:* Hash fragments are not sent in HTTP request headers to the server; therefore, access authorization cannot rely on hash parsing and must be validated on every REST API call.
- **Verification:** Automated Playwright test verifies zero `framenavigated` events on the main frame and 0 network requests of type `document` across all route transitions.
