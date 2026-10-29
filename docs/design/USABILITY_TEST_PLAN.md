# OptiForge Usability Test Plan & Persona Validation

**Status:** ACTIVE  
**Owner-persona:** Lead UX Researcher & Usability Analyst  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [UX_SPEC.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/UX_SPEC.md), [DESIGN_CRITIQUE_LOG.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN_CRITIQUE_LOG.md), [PERSONAS_AND_JTBD.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/PERSONAS_AND_JTBD.md)

---

## 1. Objectives & Metrics
The Usability Test Plan validates that both novice non-technical site owners and expert agency developers can execute core tasks with minimal friction, zero cognitive traps, and low task completion times.

### Core Metrics Measured:
- **Time-on-Task (ToT):** Elapsed seconds from task initiation to completion.
- **Click Count:** Total mouse clicks or taps required.
- **Error Rate:** Number of unintended navigation steps or misclicks.
- **System Usability Scale (SUS):** Target score ≥ 85.

---

## 2. Standard Usability Scenarios

### Task 1: Connect a New WordPress Site
- **Persona:** Sarah (Non-Technical Site Owner)
- **Prompt:** "You have installed the OptiForge WordPress plugin. Connect your site to your OptiForge command center dashboard."
- **Success Criteria:** Completed in ≤ 3 clicks and ≤ 60 seconds.

### Task 2: Bulk-Optimize 200 Images and Undo Conversion
- **Persona:** Marcus (Agency Owner)
- **Prompt:** "Run bulk optimization to convert uploaded JPEG images to WebP/AVIF. After the batch completes, undo the conversion for a specific hero image."
- **Success Criteria:** Zero configuration ambiguity; undo successfully restores original in 1 click.

### Task 3: Inspect PageSpeed Score Drop and Revert Regressive Fix
- **Persona:** Elena (Performance Consultant)
- **Prompt:** "A performance alert indicates mobile LCP degraded on a staging site. Identify the cause, review the visual diff, and revert the offending fix."
- **Success Criteria:** Navigates from alert directly to changelog diff in ≤ 2 clicks; 1-click instant revert.

---

## 3. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Lead UX Researcher** | APPROVED | Confirmed task scenarios cover both beginner onboarding and expert troubleshooting flows. |
| **Support Lead** | APPROVED | Validated scripted tests directly measure time-to-first-value and undo accessibility. |
