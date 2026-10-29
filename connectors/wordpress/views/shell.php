<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

defined('ABSPATH') || exit;

use Wefik\MimicManager\Brand;
?>
<div class="wrap mm-shell-wrap">
  <!-- Mimic Manager V2 SPA Mount Root -->
  <div id="mimic-manager-root" role="main" aria-label="<?php echo esc_attr(Brand::NAME); ?>">
    <noscript>
      <div class="mm-noscript-card" style="padding: 24px; color: #F3F3F5; background: #161618; border-radius: 8px; border: 1px solid #28282C;">
        <h2 style="margin: 0 0 8px 0; color: #00E5FF; font-size: 18px;"><?php esc_html_e('JavaScript Required', 'mimic-manager'); ?></h2>
        <p style="margin: 0; color: #9E9EA4; font-size: 14px;"><?php esc_html_e('Mimic Manager command center requires JavaScript to provide full-bleed visual editing, zero-reload routing, and live media optimizations.', 'mimic-manager'); ?></p>
      </div>
    </noscript>

    <!-- Server-rendered boot sequence with CSS-only pulse & role="status" -->
    <div id="mm-boot-loader" class="mm-boot-loader" role="status" aria-live="polite">
      <div class="mm-boot-visual">
        <svg class="mm-boot-mark" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- Shifted Stack geometry -->
          <path class="mm-pulse-top" d="M50 12 L86 30 L50 48 L14 30 Z" stroke="#00E5FF" stroke-width="4" stroke-linejoin="round" />
          <path class="mm-pulse-cutout" d="M50 22 L72 30 L50 38 L28 30 Z" stroke="#7B61FF" stroke-width="2" stroke-linejoin="round" />
          <path class="mm-pulse-mid" d="M14 42 L50 60 L86 42 L86 50 L50 68 L14 50 Z" fill="#7B61FF" opacity="0.85" />
          <path class="mm-pulse-base" d="M14 62 L50 80 L86 62 L86 70 L50 88 L14 70 Z" fill="#00E5FF" opacity="0.85" />
        </svg>
      </div>
      <p class="mm-boot-label"><?php printf(esc_html__('Loading %s...', 'mimic-manager'), esc_html(Brand::NAME)); ?></p>
    </div>

    <!-- 10-second failure fallback card (replaces loader if JS bundle fails) -->
    <div id="mm-boot-fallback" class="mm-boot-fallback" style="display: none;" role="alert">
      <div class="mm-error-card">
        <div class="mm-error-badge">⚠️</div>
        <h3 class="mm-error-title"><?php printf(esc_html__('%s Failed to Load', 'mimic-manager'), esc_html(Brand::NAME)); ?></h3>
        <p class="mm-error-message"><?php esc_html_e('The application bundle could not be initialized within 10 seconds. Check browser console logs or launch in safe mode.', 'mimic-manager'); ?></p>
        <div class="mm-error-actions">
          <button type="button" class="mm-action-btn primary" onclick="window.location.reload()"><?php esc_html_e('Retry', 'mimic-manager'); ?></button>
          <a href="<?php echo esc_url(add_query_arg('mimic_manager_safe_mode', '1')); ?>" class="mm-action-btn secondary"><?php esc_html_e('Safe Mode', 'mimic-manager'); ?></a>
        </div>
      </div>
    </div>

    <script>
      (function() {
        var timer = setTimeout(function() {
          var loader = document.getElementById('mm-boot-loader');
          var fallback = document.getElementById('mm-boot-fallback');
          if (loader && loader.parentNode) {
            loader.style.display = 'none';
            if (fallback) fallback.style.display = 'flex';
          }
        }, 10000);
        window._mmBootTimer = timer;
      })();
    </script>
  </div>
  <div id="mm-portal-root"></div>
</div>
