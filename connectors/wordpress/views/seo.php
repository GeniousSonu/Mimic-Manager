<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

defined('ABSPATH') || exit;
?>
<div class="wrap mm-wrap">
  <div class="mm-header">
    <div>
      <h1><?php esc_html_e('SEO Engine & Gap Fill', 'mimic-manager'); ?></h1>
      <p style="margin:4px 0 0; color:var(--mm-muted); font-size:13px;"><?php esc_html_e('Identifies and fixes empty meta descriptions, missing alt text, and OpenGraph gaps without overwriting existing data.', 'mimic-manager'); ?></p>
    </div>
  </div>

  <div class="mm-card">
    <h3><?php esc_html_e('SEO Plugin Integration Status', 'mimic-manager'); ?></h3>
    <p style="color:var(--mm-muted); font-size:13px;">
      <?php
      if (defined('WPSEO_VERSION')) {
          esc_html_e('Detected Yoast SEO: Mimic Manager will write directly into Yoast metadata fields.', 'mimic-manager');
      } elseif (defined('RANK_MATH_VERSION')) {
          esc_html_e('Detected Rank Math: Mimic Manager will write directly into Rank Math fields.', 'mimic-manager');
      } else {
          esc_html_e('Standalone Mode: No third-party SEO plugin detected. Mimic Manager will output native Schema and OpenGraph tags.', 'mimic-manager');
      }
      ?>
    </p>

    <div class="mm-toggle-row">
      <div>
        <strong><?php esc_html_e('Never Overwrite Rule', 'mimic-manager'); ?></strong>
        <p style="margin:2px 0 0; font-size:12px; color:var(--mm-muted);"><?php esc_html_e('Existing manually written titles, alt tags, and descriptions are permanently respected.', 'mimic-manager'); ?></p>
      </div>
      <div><span class="mm-status-pill success"><?php esc_html_e('Protected', 'mimic-manager'); ?></span></div>
    </div>
  </div>
</div>
