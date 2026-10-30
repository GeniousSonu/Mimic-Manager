<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

defined('ABSPATH') || exit;
?>
<div class="wrap mm-wrap">
  <div class="mm-header">
    <div>
      <h1><?php esc_html_e('Sandboxed Visual File Manager', 'mimic-manager'); ?></h1>
      <p style="margin:4px 0 0; color:var(--mm-muted); font-size:13px;"><?php esc_html_e('Jailed exclusively to wp-content with pre-save syntax linting and shadow backups.', 'mimic-manager'); ?></p>
    </div>
  </div>

  <div class="mm-card">
    <h3><?php esc_html_e('Sandbox & Jail Status', 'mimic-manager'); ?></h3>
    <div class="mm-toggle-row">
      <div>
        <strong><?php esc_html_e('Jail Path (Root)', 'mimic-manager'); ?></strong>
        <p style="margin:2px 0 0; font-size:12px; color:var(--mm-muted);"><code><?php echo esc_html(WP_CONTENT_DIR); ?></code></p>
      </div>
      <div><span class="mm-status-pill success"><?php esc_html_e('Jailed to wp-content', 'mimic-manager'); ?></span></div>
    </div>
    <div class="mm-toggle-row">
      <div>
        <strong><?php esc_html_e('Pre-Save PHP Syntax Linter', 'mimic-manager'); ?></strong>
        <p style="margin:2px 0 0; font-size:12px; color:var(--mm-muted);"><?php esc_html_e('Checks PHP AST tokens before saving to permanently prevent White Screen of Death (WSOD).', 'mimic-manager'); ?></p>
      </div>
      <div><span class="mm-status-pill success"><?php esc_html_e('Active', 'mimic-manager'); ?></span></div>
    </div>
    <div class="mm-toggle-row">
      <div>
        <strong><?php esc_html_e('Mode', 'mimic-manager'); ?></strong>
        <p style="margin:2px 0 0; font-size:12px; color:var(--mm-muted);"><?php esc_html_e('Default mode is read-only inspection. Write edits require administrator sudo verification.', 'mimic-manager'); ?></p>
      </div>
      <div><span class="mm-status-pill warning"><?php esc_html_e('Read-Only Browsing', 'mimic-manager'); ?></span></div>
    </div>
  </div>
</div>
