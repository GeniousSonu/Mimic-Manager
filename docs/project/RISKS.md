# Comprehensive Risk Register & Red-Team Threat Matrix

**Total Failure Modes Cataloged:** 44  
**Review Status:** ACTIVE  
**Evaluation Date:** October 29, 2026  

---

## 1. Security & Channel Integrity Risks (SSRF, Auth, Transport)

| ID | Failure Mode | Severity | Mitigation & Architectural Defense |
|---|---|---|---|
| **SEC-01** | **SSRF to Cloud Metadata:** Attacker provides `http://169.254.169.254/latest/meta-data/` to Replicator or PageSpeed crawler to steal cloud IAM credentials. | CRITICAL | `packages/ssrf-guard` blocks link-local, RFC1918, loopback, and cloud metadata addresses before socket creation. |
| **SEC-02** | **DNS Rebinding Attack:** Attacker provides domain resolving to public IP on first lookup, then returning `127.0.0.1` on socket connection. | CRITICAL | `packages/ssrf-guard` performs custom DNS resolution, validates IP, and opens TCP/TLS connection directly to the pinned IP address. |
| **SEC-03** | **Redirect-based SSRF:** Public URL redirects to private internal IP (`http://victim.internal/admin`). | HIGH | Socket hooks re-validate every redirect hop against the IP guard (max 5 hops). |
| **SEC-04** | **IPv6 Multi-representation Bypass:** SSRF attempt using `[::ffff:127.0.0.1]` (IPv4-mapped IPv6) or hex/octal encoded IP formats. | HIGH | Strict IP parser expands and normalizes all IPv4/IPv6 representations to canonical numeric octets before comparison. |
| **SEC-05** | **HMAC Request Replay:** Attacker intercepts signed webhook/API request and replays it to trigger repeated actions. | HIGH | Required timestamp with 5-minute maximum drift window + unique nonce cached in Redis with a 10-minute TTL. |
| **SEC-06** | **HMAC Timing Attack:** Attacker measures signature comparison duration byte-by-byte to forge valid HMAC tags. | MEDIUM | Enforce constant-time equality check (`crypto.timingSafeEqual` in Node.js, `hash_equals` in PHP). |
| **SEC-07** | **Secret Exposure in Plugin Repo / Logs:** Site HMAC secret or API keys logged in error traces or serialized in bug reports. | HIGH | Sensitive headers and fields (`x-signature`, `secret`, `key`, `password`) are masked at the Pino / PHP logger boundary. |
| **SEC-08** | **Clock Skew False Rejections:** Out-of-sync server clocks between WordPress host and backend cause legitimate HMAC signatures to fail. | MEDIUM | Clear error code `AUTH_TIMESTAMP_SKEW` returned with backend server UTC timestamp to assist client-side sync. |

---

## 2. File System, Image & Media Risks

| ID | Failure Mode | Severity | Mitigation & Architectural Defense |
|---|---|---|---|
| **MED-01** | **Decompression Bomb (Pixel Flood):** User uploads 10 KB file that uncompresses to 50 GB in memory (e.g., 100,000 x 100,000 pixels), crashing worker. | CRITICAL | Libvips `limitInputPixels` configured to 268,402,689 (16,384 x 16,384 max), max file size 50 MB enforced before decompression. |
| **MED-02** | **MIME / Extension Spoofing:** Executable PHP script renamed to `image.png` uploaded to trigger remote code execution. | CRITICAL | Inspect file magic bytes (`file-type` / `finfo_file`); refuse files where magic bytes do not match declared image signatures. |
| **MED-03** | **SVG Stored XSS:** Uploaded SVG contains `<script>`, `onload=`, or malicious external `<use>` hrefs executed when viewed in browser. | HIGH | SVGO pipeline with DOMPurify sanitization strips scripts, foreignObject, event attributes, and external entity declarations. |
| **MED-04** | **Corrupt ICC Color Profile Hang:** Malformed ICC color profile in JPEG/TIFF causes infinite loop or crash in libvips. | MEDIUM | `sharp.withMetadata({ icc: 'srgb' })` with strict error handling; strip corrupt profiles on conversion error. |
| **MED-05** | **Compression Size Regression:** Optimized WebP/AVIF output is larger than original compressed JPG/PNG. | LOW | Result guarantee: compare byte size; if `outputBytes >= inputBytes`, discard variant and mark "already optimal". |
| **MED-06** | **Original Image Overwrite / Deletion:** Background optimization overwrites original master file, making uncompressed rollback impossible. | CRITICAL | Originals are never deleted automatically; variants stored in dedicated subpath or with `.webp` extension alongside original. |
| **MED-07** | **Disk Exhaustion from Temp Files:** Worker crashes mid-processing, leaving orphaned temp files until disk fills. | MEDIUM | Storage driver uses auto-expiring temporary keys and a periodic maintenance job that purges temp files older than 1 hour. |

---

## 3. WordPress Plugin & Runtime Stability Risks

