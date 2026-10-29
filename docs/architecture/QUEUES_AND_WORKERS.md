# Mimic Manager Queues, Workers & Concurrency Architecture

**Status:** ACTIVE  
**Owner-persona:** SRE & Lead Infrastructure Engineer  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md), [EVENTS_AND_WEBHOOKS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/EVENTS_AND_WEBHOOKS.md), [SCALING_AND_CAPACITY.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/SCALING_AND_CAPACITY.md)

---

## 1. Overview
Mimic Manager isolates resource-intensive tasks (image compression, Chromium headless audits, AI alt-text inference) from the Fastify API Gateway using Redis-backed BullMQ queues and isolated worker processes.

---

## 2. Queue Topology & Priorities

| Queue Name | Concurrency Limit | Rate Limit | Primary Workload | Worker Sandbox |
| :--- | :--- | :--- | :--- | :--- |
| `queue:media:fast` | 8 workers / node | None | WebP generation, thumbnailing | Node.js + Sharp / libvips |
| `queue:media:heavy` | 2 workers / node | 10 jobs / min | AVIF encoding, 4K downscaling | Process-isolated libvips |
| `queue:audit:lab` | 2 workers / node | 5 jobs / min | Playwright / Chromium headless audits | Rootless Chromium container |
| `queue:ai:inference` | 1 worker / node | 30 jobs / min | Ollama vision model alt-text | Dedicated GPU / CPU thread |
| `queue:webhooks` | 10 workers / node | 100 req / s | Outbound signed webhook dispatch | Pure Node.js HTTP/2 |

---

## 3. Worker Concurrency & Memory Limits

### 3.1 Media Heavy Worker Sizing
- **Memory Ceiling:** 1.5 GB per worker process enforced via `--max-old-space-size=1536` and Docker cgroups.
- **AVIF Guard:** AVIF compression utilizes libaom-av1 / libsvtav1. Concurrency is strictly clamped to `max(1, floor(CPU_CORES / 2))` to prevent CPU starvation.

### 3.2 Headless Audit Sandbox
- Runs Chromium in `--no-sandbox` (when in unprivileged container) with seccomp profile.
- Re-launches fresh browser context every 25 audits to guarantee zero memory leaks or cache contamination.

---

## 4. Backpressure & Circuit Breaking

1. **Backpressure Metric:** When `queue:media:fast` depth exceeds 500 items, API Gateway signals HTTP 429 / retry headers to bulk-uploading clients.
2. **Worker Circuit Breaker:** If a worker crashes 3 consecutive times on a specific media payload, the job is quarantined immediately to prevent crash-looping worker containers.

---

## 5. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **SRE Lead** | APPROVED | Confirmed CPU isolation for AVIF encoding and hard process memory limits to prevent out-of-memory (OOM) kernel panics. |
| **Security Engineer** | APPROVED | Approved rootless containerization for Chromium headless audit workers with strict network egress controls. |
