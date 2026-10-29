# OptiForge Performance Budgets & Benchmarks

**Status:** ACTIVE  
**Owner-persona:** Performance Engineer & Web Vitals Specialist  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md), [SCALING_AND_CAPACITY.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/SCALING_AND_CAPACITY.md), [TESTING.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/TESTING.md)

---

## 1. Overview & Core Web Vitals Budgets

OptiForge enforces strict performance budgets both for its own software stack (PWA, API, WP connector) and for the optimization targets it applies to client websites.

---

## 2. Platform Architecture Budgets

| Component | Metric | Hard Budget | Measurement Tool | Enforced In |
| :--- | :--- | :--- | :--- | :--- |
| **Command Center PWA** | Largest Contentful Paint (LCP) | < 1.8 seconds (Mobile 4G) | Lighthouse CI | CI / PR Gate |
| **Command Center PWA** | Interaction to Next Paint (INP) | < 150 ms | Chrome Web Vitals | Production |
| **Command Center PWA** | Cumulative Layout Shift (CLS) | < 0.02 | Lighthouse CI | CI / PR Gate |
| **Command Center PWA** | Initial JS Bundle per Route | < 170 KB gzipped | `@next/bundle-analyzer` | CI / PR Gate |
| **Fastify API Gateway** | p99 Response Latency | < 50 ms (excl. file upload) | Autocannon / k6 | Load Tests |
| **WordPress Connector** | Front-end Execution Overhead | < 5 ms total execution time | Query Monitor / Xdebug | Connector CI |
| **Sharp Image Worker** | 2MP JPEG to WebP Conversion | < 80 ms | Benchmark script | Worker CI |
| **Sharp Image Worker** | 2MP JPEG to AVIF Conversion | < 600 ms (CPU preset 6) | Benchmark script | Worker CI |

---

## 3. Client Optimization Targets (WordPress Sites)

Sites running OptiForge optimization fixes are held to the following standards:
1. **Lighthouse Performance Score:** Target ≥ 90 on mobile; minimum +15 point improvement on sites starting below 60.
2. **Cumulative Layout Shift (CLS):** Target < 0.05 on all public pages.
3. **Payload Reduction:** Minimum 40% reduction in total image bytes transferred via WebP/AVIF substitution.

---

## 4. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Web Performance Specialist** | APPROVED | Confirmed 5ms connector overhead ceiling guarantees no perceived slowdown on WordPress front-end page rendering. |
| **Frontend Architect** | APPROVED | Validated 170 KB route bundle limit; Monaco editor dynamically loaded only on file manager routes. |
