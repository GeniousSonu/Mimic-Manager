# OptiForge Internationalization (i18n) & RTL Specification

**Status:** ACTIVE  
**Owner-persona:** Localization Architect & Global UX Specialist  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [CONTENT_STYLE_GUIDE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/CONTENT_STYLE_GUIDE.md), [DESIGN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN.md)

---

## 1. Overview & Formatting Rules
All user-facing copy in OptiForge is externalized into structured JSON catalogs using **ICU MessageFormat**:
- **Zero Hard-Coded Strings:** Lint rules forbid raw string literals in JSX/TSX.
- **Locale-Aware Formatting:** Numbers, percentages, dates, and file sizes are formatted via `Intl.NumberFormat` and `Intl.DateTimeFormat`.
- **Shipped Locales:** English (`en-US`) and automated Pseudo-Localization (`qps-ploc`) for catching UI clipping.

---

## 2. Right-to-Left (RTL) Layout Support
- **Logical CSS Properties:** Layouts strictly utilize CSS logical properties (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`) instead of physical directions (`left`, `right`).
- **Directional Icons:** Navigation chevrons and back buttons automatically flip in RTL mode (`[dir="rtl"]`).
- **Media Controls:** Media sliders (BeforeAfterSlider) retain chronological directionality while swapping handle labels.

---

## 3. Pseudo-Localization & Truncation Testing
In CI, OptiForge builds an automated pseudo-localized variant where:
- All vowels receive diacritics (`[!! ÕptíFõrgé !!]`).
- Strings are expanded by 30% in length to simulate German and Finnish text expansion.
- Automated visual regression verifies that zero buttons, table headers, or cards suffer text truncation.

---

## 4. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Localization Architect** | APPROVED | Confirmed strict use of logical CSS properties guarantees full bi-directional layout parity. |
| **Internationalization QA Lead** | APPROVED | Validated automated pseudo-localization catches character clipping before PR merge. |
