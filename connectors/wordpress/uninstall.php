<?php
/**
 * Uninstallation Handler for Mimic Manager.
 *
 * Called only when the plugin is deleted via the WordPress Admin.
 * Respects user privacy: only removes stored data if explicitly enabled in settings.
 *
 * @package MimicManager
 */

// If uninstall not called from WordPress, exit.
defined('WP_UNINSTALL_PLUGIN') || exit;

/**
 * Purge plugin data for a single site.
 */
function mimic_manager_uninstall_site(): void {
    // Check if user opted in to data deletion on uninstall
    $deleteOnUninstall = (bool) get_option('mimic_manager_delete_on_uninstall', false);
    if (!$deleteOnUninstall) {
        return;
    }

    // Delete options
    $options = [
        'mimic_manager_mode',
        'mimic_manager_consent',
        'mimic_manager_delete_on_uninstall',
        'mimic_manager_api_connected',
        'mimic_manager_safe_fixes',
        'mimic_manager_site_id',
        'mimic_manager_api_url',
    ];

    foreach ($options as $opt) {
        delete_option($opt);
    }

    // Delete transients
    delete_transient('mimic_manager_circuit_breaker');
    delete_transient('mimic_manager_recent_audit');

    // Clean attachment metadata
    global $wpdb;
    $wpdb->query(
        "DELETE FROM {$wpdb->postmeta} WHERE meta_key IN (
            '_mimic_manager_status',
            '_mimic_manager_savings_pct',
            '_mimic_manager_savings_bytes'
        )"
    );
}

// Multisite vs single site execution
if (is_multisite()) {
    $siteIds = get_sites(['fields' => 'ids']);
    foreach ($siteIds as $siteId) {
        switch_to_blog((int) $siteId);
        mimic_manager_uninstall_site();
        restore_current_blog();
    }
} else {
    mimic_manager_uninstall_site();
}
