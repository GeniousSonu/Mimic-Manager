# Mimic Manager Observability & Telemetry Architecture

**Status:** ACTIVE  
**Owner-persona:** SRE & Reliability Engineer  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md), [QUEUES_AND_WORKERS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/QUEUES_AND_WORKERS.md), [RUNBOOKS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/RUNBOOKS.md)

---

## 1. Overview & Privacy-First Telemetry
Mimic Manager adheres to strict privacy:
- **Zero Phoning Home:** By default, Mimic Manager transmits zero telemetry, usage statistics, or crash reports to external servers.
- **Local Metrics Only:** Health metrics, queue latencies, and conversion stats are aggregated locally in MongoDB and visualized in the Command Center PWA.

---

## 2. Structured Logging & Trace Propagation
All backend services (API, Worker, Scheduler) emit structured JSON logs using Pino:
- Every inbound HTTP request receives an `X-Request-Id` (UUIDv4).
- When a task is enqueued to BullMQ, the `requestId` is propagated through the job data.
- Worker logs include `siteId`, `jobId`, `requestId`, and duration.

---

## 3. Prometheus Metrics & Health Probes
The API exposes an unauthenticated (or token-protected) `/metrics` endpoint formatted for Prometheus scraping:
- `mimic_manager_queue_depth{queue="media_fast"}`
- `mimic_manager_worker_processing_seconds_bucket`
- `mimic_manager_image_bytes_saved_total`
- `mimic_manager_circuit_breaker_state{site_id="..."}`

---

## 4. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **SRE Lead** | APPROVED | Confirmed standard Prometheus metric schema enables native Grafana integration without custom collectors. |
| **Data Privacy Officer** | APPROVED | Validated absolute absence of default external telemetry or third-party tracking beacons. |
