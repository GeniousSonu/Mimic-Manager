# ADR-0003: Mutual HMAC-SHA256 Request Signing for CMS Connectors

**Status:** APPROVED  
**Date:** 2026-10-29  
**Owner-persona:** Lead Security Architect  
**Related-docs:** [API.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/API.md), [THREAT_MODEL.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/THREAT_MODEL.md)

---

## Context
Connected websites (WordPress instances) communicate bi-directionally with the OptiForge hub. Standard API bearer tokens can be intercepted or leaked through reverse proxies and logs. Furthermore, static API keys do not guarantee message integrity against in-transit payload tampering.

---

## Decision
We enforce **Mutual HMAC-SHA256 request signing** for all connector-to-hub and webhook delivery traffic. Each request includes `Timestamp`, `Nonce`, `Site-Id`, and a cryptographic signature computed over the raw payload and headers.

---

## Alternatives Considered
1. **mTLS (Mutual TLS):** Extremely secure, but practically impossible to configure reliably across heterogeneous shared-hosting WordPress environments.
2. **Bearer API Tokens:** Vulnerable to replay attacks and payload tampering if HTTPS termination is misconfigured.

---

## Consequences
- **Positive:** Complete payload integrity; immunity to replay attacks via nonces and timestamp windows; zero reliance on client certificate infrastructure.
- **Negative:** Requires precise raw body buffer capture in Fastify and PHP before JSON parsing.

---

## Verification
Automated cross-language test vectors (`hmac-vectors.json`) verified identically in TypeScript and PHPUnit test suites (100% green).
