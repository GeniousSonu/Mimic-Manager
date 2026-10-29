# ADR-0008: Monaco Editor Shadow DOM Integration and Sandboxed Isolation

- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** The Mimic Manager visual file manager requires an in-browser code editor with syntax highlighting, diff viewing, and code completion. Monaco Editor (VS Code core) is the industry standard. However, Monaco relies heavily on DOM measurements, CSS variables, hover overlays, context menus, and Web Workers. Rendering Monaco inside an encapsulated Shadow DOM root can lead to mispositioned hover widgets or broken font styling. Furthermore, loading Monaco from third-party CDNs is strictly prohibited by WordPress.org compliance rules.
- **Decision:**
  1. Monaco Editor is packaged locally as a lazy-loaded chunk (never loaded on initial shell boot to maintain the < 250 KB gzip budget).
  2. Workers are configured using local blob URLs and local script paths with zero external CDN dependencies.
  3. When mounted in Shadow DOM, Monaco's container is explicitly passed to `monaco.editor.create(container, { ... })` and popover roots are scoped to the shadow root.
  4. If host browser quirks in specific WordPress environments prevent clean overlay positioning inside Shadow DOM, an isolated same-origin sandboxed `iframe` served from the plugin directory with a strictly typed `postMessage` protocol (validating origin, token, and schema) is deployed as the transparent fallback.
- **Alternatives Considered:**
  1. *CodeMirror 5/6:* Lightweight, but lacks native VS Code diff viewer and deep TypeScript/PHP tokenization parity.
  2. *Raw HTML Textarea:* Zero syntax highlighting, poor tab indentation, and unacceptable developer experience for file management.
- **Consequences:**
  - *Positive:* Full desktop-grade code editing and visual diffing; zero CDN dependencies; 100% WP.org compliant; lazy load preserves snappy initial shell paint (< 1.5s).
  - *Negative:* Chunk size must be isolated so initial download remains lightweight.
- **Verification:** Unit and visual tests confirm editor opening, PHP syntax validation, diff viewer rendering against shadow backups, and reliable context menu positioning.
