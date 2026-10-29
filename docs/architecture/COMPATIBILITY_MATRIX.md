# OptiForge Compatibility Matrix

**Status:** ACTIVE  
**Owner-persona:** Release Engineer & QA Specialist  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [WORDPRESS_PLUGIN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/WORDPRESS_PLUGIN.md), [ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md), [SELF_HOSTING.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/SELF_HOSTING.md)

---

## 1. Supported Environments & Dependencies

### 1.1 WordPress Connector Compatibility
| Component | Minimum Version | Recommended Version | Tested Up To | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **WordPress Core** | 6.0 | 6.6+ | 6.7 | Compatible with Classic & Block (Gutenberg) themes. |
| **PHP Runtime** | 8.1 | 8.2 / 8.3 | 8.4 | Strict typing, attributes, and fiber compatibility. |
| **MySQL / MariaDB** | MySQL 5.7 / MariaDB 10.3 | MySQL 8.0+ / MariaDB 10.6+ | MySQL 8.4 | Utilizes standard InnoDB `dbDelta` schema. |
| **PHP Extensions** | `curl`, `json`, `hash`, `mbstring` | `gd` or `imagick` | N/A | Core extensions for signature & fallback operations. |

---

### 1.2 OptiForge Hub & Self-Hosting Stack
| Software | Minimum Version | Recommended Version | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | 20.x LTS | 22.x LTS | API, worker, and command center runtime. |
| **Docker Engine** | 24.0+ | 27.0+ | Supports Compose v2 and rootless containers. |
| **MongoDB** | 6.0 | 7.0+ | Requires wiredTiger engine with TTL index support. |
| **Redis** | 6.2 | 7.2+ | AOF enabled (`appendonly yes`) for BullMQ persistence. |
| **Sharp / libvips** | 0.33+ | 0.35+ | Pre-built libvips with AVIF & WebP support. |

---

### 1.3 Third-Party Plugin Coexistence Matrix
| Plugin / Tool | Coexistence Mode | Potential Conflict | Mitigation Mechanism |
| :--- | :--- | :--- | :--- |
| **Yoast SEO** | Symbiotic | Duplicate meta description | OptiForge syncs to `_yoast_wpseo_metadesc`; front-end tag injection disabled. |
| **Rank Math** | Symbiotic | Competing OpenGraph tags | OptiForge defers to Rank Math schema graph. |
| **WP Rocket** | Selective | Double JS delay / minify | If WP Rocket JS delay is active, OptiForge disables `FIX-PERF-004`. |
| **Autoptimize** | Selective | Double CSS inlining | Banner prompts user to disable CSS optimization in one tool. |
| **ShortPixel / EWWW** | Disallowed | Duplicate WebP conversion | OptiForge displays conflict banner and pauses background media hooks. |

---

## 2. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **QA Lead** | APPROVED | Confirmed all supported PHP and WordPress versions are covered in automated CI matrix tests. |
| **WordPress Integration Lead** | APPROVED | Validated coexistence rules for major caching and SEO plugins prevent customer support escalations. |
