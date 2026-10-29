# OptiForge Definition of Done (DoD)

**Status:** ACTIVE  
**Owner-persona:** Lead Quality Engineer & Scrum Master  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [TESTING.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/TESTING.md), [CI_CD.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/CI_CD.md), [TRACEABILITY.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/TRACEABILITY.md)

---

## 1. Phase & Feature Exit Gates

A task, feature, or phase is considered **DONE** only when all of the following criteria are met:

### 1.1 Documentation Gate
- [ ] Specification updated in matching doc in `docs/` in the same commit.
- [ ] Stable requirement ID (`FR-xxx`, `NFR-xxx`) assigned and mapped in `docs/engineering/TRACEABILITY.md`.
- [ ] No `TODO` remains except documented `PLANNED` tasks linked to `docs/project/PLAN.md`.
- [ ] Hostile review logged with at least two reviewer personas.

### 1.2 Code & Architectural Gate
- [ ] Strict TypeScript typing enforced (zero `any`).
- [ ] Defensive PHP applied with `try / catch (\Throwable $e)` and circuit breaker integration.
- [ ] All database writes and mutations recorded in `wp_optiforge_changelog` with atomic rollback capability.

### 1.3 Quality & Testing Gate
- [ ] Unit tests written with ≥ 85% branch coverage on new logic.
- [ ] If UI components were touched, all 10 states tested, axe accessibility tests pass, and contrast passes WCAG 2.2 AA.
- [ ] Cross-system integration and E2E roundtrip tests pass 100% green.
- [ ] CI pipeline passes completely with frozen lockfile.

---

## 2. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Lead Quality Engineer** | APPROVED | Confirmed strict DoD criteria prevent technical debt accumulation across development phases. |
| **Engineering Manager** | APPROVED | Validated requirement mapping gate enforces traceability. |
