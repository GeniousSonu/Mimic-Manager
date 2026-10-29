# ADR-0002: BullMQ and Redis for Task Queueing and Nonce Replay Caching

**Status:** APPROVED  
**Date:** 2026-10-29  
**Owner-persona:** Distributed Systems Lead  
**Related-docs:** [QUEUES_AND_WORKERS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/QUEUES_AND_WORKERS.md), [ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md)

---

## Context
Background tasks (Sharp image optimization, Playwright headless audits, outbound webhook delivery) must be queued reliably across distributed worker processes with rate-limiting, retry policies, and dead-letter queues. Additionally, the HMAC authentication guard requires a fast in-memory nonce store to prevent replay attacks.

---

## Decision
We adopt **Redis 7 (with AOF enabled) and BullMQ** as the unified queue and nonce caching layer.

---

## Alternatives Considered
1. **RabbitMQ / AMQP:** Strong message routing, but introduces a complex secondary service dependency without native Redis key-value caching benefits.
2. **MongoDB-based Queues (Agenda):** Leverages existing database, but causes high write amplification and locks under heavy polling workloads.

---

## Consequences
- **Positive:** Low latency; atomic lock and nonce operations via Redis scripting; rich BullMQ rate-limiting and job stall detection.
- **Negative:** Requires Redis instance memory management and AOF disk persistence configuration.

---

## Verification
End-to-end integration test proves tasks are dispatched, processed by Sharp worker, and signed webhooks sent within 250ms end-to-end.
