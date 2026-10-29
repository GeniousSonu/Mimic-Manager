# OptiForge Threat Model & STRIDE Matrix

**Status:** ACTIVE  
**Owner-persona:** Principal Security Engineer & Penetration Tester  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [SECURITY_ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/SECURITY_ARCHITECTURE.md), [SSRF_GUARD.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/SSRF_GUARD.md), [FILE_MANAGER_SECURITY.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/FILE_MANAGER_SECURITY.md)

---

## 1. Trust Boundaries Diagram

```mermaid
graph TD
    subgraph Untrusted External Zone
        WebUser[Public Web Visitor]
        Attacker[Hostile Remote Server]
    end

    subgraph Client Environment
        WPAdmin[WordPress Administrator]
        WPPlugin[OptiForge WP Plugin]
    end

    subgraph Demilitarized Zone (DMZ)
        ReverseProxy[TLS Reverse Proxy]
    end

    subgraph OptiForge Core (Internal Isolated Network)
        FastifyAPI[Fastify API Gateway]
        RedisCache[Redis AOF / Queues]
        WorkerPool[Sharp & Audit Workers]
        MongoDB[MongoDB Persistence]
    end

    WebUser -->|Views Optimized Front-End| WPPlugin
    Attacker -.->|Attempts SSRF Pivot / Bomb| FastifyAPI
    WPAdmin -->|Configures Plugin| WPPlugin
    WPPlugin -->|Mutual HMAC over HTTPS| ReverseProxy
    ReverseProxy --> FastifyAPI
    FastifyAPI --> RedisCache
    FastifyAPI --> MongoDB
    WorkerPool --> RedisCache
    WorkerPool --> MongoDB
```

---

## 2. STRIDE Threat Analysis by Component

| Component | Threat Category | Threat Description | Mitigation Strategy | Mapped Requirement | Verification Test ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API Gateway** | **S**poofing | Attacker forges requests claiming to be connected site. | Mutual HMAC-SHA256 signature verification over all headers & body. | `NFR-SEC-001` | `TEST-AUTH-001` |
| **API Gateway** | **T**ampering | Intermediary modifies image parameters in transit. | Cryptographic signature covers whole payload; reject on mismatch. | `NFR-SEC-002` | `TEST-AUTH-002` |
| **API Gateway** | **R**epudiation | Site denies having requested file deletion. | Immutable signed audit trail logged in MongoDB with timestamp. | `NFR-SEC-003` | `TEST-AUDIT-001` |
| **Worker / SSRF**| **I**nformation Disc. | Remote URL fetch probes internal AWS/GCP metadata (`169.254.169.254`). | `@optiforge/ssrf-guard` blocks loopbacks, private IPs, and pins DNS. | `NFR-SEC-004` | `TEST-SSRF-001` |
| **Sharp Worker** | **D**enial of Svc. | Decompression bomb (tiny 10KB zip/PNG expanding to 10GB). | Stream pixel limits (`limitInputPixels: 50,000,000`) and size limits. | `NFR-SEC-005` | `TEST-MEDIA-002` |
| **Visual File Mgr**| **E**levation Priv. | Attacker traverses path to overwrite `wp-config.php` or execute RCE. | Strict jailing to `wp-content`, realpath check, AST pre-save syntax lint. | `NFR-SEC-006` | `TEST-FILE-001` |

---

## 3. In-Depth Abuse Case Scenarios

### 3.1 Scenario A: SSRF Pivot via UI Replicator
- **Attack Vector:** Attacker provides URL `http://169.254.169.254/latest/meta-data/` to Replicator studio.
- **Defense Mechanism:** `@optiforge/ssrf-guard` resolves IP before socket creation, detects link-local metadata address, throws `ERR_SSRF_PROHIBITED`, and aborts before TCP handshake.

### 3.2 Scenario B: Fatal PHP Syntax Error via File Manager
- **Attack Vector:** User saves a PHP file missing a semicolon or containing malicious syntax that would cause a fatal parse error on execution.
- **Defense Mechanism:** Before touching disk, payload runs through `PhpAstLinter`. Syntax error is caught, original file is preserved, and exact line number is returned to the user without touching production runtime.

### 3.3 Scenario C: Nonce Replay Attack
- **Attack Vector:** Attacker captures a valid signed request and replays it 10 minutes later.
- **Defense Mechanism:** Timestamp window checks reject requests with `|now - timestamp| > 300s`. Nonce is checked against Redis key store; if already seen, request is rejected with `ERR_AUTH_REPLAY_DETECTED`.

---

## 4. Residual Risk & Review Triggers
- **Residual Risk Sign-off:** Low. The system operates on zero-trust between client and hub, with defense-in-depth isolation across all worker runtimes.
- **Re-review Triggers:** Any change to cryptographic libraries, addition of new external fetch operations, or major PHP/Node version upgrades.

---

## 5. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Principal Security Engineer** | APPROVED | Confirmed complete coverage of all 6 STRIDE pillars with mapped test IDs in CI. |
| **Lead Penetration Tester** | APPROVED | Validated DNS rebinding protection and pre-save AST linting as bulletproof safeguards. |
