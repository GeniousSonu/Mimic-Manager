# Environment Specification & Tool Inventory

**Inspected Date:** October 29, 2026  
**System:** Linux pc-it-163 7.0.0-38-generic #38-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux  
**Distribution:** Ubuntu 26.04.1 LTS (Resolute Raccoon)  

---

## 1. System Runtimes & Package Managers

| Tool / Runtime | Installed Version | Path | Status |
|---|---|---|---|
| **Node.js** | `v22.23.2` (LTS) | `/home/dayshift/.nvm/versions/node/v22.23.2/bin/node` | Verified |
| **npm** | `10.9.8` | `/home/dayshift/.nvm/versions/node/v22.23.2/bin/npm` | Verified |
| **pnpm** | `12.16.1` | `/home/dayshift/.nvm/versions/node/v22.23.2/bin/pnpm` | Installed & Verified |
| **PHP** | `8.2.29` (cli, NTS) | `/home/dayshift/.local/bin/php` | Verified |
| **Composer** | `2.10.3` | `/home/dayshift/.local/bin/composer` | Installed & Verified |
| **Docker Engine** | `29.9.1` (build dfc520d) | `/usr/bin/docker` | Running & Verified |
| **Docker Compose** | `v5.6.0` | `/usr/bin/docker compose` | Verified |
| **Git** | `2.53.0` | `/usr/bin/git` | Verified |

---

## 2. PHP Runtime & Extensions

The PHP 8.2.29 environment has all required extensions compiled or dynamically loaded:
- **Core / Crypto / Hash:** `hash`, `openssl`, `sodium`, `random`
- **Networking / Transport:** `curl`, `sockets`
- **Image / Media processing:** `gd`, `exif`, `fileinfo`
- **XML / DOM / Markup:** `dom`, `libxml`, `SimpleXML`, `xml`, `xmlreader`, `xmlwriter`, `xsl`
- **Internationalization & Compression:** `intl`, `mbstring`, `iconv`, `zip`, `zlib`, `bz2`
- **Database & Serialization:** `json`, `mysqli`, `mysqlnd`, `PDO`, `pdo_mysql`, `pdo_sqlite`, `sqlite3`
- **Process Management:** `pcntl`, `posix`

---

## 3. Verified Dependency Targets (Current Stable)

| Technology | Target Version | Release / API Status |
|---|---|---|
| **@nestjs/core / common** | `^12.3.2` | NestJS 12 modular monolith with Fastify adapter |
| **@nestjs/platform-fastify** | `^12.3.2` | Fastify v5 integration |
| **fastify** | `^5.12.7` | High-performance HTTP server |
| **bullmq** | `^6.5.1` | Redis-backed distributed queues |
| **mongoose** | `^9.11.4` | MongoDB ODM with TypeScript strict types |
| **sharp** | `^0.35.5` | Libvips image manipulation & format conversions |
| **playwright-core** | `^1.64.1` | Headless Chromium automation |
| **lighthouse** | `^13.6.0` | Automated lab performance & SEO auditing |
| **next** | `^16.4.3` | React 19 App Router & PWA foundation |
| **@wordpress/env** | `^12.0.0` | Dockerized local WP integration environment |
| **@wordpress/blocks** | `^17.0.0` | Block registration & parsing library |
| **woocommerce/action-scheduler** | `^4.2.0` | Background job processing for WordPress |
| **WordPress/plugin-check** | `^2.1.0` | Plugin guidelines & security validator |
