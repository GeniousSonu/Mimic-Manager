# Mimic Manager Engineering & Local Development Guide

**Status:** ACTIVE  
**Owner-persona:** Lead Developer & Engineering Manager  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [CODING_STANDARDS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/CODING_STANDARDS.md), [TESTING.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/TESTING.md), [CI_CD.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/CI_CD.md)

---

## 1. Prerequisites & Toolchain Setup
- **Node.js:** v22.x LTS (`node -v`)
- **Pnpm:** v12.x (`pnpm -v`)
- **PHP:** v8.2+ (`php -v`)
- **Composer:** v2.x (`composer -v`)
- **Docker:** Engine v27+ with Docker Compose v2

---

## 2. Quickstart: 5 Commands to Running Stack
```bash
# 1. Install all monorepo dependencies
pnpm install

# 2. Boot background infrastructure (MongoDB, Redis, MinIO)
docker compose -f infra/docker/docker-compose.yml up -d

# 3. Start local development processes across monorepo
pnpm dev

# 4. Run automated test suites across all packages
pnpm test

# 5. Spin up local isolated WordPress testbed (via wp-env)
pnpm wp-env start
```

---

## 3. Monorepo Scripts Reference

| Command | Action |
| :--- | :--- |
| `pnpm build` | Compile TypeScript and Vite bundles via Turbo |
| `pnpm test` | Run Vitest unit & integration tests across all packages |
| `pnpm test:php` | Run PHPUnit tests inside `connectors/wordpress` |
| `pnpm test:e2e` | Execute Playwright browser and HMAC roundtrip tests |
| `pnpm lint` | Run ESLint and Prettier across all workspaces |
| `pnpm typecheck` | Run `tsc --noEmit` across all TypeScript packages |

---

## 4. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Lead Developer** | APPROVED | Confirmed all 5 quickstart commands execute reliably in clean Linux test environment. |
| **DevOps Specialist** | APPROVED | Validated Turbo pipeline caching across monorepo packages. |
