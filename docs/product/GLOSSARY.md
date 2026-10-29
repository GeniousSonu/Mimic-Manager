# OptiForge Domain Glossary

**Status:** ACTIVE  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v0.1.0-alpha  

---

| Term | Definition in OptiForge |
|---|---|
| **Action Scheduler** | Battle-tested WordPress background job queue library originally created for WooCommerce; handles durable retryable tasks in PHP without blocking web requests. |
| **Circuit Breaker** | Architectural pattern in the WordPress connector that trips after 3 consecutive backend failures, disabling remote requests for an exponential cooldown and gracefully falling back to local processing. |
| **CLS** | Cumulative Layout Shift; Core Web Vital measuring visual stability during page render (target < 0.1). |
| **Decompression Bomb** | Malicious compressed image (e.g. 10 KB file) that expands to tens of gigabytes in memory (100,000 x 100,000 pixels); mitigated via Sharp's `limitInputPixels`. |
| **Fix Registry** | Centralized collection of performance modifications implementing the 5-method contract: `detect`, `plan`, `apply`, `verify`, and `revert`. |
| **Guided Fix** | Performance finding that requires manual server or DNS configuration (e.g. Brotli compression, TTFB, hosting upgrade); OptiForge provides copy-paste snippets. |
| **HMAC-SHA256** | Hash-based Message Authentication Code using SHA-256; ensures mutual request integrity, origin authentication, and replay protection between connector and API. |
| **IR (Intermediate Representation)** | Normalized, viewport-aware DOM node tree `{id, tag, role, styles, layout, children, assets}` produced by the UI Replicator before compiling to Gutenberg blocks. |
| **LCP** | Largest Contentful Paint; Core Web Vital measuring perceptual render speed of the largest above-the-fold content element (target < 2.5s). |
| **Moderate Fix** | Performance modification that carries visual or functional regression risks (e.g. script deferral, critical CSS); strictly verified in headless Playwright preview before activation. |
| **Playwright Preview** | Isolated headless browser session running against a preview cookie/token to assert zero console errors, zero failed critical requests, and visual match before live apply. |
| **Safe Fix** | Performance modification guaranteed to be non-breaking and reversible (e.g. image width/height, native lazy loading, font-display: swap). |
| **SSRF** | Server-Side Request Forgery; vulnerability where an attacker tricks a server into accessing internal network addresses (e.g. `169.254.169.254`); mitigated via `packages/ssrf-guard`. |