| ID | Failure Mode | Severity | Mitigation & Architectural Defense |
|---|---|---|---|
| **WP-01** | **Fatal Error / White Screen of Death (WSOD):** Backend API goes down, causing unhandled exception in WordPress admin or frontend. | CRITICAL | All hook callbacks wrapped in `try/catch (\Throwable $e)`; fail silent, log error, and return original unaltered content. |
| **WP-02** | **Circuit Breaker Loop:** Plugin relentlessly tries to connect to dead backend, adding 10s latency to every page load. | HIGH | Circuit breaker trips after 3 consecutive failures; opens for exponential cooldown (up to 1 hour); disables remote calls. |
| **WP-03** | **Dependency Collision (Composer Hell):** Bundled Action Scheduler or Guzzle conflicts with another installed plugin's version. | HIGH | Use Strauss or PHP-Scoper to namespace and prefix all third-party PHP packages under `MimicManager\Vendor\*`. |
| **WP-04** | **DB Table Bloat from ChangeLog:** High-volume site accumulates millions of change records, degrading database performance. | MEDIUM | Configurable retention period (default 30 days) with automated daily cleanup via Action Scheduler; proper index on `(entity_type, entity_id)`. |
| **WP-05** | **REST API Disabled by Security Plugin:** Security plugin (e.g. iThemes/Wordfence) disables REST API, breaking connector pairing. | MEDIUM | Provide fallback admin-post AJAX endpoints or clear diagnostic messaging in plugin status panel. |
| **WP-06** | **Global Kill Switch Absence:** Plugin causes unexpected conflict and admin cannot access wp-admin. | HIGH | Implement constant `define('MIMIC_MANAGER_DISABLE', true);` and admin URL query `?mimic_manager_safe_mode=1` to bypass all filters. |
| **WP-07** | **wp_head Buffer Corruption:** Speed optimization buffer output breaks other plugins using output buffering. | MEDIUM | Avoid reckless global `ob_start()` without depth tracking; use specific standard WordPress filter hooks (`the_content`, `script_loader_tag`). |

---

## 4. SEO & Data Integrity Risks

| ID | Failure Mode | Severity | Mitigation & Architectural Defense |
|---|---|---|---|
| **SEO-01** | **Duplicate Schema Injection:** Plugin injects `WebSite` or `Organization` schema when Yoast or Rank Math has already generated it. | HIGH | HTML inspector & schema parser inspect rendered output; never output any schema type already detected in page DOM. |
| **SEO-02** | **Overwriting User-Authored Metadata:** Auto-SEO replaces carefully crafted hand-written meta descriptions with generic AI text. | CRITICAL | Strict rule: Only fill empty fields. Track `user_modified` flag in database; never overwrite user-modified fields without explicit toggle. |
| **SEO-03** | **SEO Plugin Conflict (Double Meta Tags):** Both Mimic Manager and Yoast output `<meta name="description">`, harming SEO ranking. | HIGH | Adapter architecture detects active SEO plugins (Yoast, Rank Math, SEOPress, AIOSEO) and writes into their native post-meta fields instead. |
| **SEO-04** | **Broken Canonical Tag Generation:** AI or heuristic canonical points to wrong domain, query parameter URL, or causes duplicate loop. | HIGH | Strict canonical derivation from WordPress `wp_get_canonical_url()`; validate URL syntax and protocol. |
| **SEO-05** | **Accidental Noindex Tag Injection:** Buggy rule applies `noindex, nofollow` to production pages. | CRITICAL | `noindex` can never be applied by any auto-fix. Audit rule only alerts the user if `noindex` is detected on non-staging sites. |
| **SEO-06** | **Redirect Loop Creation:** Redirect manager rule maps Page A -> Page B -> Page A, locking out users and search crawlers. | HIGH | Redirect creation logic runs cycle detection algorithm before persisting any 301/302 rule. |

---

## 5. PageSpeed & Fix Verification Risks

| ID | Failure Mode | Severity | Mitigation & Architectural Defense |
|---|---|---|---|
| **SPD-01** | **Breaking E-Commerce Checkout with Defer JS:** Deferring scripts breaks WooCommerce Stripe payment gateway or cart recalculation. | CRITICAL | Default exclusion list protects jQuery, WooCommerce checkout/cart routes, and analytics consent scripts; verify before apply. |
| **SPD-02** | **False Positive Verification:** Playwright verifies page with empty cart, missing the JavaScript crash on user interaction. | HIGH | Verification runs synthetic interaction test suite: menu toggle, form focus, button click, and checks `window.errors`. |
| **SPD-03** | **Layout Shift Regression (CLS):** Removing or modifying CSS causes massive visual jump during page load. | HIGH | Verification measures Core Web Vitals (CLS) delta in Playwright; auto-reverts if CLS increases by > 0.05. |
| **SPD-04** | **Critical CSS Truncation:** Playwright critical CSS extraction misses styles needed for dynamic mobile navigation drawer. | MEDIUM | Extract critical CSS across 3 viewports (desktop, tablet, mobile); load full stylesheet asynchronously with `onload` fallback. |
| **SPD-05** | **Visual Regressions on Dynamic Content:** Pixelmatch screenshot comparison fails due to live date/clock or video carousel. | MEDIUM | Mask dynamic regions (ads, timestamps, carousels) during screenshot comparison; use perceptual diff threshold (1%). |
| **SPD-06** | **Unused CSS Stripping Breaks Modals:** Stripping "unused" CSS removes classes used exclusively by popup dialogs. | HIGH | Safe tier only; CSS stripping is restricted to Guided tier with human review or conservative whitelist. |

