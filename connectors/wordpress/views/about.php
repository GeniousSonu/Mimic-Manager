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
      <h1><?php echo esc_html(Brand::NAME); ?></h1>
      <p style="margin:4px 0 0; color:var(--mm-muted); font-size:13px;"><?php esc_html_e('Attributions, system diagnostic information, and open source licenses.', 'mimic-manager'); ?></p>
    </div>
  </div>

  <div class="mm-grid">
    <div class="mm-card">
      <h3><?php esc_html_e('Attribution & Project Details', 'mimic-manager'); ?></h3>
      <p><strong><?php esc_html_e('Creator & Lead Author:', 'mimic-manager'); ?></strong> <a href="<?php echo esc_url(Brand::CREATOR_URL); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html(Brand::CREATOR); ?></a></p>
      <p><strong><?php esc_html_e('Project Organization:', 'mimic-manager'); ?></strong> <a href="<?php echo esc_url(Brand::OWNER_URL); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html(Brand::OWNER); ?></a></p>
      <p><strong><?php esc_html_e('Plugin Version:', 'mimic-manager'); ?></strong> <?php echo esc_html(Brand::VERSION); ?></p>
      <p><strong><?php esc_html_e('License:', 'mimic-manager'); ?></strong> GNU General Public License v2 or later (GPL-2.0-or-later)</p>
    </div>

    <div class="mm-card">
      <h3><?php esc_html_e('Server Diagnostics', 'mimic-manager'); ?></h3>
      <p><strong><?php esc_html_e('PHP Version:', 'mimic-manager'); ?></strong> <?php echo esc_html(PHP_VERSION); ?></p>
      <p><strong><?php esc_html_e('Local Image Engine:', 'mimic-manager'); ?></strong> <?php echo esc_html(strtoupper($engine['engine'])); ?></p>
      <p><strong><?php esc_html_e('Memory Limit:', 'mimic-manager'); ?></strong> <?php echo esc_html((string) ini_get('memory_limit')); ?></p>
      <p><strong><?php esc_html_e('Max Execution Time:', 'mimic-manager'); ?></strong> <?php echo esc_html((string) ini_get('max_execution_time')); ?>s</p>
    </div>
  </div>
</div>
