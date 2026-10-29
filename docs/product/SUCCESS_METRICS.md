# Success Metrics & Local KPI Instrumentation

**Status:** ACTIVE  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v0.1.0-alpha  

---

## 1. Principles: Zero Telemetry by Default

All metrics described in this document are **computed and stored strictly locally** within the user's self-hosted database instance. Mimic Manager does not transmit telemetry, analytics, or behavioral tracking to any external server.

---

## 2. Core Quantitative Targets

| Metric | Target | Measurement Mechanism |
|---|---|---|
| **Time-to-First-Value (TTFV)** | < 10 minutes | Time elapsed between initial Docker container startup and completion of the first media optimization job. |
| **Media Storage Reduction** | ≥ 45% average byte savings | Cumulative calculation: `(sum(originalBytes) - sum(variantBytes)) / sum(originalBytes)`. |
| **Fix Verification Accuracy** | > 99.5% regression detection | Proportion of synthetic breaking script injections successfully caught and blocked by Playwright preview before production. |
| **Front-End Overhead** | < 5 ms median | Measured via server execution timer on front-end WordPress request delivery. |
| **wp-admin Availability** | 100% crash-free | Zero fatal PHP errors (`\Throwable` interception across all hook callbacks). |
| **Command Center Lighthouse** | ≥ 95 Performance, ≥ 95 A11y, 100 Best Practices | Automated Lighthouse CI run against the PWA production build. |
| **WCAG 2.2 Compliance** | 100% AA Pass (0 critical/serious violations) | Automated `axe-core` scans across all UI states and components. |
