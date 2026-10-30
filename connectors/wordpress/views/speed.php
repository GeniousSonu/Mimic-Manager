<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

defined('ABSPATH') || exit;
?>
<div class="wrap mm-wrap">
  <div class="mm-header">
    <div>
      <h1><?php esc_html_e('Core Web Vitals & PageSpeed Fixes', 'mimic-manager'); ?></h1>
      <p style="margin:4px 0 0; color:var(--mm-muted); font-size:13px;"><?php esc_html_e('Non-destructive, tiered frontend optimizations with 100% undo capability.', 'mimic-manager'); ?></p>
    </div>
  </div>

  <div class="mm-card">
    <h3><?php esc_html_e('Tier 1: Safe Automatic Fixes', 'mimic-manager'); ?></h3>
    <div class="mm-toggle-row">
      <div>
        <strong><?php esc_html_e('Image Explicit Dimensions', 'mimic-manager'); ?></strong>
        <p style="margin:2px 0 0; font-size:12px; color:var(--mm-muted);"><?php esc_html_e('Adds width and height attributes to prevent Cumulative Layout Shift (CLS).', 'mimic-manager'); ?></p>
      </div>
      <div><span class="mm-status-pill success"><?php esc_html_e('Enabled', 'mimic-manager'); ?></span></div>
    </div>
    <div class="mm-toggle-row">
      <div>
        <strong><?php esc_html_e('Native Lazy-Loading with LCP Exclusion', 'mimic-manager'); ?></strong>
        <p style="margin:2px 0 0; font-size:12px; color:var(--mm-muted);"><?php esc_html_e('Adds loading="lazy" to below-the-fold images while keeping hero images eager.', 'mimic-manager'); ?></p>
      </div>
      <div><span class="mm-status-pill success"><?php esc_html_e('Enabled', 'mimic-manager'); ?></span></div>
    </div>
    <div class="mm-toggle-row">
      <div>
        <strong><?php esc_html_e('Async Decoding & Fetchpriority', 'mimic-manager'); ?></strong>
        <p style="margin:2px 0 0; font-size:12px; color:var(--mm-muted);"><?php esc_html_e('Applies decoding="async" and fetchpriority="high" to prioritize the hero image.', 'mimic-manager'); ?></p>
      </div>
      <div><span class="mm-status-pill success"><?php esc_html_e('Enabled', 'mimic-manager'); ?></span></div>
    </div>
    <div class="mm-toggle-row">
      <div>
        <strong><?php esc_html_e('Font Display Swap', 'mimic-manager'); ?></strong>
        <p style="margin:2px 0 0; font-size:12px; color:var(--mm-muted);"><?php esc_html_e('Enforces font-display: swap on embedded Google Fonts to eliminate FOIT.', 'mimic-manager'); ?></p>
      </div>
      <div><span class="mm-status-pill success"><?php esc_html_e('Enabled', 'mimic-manager'); ?></span></div>
    </div>
  </div>
</div>
