# Mimic Manager

**Optimize media, speed, and SEO for every site you manage, with proof and undo.**

Created by **SK Sahinur Islam** · A [Wefik](https://www.wefik.in) project

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Plugin License: GPL v2+](https://img.shields.io/badge/Plugin_License-GPL_v2+-green.svg)](LICENSE-PLUGIN)
[![CI Tests](https://img.shields.io/badge/Tests-100%25_Passing-brightgreen.svg)](docs/project/TEST_REPORT.md)
[![WCAG](https://img.shields.io/badge/WCAG_2.2-AA_Compliant-success.svg)](packages/ui/tokens/tokens.json)

---

## 1. Feature Matrix & Status

| Pillar / Feature | Status | Description |
|---|---|---|
| **Media Optimization** | `STABLE` | Multi-format generation (WebP, AVIF), decompression bomb protection, Sharp libvips, local GD fallback. |
| **Contextual AI Alt-Text** | `STABLE` | Local vision LLM (Ollama) & heuristic fallback; context-aware from post titles; review queue. |
| **PageSpeed Tiered Fixes** | `STABLE` | Safe (1-click), Moderate (preview & verify), Guided (copy-paste); Playwright auto-revert on error. |
| **Plugin-Aware SEO Gap Fill**| `STABLE` | Cooperates with Yoast, Rank Math, SEOPress; writes to their native fields; no duplicate schema. |
| **UI Replicator** | `STABLE` | Multi-viewport DOM Intermediate Representation (IR) compiling to clean, valid Gutenberg blocks. |
| **Visual File Manager** | `STABLE` | Jailed to `wp-content`, pre-save PHP AST syntax check (`php -l`), Monaco editor, atomic backups. |
| **Multi-Site Command Center**| `STABLE` | Dark-first Next.js PWA, 6-digit site pairing, background job progress streaming (SSE). |

---

## 2. Quick Start (Run in ≤ 5 Commands)

```bash
# 1. Clone repository
git clone https://github.com/GeniousSonu/Mimic-Manager.git && cd Mimic-Manager

# 2. Install dependencies
pnpm install

# 3. Launch Docker Compose (Mongo, Redis, MinIO)
docker compose -f infra/docker/docker-compose.yml up -d

# 4. Run full test suite verification
pnpm test && cd connectors/wordpress && ./vendor/bin/phpunit tests/ && cd ../..

# 5. Start development servers
pnpm dev
```
Open `http://localhost:3000/api/docs` to explore the OpenAPI 3.1 interactive Swagger documentation.

---

## 3. WordPress Plugin Installation

1. Copy or symlink `connectors/wordpress` to your WordPress site's `wp-content/plugins/mimic-manager`.
2. Activate the plugin in **Plugins** menu.
3. Open **Mimic Manager > Settings**, generate a 6-digit pairing code from your PWA command center, and click **Connect**.
4. The site establishes mutual HMAC-SHA256 authenticated channels with automated replay protection.

---

## 4. What Mimic Manager is NOT

- **NOT a Full-Page HTML Cache:** Battle-tested plugins (LiteSpeed Cache, WP Rocket) and edge CDNs (Cloudflare) already excel at page caching. Mimic Manager provides purge hooks instead.
- **NOT an Edge CDN:** Mimic Manager generates optimized local assets and rewrite rules; it does not operate global DNS edge servers.
- **NOT a Server Configuration Mutator:** Mimic Manager will never automatically modify `/etc/nginx/nginx.conf` or Apache virtual hosts. Guided snippets are provided with safety notices.

---

## 5. Documentation Navigation

- [Master Documentation Map (00-index.md)](file:///home/dayshift/Pictures/Mimic%20Manager/docs/00-index.md)
- [Product Requirements Document (PRD.md)](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/PRD.md)
- [System Architecture (ARCHITECTURE.md)](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md)
- [Threat Model (THREAT_MODEL.md)](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/THREAT_MODEL.md)
- [Design System & Tokens (DESIGN.md)](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN.md)
- [Self-Hosting Guide (SELF_HOSTING.md)](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/SELF_HOSTING.md)
- [Live Test Execution Report (TEST_REPORT.md)](file:///home/dayshift/Pictures/Mimic%20Manager/docs/project/TEST_REPORT.md)

---

## 6. License & Open Source Sovereignty

- **Core Server, Worker & PWA:** GNU Affero General Public License v3.0 ([LICENSE](file:///home/dayshift/Pictures/Mimic%20Manager/LICENSE)).
- **WordPress Connector Plugin:** GNU General Public License v2.0 or later ([LICENSE-PLUGIN](file:///home/dayshift/Pictures/Mimic%20Manager/LICENSE-PLUGIN)).
- **100% Free & Open Source:** Zero paid tiers, zero telemetric phoning-home, zero artificial limits.

---

## 7. Attribution

Mimic Manager is developed and maintained by **Wefik**.  
Created and lead-authored by **SK Sahinur Islam** ([www.genioussonu.me](https://www.genioussonu.me/plugin/mimic-manager)).  
Copyright (c) 2026 Wefik. All rights reserved.
