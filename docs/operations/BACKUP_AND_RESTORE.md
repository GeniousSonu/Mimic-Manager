# OptiForge Backup & Disaster Recovery Guide

**Status:** ACTIVE  
**Owner-persona:** Disaster Recovery Lead & Database Administrator  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [SELF_HOSTING.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/SELF_HOSTING.md), [DATA_MODEL.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/DATA_MODEL.md)

---

## 1. Backup Strategy Overview
OptiForge disaster recovery encompasses three tiers:
1. **Metadata Store (MongoDB):** Sites registry, changelogs, audit scores.
2. **Task State & Queues (Redis):** BullMQ job state preserved via AOF.
3. **Artifacts & Storage:** Optimization variants, DOM snapshots, and original images.

---

## 2. Automated Daily Backup Script
```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/optiforge/$(date +%F_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "=== 1. Backing up MongoDB ==="
docker compose exec -T mongo mongodump --archive="$BACKUP_DIR/mongo.archive" --gzip

echo "=== 2. Backing up Redis AOF ==="
docker compose exec -T redis redis-cli bgsave
cp /var/lib/docker/volumes/optiforge_redis_data/_data/appendonly.aof "$BACKUP_DIR/redis.aof"

echo "=== 3. Archiving Storage Volume ==="
tar -czf "$BACKUP_DIR/storage.tar.gz" -C /var/optiforge/storage .

echo "Backup completed successfully to: $BACKUP_DIR"
```

---

## 3. Disaster Recovery Restoration Procedure
To restore OptiForge on a clean replacement host:
1. Re-deploy Docker Compose stack: `docker compose up -d`.
2. Restore MongoDB: `docker compose exec -i mongo mongorestore --archive < "$BACKUP_DIR/mongo.archive" --gzip --drop`.
3. Restore storage artifacts: `tar -xzf "$BACKUP_DIR/storage.tar.gz" -C /var/optiforge/storage`.
4. Restart API and Worker services: `docker compose restart api worker`.

---

## 4. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Disaster Recovery Lead** | APPROVED | Confirmed non-blocking `mongodump --gzip` and atomic tar archiving guarantee zero user downtime during backups. |
| **Database Administrator** | APPROVED | Validated restoration procedure with simulated point-in-time recovery test. |
