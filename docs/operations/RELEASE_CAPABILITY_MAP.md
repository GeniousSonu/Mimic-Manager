# Release Engineering & Tooling Capability Map

**Status:** ACTIVE  
**Last-reviewed:** 2026-10-29  
**Applies-to:** Track `RELEASE-ENG` (Addendum K)  
**Standard:** All tools, actions, APIs, and GitHub features verified against CURRENT official documentation prior to use.

---

## 1. Verified Capabilities & Reference Documentation

| Capability / Tool | Current Source URL | Verified API / Version | Access Date | Integration Role |
| :--- | :--- | :--- | :--- | :--- |
| **Google Release-Please Action** | `https://github.com/google-github-actions/release-please-action` | `v4.1.3` (node20) | 2026-10-29 | Automated Conventional Commit parsing, release PR maintenance, SemVer bumping, and CHANGELOG generation for monorepos |
| **GitHub REST API (Releases & Assets)** | `https://docs.github.com/en/rest/releases/releases` | GitHub REST v2022-11-28 | 2026-10-29 | GitHub-channel updater release asset fetching, checksum verification, draft release publication |
| **WordPress Upgrader Transient Hook** | `https://developer.wordpress.org/reference/hooks/pre_set_site_transient_transient/` | WordPress Core `pre_set_site_transient_update_plugins` | 2026-10-29 | Native WordPress update UI injection for `github` flavor without full-page overhead |
| **WordPress Plugins API Popup Hook** | `https://developer.wordpress.org/reference/hooks/plugins_api/` | WordPress Core `plugins_api` | 2026-10-29 | Native "View version details" modal content population (changelog, requirements, banner) |
| **WordPress Upgrader Completion Hook**| `https://developer.wordpress.org/reference/hooks/upgrader_process_complete/` | WordPress Core `upgrader_process_complete` | 2026-10-29 | Transient cache purging upon successful package upgrade |
| **GitHub Actions Artifact Attestation**| `https://github.com/actions/attest-build-provenance` | `v2.2.0` | 2026-10-29 | Cryptographic Sigstore provenance attestation for built ZIPs, Docker images, and manifests |
| **10up WP Plugin Deploy Action** | `https://github.com/10up/action-wordpress-plugin-deploy` | `v2.2.3` | 2026-10-29 | Automated SVN asset sync and trunk/tag deployment for `wporg` channel |
| **Semantic Versioning Specification** | `https://semver.org/spec/v2.0.0.html` | SemVer 2.0.0 | 2026-10-29 | Product versioning standard (`vMAJOR.MINOR.PATCH[-prerelease]`) |
| **Conventional Commits Specification** | `https://www.conventionalcommits.org/en/v1.0.0/` | v1.0.0 | 2026-10-29 | Structured commit messages driving automated SemVer bumps |

---

## 2. Capability Boundaries & Strict Guardrails

1. **Zero External Updater in WP.org Flavor:**
   WordPress.org Guidelines Guideline 3 strictly prohibits third-party update mechanisms. The `wporg` flavor is built without any updater code, without GitHub release URLs, and without update transients. Verified by automated static AST scan.
2. **Opt-in Consent for GitHub Channel Updater:**
   The `github` flavor updater never sends an outbound network request on a fresh install until the administrator explicitly toggles consent in Settings.
3. **ETag & Rate-Limit Awareness:**
   GitHub Releases API calls use conditional HTTP requests (`If-None-Match` with ETag) and are cached in a 12-hour WordPress transient to respect GitHub's 60 requests/hr unauthenticated rate limit.
4. **Deterministic Single Canonical Version:**
   Root `package.json` `"version"` is the sole authoritative version string. All child files (`composer.json`, PHP constant, `readme.txt`, OpenAPI) are synchronized via `pnpm version:sync`. Hand-editing is blocked by `pnpm version:check`.
