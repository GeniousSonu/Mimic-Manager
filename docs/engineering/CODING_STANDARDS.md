# OptiForge Coding Standards & Style Conventions

**Status:** ACTIVE  
**Owner-persona:** Lead Software Architect & Quality Auditor  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [DEVELOPMENT.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/DEVELOPMENT.md), [DEFINITION_OF_DONE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/DEFINITION_OF_DONE.md)

---

## 1. General Principles
1. **Maintain Documentation Integrity:** Preserve existing docstrings, requirement tags (`@req FR-xxx`), and architectural citations.
2. **Strict Typing:** No `any` types permitted in TypeScript. Use explicit Zod schemas or interfaces.
3. **No Dead Code:** No commented-out blocks or unused imports.
4. **Defensive PHP:** All WordPress functions, hooks, and filters must wrap in `try / catch (\Throwable $e)` and verify capabilities.

---

## 2. Commit Message Standards (Conventional Commits)
Commits must adhere strictly to the Conventional Commits format:
- `feat(scope): add new feature`
- `fix(scope): resolve bug or regression`
- `docs(scope): update documentation or specs`
- `test(scope): add or modify test suites`
- `refactor(scope): refactor code without behavioral change`

---

## 3. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Lead Architect** | APPROVED | Confirmed zero-any rule and requirement tagging in code comments enables automated traceability generation. |
| **QA Auditor** | APPROVED | Validated defensive PHP guidelines prevent fatal execution stops. |