---

## 6. UI Replicator Risks

| ID | Failure Mode | Severity | Mitigation & Architectural Defense |
|---|---|---|---|
| **REP-01** | **Copyright / Trademark Infringement:** User attempts to clone commercial websites, exposing platform to DMCA/legal claims. | HIGH | Mandatory legal terms of service acknowledgment; store `consentAckAt`; enforce robots.txt by default; placeholder image mode. |
| **REP-02** | **Hostile Site Browser Hang (Infinite Loop):** Target site contains `while(true)` or canvas bomb designed to freeze scraper. | HIGH | Playwright worker runs in dedicated sandbox container with strict CPU/memory limits and 30-second hard wall-clock timeout. |
| **REP-03** | **Massive DOM Memory Crash:** Scraped site has 500,000 DOM nodes, causing Node.js process Out-Of-Memory (OOM). | HIGH | Maximum DOM extraction cap (1,500 nodes); abort capture and return `ERR_DOM_TOO_COMPLEX` if exceeded. |
| **REP-04** | **Gutenberg Block Validation Errors:** Generated block HTML has formatting discrepancies that trigger block validation warning in WP. | HIGH | Round-trip validate generated block output against `@wordpress/blocks` parser and serializer before export. |
| **REP-05** | **CSS Collision with Theme Styles:** Scraped section CSS leaks into existing theme styles, distorting headers or footers. | MEDIUM | All extracted CSS rules are strictly scoped under a unique wrapper class (`.mm-replicator-[id]`). |
| **REP-06** | **External Asset Hotlinking:** Cloned sections link directly to images hosted on target third-party domain. | MEDIUM | Download assets through media engine, sanitize SVGs, and re-host to local media library or substitute placeholders. |

---

## 7. WordPress Visual File Manager Risks

| ID | Failure Mode | Severity | Mitigation & Architectural Defense |
|---|---|---|---|
| **FIL-01** | **Path Traversal / Jail Escape:** Attacker sends `../../wp-config.php` or `..%2f..%2f` to read database passwords. | CRITICAL | Canonicalize paths with `realpath()`; verify resolved path starts strictly with allowed root directory (`wp-content`). |
| **FIL-02** | **Symlink Escape:** Attacker creates symlink pointing to `/etc/passwd` or `/var/www/`. | CRITICAL | Refuse to follow symlinks whose target resolves outside the permitted jail root. |
| **FIL-03** | **Direct RCE via Web-Shell Upload:** Attacker uploads `shell.php` into uploads directory. | CRITICAL | Block upload of executable extensions (`php`, `phtml`, `phar`, `sh`, `cgi`); verify file content against MIME whitelist. |
| **FIL-04** | **White Screen from PHP Syntax Error:** User edits theme `functions.php`, introduces typo, and bricks site. | CRITICAL | Execute pre-save linting (`php -l` or bundled PHP parser); abort save operation if syntax validation fails. |
| **FIL-05** | **Zip Slip Vulnerability:** Extracting a malicious zip file containing `../../payload.php` overwrites arbitrary system files. | CRITICAL | Validate every zip entry target path before extraction; reject any archive containing directory traversal paths. |
| **FIL-06** | **Concurrent Edit Overwrite (Lost Updates):** Two users edit the same file; User B blindly overwrites User A's changes. | MEDIUM | Optimistic locking using file SHA-256 hash or mtime; warn and prompt with diff if file modified since opened. |

---

## 8. Queue, Infrastructure & Distributed System Risks

| ID | Failure Mode | Severity | Mitigation & Architectural Defense |
|---|---|---|---|
| **SYS-01** | **Redis / MongoDB Split Brain or Outage:** Temporary network glitch between worker and Redis causes lost jobs. | HIGH | BullMQ stalled job detection, automatic retry with exponential backoff + jitter; jobs persisted in MongoDB before queueing. |
| **SYS-02** | **Duplicate Job Execution:** Worker restart triggers retry of already completed media optimization, corrupting state. | MEDIUM | Idempotency keys (`idempotencyKey` index) on all jobs; processors check current database state before mutating files. |
| **SYS-03** | **Dead Letter Queue (DLQ) Silent Poisoning:** Poison-pill job continuously crashes workers and fills DLQ undetected. | MEDIUM | Capped retries (max 3); failed jobs moved to DLQ with structured error codes; admin dashboard alert on DLQ accumulation. |
