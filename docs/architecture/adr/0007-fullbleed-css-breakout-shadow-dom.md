# ADR-0007: Full-Bleed CSS Breakout with Scoped Body Class and Notice Tray

- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:** Standard WordPress admin layout forces 20px padding and margins around `#wpcontent`, `#wpbody-content`, and `.wrap`, and renders a fixed `#wpfooter`. For data-intensive tooling such as a 3-pane File Manager and real-time Core Web Vitals diff visualizer, this creates cramped viewports, wasted horizontal space, and awkward double scrollbars. Furthermore, third-party plugin notices frequently inject intrusive banner messages into the top of the admin content area.
- **Decision:**
  1. Add a scoped body class (`mm-fullbleed`) strictly on the `toplevel_page_mimic-manager` screen via the WordPress `admin_body_class` filter.
  2. Scope all CSS overrides strictly under `body.mm-fullbleed`: remove margin and padding on `#wpcontent`, `#wpbody`, `#wpbody-content`, and `.wrap`; hide `#wpfooter`; keep `#wpadminbar` and `#adminmenuwrap` fully functional and accessible.
  3. Dimension the host mount root to 100% width and `calc(100dvh - var(--wp-admin--admin-bar--height, 32px))` (with 46px fallback at mobile `<= 782px`). The page body is set to `overflow: hidden` to eliminate double scrollbars; internal panes manage their own scrolling.
  4. Collect core and third-party notices into a collapsible "WordPress notices (N)" tray in the shell header, preserving full visibility without polluting the canvas.
- **Alternatives Considered:**
  1. *Complete Admin Takeover (Hiding WP Admin Bar and Menu):* Disorients administrators, breaks skip navigation links, and violates WordPress.org plugin directory guidelines.
  2. *Standard Constrained Box:* Creates horizontal squeezing, limiting data grid columns and editor usability.
- **Consequences:**
  - *Positive:* Maximized desktop screen estate; seamless native-like desktop software feel; zero double scrollbars; WordPress notices remain accessible.
  - *Negative:* Must account for WP admin bar height variations across mobile and desktop breakpoints (32px vs 46px).
- **Verification:** Visual regression tests at 1280px, 1440px, 1920px, and mobile 390px verify host height equals `viewport - admin_bar`, with no body scrollbars and zero style leakage.
