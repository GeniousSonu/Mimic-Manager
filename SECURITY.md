# Security Policy

**Status:** ACTIVE  
**Last-reviewed:** 2026-10-29  

---

## 1. Supported Versions

| Version | Supported |
|---|---|
| `v0.1.x` | Yes (Active Development) |

---

## 2. Reporting a Vulnerability

We take the security of Mimic Manager seriously. If you discover a security vulnerability, please do NOT file a public issue.

**Reporting Procedure:**
1. Email full details, reproduction steps, and potential impact to `security@wefik.in`.
2. Encrypt your report using our GPG key if appropriate.
3. You will receive an acknowledgment within 24 hours and regular status updates every 48 hours until resolved.
4. We adhere to a 90-day coordinated disclosure timeline before publishing CVEs or public disclosures.

---

## 3. Core Security Principles
- **SSRF Defense:** All external fetches are protected by `packages/ssrf-guard` with DNS pinning, blocking private networks, loopbacks, and cloud metadata (`169.254.169.254`).
- **Cryptographic Channel:** All API and webhook communication uses bidirectional HMAC-SHA256 signatures with nonce deduplication and max 300s timestamp drift.
- **Filesystem Jailing:** Visual File Manager operations are strictly jailed to `wp-content` with pre-save AST syntax checks to prevent remote code execution or white screens.
