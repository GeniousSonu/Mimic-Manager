# OptiForge Motion & Animation Specification

**Status:** ACTIVE  
**Owner-persona:** Motion Designer & Accessibility Specialist  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [DESIGN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN.md), [TOKENS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/TOKENS.md), [ACCESSIBILITY.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/ACCESSIBILITY.md)

---

## 1. Motion Philosophy & Principles
Motion in OptiForge serves functional clarity rather than theatrical decoration:
- **Communicate Cause & Effect:** Show where an item expanded from, clarify spatial relationships, and confirm state changes.
- **Never Block User Input:** Animations must not prevent clicks, keypresses, or navigation.
- **Strict 60 FPS Budget:** All animations must utilize GPU-accelerated CSS properties (`transform`, `opacity`); zero animation of `width`, `height`, `margin`, or `top`.

---

## 2. Motion Timing & Easing Curves

| Token Name | Value | Purpose |
| :--- | :--- | :--- |
| `--motion-duration-instant` | `90ms` | Micro-interactions: toggle switches, button pressed states |
| `--motion-duration-fast` | `140ms` | Tooltips, dropdown menus, context menus opening |
| `--motion-duration-normal` | `220ms` | Modal dialogs, card state transitions, tab switching |
| `--motion-duration-slow` | `320ms` | Sheet / drawer sliding, accordion expand/collapse |
| `--motion-duration-deliberate`| `480ms` | Complex layout re-flow, multi-step wizards |
| `--motion-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Standard transitions and fades |
| `--motion-ease-emphasized` | `cubic-bezier(0.3, 0, 0, 1.05)` | Playful entrances, drawer reveals, popovers |
| `--motion-ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Rapid exits and dismissals |

---

## 3. Reduced Motion Support (`prefers-reduced-motion`)
When the user's OS or browser has `prefers-reduced-motion: reduce` enabled:
- All slide, spring, and transform animations are disabled.
- Transitions fall back to instantaneous or simple cross-fades under 120ms.
- Continuous skeleton shimmer animations pause immediately.

---

## 4. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Motion Specialist** | APPROVED | Confirmed strict use of transform and opacity guarantees consistent 60 FPS rendering on mid-tier mobile hardware. |
| **Accessibility Specialist** | APPROVED | Validated instant fade fallback for users with vestibular motion sensitivities. |
