# Mimic Manager REST API & Event Stream Specification

**Status:** ACTIVE  
**Owner-persona:** API Architect & Lead Integration Engineer  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md), [DATA_MODEL.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/DATA_MODEL.md), [EVENTS_AND_WEBHOOKS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/EVENTS_AND_WEBHOOKS.md), [openapi/openapi.yaml](file:///home/dayshift/Pictures/Mimic%20Manager/openapi/openapi.yaml)

---

## 1. Overview & Conventions

The Mimic Manager API provides a RESTful interface for command-and-control operations between the Command Center PWA, backend microservices, and connected CMS instances (e.g., WordPress).

### 1.1 Base URL & Content Negotiation
- **Production Base URL:** `https://mimic-manager.internal/api/v1`
- **Content-Type:** `application/json` (verbatim binary buffers for `/media/jobs`)
- **Character Encoding:** UTF-8
- **Date Format:** ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)

### 1.2 Authentication Methods
Mimic Manager enforces two authentication models:
1. **PWA Session & CLI Tokens:** Bearer token authentication via `Authorization: Bearer <jwt_or_api_key>` with scoped permissions (`read:sites`, `write:media`, `admin:all`).
2. **Mutual HMAC-SHA256 Signing (CMS Connector):** Used for site-to-hub communication. Requests must supply:
   - `X-Mimic Manager-Site-Id`: Site UUIDv4.
   - `X-Mimic Manager-Timestamp`: UNIX timestamp in seconds (valid within ±300s window).
   - `X-Mimic Manager-Nonce`: Random 32-character hex string (cached in Redis with 10-minute TTL to prevent replay).
   - `X-Mimic Manager-Signature`: `sha256=<hex_digest>` computed over `${timestamp}.${nonce}.${siteId}.${body}`.

---

## 2. Error Taxonomy & Client Actions

Every error response adheres strictly to the RFC 7807 Problem Details specification:

| Error Code | HTTP Status | Meaning | Recommended Client Action |
| :--- | :--- | :--- | :--- |
| `ERR_AUTH_MISSING_SIGNATURE` | 401 Unauthorized | Missing HMAC headers | Inspect request pipeline; verify header injection. |
| `ERR_AUTH_INVALID_SIGNATURE` | 401 Unauthorized | HMAC signature verification failed | Verify shared secret; check body serialization integrity. |
| `ERR_AUTH_REPLAY_DETECTED` | 401 Unauthorized | Nonce already seen or clock skewed > 300s | Synchronize system clock via NTP; generate new nonce. |
| `ERR_RATE_LIMIT_EXCEEDED` | 429 Too Many Requests | Rate quota depleted | Back off using the `Retry-After` header interval. |
| `ERR_PAYLOAD_TOO_LARGE` | 413 Payload Too Large | File exceeds configured limit (default: 50MB) | Downsample or chunk upload before sending. |
| `ERR_SSRF_PROHIBITED` | 400 Bad Request | Target URL resolves to blocked IP (RFC1918/Metadata) | Specify a valid public DNS hostname; bypass rejected. |
| `ERR_DECOMPRESSION_BOMB` | 422 Unprocessable | Image pixel count exceeds threshold (>50MP) | Reject file at source; abort processing. |
| `ERR_CIRCUIT_BREAKER_OPEN` | 503 Service Unavailable | Connector reported repeated fatal errors | Pause requests; check connector health in dashboard. |

---

## 3. Rate Limiting Policy

Rate limiting is enforced globally and per site via Redis Token Bucket:

| Route Group | Scope | Default Quota | Burst Allowance |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth/*` | IP Address | 10 req / min | 5 req |
| `/api/v1/sites/pair` | IP Address | 5 req / min | 2 req |
| `/api/v1/media/jobs` | Site UUID | 120 req / min | 30 req |
| `/api/v1/pagespeed/*` | Site UUID | 10 req / min | 2 req |
| `/api/v1/events/stream` | User Token | 20 connections | 5 connections |

---

## 4. Endpoints Specification

### 4.1 Site Pairing & Secret Handshake
- **POST `/api/v1/sites/pair`**
  - **Description:** Complete initial cryptographic handshake between CMS and hub.
  - **Request Body:**
    ```json
    {
      "pairingCode": "849201",
      "homeUrl": "https://example.com",
      "name": "Production Store",
      "environment": "production"
    }
    ```
  - **Response (200 OK):**
    ```json
    {
      "siteId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "clientSecret": "sec_7f9a12c8e3d14ab590ef18c4390b",
      "webhookUrl": "https://mimic-manager.internal/api/v1/webhooks/connector"
    }
    ```

---

### 4.2 Media Optimization Job Dispatch
- **POST `/api/v1/media/jobs`**
  - **Description:** Enqueue an image for lossless/lossy conversion and format generation (WebP/AVIF).
  - **Headers:** Includes required mutual HMAC headers.
  - **Request Body:** Verbatim binary buffer or JSON payload with presigned source URL.
  - **Response (202 Accepted):**
    ```json
    {
      "jobId": "e2a5f1c9-7603-455b-bf48-3908dbca674a",
      "status": "pending",
      "estimatedDurationMs": 450,
      "streamUrl": "/api/v1/jobs/e2a5f1c9-7603-455b-bf48-3908dbca674a/events"
    }
    ```

---

### 4.3 Real-Time SSE Event Stream
- **GET `/api/v1/events/stream`**
  - **Description:** Server-Sent Events stream for live job progress, queue metrics, and system alerts.
  - **Event Format:**
    ```text
    event: job.progress
    data: {"jobId":"e2a5f1c9","percent":75,"status":"processing","step":"avif_encode"}

    event: job.completed
    data: {"jobId":"e2a5f1c9","status":"completed","bytesSaved":245100,"ratio":0.68}
    ```

---

## 5. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Lead API Architect** | APPROVED | Confirmed idempotency keys on mutating routes and standard RFC 7807 problem details payloads for predictable client recovery. |
| **Senior Security Engineer** | APPROVED | Verified non-replayable HMAC nonce caching in Redis with mandatory 300-second maximum clock skew window. |
