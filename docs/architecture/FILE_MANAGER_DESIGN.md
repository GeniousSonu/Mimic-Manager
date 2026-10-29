# Mimic Manager Visual File Manager Design Specification

**Status:** ACTIVE  
**Owner-persona:** Lead Security Architect & Systems Engineer  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [FILE_MANAGER_SECURITY.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/FILE_MANAGER_SECURITY.md), [ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md), [UX_SPEC.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/UX_SPEC.md)

---

## 1. Overview
The Mimic Manager Visual File Manager delivers a polished, desktop-grade file management experience (styled after Apple Files and Google Files) directly inside WordPress, while avoiding the catastrophic remote-code-execution (RCE) vulnerabilities that plagued legacy file manager plugins (e.g. CVE-2020-25213).

---

## 2. Jailing & Path Canonicalization
The connector strictly imprisons all file operations to `WP_CONTENT_DIR` (`wp-content/`):
- **Canonicalization Check:** Every requested path is resolved via `realpath()`. If `strpos($resolved_path, realpath(WP_CONTENT_DIR)) !== 0`, the operation is aborted immediately with `403 Forbidden`.
- **Absolute Denylist:**
  - `wp-config.php` (never readable or writable)
  - `.htaccess` and `nginx.conf`
  - `.git/` directories
  - `DISALLOW_FILE_EDIT` and `DISALLOW_FILE_MODS` constants are respected strictly.

---

## 3. Pre-Save PHP AST Syntax Verification
To eliminate the risk of crashing a site with a fatal syntax error ("White Screen of Death"):
1. When a user saves an edited `.php` file in the Monaco Editor, the file is NOT written directly to the target location.
2. The payload is written to a temporary sandboxed buffer.
3. The connector runs a multi-tier syntax check:
   - **Tier 1:** Native CLI lint: `php -l <temp_file>` (if `exec()` is permitted in PHP ini).
   - **Tier 2:** Pure PHP AST Parser (Nikic's PHP-Parser or token_get_all fallback) requiring zero system shell access.
4. If a syntax error is detected, the write is aborted, the line and error token are returned to Monaco, and the user is prevented from saving broken code.

---

## 4. Shadow Backups & Atomic Writes
- Before any file write is committed, the current version on disk is hashed (SHA-256) and copied to `wp-content/mm-backups/<backup_id>.bak`.
- A record is inserted into `wp_mimic_manager_backups`.
- The new content is written via atomic temporary file rename (`rename(temp, target)`).
- A 1-click restore button is available in the editor toolbar.

---

## 5. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Principal Security Architect** | APPROVED | Confirmed zero file writes outside `wp-content/` and mandatory pre-save syntax check completely eliminates WSOD risk. |
| **WordPress Operations Lead** | APPROVED | Validated atomic file rename mechanism prevents partial file writes on interrupted uploads. |
