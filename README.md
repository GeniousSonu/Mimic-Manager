<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset=".github/assets/logo-light.svg">
    <img alt="Mimic Manager Logo" src=".github/assets/logo-dark.svg" width="400">
  </picture>
</p>

<p align="center">
  <strong>Optimize media, speed, and SEO for every site you manage, with proof and undo.</strong><br>
  Created by <strong>SK Sahinur Islam</strong> (<a href="https://www.genioussonu.me">www.genioussonu.me</a>) · A <a href="https://www.wefik.in">Wefik</a> product
</p>

<p align="center">
  <a href="https://github.com/GeniousSonu/Mimic-Manager/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0--rc.1-00E5FF.svg" alt="Release v1.0.0-rc.1"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL_v3-7B61FF.svg" alt="License: AGPL v3"></a>
  <a href="LICENSE-PLUGIN"><img src="https://img.shields.io/badge/Plugin_License-GPL_v2+-green.svg" alt="Plugin License: GPL v2+"></a>
  <a href="docs/project/TEST_REPORT.md"><img src="https://img.shields.io/badge/Tests-100%25_Passing-brightgreen.svg" alt="CI Tests"></a>
  <a href="packages/ui/tokens/tokens.json"><img src="https://img.shields.io/badge/WCAG_2.2-AA_Compliant-success.svg" alt="WCAG 2.2 AA"></a>
  <a href="connectors/wordpress/readme.txt"><img src="https://img.shields.io/badge/WordPress-6.0_to_6.7-blue.svg" alt="WordPress Tested up to 6.7"></a>
</p>

---

## 1. Feature Matrix & Production Status

| Pillar / Feature | Status | Description |
|---|---|---|
| **Media Optimization** | `STABLE` | Multi-format generation (WebP, AVIF), decompression bomb protection, Sharp libvips, local GD fallback. |
| **Contextual AI Alt-Text** | `STABLE` | Local vision LLM (Ollama) & heuristic fallback; context-aware from post titles; review queue. |
| **PageSpeed Tiered Fixes** | `STABLE` | Safe (1-click), Moderate (preview & verify), Guided (copy-paste); Playwright auto-revert on error. |
| **Plugin-Aware SEO Gap Fill**| `STABLE` | Cooperates with Yoast, Rank Math, SEOPress; writes to their native fields; no duplicate schema. |
| **UI Replicator** | `STABLE` | Multi-viewport DOM Intermediate Representation (IR) compiling to clean, valid Gutenberg blocks. |
| **Visual File Manager** | `STABLE` | Jailed to `wp-content`, pre-save PHP AST syntax check (`php -l`), Monaco editor, atomic backups. |
| **SPA Command Center** | `STABLE` | Full-bleed zero-reload admin shell, notices tray, dark-first Deep Space tokens, accessible toasts with 10s undo. |

---

## 2. Deployment & Installation Options

