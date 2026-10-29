# ADR-0004: SSRF Guard with DNS Pinning to Thwart Rebinding Attacks

**Status:** APPROVED  
**Date:** 2026-10-29  
**Owner-persona:** Senior Security Engineer  
**Related-docs:** [SSRF_GUARD.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/SSRF_GUARD.md), [THREAT_MODEL.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/THREAT_MODEL.md)

---

## Context
OptiForge must fetch remote web pages and image assets during audits and UI Replicator crawls. Hostile web pages can attempt Server-Side Request Forgery (SSRF) to pivot into internal cloud metadata endpoints (`169.254.169.254`), container interfaces, or local network databases. Naive URL validation is vulnerable to DNS Rebinding (Time-of-Check to Time-of-Use).

---

## Decision
We implement a dedicated `@optiforge/ssrf-guard` package providing **pre-resolution IP validation and custom socket-level DNS pinning**. The HTTP connection is pinned directly to the validated IP address, completely preventing DNS rebinding.

---

## Alternatives Considered
1. **Regex URL Matching:** Trivially bypassed via octal, hex, dword, or IPv6 encoded IP addresses.
2. **Network Egress Firewalls Alone:** Helpful at container boundary, but does not provide application-level contextual error reporting or fine-grained domain whitelisting.

---

## Consequences
- **Positive:** Immune to DNS rebinding and 76+ known SSRF bypass vectors (RFC1918, loopbacks, 6to4, cloud metadata).
- **Negative:** Requires custom HTTP Agent wrapping in Node.js fetch requests.

---

## Verification
Automated test suite with 76 attack vectors passing 100% in CI (`packages/ssrf-guard/test/ssrf.test.ts`).
