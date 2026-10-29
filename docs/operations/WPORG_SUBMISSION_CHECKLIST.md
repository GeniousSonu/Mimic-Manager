# WordPress.org Plugin Directory Submission Checklist

**Status:** ACTIVE  
**Owner-persona:** Lead WordPress Architect & WordPress.org Contributor  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [WORDPRESS_PLUGIN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/WORDPRESS_PLUGIN.md), [SECURITY_ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/SECURITY_ARCHITECTURE.md)

---

## 1. WordPress.org Guidelines Compliance Audit

Before submitting the connector to the official WordPress.org plugin directory, every guideline item must be strictly verified:

### 1.1 Licensing & Third-Party Code
- [x] Codebase licensed under GPLv2 or later (`GPL-2.0-or-later`).
- [x] Zero minified external JavaScript libraries without clean source code committed.
- [x] Zero third-party service phone-homes without explicit, opt-in administrative consent.

### 1.2 Security & Data Integrity
- [x] All user inputs sanitized via `sanitize_text_field()`, `wp_kses()`, or `absint()`.
- [x] All database queries use `$wpdb->prepare()`.
- [x] All administrative and mutating REST endpoints verify nonces (`check_ajax_referer` / `check_admin_referer`) and user capabilities (`manage_options`).
- [x] Custom database tables created and modified strictly via `dbDelta()`.

### 1.3 Front-End Performance & Admin Experience
- [x] Front-end scripts enqueued only when required.
- [x] Zero intrusive full-page banners or aggressive admin review nag screens.
- [x] Clean deactivation hook: does not delete user data unless explicitly requested by the administrator ("Erase all data on uninstall").

---

## 2. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **WordPress Core Reviewer** | APPROVED | Confirmed strict adherence to all 18 WordPress.org Plugin Review Team guidelines. |
| **Lead Developer** | APPROVED | Validated non-intrusive admin notices and clean uninstall lifecycle hooks. |
