# Mimic Manager Content Style Guide & UX Writing

**Status:** ACTIVE  
**Owner-persona:** Lead UX Writer & Content Designer  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [DESIGN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN.md), [I18N_AND_RTL.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/I18N_AND_RTL.md)

---

## 1. Tone of Voice Matrix

| Context | Tone Goal | Example DO | Example DON'T |
| :--- | :--- | :--- | :--- |
| **First-Run** | Welcoming, reassuring, concise | "Connect your WordPress site to begin optimizing media and speed." | "Welcome to the ultimate revolutionary optimization powerhouse!" |
| **Success** | Understated, precise | "Optimized 42 images. Saved 14.8 MB (68%)." | "Awesome job! You crushed it! 🎉" |
| **Warning** | Clear, calm, risk-oriented | "Deferring this script may affect your sticky navigation menu. Preview before applying." | "Warning: Danger of breaking your layout!" |
| **Error** | Actionable, constructive | "Could not connect to Redis. Check your connection string in Settings." | "Fatal Error: Connection refused." |

---

## 2. The 4-Part Error Formula

Every error message in Mimic Manager strictly adheres to this 4-part formula:
1. **What Happened:** State the failure clearly without panic.
2. **Why It Happened:** Explain the root cause if known.
3. **What You Can Do:** Provide the immediate next step or remediation action.
4. **Technical Details (Optional Toggle):** Expandable error stack with a "Copy Diagnostics" button.

### Example:
> **Could not generate AVIF variants.**  
> The uploaded file exceeds the 50 megapixel safety limit (calculated: 72 MP).  
> Downsample the original image before uploading, or increase the pixel ceiling in Settings.  
> `[▸ View Technical Details] [Copy Diagnostics]`

---

## 3. General Writing Rules
- **Sentence Case Everywhere:** Use sentence case for headings, buttons, and labels (e.g., "Run full audit", not "Run Full Audit").
- **No Exclamation Marks:** Prohibited across all technical and error messages.
- **Verbs on Actions:** Buttons must state what will happen (e.g., "Delete 12 originals", not "OK").

---

## 4. Microcopy Library Catalog

| Key | Context | Text | Max Length |
| :--- | :--- | :--- | :--- |
| `btn.preview_fix` | Speed Fix Card | "Preview changes" | 24 chars |
| `btn.apply_fix` | Speed Fix Card | "Apply fix" | 16 chars |
| `btn.revert_fix` | Speed Fix Card | "Revert to original" | 24 chars |
| `toast.fix_applied` | Mutation Toast | "Fix applied. Front-end verified." | 40 chars |
| `btn.undo` | Toast Action | "Undo" | 8 chars |

---

## 5. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **UX Writer Lead** | APPROVED | Confirmed sentence case and 4-part error formula across all client-facing copy. |
| **Support Engineer** | APPROVED | Validated "Copy Diagnostics" button in technical details drawer prevents back-and-forth debugging on support forums. |
