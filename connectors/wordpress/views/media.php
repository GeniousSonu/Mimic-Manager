<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

defined('ABSPATH') || exit;

use Wefik\MimicManager\Brand;

$query = new \WP_Query([
    'post_type' => 'attachment',
    'post_status' => 'inherit',
    'post_mime_type' => ['image/jpeg', 'image/png'],
    'posts_per_page' => 10,
]);
?>
<div class="wrap mm-wrap">
  <div class="mm-header">
    <div>
      <h1><?php esc_html_e('Media Optimization', 'mimic-manager'); ?></h1>
      <p style="margin:4px 0 0; color:var(--mm-muted); font-size:13px;"><?php esc_html_e('Convert JPEG and PNG to WebP locally. Originals are permanently preserved.', 'mimic-manager'); ?></p>
    </div>
  </div>

  <div class="mm-card" style="margin-bottom:20px;">
    <h3><?php esc_html_e('Recent Uploads Ready for WebP Conversion', 'mimic-manager'); ?></h3>
    <?php if ($query->have_posts()): ?>
      <table class="widefat fixed striped" style="margin-top:12px;">
        <thead>
          <tr>
            <th><?php esc_html_e('Preview', 'mimic-manager'); ?></th>
            <th><?php esc_html_e('Title / Filename', 'mimic-manager'); ?></th>
            <th><?php esc_html_e('Status', 'mimic-manager'); ?></th>
            <th><?php esc_html_e('Action', 'mimic-manager'); ?></th>
          </tr>
        </thead>
        <tbody>
          <?php while ($query->have_posts()): $query->the_post();
            $id = get_the_ID();
            $status = get_post_meta($id, '_mimic_manager_status', true);
            $savings = get_post_meta($id, '_mimic_manager_savings_pct', true);
          ?>
            <tr>
              <td style="width:60px;"><?php echo wp_get_attachment_image($id, [40, 40]); ?></td>
              <td><strong><?php the_title(); ?></strong><br><small><?php echo esc_html(basename((string) get_attached_file($id))); ?></small></td>
              <td>
                <?php if ($status === 'optimized'): ?>
                  <span class="mm-status-pill success">● <?php printf(esc_html__('WebP (-%s%%)', 'mimic-manager'), esc_html((string) $savings)); ?></span>
                <?php else: ?>
                  <span class="mm-status-pill warning">● <?php esc_html_e('Original uncompressed', 'mimic-manager'); ?></span>
                <?php endif; ?>
              </td>
              <td>
                <button type="button" class="mm-btn mm-btn-secondary mm-optimize-btn" data-id="<?php echo esc_attr((string) $id); ?>">
                  <?php echo $status === 'optimized' ? esc_html__('Re-optimize', 'mimic-manager') : esc_html__('Convert to WebP', 'mimic-manager'); ?>
                </button>
              </td>
            </tr>
          <?php endwhile; wp_reset_postdata(); ?>
        </tbody>
      </table>
    <?php else: ?>
      <p><?php esc_html_e('No images found in Media Library.', 'mimic-manager'); ?></p>
    <?php endif; ?>
  </div>
</div>
