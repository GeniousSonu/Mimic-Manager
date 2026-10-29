# Mimic Manager Visual File Manager Security Architecture

**Status:** ACTIVE  
**Owner-persona:** Lead Application Security Architect  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [FILE_MANAGER_DESIGN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/FILE_MANAGER_DESIGN.md), [THREAT_MODEL.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/THREAT_MODEL.md)

---

## 1. Historical Vulnerability Analysis (CVE-2020-25213)
In 2020, over 700,000 WordPress sites were compromised due to an unauthenticated arbitrary file upload in the popular WP File Manager plugin (CVE-2020-25213). The plugin bundled an unauthenticated third-party elFinder library connector that allowed direct POST uploads to server directories without capability checks.

### Architectural Invariants in Mimic Manager to Prevent All Similar Exploits:
1. **Zero Third-Party Vendor Connectors:** Zero bundled legacy PHP libraries (elFinder, Roxy Fileman).
2. **Strict WordPress Capability Checks:** Every file manager REST endpoint requires `current_user_can('manage_options')` AND a verified WordPress nonce.
3. **Double-Factor Step-Up Authentication:** Editing executable code (`.php`, `.js`) requires re-entering the admin password or an active 2FA confirmation token.
4. **Hard Invariant Jail:** All operations are strictly jailed to `wp-content/`. Traversals (`../`) or symlinks pointing outside `WP_CONTENT_DIR` trigger an immediate `403 Forbidden` response and an administrative security alert.

---

## 2. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Principal Security Architect** | APPROVED | Confirmed strict capability checks and zero third-party PHP file upload libraries eliminate historical CVE patterns. |
| **WordPress VIP Auditor** | APPROVED | Validated step-up authentication prevents malicious edits even if an admin session is hijacked. |
