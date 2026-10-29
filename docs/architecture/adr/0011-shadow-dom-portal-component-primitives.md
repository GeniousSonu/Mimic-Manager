# ADR-0011: Shadow DOM Portal Component Primitives

- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** Component overlay primitives (Dialog, Sheet, Popover, Tooltip, Dropdown Menu) commonly default to mounting portals into `document.body`. In WordPress wp-admin, appending overlays directly to `document.body` causes them to escape the isolated Shadow DOM scope, exposing them to hostile admin styles, broken theme variables, and global z-index collisions.
- **Decision:**
  1. All component primitives in `packages/ui` explicitly require and bind to a designated portal root container located *inside* the Shadow DOM root (`shadowRoot.getElementById('mm-portal-root')`).
  2. Dialogs, sheets, and popovers maintain strict focus trapping (`aria-modal="true"`) and return focus to the trigger element upon dismissal or Escape key press.
  3. Pre-built primitives (Card, Button, IconButton, Input, Select, Switch, Checkbox, Tabs, Tooltip, Popover, Dialog, Sheet, StatusBadge, SkeletonLoader, EmptyState, ErrorCard, Toolbar, Tree, DataGrid, Kbd, Spinner) are used exclusively across all plugin views. Ad-hoc un-styled raw HTML controls are strictly forbidden.
- **Alternatives Considered:**
  1. *Mounting Portals to document.body with CSS Reset:* Fragile; third-party plugins with `!important` global rules pollute modal borders, typography, and button layouts.
  2. *Inline Overlays without Portals:* Can trigger `overflow: hidden` clipping inside data tables or sidebar panes.
- **Consequences:**
  - *Positive:* 100% style isolation for modals and tooltips; consistent z-index layering; zero CSS pollution in either direction.
  - *Negative:* All overlay triggers must have access to the shadow root container reference.
- **Verification:** Automated Playwright test verifies modal backdrop, dialog card, and tooltip positioning and focus trapping inside the shadow root when hostile WordPress CSS is active.
