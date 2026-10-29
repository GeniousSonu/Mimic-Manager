<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

defined('ABSPATH') || exit;

use Wefik\MimicManager\Brand;

$consent = (bool) get_option('mimic_manager_consent', false);
$deleteOnUninstall = (bool) get_option('mimic_manager_delete_on_uninstall', false);
?>
<div class="wrap mm-wrap">
  <div class="mm-header">
    <div>
      <h1><?php esc_html_e('Settings & Telemetry Consent', 'mimic-manager'); ?></h1>
      <p style="margin:4px 0 0; color:var(--mm-muted); font-size:13px;"><?php esc_html_e('Manage operational modes, data privacy, and uninstallation preferences.', 'mimic-manager'); ?></p>
    </div>
  </div>

  <div class="mm-card" style="margin-bottom:20px;">
    <h3><?php esc_html_e('External Services & Cloud Offloading Consent', 'mimic-manager'); ?></h3>
    <p style="color:var(--mm-muted); font-size:13px; margin-bottom:16px;">
      <?php esc_html_e('In strict accordance with WordPress.org guidelines, Mimic Manager makes ZERO remote network requests by default. If you run a self-hosted Mimic Manager backend API, you must explicitly opt in to allow the plugin to offload heavy processing to your private API.', 'mimic-manager'); ?>
    </p>

    <div class="mm-toggle-row">
      <div>
        <strong><?php esc_html_e('Allow Cloud Offload to Self-Hosted Backend', 'mimic-manager'); ?></strong>
        <p style="margin:2px 0 0; font-size:12px; color:var(--mm-muted);"><?php esc_html_e('Enables encrypted HMAC communication with your Render/Docker backend instance.', 'mimic-manager'); ?></p>
      </div>
      <div>
        <label>
          <input type="checkbox" id="mm-consent-toggle" <?php checked($consent); ?>>
          <span id="mm-consent-status" style="margin-left:8px; font-weight:600;">
            <?php echo $consent ? esc_html__('Connected / Opted In', 'mimic-manager') : esc_html__('Local Only (No external calls)', 'mimic-manager'); ?>
          </span>
        </label>
      </div>
    </div>
  </div>

  <div class="mm-card">
    <h3><?php esc_html_e('Uninstallation Behavior', 'mimic-manager'); ?></h3>
    <div class="mm-toggle-row">
      <div>
        <strong><?php esc_html_e('Delete All Plugin Data on Uninstall', 'mimic-manager'); ?></strong>
        <p style="margin:2px 0 0; font-size:12px; color:var(--mm-muted);"><?php esc_html_e('When enabled, deleting this plugin will permanently drop all custom database tables, options, and transients.', 'mimic-manager'); ?></p>
      </div>
      <div>
        <label>
          <input type="checkbox" id="mm-uninstall-toggle" <?php checked($deleteOnUninstall); ?>>
          <span style="margin-left:8px; font-weight:600;"><?php esc_html_e('Opt-in Cleanup', 'mimic-manager'); ?></span>
        </label>
      </div>
    </div>
  </div>
</div>
