# System Architecture & Technical Blueprint

**Status:** ACTIVE  
**Owner-persona:** Principal Systems Architect & Senior Security Engineer  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v0.1.0-alpha  
**Related-docs:** [DATA_MODEL.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/DATA_MODEL.md), [API.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/API.md), [FIX_REGISTRY.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/FIX_REGISTRY.md), [docs/security/THREAT_MODEL.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/THREAT_MODEL.md)

---

## 1. C4 Architecture Models

### 1.1 Context Diagram (C4 Level 1)
```mermaid
graph TD
  User[Developer / Agency / Site Owner] -->|Manages Sites & Optimizations| PWA[Mimic Manager Command Center PWA]
  User -->|Installs Connector & Edits Files| WP[WordPress Site wp-admin]

  PWA -->|REST API & SSE / Mutual HMAC| API[Mimic Manager Backend API]
  WP -->|Pushes Media / Receives Variants| API
  API -->|Enqueues Tasks| Queue[Redis Task Queues]
  Queue -->|Dispatches Jobs| Worker[Mimic Manager Background Workers]
  Worker -->|Optimizes Images / Runs Browser| Worker
  Worker -->|Signed Webhook Notification| WP
```

### 1.2 Container Diagram (C4 Level 2)
```mermaid
graph TD
  subgraph Client Tier
    PWA[Next.js 16 PWA Shell]
    WPUi[React wp-admin UI in Shadow DOM]
  end

  subgraph Backend Tier
    FastifyAPI[NestJS 12 + Fastify 5 API Gateway]
    BullMQWorker[BullMQ Worker Processes]
    SharpLib[Sharp 0.35 + libvips]
    ChromiumSandbox[Isolated Chromium Container]
  end

  subgraph Storage & Cache
    Mongo[MongoDB 7 - Persistent Metadata]
    Redis[Redis 7 - BullMQ & Nonce Cache]
    Storage[Local Disk / MinIO / S3 Driver]
  end

  FastifyAPI --> Mongo
  FastifyAPI --> Redis
  BullMQWorker --> Redis
  BullMQWorker --> Mongo
  BullMQWorker --> Storage
  BullMQWorker --> SharpLib
  BullMQWorker --> ChromiumSandbox
```

---

## 2. Runtime Sequence Views

### 2.1 Media Optimization Pull-Model Sequence
```mermaid
sequenceDiagram
  autonumber
  actor User as Content Author
  participant WP as WordPress Plugin
  participant API as Fastify API
  participant Redis as BullMQ Queue
  participant Worker as Sharp Worker
  participant Store as Temp Storage

  User->>WP: Uploads image (hero.jpg)
  WP->>WP: Saves original file locally
  WP->>API: POST /api/v1/media/jobs (HMAC Signed + Image Bytes)
  API->>API: Verify HMAC signature & Nonce replay
  API->>Redis: Enqueue media.optimize job
  API-->>WP: 201 Created (Job ID, Status: Pending)
  WP-->>User: Upload finishes instantly (<200ms)

  Redis->>Worker: Dispatch media.optimize job
  Worker->>Worker: Validate magic bytes & safety bounds
  Worker->>Worker: Sharp generates WebP/AVIF variants
  Worker->>Store: Write variant (TTL: 1 hour)
  Worker->>WP: POST /wp-json/mimic-manager/v1/webhook (Signed HMAC)
  WP->>WP: Verify Webhook HMAC signature
  WP->>Store: Pull variant & verify SHA-256 checksum
  WP->>WP: Atomic move to /uploads/ & update attachment metadata
  WP->>WP: Record previous state in ChangeLog
```

### 2.2 PageSpeed Fix Verification & Auto-Revert Sequence
```mermaid
sequenceDiagram
  autonumber
  actor Dev as Developer
  participant PWA as PWA Command Center
  participant API as Fastify API
  participant Worker as Browser Worker
  participant WP as WordPress Site

  Dev->>PWA: Click "Apply Moderate Fix" (e.g. Defer JS)
  PWA->>API: POST /api/v1/speed/verify
  API->>WP: Issue temporary signed preview cookie
  API->>Worker: Launch isolated Playwright browser
  Worker->>WP: Render target URL with preview cookie
  alt JavaScript Console Error or Visual Regression Detected
    Worker-->>API: Verification Failed (Uncaught Error / CLS +0.12)
    API-->>PWA: Fix Rejected (Display error log & screenshot diff)
  else Verification Passes Cleanly
    Worker-->>API: Verification Passed (0 errors, score +14)
    API->>WP: POST /api/v1/speed/apply (Activate production filter)
    API-->>PWA: Fix Applied Live with 10s Undo Toast
  end
```

---

## 3. Module Boundaries & Dependency Enforcement

```
packages/types       <-- Base contract (Zero internal dependencies)
packages/ssrf-guard  <-- Imports @mimic-manager/types
packages/fixes       <-- Imports @mimic-manager/types
packages/ir          <-- Imports @mimic-manager/types
packages/ui          <-- Design system (Standalone React/CSS)
apps/api             <-- Imports types, ssrf-guard
apps/worker          <-- Imports types, ssrf-guard
apps/pwa             <-- Imports types, ui
connectors/wordpress <-- Independent PHP runtime (GPL-2.0+)
```

---

## 4. Failure Mode & Self-Healing Matrix

| Component | Failure | Blast Radius | Detection | Automated System Action |
|---|---|---|---|---|
| **Backend API** | Process crash / OOM | External optimization paused | Docker healthcheck fails | Container restarts automatically; WordPress plugin activates local GD/Imagick fallback. |
| **Worker Process**| Decompression bomb | Single worker task killed | Memory limit violation | Task rejected with `MEDIA_DECOMPRESSION_BOMB`; worker respawns cleanly. |
| **Redis** | Redis network timeout | Queued jobs temporarily paused | Connection error event | BullMQ pauses queue; retries with exponential backoff and jitter. |
| **WordPress Host**| External HTTP blocked | Plugin cannot reach backend | 3 consecutive connect timeouts | Circuit breaker trips; switches site to local-only optimization without throwing errors. |
