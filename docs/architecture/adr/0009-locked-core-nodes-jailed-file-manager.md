# ADR-0009: Jailed File Manager Tree and Locked Core Nodes

- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** In WordPress, arbitrary file browsing and editing presents catastrophic security risks if not strictly constrained. Path traversal attacks (`../../`) could expose `wp-config.php`, `.env`, database dumps, or server configurations. Furthermore, novice users browsing WordPress core directories (`wp-admin`, `wp-includes`) might inadvertently edit core files, resulting in irreversible site breakage or security vulnerabilities during core auto-updates.
- **Decision:**
  1. The default file tree root is strictly jailed to `wp-content/`.
  2. WordPress core directories (`wp-admin/`, `wp-includes/`) and root files (`wp-config.php`, `.htaccess`) are rendered in the tree as locked core nodes with a distinct lock icon and read-only badge.
  3. Locked core nodes are non-expandable by default. A tooltip informs the user: *"WordPress core, read-only. Enable advanced mode in Settings to browse."*
  4. Advanced mode requires explicit opt-in in Settings and re-authentication (sudo mode verification).
  5. The file tree never reveals paths outside the resolved WordPress jail root under any circumstances.
  6. If `DISALLOW_FILE_EDIT` or `DISALLOW_FILE_MODS` constants are defined in WordPress, write operations are completely disabled everywhere in the UI and enforced server-side.
  7. When write mode is disabled (the default), mutating buttons (New File, New Folder, Upload, Rename, Delete) render with honest disabled states and informative tooltips rather than remaining clickable and failing silently.
- **Alternatives Considered:**
  1. *Completely Hiding Core Folders:* Causes confusion for developers wondering why core is absent. Showing them with a locked icon communicates transparent security.
  2. *Unrestricted Root Browsing:* Highly unsafe, rejected by security guidelines and Addendum G/Addendum I.
- **Consequences:**
  - *Positive:* Ironclad protection against unauthorized core modifications and accidental breakages; clear, honest UI states without dead buttons.
  - *Negative:* Advanced developers must perform a 1-step re-auth to browse core files.
- **Verification:** Security traversal test suite proves `..` attempts are blocked by `JailGuard` with HTTP 403, and locked nodes reject expand requests without advanced authorization.
