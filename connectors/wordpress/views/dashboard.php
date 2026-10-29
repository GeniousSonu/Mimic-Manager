<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

defined('ABSPATH') || exit;

use Wefik\MimicManager\Brand;
use Wefik\MimicManager\Media\LocalOptimizer;

$engine = LocalOptimizer::getEngineStatus();
?>
<div class="wrap mm-wrap">
  <div class="mm-header">
    <div>
      <h1><?php echo esc_html(Brand::NAME); ?> <span class="mm-badge">v<?php echo esc_html(Brand::VERSION); ?></span></h1>
      <p style="margin:4px 0 0; color:var(--mm-muted); font-size:13px;"><?php esc_html_e('Unified media optimization, PageSpeed fixes, and SEO gap-fill with zero lock-in.', 'mimic-manager'); ?></p>
    </div>
    <div>
      <a href="<?php echo esc_url(admin_url('admin.php?page=mimic-manager-media')); ?>" class="mm-btn"><?php esc_html_e('Optimize Media', 'mimic-manager'); ?></a>
    </div>
  </div>

  <div class="mm-grid">
    <div class="mm-card">
      <h3><?php esc_html_e('Local Image Engine', 'mimic-manager'); ?></h3>
      <div class="mm-stat"><?php echo esc_html(strtoupper($engine['engine'])); ?></div>
      <div class="mm-stat-desc">
        <?php if ($engine['supported']): ?>
          <span class="mm-status-pill success">● <?php esc_html_e('Active — Converts to WebP natively on your server', 'mimic-manager'); ?></span>
        <?php else: ?>
          <span class="mm-status-pill warning">● <?php esc_html_e('Fallback mode (Enable GD or Imagick for WebP)', 'mimic-manager'); ?></span>
        <?php endif; ?>
      </div>
    </div>

    <div class="mm-card">
      <h3><?php esc_html_e('Data Privacy & Telemetry', 'mimic-manager'); ?></h3>
      <div class="mm-stat"><?php esc_html_e('100% LOCAL', 'mimic-manager'); ?></div>
      <div class="mm-stat-desc">
        <span class="mm-status-pill success">● <?php esc_html_e('Zero external calls without explicit consent', 'mimic-manager'); ?></span>
      </div>
    </div>

    <div class="mm-card">
      <h3><?php esc_html_e('PageSpeed Engine', 'mimic-manager'); ?></h3>
      <div class="mm-stat"><?php esc_html_e('SAFE MODE', 'mimic-manager'); ?></div>
      <div class="mm-stat-desc">
        <?php esc_html_e('Image dimensions, fetchpriority, async decoding enabled', 'mimic-manager'); ?>
      </div>
    </div>
  </div>

  <div class="mm-card">
    <h3><?php esc_html_e('Quick Operations', 'mimic-manager'); ?></h3>
    <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:16px;">
      <a href="<?php echo esc_url(admin_url('admin.php?page=mimic-manager-media')); ?>" class="mm-btn mm-btn-secondary"><?php esc_html_e('Bulk Compress Images', 'mimic-manager'); ?></a>
      <a href="<?php echo esc_url(admin_url('admin.php?page=mimic-manager-speed')); ?>" class="mm-btn mm-btn-secondary"><?php esc_html_e('Apply Core Web Vitals Fixes', 'mimic-manager'); ?></a>
      <a href="<?php echo esc_url(admin_url('admin.php?page=mimic-manager-seo')); ?>" class="mm-btn mm-btn-secondary"><?php esc_html_e('Audit Missing Alt Text & Meta', 'mimic-manager'); ?></a>
      <a href="<?php echo esc_url(admin_url('admin.php?page=mimic-manager-files')); ?>" class="mm-btn mm-btn-secondary"><?php esc_html_e('Open Sandboxed File Manager', 'mimic-manager'); ?></a>
    </div>
  </div>
</div>
