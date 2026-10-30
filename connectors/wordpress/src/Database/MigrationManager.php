<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager\Database;

use Wefik\MimicManager\Brand;

final class MigrationManager
{
    public const CURRENT_SCHEMA_VERSION = 100;
    private const OPTION_KEY = 'mimic_manager_db_version';
    private const BACKUP_KEY = 'mimic_manager_options_backup';
    private const LOCK_KEY = 'mimic_manager_migration_lock';

    public static function init(): void
    {
        if (!function_exists('add_action')) {
            return;
        }
        add_action('admin_init', [self::class, 'runMigrationsIfNeeded']);
    }

    public static function runMigrationsIfNeeded(): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }

        $installedVersion = (int) get_option(self::OPTION_KEY, 0);

        // First install
        if ($installedVersion === 0) {
            update_option(self::OPTION_KEY, self::CURRENT_SCHEMA_VERSION);
            return;
        }

        // Downgrade Guard: code is older than the database schema
        if ($installedVersion > self::CURRENT_SCHEMA_VERSION) {
            add_action('admin_notices', function () use ($installedVersion) {
                echo '<div class="notice notice-error"><p>' .
                    sprintf(
                        esc_html__('Mimic Manager downgrade detected! Database schema (v%d) is newer than plugin code (v%d). Operating in safe read-only mode to prevent data corruption.', 'mimic-manager'),
                        $installedVersion,
                        self::CURRENT_SCHEMA_VERSION
                    ) .
                    '</p></div>';
            });
            if (!defined('MIMIC_MANAGER_SAFE_MODE')) {
                define('MIMIC_MANAGER_SAFE_MODE', true);
            }
            return;
        }

        // Upgrade needed
        if ($installedVersion < self::CURRENT_SCHEMA_VERSION) {
            self::executeUpgrades($installedVersion);
        }
    }

    private static function executeUpgrades(int $fromVersion): void
    {
        // Mutex lock for multisite / cluster environments
        if (get_transient(self::LOCK_KEY)) {
            return;
        }
        set_transient(self::LOCK_KEY, time(), 60);

        try {
            // Snapshot current options before migration
            self::snapshotOptions();

            // Run migration steps sequentially
            for ($v = $fromVersion + 1; $v <= self::CURRENT_SCHEMA_VERSION; $v++) {
                $method = "migrateTo{$v}";
                if (method_exists(self::class, $method)) {
                    self::$method();
                }
            }

            update_option(self::OPTION_KEY, self::CURRENT_SCHEMA_VERSION);
            update_option('mimic_manager_whats_new_pending', true);
        } catch (\Throwable $e) {
            error_log('[Mimic Manager] Database migration failed: ' . $e->getMessage());
            add_action('admin_notices', function () use ($e) {
                echo '<div class="notice notice-error is-dismissible"><p>' .
                    sprintf(esc_html__('Mimic Manager update migration encountered an error: %s. Safe mode active.', 'mimic-manager'), esc_html($e->getMessage())) .
                    '</p></div>';
            });
        } finally {
            delete_transient(self::LOCK_KEY);
        }
    }

    public static function snapshotOptions(): void
    {
        global $wpdb;
        $prefix = Brand::OPTION_PREFIX;
        $results = $wpdb->get_results(
            $wpdb->prepare("SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE %s", $wpdb->esc_like($prefix) . '%'),
            ARRAY_A
        );

        $backup = [
            'timestamp' => time(),
            'version' => Brand::VERSION,
            'db_version' => get_option(self::OPTION_KEY, 0),
            'options' => $results,
        ];

        update_option(self::BACKUP_KEY, $backup, false);
    }

    public static function restoreOptionsBackup(): bool
    {
        $backup = get_option(self::BACKUP_KEY, null);
        if (!$backup || !isset($backup['options']) || !is_array($backup['options'])) {
            return false;
        }

        foreach ($backup['options'] as $row) {
            update_option($row['option_name'], maybe_unserialize($row['option_value']));
        }
        return true;
    }

    private static function migrateTo100(): void
    {
        // Initial schema baseline: register default settings if missing
        if (get_option('mimic_manager_telemetry_optin') === false) {
            update_option('mimic_manager_telemetry_optin', '0');
        }
    }
}
