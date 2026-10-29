# Mimic Manager Iconography Specification

**Status:** ACTIVE  
**Owner-persona:** Visual Designer & Iconography Specialist  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [DESIGN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN.md), [COMPONENTS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/COMPONENTS.md)

---

## 1. Icon Library & Construction Rules
- **Base Icon Library:** **Lucide Icons** (ISC License, 100% open source).
- **Grid Size:** Designed strictly on a **24×24 pixel vector grid**.
- **Stroke Width:** Unified **1.75px** stroke width.
- **Caps & Joins:** Round line caps (`stroke-linecap="round"`) and round corner joins (`stroke-linejoin="round"`).
- **Prohibition:** Emoji must **never** be used as icons in the product UI.

---

## 2. File Manager File-Type Icon Set
To provide Apple Files / Google Files polish in the Visual File Manager, dedicated colorized file-type icons are rendered:

| File Type | Base Icon | Color Token | File Extensions Covered |
| :--- | :--- | :--- | :--- |
| **Folder** | `Folder` | `--color-accent-default` (`#7C6CFF`) | Directories, packages |
| **Code** | `FileCode` | `--color-semantic-info` (`#4DA3FF`) | `.php`, `.js`, `.ts`, `.css`, `.json`, `.sql` |
| **Image** | `FileImage` | `--color-semantic-success` (`#2FBF8F`) | `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.svg` |
| **Archive** | `FileArchive` | `--color-semantic-warning` (`#F5A524`) | `.zip`, `.tar`, `.gz`, `.rar` |
| **Document**| `FileText` | `--color-text-secondary` (`#A5AEC0`) | `.txt`, `.md`, `.pdf`, `.log` |
| **Font** | `FileType` | `--color-accent-hover` (`#8F81FF`) | `.woff2`, `.woff`, `.ttf`, `.eot` |
| **Video** | `FileVideo` | `--color-semantic-danger` (`#F2555A`) | `.mp4`, `.webm`, `.mov` |
| **Config** | `FileCog` | `--color-text-tertiary` (`#747E92`) | `.env`, `.ini`, `.conf`, `.yml` |

---

## 3. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Iconography Specialist** | APPROVED | Confirmed consistent 1.75px stroke width across all system icons ensures visual cohesion with typography. |
| **UI Polish Auditor** | APPROVED | Validated file-type color coding accelerates visual recognition in dense directory listings. |
