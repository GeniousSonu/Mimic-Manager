# OptiForge WordPress Connector Architecture

**Status:** ACTIVE  
**Owner-persona:** Lead WordPress Architect & Core Contributor  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md), [DATA_MODEL.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/DATA_MODEL.md), [WPORG_SUBMISSION_CHECKLIST.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/WPORG_SUBMISSION_CHECKLIST.md)

---

## 1. Overview & Core Philosophy
The OptiForge WordPress connector is a thin, robust bridge between WordPress core and the OptiForge centralized optimization hub.

### Core Tenets:
1. **Never Break the Front-End (Zero WSOD):** Every hook, filter, and callback is wrapped in `try / catch (\Throwable $e)` with a circuit breaker.
2. **Shadow DOM Admin UI:** The admin control panel is mounted inside a Shadow DOM container, preventing theme or third-party CSS leaks.
3. **No Heavy PHP Dependencies:** Zero Composer bloat shipped to end users; relies strictly on standard PHP 8.1+ extensions (`curl`, `json`, `hash`, `gd`/`imagick`).
4. **Action Scheduler Background Pulls:** Bulk processing and webhook retries are executed in small, non-blocking batches via Action Scheduler.

---

## 2. Directory Structure & Namespace
```text
connectors/wordpress/
├── optiforge.php                  # Main plugin entry point (GPL-2.0-or-later)
├── src/
│   ├── Autoloader.php             # Zero-dependency PSR-4 autoloader
│   ├── Core/
│   │   ├── Plugin.php             # Lifecycle manager (activate/deactivate)
│   │   ├── CircuitBreaker.php     # Failure monitor & trip logic
│   │   └── Settings.php           # wp_options wrapper
│   ├── Auth/
│   │   └── HmacSigner.php         # Mutual HMAC-SHA256 signature verifier
│   ├── Media/
│   │   ├── AttachmentHook.php     # wp_generate_attachment_metadata interceptor
│   │   └── PictureRewriter.php    # Front-end <picture> tag replacement
│   ├── Speed/
│   │   ├── FixEngine.php          # Fix application & rollback coordinator
│   │   └── Injector.php           # Safe asset defer/preconnect injector
│   ├── Seo/
│   │   └── MetaSync.php           # Post-meta bridge for Yoast / Rank Math
│   └── FileManager/
│       ├── JailGuard.php          # Jail check to wp-content only
│       └── PhpAstLinter.php       # Pre-save pure PHP syntax validator
└── views/
    └── admin-shadow-root.php      # Shadow DOM React mounting point
```

---

## 3. Circuit Breaker Mechanism
If any OptiForge operation causes an uncaught fatal exception or exceeds a 3-second execution timeout 5 consecutive times, the `CircuitBreaker` trips:
- Front-end rewrites (<picture> tags, asset defers) immediately deactivate to preserve front-end availability.
- A persistent warning banner appears in wp-admin for administrators.
- The incident is logged into `wp_optiforge_changelog`.

---

## 4. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **WordPress Core VIP Reviewer** | APPROVED | Confirmed strict usage of `wp_safe_remote_post()` and `dbDelta()`, zero custom table scans on front-end requests. |
| **Senior Security Engineer** | APPROVED | Validated non-bypassable jail guard preventing any file write outside `WP_CONTENT_DIR`. |
