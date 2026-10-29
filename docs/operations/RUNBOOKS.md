# OptiForge Operational Runbooks & Emergency Procedures

**Status:** ACTIVE  
**Owner-persona:** SRE Incident Commander & Operations Lead  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [SELF_HOSTING.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/SELF_HOSTING.md), [INCIDENT_RESPONSE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/INCIDENT_RESPONSE.md)

---

## 1. Runbook Index & Standard Operating Procedures

### 1.1 Runbook: BullMQ Task Queue Stuck
- **Symptom:** Image conversion jobs remain in `pending` or `active` state without completing; queue depth increases.
- **Impact:** Delay in WebP/AVIF generation; new uploads queued on WordPress connector.
- **Detection:** Prometheus alert `optiforge_queue_depth > 100` or dashboard queue count badge alert.
- **Diagnosis Steps:**
  1. Inspect worker container logs: `docker compose logs -f worker`.
  2. Check Redis memory usage: `docker compose exec redis redis-cli info memory`.
  3. Inspect BullMQ stalled jobs: `pnpm --filter @optiforge/worker run queue:inspect`.
- **Fix Steps:**
  1. Restart stuck worker processes: `docker compose restart worker`.
  2. Clear stalled locks in Redis: `docker compose exec redis redis-cli del "bull:media_fast:stalled-check"`.
  3. Drain dead-letter queue if poisonous payload caused crash loop.
- **Verification:** Monitor `optiforge_queue_depth`; verify processing resumes and count decreases.
- **Prevention:** Enforce worker memory limits (`--max-old-space-size=1536`) and timeout guards.
- **Escalation:** Escalate to Backend Lead if specific image payload causes repeated segmentation faults in libvips.

---

### 1.2 Runbook: Redis Instance Down or Connection Lost
- **Symptom:** API Gateway returns `500 Internal Server Error` on job dispatch routes; HMAC nonce checks fail.
- **Impact:** Total failure to process background tasks and authenticate incoming CMS requests.
- **Detection:** Health check `/api/v1/health` reports `"redis": "down"`.
- **Diagnosis Steps:**
  1. Check Redis container state: `docker compose ps redis`.
  2. Check Redis error logs: `docker compose logs --tail=100 redis`.
  3. Verify disk space on Redis volume host mount: `df -h /var/lib/docker/volumes`.
- **Fix Steps:**
  1. If container stopped due to out-of-memory (OOM), allocate more RAM to host or reduce maxmemory.
  2. Restart Redis: `docker compose up -d redis`.
  3. Verify AOF persistence integrity: `docker compose exec redis redis-check-aof --fix /data/appendonly.aof`.
- **Verification:** Query health check `curl -f http://localhost:3000/api/v1/health` -> verify `"status": "ok"`.
- **Prevention:** Enable Redis maxmemory policy `volatile-lru` and ensure minimum 2GB dedicated swap.
- **Escalation:** Contact Infrastructure Lead if AOF corruption cannot be automatically repaired.

---

### 1.3 Runbook: Local Storage Partition Disk Full
- **Symptom:** API returns `507 Insufficient Storage` or `ERR_PAYLOAD_TOO_LARGE`; sharp workers fail to write variants.
- **Impact:** Optimization halts; WordPress connector falls back to local GD or skips conversion.
- **Detection:** Disk monitor alert `disk_usage > 90%` on `/var/optiforge/storage`.
- **Diagnosis Steps:**
  1. Check disk allocation: `df -h /var/optiforge/storage`.
  2. Identify largest directories: `du -sh /var/optiforge/storage/* | sort -hr | head -n 10`.
- **Fix Steps:**
  1. Run transient artifact pruning: `docker compose exec api node dist/scripts/prune-storage.js --older-than=30d`.
  2. Clear orphaned temporary uploads: `rm -rf /var/optiforge/storage/tmp/*`.
  3. In Command Center PWA, run "Prune Audit Screenshots" to free historical diff images.
- **Verification:** Run `df -h` -> confirm available space > 25%.
- **Prevention:** Configure automated cron job running `prune-storage.js` daily.
- **Escalation:** Contact Systems Administrator to resize VPS storage volume.

---

### 1.4 Runbook: Chromium Headless Audit Crash Loop
- **Symptom:** PageSpeed audits fail immediately with `ERR_BROWSER_CRASHED`; audit worker restarting repeatedly.
- **Impact:** Speed audits and Replicator DOM crawls unavailable; image optimization unaffected.
- **Detection:** Worker logs showing `Target page, context or browser has been closed` or exit code `137` (OOM).
- **Diagnosis Steps:**
  1. Check shared memory `/dev/shm` allocation in Docker: `docker inspect optiforge-worker | grep ShmSize`.
  2. Inspect system dmesg for kernel OOM killer events: `dmesg -T | grep -i oom`.
- **Fix Steps:**
  1. Ensure container specifies `shm_size: '2gb'` in `docker-compose.yml`.
  2. Restart audit worker: `docker compose restart worker-audit`.
- **Verification:** Trigger test audit via API `curl -X POST http://localhost:3000/api/v1/pagespeed/audit` -> verify 200 OK.
- **Prevention:** Allocate minimum 2GB shared memory for Chromium headless tabs.
- **Escalation:** Escalate to QA Lead if specific website DOM triggers infinite recursion in Chromium engine.

---

### 1.5 Runbook: Cryptographic Key & Secret Rotation
- **Symptom:** Routine 90-day security policy compliance, or suspected leak of master KMS key.
- **Impact:** None if executed following the grace-window procedure; transient 401s if misconfigured.
- **Diagnosis Steps:**
  1. Identify target site or master key to rotate.
- **Fix Steps:**
  1. Generate new 32-byte master key: `NEW_KEY=$(openssl rand -hex 32)`.
  2. Run re-encryption utility: `docker compose exec api node dist/scripts/rotate-kms-key.js --new-key=$NEW_KEY`.
  3. Update `MASTER_KMS_KEY` in `.env` and restart API: `docker compose up -d api`.
- **Verification:** Verify site signatures validate properly on `/api/v1/media/jobs`.
- **Prevention:** Maintain automated annual key rotation calendar.
- **Escalation:** Contact CISO immediately if leak involves production database dump.

---

## 2. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **SRE Lead** | APPROVED | Confirmed all 5 failure modes specified in Addendum A §A2.11 include concrete diagnosis and fix commands. |
| **Incident Commander** | APPROVED | Validated escalation triggers and prevention measures for high-stress operational outages. |
