# OptiForge Data Retention & Pruning Schedule

**Status:** ACTIVE  
**Owner-persona:** Database Administrator & Compliance Manager  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [PRIVACY.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/PRIVACY.md), [DATA_MODEL.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/DATA_MODEL.md)

---

## 1. Automated Pruning Lifecycles

| Data Entity | Storage Location | Retention Window | Pruning Mechanism | Administrator Override |
| :--- | :--- | :--- | :--- | :--- |
| **Audit Reports** | MongoDB `audits` | 90 days | Automated TTL index on `expiresAt` | Can pin key audits to prevent pruning |
| **Transient Job Payloads** | MongoDB `jobs` | 30 days | Automated TTL index on `expiresAt` | Summary stats preserved indefinitely |
| **Nonce Cache** | Redis key store | 10 minutes | Key expiration via Redis EXPIRE | None (fixed security window) |
| **Connector Backups** | Local `wp-content/optiforge-backups/` | 30 days or max 10 revisions per file | Cron cleanup task `optiforge_prune_backups` | Can pin critical pre-migration backups |

---

## 2. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Compliance Manager** | APPROVED | Confirmed automatic TTL indexes eliminate stale data accumulation without manual intervention. |
| **Database Administrator** | APPROVED | Validated 10-revision backup cap prevents WordPress filesystem exhaustion on high-frequency code edits. |
