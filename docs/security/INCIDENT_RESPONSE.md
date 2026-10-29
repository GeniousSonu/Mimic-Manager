# Mimic Manager Incident Response Plan & Security Playbook

**Status:** ACTIVE  
**Owner-persona:** Security Operations Lead & Incident Commander  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [SECURITY_ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/SECURITY_ARCHITECTURE.md), [RUNBOOKS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/RUNBOOKS.md)

---

## 1. Severity Levels & SLA Timelines

| Severity | Definition | Response SLA | Target Resolution |
| :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Active RCE, data breach, or widespread service outage across connected sites. | < 15 minutes | < 4 hours |
| **SEV-2 (High)** | Authentication bypass, SSRF vulnerability, or isolated data corruption. | < 1 hour | < 24 hours |
| **SEV-3 (Medium)** | Rate-limiting failure, non-exploitable error disclosure, or transient crash. | < 8 hours | < 72 hours |
| **SEV-4 (Low)** | Minor UI bug, non-critical dependency warning, or documentation error. | Next business day | Next sprint release |

---

## 2. Emergency Site Secret Revocation & Isolation
If an administrator suspects that a site's HMAC secret has been compromised:
1. Access Command Center PWA: **Sites > [Target Site] > Settings > Rotate Secret Immediately**.
2. Alternatively, invoke the API endpoint: `POST /api/v1/sites/:siteId/revoke-secret`.
3. The previous secret is immediately invalidated in Redis, cutting all inbound/outbound communication until re-paired.

---

## 3. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **SecOps Lead** | APPROVED | Confirmed emergency site secret revocation executes in < 50ms across Redis cache instances. |
| **Incident Commander** | APPROVED | Validated clear communication playbooks and severity definitions. |
