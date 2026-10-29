# OptiForge Fix Authoring Guide

**Status:** ACTIVE  
**Owner-persona:** Core Engine Maintainer & Integration Specialist  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [FIX_REGISTRY.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/FIX_REGISTRY.md), [CODING_STANDARDS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/CODING_STANDARDS.md), [TESTING.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/TESTING.md)

---

## 1. Overview & The 5-Method Contract
Every performance fix implemented in OptiForge must implement the standard `FixContract` interface:

```typescript
export interface FixContract {
  readonly id: string;
  readonly tier: 'safe' | 'moderate' | 'guided';
  
  // 1. Detect if the fix is applicable to the current site/page
  detect(context: SiteContext): Promise<DetectionResult>;
  
  // 2. Generate the proposed diff / state transformation without applying
  plan(context: SiteContext, finding: Finding): Promise<FixPlan>;
  
  // 3. Apply the modification to the site / connector
  apply(context: SiteContext, plan: FixPlan): Promise<ApplyResult>;
  
  // 4. Verify post-apply integrity (console errors, visual diff)
  verify(context: SiteContext, plan: FixPlan): Promise<VerificationResult>;
  
  // 5. Revert the modification cleanly back to original state
  revert(context: SiteContext, changelogEntry: ChangelogEntry): Promise<RevertResult>;
}
```

---

## 2. Idempotency Marker Rules
Every applied fix must insert a traceable HTML comment or metadata marker to prevent double-application:
- **Format:** `<!-- optiforge:fix id="FIX-PERF-001" action="applied" timestamp="1730198400" -->`
- If this marker is already present in the target HTML or database entity, `detect()` must return `isApplicable: false`.

---

## 3. Test Fixture Requirements
When authoring a new fix, you must commit two test fixtures under `test/fixtures/fixes/<fix_id>/`:
1. `golden/`: A clean page before and after the fix, proving measurable score improvement without breakage.
2. `breaking/`: A pathological edge-case page (e.g. inline scripts with syntax errors or circular dependencies) proving that `verify()` correctly catches the regression and triggers `revert()`.

---

## 4. Review Checklist
Before submitting a PR with a new fix:
- [ ] Registered in `FIX_REGISTRY.md` with tier and conflict list.
- [ ] Implements all 5 methods (`detect`, `plan`, `apply`, `verify`, `revert`).
- [ ] Fully typed in TypeScript and covered by automated unit & e2e tests.
- [ ] Passes automated visual diff test on the golden fixture.
- [ ] Confirmed zero side-effects when reverted.

---

## 5. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Core Engine Architect** | APPROVED | Confirmed strict 5-method contract eliminates partial applications and guarantees clean reversibility. |
| **Senior QA Engineer** | APPROVED | Enforced mandatory golden and breaking fixtures before PR approval. |
