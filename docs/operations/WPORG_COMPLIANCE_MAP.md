# WordPress.org Plugin Directory Compliance & Guidelines Map

**Status:** APPROVED FOR SUBMISSION  
**Target Plugin:** Mimic Manager (`connectors/wordpress`)  
**Specification:** WordPress.org Detailed Plugin Guidelines & Review Requirements  
**Verification Date:** 2026-10-29  

---

## 1. Official Guidelines Sources & Reference Dates

| Document / Policy | Official URL | Verified Date | Implementation Impact |
|---|---|---|---|
| **Detailed Plugin Guidelines** | [wordpress.org/plugins/developers/guidelines/](https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/) | 2026-10-29 | Governs all 18 numbered rules, licensing, remote code, consent. |
| **Plugin Submission & Review Process** | [developer.wordpress.org/plugins/wordpress-org/submission-and-review/](https://developer.wordpress.org/plugins/wordpress-org/submission-and-review/) | 2026-10-29 | Review criteria, manual security checks, reviewer email workflow. |
| **Plugin Readme Standard & Validator** | [wordpress.org/plugins/developers/readme-validator/](https://wordpress.org/plugins/developers/readme-validator/) | 2026-10-29 | Readme section syntax, headers, stable tag, external service disclosure. |
| **Plugin Handbook: Security** | [developer.wordpress.org/plugins/security/](https://developer.wordpress.org/plugins/security/) | 2026-10-29 | Nonce verification, capability gating (`manage_options`), output escaping. |
| **Plugin Handbook: Privacy & Data** | [developer.wordpress.org/plugins/privacy/](https://developer.wordpress.org/plugins/privacy/) | 2026-10-29 | `wp_add_privacy_policy_content`, export/erase personal data hooks. |
| **Plugin Check (PCP) Tool** | [wordpress.org/plugins/plugin-check/](https://wordpress.org/plugins/plugin-check/) | 2026-10-29 | Automated linter for core WPCS, security, assets, and standard functions. |
| **WordPress Core Roadmap** | [wordpress.org/about/requirements/](https://wordpress.org/about/requirements/) | 2026-10-29 | Targets WP `6.0` to `6.7` (latest stable) and PHP `8.0` to `8.4`. |

---

## 2. Guideline Threat Analysis & Architectural Mitigations

### Threat 1: External Backend Dependency (Guideline 5)
- **Rule:** A plugin must provide immediate local utility without requiring a remote server, external account, or tracking connection. No outbound requests may occur before explicit user consent.
- **Architectural Resolution:**
  - Mimic Manager works 100% offline upon activation using local PHP extensions (`Imagick` / `GD`) for WebP/AVIF conversions, local heuristics for SEO gap filling, local rule engines for PageSpeed fixes, and a sandboxed local file manager.
  - The external backend API is strictly an **optional enhancement** for offloading heavy jobs.
  - **Zero Outbound Calls on Activation:** Fresh activation makes 0 network calls. Network transmission occurs only after the administrator navigates to Settings and completes the pairing flow.
  - Fully disclosed under `== External Services ==` in `readme.txt`.

### Threat 2: High-Scrutiny File Manager (Guidelines 2, 4, 10)
- **Rule:** Plugins editing files undergo stringent security audits due to potential arbitrary file read/write (RCE) risks.
- **Architectural Resolution:**
  - Strict containment (`JailGuard`) using `realpath` verification permanently confining file operations inside `WP_CONTENT_DIR`.
  - Blocklist on sensitive configuration files: `wp-config.php`, `.env`, `.htaccess`, `.sql`, `php.ini`.
  - Capability gated to `manage_options` exclusively.
  - Sudo re-authentication modal requiring admin password verification before writes.
  - Respects `DISALLOW_FILE_EDIT` and `DISALLOW_FILE_MODS` core constants.
  - Pre-save PHP AST syntax check (`PhpAstLinter`) to prevent WSOD.
  - Shipped with read-only preview by default; write/edit mode requires deliberate toggle.

### Threat 3: Licensing & Bundled Libraries (Guideline 1 & 4)
- **Rule:** Every line of bundled code, styles, fonts, and scripts must be 100% GPLv2+ compatible. No obfuscated or minified code without public unminified sources.
- **Architectural Resolution:**
  - WordPress connector is licensed strictly under **GPL-2.0-or-later**.
  - All bundled Composer packages are namespaced (`Wefik\MimicManager\Vendor`) to prevent symbol collisions.
  - Scripts and styles are built into un-obfuscated bundles with source maps and build scripts documented in `readme.txt`.

---

## 3. Owner-Blocked Items Matrix

The following items cannot be automated via code and must be supplied or performed by the account owner:

| ID | Item | Current State | Required Owner Action |
|---|---|---|---|
| **OWNER-01** | **WordPress.org Username** | Placeholder `wefik, genioussonu` | Confirm official WP.org profile username for `Contributors:` in `readme.txt`. |
| **OWNER-02** | **SVN Credentials** | Pending | Add `WPORG_SVN_USERNAME` and `WPORG_SVN_PASSWORD` as GitHub Secrets for CI deployment. |
| **OWNER-03** | **Submission Upload** | Prepared | Log in to `wordpress.org/plugins/developers/add/` and upload the built zip bundle. |
| **OWNER-04** | **Slug Reservation** | `mimic-manager` | Reviewers will confirm slug `mimic-manager` upon approval of initial zip. |
