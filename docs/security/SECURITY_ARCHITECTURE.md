# OptiForge Security Architecture Specification

**Status:** ACTIVE  
**Owner-persona:** Chief Information Security Officer & Principal Architect  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [THREAT_MODEL.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/THREAT_MODEL.md), [SSRF_GUARD.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/SSRF_GUARD.md), [FILE_MANAGER_SECURITY.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/FILE_MANAGER_SECURITY.md)

---

## 1. Security Architecture Principles

1. **Zero-Trust Network Model:** Even within the Docker Compose network, services communicate with authentication where appropriate; the API treats all inbound CMS traffic as untrusted until cryptographically verified.
2. **Defense-in-Depth:** Validation occurs at multiple layers: DNS/IP level, request schema validation (Zod), authorization guard, and worker sandboxing.
3. **Principle of Least Privilege:** Chromium workers run as unprivileged rootless users (`uid=10001`); the WordPress connector only requests filesystem write permissions inside `wp-content/`.
4. **Cryptographic Integrity:** Zero plain-text secrets in logs, database tables, or network transfers.

---

## 2. Key Management & Rotation
- **Secret Generation:** 256-bit entropy generated via `crypto.randomBytes(32)` during pairing handshake.
- **Secret Storage:** Stored in MongoDB encrypted at rest using AES-256-GCM with master KMS key.
- **Rotation Workflow:** Sites can initiate a seamless zero-downtime secret rotation. The previous secret remains valid for a 1-hour grace window while the new secret is deployed to the CMS connector.

---

## 3. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **CISO** | APPROVED | Confirmed zero plain-text storage of shared secrets and mandatory AES-256-GCM envelope encryption. |
| **Cloud Security Lead** | APPROVED | Approved rootless container specifications and network isolation boundaries. |
