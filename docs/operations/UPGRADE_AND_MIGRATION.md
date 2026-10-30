# Mimic Manager Upgrade, Migration & Rollback Guide

**Status:** ACTIVE  
**Last-reviewed:** 2026-10-30  
**Applies-to:** Operations Engineers, Site Administrators, DevOps  
**Related-docs:** [VERSIONING.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/VERSIONING.md), [BACKUP_AND_RESTORE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/BACKUP_AND_RESTORE.md), [ADR-0016](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/adr/0016-plugin-backend-compatibility-handshake-protocol.md)

---

## 1. Upgrade Philosophy & Compatibility Contract

Mimic Manager uses a distributed topology where the WordPress connector acts as a thin client communicating with the NestJS API backend and BullMQ worker. Upgrades must maintain continuous service availability without data loss or administrative lockouts.

### Compatibility Handshake
Before executing background optimization tasks or synchronizing media:
- The WordPress plugin executes `GET /api/v1/health` and verifies HTTP 200.
- It parses response headers `X-Mimic-Api-Version` and compares against its internal `SUPPORTED_API_RANGE` (e.g., `^1.0.0`).
- If a major mismatch is detected, the plugin trips a soft warning notice in wp-admin, suspends automatic background jobs, and preserves all local configuration.

---

## 2. Docker Compose (Self-Hosted) Upgrade Runbook

For users running the complete stack via Docker Compose:

### 2.1 Pre-Upgrade Verification
```bash
# 1. Check container status
docker compose ps

# 2. Perform database backup
docker compose exec -T mongo mongodump --archive --gzip > backup-pre-upgrade-$(date +%F).gz
```

### 2.2 Application Upgrade
```bash
# 1. Pull the targeted release tags
docker compose pull

# 2. Run database migration scripts (if any schema upgrades exist)
docker compose run --rm api pnpm run db:migrate

# 3. Perform rolling restarts to eliminate downtime
docker compose up -d --no-deps api
docker compose up -d --no-deps worker
docker compose up -d --no-deps pwa

# 4. Verify health endpoints
curl -f http://localhost:3000/api/v1/health
```

### 2.3 Rollback Procedure
If the new release exhibits runtime anomalies:
```bash
# 1. Revert compose image tags to prior version
sed -i 's/:v1.1.0/:v1.0.0/g' docker-compose.yml

# 2. Restart services on prior version
docker compose up -d --no-deps api worker pwa

# 3. Restore database snapshot if schema was altered
docker compose exec -i mongo mongorestore --drop --archive --gzip < backup-pre-upgrade-*.gz
```

---

## 3. Render Web Service Upgrade Runbook

For production instances deployed on Render:

1. **Automated Deployments:**
   - Any commit tagged and merged into `main` automatically triggers Render's build pipeline (`pnpm build`).
   - The zero-downtime rolling deployment starts a new container instance, waits for `/api/v1/health` to return 200, and directs incoming traffic before terminating the previous container.

2. **Rollback via Render Dashboard:**
   - Navigate to the Render Dashboard > Web Service > **Events**.
   - Locate the previous successful deploy.
   - Click **Rollback** on the target release.

---

## 4. WordPress Plugin Upgrade & Migration Framework

### 4.1 Automated Database Schema Migration (`MigrationManager`)
Upon updating the WordPress connector zip (either manually or via the GitHub Updater):
1. **Mutex Lock:** `MigrationManager::run()` acquires a temporary transient lock `mimic_manager_migration_lock` (300s TTL) to prevent race conditions during multi-worker or concurrent page requests.
2. **Options Snapshot:** Before modifying any settings or database structures, `MigrationManager` creates a backup snapshot in `wp_options` under `mimic_manager_options_backup_{version}`.
3. **Sequential Forward Migrations:** Registered migrations execute sequentially by version number.
4. **Non-Destructive Guarantee:** Historical audit logs, fix snapshots, and media records are never dropped or destructively altered during minor or patch upgrades.
5. **Downgrade Guard:** If an older plugin version is installed over a newer database schema, `MigrationManager` logs an alert, enters read-only compatibility mode, and refuses to run destructive operations.

### 4.2 Manual Plugin Rollback Runbook
If an upgrade causes incompatibilities with other active plugins:
1. Deactivate the current version in `wp-admin` > **Plugins**.
2. Download the previous release zip (e.g., `mimic-manager.zip` from GitHub Releases).
3. Upload via **Plugins** > **Add New** > **Upload Plugin**, and select **Replace current with uploaded**.
4. The plugin detects the downgrade, preserves all configuration options, and continues operating without resetting user data.
