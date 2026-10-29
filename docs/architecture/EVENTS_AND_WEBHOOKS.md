# Mimic Manager Events & Signed Webhook Specification

**Status:** ACTIVE  
**Owner-persona:** Distributed Systems Architect & Lead Security Engineer  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [API.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/API.md), [QUEUES_AND_WORKERS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/QUEUES_AND_WORKERS.md), [WORDPRESS_PLUGIN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/WORDPRESS_PLUGIN.md)

---

## 1. Overview
Mimic Manager employs an asynchronous, event-driven architecture to communicate job progress, completion notifications, and health updates across services and external CMS connectors.

Webhooks dispatched to CMS connectors are cryptographically signed using the shared secret established during site pairing.

---

## 2. Event Types & Payloads

### 2.1 Standard Event Catalog
| Event Name | Producer | Consumers | Description |
| :--- | :--- | :--- | :--- |
| `media.optimized` | Sharp Worker | API Gateway, WP Connector | Fired when all variants (WebP, AVIF) have been generated. |
| `media.failed` | Sharp Worker | API Gateway, WP Connector | Fired on decompression bomb, corrupt buffer, or worker crash. |
| `audit.completed` | Audit Worker | API Gateway, PWA | Fired when Lighthouse / PageSpeed lab audit finishes. |
| `fix.verified` | Verify Worker | API Gateway, WP Connector | Fired when preview audit confirms zero visual regression. |
| `fix.reverted` | Verify Worker | WP Connector, PWA | Fired when auto-revert triggered due to regression or JS error. |

---

## 3. Webhook Delivery & Signing Protocol

### 3.1 Mutual Cryptographic Verification
Webhooks sent from Mimic Manager Hub to CMS connectors must include the following headers:
- `X-Mimic Manager-Event`: The event identifier (e.g. `media.optimized`).
- `X-Mimic Manager-Delivery-Id`: Unique UUIDv4 per delivery attempt.
- `X-Mimic Manager-Timestamp`: UNIX timestamp in seconds.
- `X-Mimic Manager-Signature`: `sha256=<hex_digest>` computed using the site's shared secret.

### 3.2 Canonical Signature String
```text
canonical_string = timestamp + "." + deliveryId + "." + rawBodyJson
signature = HMAC_SHA256(siteSecret, canonical_string)
```

### 3.3 Test Vectors for Verification
```json
{
  "secret": "sec_test_7f9a12c8e3d14ab590ef18c4390b",
  "timestamp": 1730198400,
  "deliveryId": "c4b1e5a2-9382-4f91-8932-984210abedfe",
  "payload": "{\"event\":\"media.optimized\",\"jobId\":\"j_123\"}",
  "expectedSignature": "sha256=13b94e803d2e9bb2e15dc098d578b8f2d59dfa43ec9ffcebc73f710f63b655f9"
}
```

---

## 4. Retry Policy & Dead Letter Queue (DLQ)
Webhooks follow an exponential backoff schedule on HTTP 5xx or connection timeouts:
1. Attempt 1: Immediate
2. Attempt 2: 15 seconds
3. Attempt 3: 60 seconds
4. Attempt 4: 5 minutes
5. Attempt 5: 30 minutes

If all 5 attempts fail, the delivery is marked as `DEAD_LETTER` and logged in MongoDB for manual inspection or redelivery.

---

## 5. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Distributed Systems Lead** | APPROVED | Confirmed strict idempotent delivery IDs to prevent duplicate variant attachment in WordPress. |
| **Security Auditor** | APPROVED | Validated inclusion of delivery ID in HMAC canonical string to eliminate replay vectors across identical payloads. |
