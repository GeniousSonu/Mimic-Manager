# Database Backup and Disaster Recovery Guide

**Status:** PRODUCTION READY  
**Component:** MongoDB Atlas (M0 Free Tier) & Redis  
**Target:** Render Production Environment  

---

## 1. Overview & Rationale

MongoDB Atlas M0 (Free Tier) does not include automated continuous backup or point-in-time recovery (PITR). Because Mimic Manager stores site pairings, optimization job records, and configuration in MongoDB, establishing an automated or periodic offsite backup workflow is required for production resilience.

This guide details:
1. Exporting MongoDB Atlas data using `./scripts/backup/atlas-export.sh`
2. Restoring from a backup archive
3. Redis persistence considerations

---

## 2. Automated / Manual Export with `atlas-export.sh`

The included backup script [atlas-export.sh](file:///home/dayshift/Pictures/Mimic%20Manager/scripts/backup/atlas-export.sh) provides dual-mode execution:
- **Primary:** Uses official `mongodump` with `--gzip` if installed.
- **Fallback:** Uses native Node.js and the official `mongodb` driver to export all collections into JSON documents and tar-gzips them.

### Running a Backup

Ensure your `MONGODB_URI` is present in `.env` or passed via environment variable:

```bash
# Export using .env configuration
./scripts/backup/atlas-export.sh

# Or specifying custom output directory
MONGODB_URI="mongodb+srv://..." ./scripts/backup/atlas-export.sh /custom/backup/dir
```

Output:
```
[*] Initializing MongoDB Atlas export into: ./backups/atlas/20261029_180633
[+] Exporting collections: sites, jobs, audit_logs...
[✓] Atlas backup successfully created: ./backups/atlas/20261029_180633.tar.gz
```

### Scheduling Backups (Cron / GitHub Actions)
You can schedule periodic exports via cron or GitHub Actions using the `MONGODB_URI` repository secret:
```cron
# Run daily at 02:00 UTC
0 2 * * * cd /opt/mimic-manager && ./scripts/backup/atlas-export.sh /var/backups/mimic-manager
```

---

## 3. Restoring from Backup

### A. Restoring from `mongodump` Archive

If the backup was created with `mongodump`:
```bash
# Unpack the archive
tar -xzf 20261029_180633.tar.gz

# Restore to Atlas
mongorestore --uri="$MONGODB_URI" --drop --gzip 20261029_180633/dump
```

### B. Restoring from JSON Documents (Node.js Fallback)

If the backup contains JSON collection files:
```bash
# Unpack
tar -xzf 20261029_180633.tar.gz

# Restore collections via mongoimport
for file in 20261029_180633/*.json; do
  col=$(basename "$file" .json)
  echo "Restoring collection: $col"
  mongoimport --uri="$MONGODB_URI" --collection="$col" --file="$file" --jsonArray --mode=upsert
done
```

---

## 4. Redis Recovery

Mimic Manager uses Redis exclusively for:
- BullMQ queue state (`media_optimize`)
- Rate limiting counters
- Short-lived lock coordination

**Recovery Policy:**
- Redis eviction policy must be `noeviction` on redis.io so BullMQ jobs are never dropped during processing.
- If Redis restarts or is replaced, BullMQ automatically recreates queue keys on startup. Stalled jobs are cleaned up automatically by the app's stalled-job recovery logic.
