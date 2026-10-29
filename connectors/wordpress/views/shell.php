<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

defined('ABSPATH') || exit;

use Wefik\MimicManager\Brand;
?>
<div class="wrap mm-shell-wrap">
  <!-- Mimic Manager V2 SPA Mount Root -->
  <div id="mimic-manager-root" role="main" aria-label="<?php echo esc_attr(Brand::NAME); ?>">
    <noscript>
      <div style="padding: 24px; color: #FFF; background: #161618; border-radius: 8px;">
        <h2><?php esc_html_e('JavaScript Required', 'mimic-manager'); ?></h2>
        <p><?php esc_html_e('Mimic Manager command center requires JavaScript to provide full-bleed visual editing, zero-reload routing, and live media optimizations.', 'mimic-manager'); ?></p>
      </div>
    </noscript>
    <div class="mm-loading-shell">
      <div class="mm-spinner"></div>
      <p><?php printf(esc_html__('Loading %s...', 'mimic-manager'), esc_html(Brand::NAME)); ?></p>
    </div>
  </div>
</div>
