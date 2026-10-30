# ADR-0016: Plugin-Backend Compatibility Handshake Protocol

- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:**
  The Mimic Manager platform separates the self-hosted backend (NestJS/Fastify, BullMQ, Redis, MongoDB, Playwright) from the WordPress connector. Sites may update the WordPress plugin independently of the backend API (or vice-versa). An incompatible API or payload shape must never cause PHP fatal errors, crash `wp-admin`, or break the public-facing WordPress website.
- **Decision:**
  Implement a bidirectional version compatibility handshake:
  1. **Outbound Headers:** Every authenticated request from the WordPress connector to the backend transmits:
     - `X-Mimic-Product-Version: <SemVer>`
     - `X-Mimic-Protocol-Version: <Major.Minor>`
  2. **Backend Evaluation:**
     - The backend checks the protocol version against its supported range.
     - The backend maintains backward compatibility for at least current and `N-1` minor protocol versions.
  3. **Response Envelope:** Every response includes compatibility metadata:
     - `backendVersion`, `protocolVersion`, `supportedPluginRange`, and `compatibility` (`compatible` | `update_recommended` | `incompatible`).
  4. **Degradation Policy (Zero WSOD Guarantee):**
     - If the backend returns `incompatible`, the WordPress connector trips its circuit breaker, notifies the administrator via the header badge and Site Health, and gracefully falls back 100% to local GD/WebP optimization.
     - The public site continues serving traffic without interruption.
- **Alternatives Considered:**
  - *Hard Coupling (Refuse Execution on Version Drift):* Rejected because breaking site media or admin navigation when updating a minor version causes downtime.
  - *Silent Failure Without User Notice:* Rejected because administrators would be unaware that cloud features (AI Replicator, Playwright verification) are dormant.
- **Consequences:**
  - Complete uptime protection for WordPress hosts.
  - Clear, actionable administrator feedback in the SPA header and WordPress Site Health.
  - Predictable backward compatibility lifecycle for self-hosted backend operators.
- **Verification:**
  - Compatibility handshake test suite across a matrix of plugin vs backend versions (Current, N-1, N+1, Incompatible).
  - Test verifying WordPress admin page loads cleanly with 200 OK and zero fatal errors when backend responds with `incompatible`.
