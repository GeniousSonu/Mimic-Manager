# ADR-0015: Two-Channel WordPress Plugin Update Architecture

- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:**
  The WordPress connector must support two distribution channels with conflicting compliance constraints:
  1. **WordPress.org Directory:** Must adhere strictly to Plugin Guideline 3 (no third-party update checking, no external pingbacks, updates delivered exclusively by WordPress.org SVN).
  2. **Direct GitHub Releases:** Users who self-host or install directly from GitHub require automatic update notifications and one-click upgrades integrated into native `wp-admin` (`Dashboard → Updates`).
- **Decision:**
  Implement a **two-flavor build pipeline** producing two distinct ZIP artifacts from a single clean codebase:
  1. **`wporg` Flavor (`mimic-manager-<version>.zip`):**
     - Contains **ZERO** updater code, zero external update transients, and zero GitHub release URLs.
     - A static AST verification test runs against the built ZIP and fails the build if any updater code or filter is detected.
     - WordPress.org handles update checks and delivery natively.
  2. **`github` Flavor (`mimic-manager-<version>-github.zip`):**
     - Includes a lightweight, secure updater class (`GitHubUpdater`) integrating into WordPress core's `pre_set_site_transient_update_plugins` and `plugins_api` hooks.
     - **Strict Opt-in Consent:** Fresh installs make zero outbound network calls until the site administrator explicitly toggles update checks in Settings.
     - **ETag & Transient Caching:** GitHub Releases API is queried conditionally using `If-None-Match` and cached for 12 hours in a WordPress transient.
     - **Cryptographic Verification:** Downloaded ZIP packages are verified against the release's SHA-256 checksum asset before installation is permitted.
     - **Downgrade & Mismatch Guard:** Blocks version downgrades and rejects packages with mismatched slugs or folder names.
     - **Native Rollback:** Takes a pre-update snapshot of plugin options and triggers safe-mode rollback if activation or DB migration fails.
- **Alternatives Considered:**
  - *Single Hybrid ZIP with Runtime Toggle:* Rejected because WordPress.org plugin reviewers reject plugins that include dead or conditionally disabled third-party updaters.
  - *Custom React-based Upgrader UI:* Rejected because reinvention of WordPress core's native upgrader violates accessibility, breaks standard update hooks, and fails during network interruptions.
- **Consequences:**
  - 100% compliance with WordPress.org guidelines for the directory release.
  - Seamless, secure, native-feeling updates for self-hosted and direct GitHub users.
  - Deterministic build scripts with cryptographic verification of both packages.
- **Verification:**
  - Static scanner asserts zero updater code in the `wporg` ZIP.
  - Playwright and PHPUnit tests verify `pre_set_site_transient_update_plugins` injection and SHA-256 checksum rejection in the `github` flavor.
