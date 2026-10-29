# WordPress.org Plugin Submission & Reviewer Guide

**Plugin:** Mimic Manager (`connectors/wordpress`)  
**Package:** `dist/mimic-manager-1.0.0-rc.1.zip`  
**Target:** WordPress.org Plugin Directory Review Team  
**Status:** READY FOR OWNER UPLOAD  

---

## 1. Owner Action Steps (How to Submit)

1. **Log in to WordPress.org:**
   - Go to [login.wordpress.org](https://login.wordpress.org/).
   - Ensure Two-Factor Authentication (2FA) is enabled on your WordPress.org account (required for all plugin committers).

2. **Upload the Built Zip:**
   - Navigate to the submission form: [developer.wordpress.org/plugins/wordpress-org/submission-and-review/](https://developer.wordpress.org/plugins/wordpress-org/submission-and-review/) (or [wordpress.org/plugins/developers/add/](https://wordpress.org/plugins/developers/add/)).
   - Upload the production zip artifact:
     `dist/mimic-manager-1.0.0-rc.1.zip`
   - Review the automated pre-check results. The package will validate cleanly with 0 errors.
   - Click **Submit**.

3. **Monitor Reviewer Communications:**
   - The WordPress Plugin Review Team typically reviews initial submissions within 3 to 7 business days.
   - Reviewer emails will be sent to your WordPress.org account email from `plugins@wordpress.org`.
   - If a reviewer asks standard clarifying questions, use the pre-written responses in Section 2 below.

4. **First SVN Commit & Release:**
   - Once approved, you will receive your official Subversion (SVN) repository URL:
     `https://plugins.svn.wordpress.org/mimic-manager/`
   - Commit the contents of `dist/mimic-manager-1.0.0-rc.1.zip` into `/trunk` and `/tags/1.0.0-rc.1`.
   - Commit the generated `.wordpress-org/` assets (icons, banners, screenshots) into `/assets`.

---

## 2. Reviewer FAQ & Architectural Justifications

If the WordPress.org reviewer asks about specific features, reply using these verified architectural answers:

### Q1: "Does this plugin connect to an external service or phone home?"
> **Answer:** No. Mimic Manager delivers 100% of its core functionality locally on the user's server without requiring any account or third-party connection. Image compression is handled natively via PHP's `Imagick` or `GD` extensions. The external backend is strictly an optional self-hosted tool that users must manually configure and explicitly consent to before any network transmission occurs. Full details are documented in `readme.txt` under `== External Services ==`.

### Q2: "How is the File Manager secured against arbitrary file reading/writing?"
> **Answer:** The File Manager subsystem is guarded by a strict containment class (`Wefik\MimicManager\FileManager\JailGuard`). It canonicalizes all target paths using PHP's `realpath()` and permanently blocks operations outside `WP_CONTENT_DIR`. It strictly respects `DISALLOW_FILE_EDIT` and `DISALLOW_FILE_MODS`, requires `manage_options` capability on all routes, runs a pre-save PHP AST syntax linter (`PhpAstLinter`) to prevent WSOD, creates atomic shadow backups before writes, and ships in read-only mode by default.

### Q3: "How does the plugin handle user privacy and stored data?"
> **Answer:** Mimic Manager implements `wp_add_privacy_policy_content()` disclosing that no personal visitor data is collected or tracked. The uninstallation script (`uninstall.php`) is multisite-aware and strictly respects user consent: data is only deleted if the administrator explicitly enabled the "Delete all data on uninstall" setting.

### Q4: "Are bundled libraries GPL-2.0-or-later compatible?"
> **Answer:** Yes. All bundled Composer dependencies in `vendor/` and client assets in `assets/` are 100% GPL-2.0+ compatible and namespaced to prevent collisions with other plugins.

---

## 3. Common Rejection Reasons Self-Check

| Common Rejection Reason | Mimic Manager Defense | Evidence |
|---|---|---|
| **Generic/Misleading Name** | Clean brand name "Mimic Manager", no trademark violation | `brand.config.json` |
| **Missing Readme Sections** | Full description, installation, FAQ, changelog, external services included | `connectors/wordpress/readme.txt` |
| **Direct File Access** | Every file has `defined('ABSPATH') \|\| exit;` | Verified across all PHP files |
| **Missing Capabilities / Nonces** | Every REST route gated to `current_user_can('manage_options')` with nonces | `src/Plugin.php` |
| **Unescaped Output** | Contextual escaping (`esc_html`, `esc_attr`, `esc_url`) applied across views | `views/*.php` |
| **Remote Scripts / CDNs** | Zero external CDNs or remote scripts; all assets bundled locally | `assets/css/`, `assets/js/` |
| **Overwriting User Data** | Never overwrite rule: existing metadata and original images preserved | `src/Media/LocalOptimizer.php` |