### Option A: WordPress Plugin (Single ZIP Install)
1. Download the latest release package:
   - **WordPress.org Flavor:** [`dist/mimic-manager.zip`](https://github.com/GeniousSonu/Mimic-Manager/releases/latest) (zero third-party updater code, 100% WP.org compliant).
   - **GitHub Flavor:** [`dist/mimic-manager-github.zip`](https://github.com/GeniousSonu/Mimic-Manager/releases/latest) (includes opt-in native WordPress updater via GitHub Releases).
2. Go to **wp-admin → Plugins → Add New → Upload Plugin**, select the ZIP file, and click **Install Now**.
3. Activate the plugin and access **Mimic Manager** directly in your admin menu.

### Option B: Self-Hosted Docker Compose (Backend + Worker + Database)
```bash
# 1. Clone repository
git clone https://github.com/GeniousSonu/Mimic-Manager.git && cd Mimic-Manager

# 2. Start all services in the background (MongoDB 7, Redis 7, MinIO, NestJS API, BullMQ Worker)
docker compose -f infra/docker/docker-compose.yml up -d

# 3. Explore the OpenAPI 3.1 Swagger docs
open http://localhost:3000/api/docs
```

### Option C: Render Cloud Deployment (One-Click Blueprint)
Deploy the API and in-process BullMQ worker to Render using the tested Infrastructure-as-Code Blueprint:
- Review [Render Deployment Guide](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/RENDER_DEPLOYMENT.md).
- Connect repository and apply [`render.yaml`](file:///home/dayshift/Pictures/Mimic%20Manager/render.yaml).

---

## 3. Quick Start (Development & Local Verification)

```bash
# 1. Install workspace dependencies
pnpm approve-builds --all && pnpm install

# 2. Run full test verification suite (TypeScript + PHPUnit + Contrast)
pnpm test && pnpm test:php && pnpm test:contrast

# 3. Audit arbitrary spacing & 4px grid tokens
pnpm lint:spacing

# 4. Run Playwright E2E SPA zero-reload verification
pnpm vitest run e2e/spa-zero-reload.test.ts

# 5. Build production plugin ZIP packages
pnpm plugin:build && pnpm plugin:verify-zip && pnpm plugin:scan-updater
```

---

## 4. What Mimic Manager is NOT

- **NOT a Full-Page HTML Cache:** Battle-tested plugins (LiteSpeed Cache, WP Rocket) and edge CDNs (Cloudflare) already excel at page caching. Mimic Manager provides cache-purge hooks instead.
- **NOT an Edge CDN:** Mimic Manager generates optimized local assets and rewrite rules; it does not operate global DNS edge servers.
- **NOT a Server Configuration Mutator:** Mimic Manager will never automatically modify `/etc/nginx/nginx.conf` or Apache virtual hosts. Guided copy-paste snippets are provided with safety notices.

---

## 5. Documentation Suite

- [Master Documentation Map (00-index.md)](file:///home/dayshift/Pictures/Mimic%20Manager/docs/00-index.md)
- [Versioning & Compatibility Policy (VERSIONING.md)](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/VERSIONING.md)
- [Release Tooling & Capability Map (RELEASE_CAPABILITY_MAP.md)](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/RELEASE_CAPABILITY_MAP.md)
- [Manual Release Steps Runbook (RELEASE_MANUAL_STEPS.md)](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/RELEASE_MANUAL_STEPS.md)
- [Upgrades & Migrations Guide (UPGRADE_AND_MIGRATION.md)](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/UPGRADE_AND_MIGRATION.md)
- [Product Requirements Document (PRD.md)](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/PRD.md)
- [System Architecture (ARCHITECTURE.md)](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md)
- [Threat Model & Security Audits (THREAT_MODEL.md)](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/THREAT_MODEL.md)
- [Design System & 4px Grid Tokens (DESIGN.md)](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN.md)
- [Live Test Execution Report (TEST_REPORT.md)](file:///home/dayshift/Pictures/Mimic%20Manager/docs/project/TEST_REPORT.md)

---

## 6. License & Open Source Sovereignty

- **Core Server, Worker & PWA:** GNU Affero General Public License v3.0 ([LICENSE](file:///home/dayshift/Pictures/Mimic%20Manager/LICENSE)).
- **WordPress Connector Plugin:** GNU General Public License v2.0 or later ([LICENSE-PLUGIN](file:///home/dayshift/Pictures/Mimic%20Manager/LICENSE-PLUGIN)).
- **100% Free & Open Source:** Zero paid tiers, zero telemetric phoning-home, zero artificial limits.

---

## 7. Attribution & Ownership

Mimic Manager is developed and maintained by **Wefik** ([www.wefik.in](https://www.wefik.in)).  
Created and lead-authored by **SK Sahinur Islam** ([www.genioussonu.me](https://www.genioussonu.me)).  
Copyright (c) 2026 Wefik. All rights reserved.
