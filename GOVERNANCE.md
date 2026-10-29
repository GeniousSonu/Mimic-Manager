# Project Governance & Decision-Making Model

**Status:** ACTIVE  
**Last-reviewed:** 2026-10-29  

---

## 1. Principles

1. **Digital Sovereignty & FOSS:** Mimic Manager will remain 100% Free and Open Source software under AGPL-3.0 (core) and GPL-2.0+ (WordPress connector). No features will ever be gated behind a commercial paywall or cloud license key.
2. **Docs-First & Engineering Discipline:** All architectural and product changes follow the autonomous working loop:
   `PLAN → RED-TEAM REVIEW → REVISE → GATE-APPROVE → BUILD → SELF-TEST → FIX → REPORT`.
3. **Decisions via ADRs:** Significant architectural decisions are documented as Architecture Decision Records (`docs/architecture/adr/`) and require explicit consensus before merge.

---

## 2. Maintainers & Roles

- **Project Owner:** Wefik (https://www.wefik.in)
- **Creator and Lead Author:** SK Sahinur Islam (https://www.genioussonu.me/plugin/mimic-manager)
- **Core Maintainers:** Responsible for reviewing ADRs, managing security releases, ensuring test suite integrity, and maintaining documentation accuracy.
- **Security Lead:** Oversees vulnerability triage, SSRF defense updates, and coordinates security audits (`security@wefik.in`).
- **Design Lead:** Enforces Design System consistency, accessibility standards (WCAG 2.2 AA), and contrast compliance.
