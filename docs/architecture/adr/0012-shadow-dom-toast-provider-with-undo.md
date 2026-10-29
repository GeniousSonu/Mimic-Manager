# ADR-0012: Accessible Shadow DOM Toast Provider with Undo Capability

- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** Notification toasts are vital for providing feedback on background jobs (bulk media compression, scan completions) and state changes (settings saved, backend disconnected). However, global toast libraries often render into `document.body`, produce redundant or repeating toasts during network reconnect loops, lack screen reader announcement (`aria-live`), or fail to provide an immediate "Undo" capability for destructive actions.
- **Decision:**
  1. We implement an accessible Toast Provider mounted inside the Shadow DOM shell.
  2. Toasts are announced via `aria-live="polite"` (or `assertive` for critical errors) and support keyboard dismissal (Escape or click).
  3. Every mutating action (file deletion, bulk compression, fix application) includes an inline "Undo" action with a minimum 10-second survival window before final persistence.
  4. Redundant toast deduplication: connection warnings (such as "Cloud backend unreachable. Operating in local mode.") are strictly deduplicated and rate-limited to at most once per state transition.
  5. Maximum stack limit of 3 visible toasts, with older toasts fading out gracefully.
  6. Toasts never log or expose raw stack traces, tokens, or security credentials.
- **Alternatives Considered:**
  1. *Native browser alert/confirm:* Blocking, un-stylable, and jarring.
  2. *Unbounded Toast Stacking:* Floods the viewport during batch background processing.
- **Consequences:**
  - *Positive:* High user confidence through immediate 1-click Undo; non-intrusive feedback; fully accessible for screen reader and keyboard users.
  - *Negative:* Mutating operations must delay irreversible cleanup until the Undo timer expires.
- **Verification:** Unit tests confirm 10-second undo callback execution and deduplication rate limiting.
