# Mimic Manager Upgrade & Database Migration Guide

**Status:** ACTIVE  
**Owner-persona:** Lead Release Engineer & Database Administrator  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [BACKUP_AND_RESTORE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/BACKUP_AND_RESTORE.md), [DATA_MODEL.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/DATA_MODEL.md)

---

## 1. Zero-Downtime Upgrade Procedure

```bash
# 1. Pull latest Docker images
docker compose pull

# 2. Run pending database migrations
docker compose run --rm api pnpm run db:migrate

# 3. Perform rolling restart of services
docker compose up -d --no-deps api
docker compose up -d --no-deps worker
docker compose up -d --no-deps pwa

# 4. Prune legacy unused images
docker image prune -f
```

---

## 2. WordPress Connector Auto-Migration
- When updating the WordPress plugin, database schema updates execute automatically via WordPress Core `dbDelta()` within `Plugin::activate()` and `Plugin::maybe_upgrade()`.
- Rollback safety: Prior version database tables are never dropped during minor upgrades.

---

## 3. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Release Engineer** | APPROVED | Confirmed rolling restart prevents dropped WebSocket and SSE client connections during deployment. |
| **WordPress Core Specialist** | APPROVED | Validated non-destructive `dbDelta` execution preserves historical audit changelogs. |
