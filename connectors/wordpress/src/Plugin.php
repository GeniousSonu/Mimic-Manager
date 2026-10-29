<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager;

use Wefik\MimicManager\Media\LocalOptimizer;
use Wefik\MimicManager\Media\PictureRewriter;
use Wefik\MimicManager\Media\AttachmentHook;
use Wefik\MimicManager\Speed\FixEngine;
use Wefik\MimicManager\Seo\MetaSync;
use Wefik\MimicManager\Seo\SchemaFilter;
use Wefik\MimicManager\FileManager\JailGuard;

final class Plugin
{
    private static ?Plugin $instance = null;

    public static function getInstance(): Plugin
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
        // Check for kill switch
        if (defined('MIMIC_MANAGER_KILL_SWITCH') && constant('MIMIC_MANAGER_KILL_SWITCH')) {
            return;
        }

        // Safe mode bypass
        if (isset($_GET['mimic_manager_safe_mode']) && $_GET['mimic_manager_safe_mode'] === '1') {
            add_action('admin_notices', [$this, 'renderSafeModeNotice']);
            return;
        }

        $this->registerHooks();
    }

    private function registerHooks(): void
    {
        // Admin presentation
        add_action('admin_menu', [$this, 'registerAdminMenus']);
        add_action('admin_enqueue_scripts', [$this, 'enqueueAdminAssets']);

        // Media library integration
        add_filter('manage_media_columns', [$this, 'addMediaColumns']);
        add_action('manage_media_custom_column', [$this, 'renderMediaColumnContent'], 10, 2);
        add_filter('wp_handle_upload', [$this, 'onMediaUpload']);

        // Front-end optimization (safe, minimal)
        add_filter('the_content', [$this, 'rewriteContentImages'], 99);

        // Site Health & Privacy
        add_filter('site_status_tests', [$this, 'registerSiteHealthTests']);
        add_filter('debug_information', [$this, 'registerDebugInfo']);
        add_action('admin_init', [$this, 'registerPrivacyPolicyContent']);

        // REST API
        add_action('rest_api_init', [$this, 'registerRestRoutes']);
    }

    public function registerAdminMenus(): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }

        $iconSvg = 'data:image/svg+xml;base64,' . base64_encode(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">' .
            '<path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z"/>' .
            '<path d="M10 5a5 5 0 00-5 5h1.5a3.5 3.5 0 117 0H15a5 5 0 00-5-5z"/>' .
            '</svg>'
        );

        $mainHook = add_menu_page(
            Brand::NAME,
            Brand::NAME,
            'manage_options',
            'mimic-manager',
            [$this, 'renderDashboardPage'],
            $iconSvg,
            58
        );

        add_submenu_page('mimic-manager', __('Dashboard', 'mimic-manager'), __('Dashboard', 'mimic-manager'), 'manage_options', 'mimic-manager', [$this, 'renderDashboardPage']);
        add_submenu_page('mimic-manager', __('Media Optimization', 'mimic-manager'), __('Media', 'mimic-manager'), 'manage_options', 'mimic-manager-media', [$this, 'renderMediaPage']);
        add_submenu_page('mimic-manager', __('PageSpeed Fixes', 'mimic-manager'), __('Speed', 'mimic-manager'), 'manage_options', 'mimic-manager-speed', [$this, 'renderSpeedPage']);
        add_submenu_page('mimic-manager', __('SEO Gap Fill', 'mimic-manager'), __('SEO', 'mimic-manager'), 'manage_options', 'mimic-manager-seo', [$this, 'renderSeoPage']);
        add_submenu_page('mimic-manager', __('File Manager', 'mimic-manager'), __('Files', 'mimic-manager'), 'manage_options', 'mimic-manager-files', [$this, 'renderFilesPage']);
        add_submenu_page('mimic-manager', __('Settings', 'mimic-manager'), __('Settings', 'mimic-manager'), 'manage_options', 'mimic-manager-settings', [$this, 'renderSettingsPage']);
        add_submenu_page('mimic-manager', __('About & Help', 'mimic-manager'), __('About', 'mimic-manager'), 'manage_options', 'mimic-manager-about', [$this, 'renderAboutPage']);

        add_action("load-{$mainHook}", [$this, 'addHelpTabs']);
    }

    public function enqueueAdminAssets(string $hookSuffix): void
    {
        // Strictly scope to our own screens: no global CSS/JS leaks
        if (strpos($hookSuffix, 'mimic-manager') === false) {
            return;
        }

        wp_enqueue_style(
            'mimic-manager-admin-css',
            plugins_url('assets/css/admin.css', dirname(__FILE__)),
            [],
            Brand::VERSION
        );

        wp_enqueue_script(
            'mimic-manager-admin-js',
            plugins_url('assets/js/admin.js', dirname(__FILE__)),
            ['wp-element', 'wp-components', 'wp-api-fetch'],
            Brand::VERSION,
            true
        );

        wp_localize_script('mimic-manager-admin-js', 'mimicManagerData', [
            'restUrl' => esc_url_raw(rest_url(Brand::REST_NAMESPACE)),
            'nonce' => wp_create_nonce('wp_rest'),
            'brand' => [
                'name' => Brand::NAME,
                'version' => Brand::VERSION,
                'creator' => Brand::CREATOR,
                'owner' => Brand::OWNER,
            ],
        ]);
    }

    public function addHelpTabs(): void
    {
        $screen = get_current_screen();
        if (!$screen) return;

        $screen->add_help_tab([
            'id' => 'mm_overview',
            'title' => __('Overview', 'mimic-manager'),
            'content' => '<p>' . esc_html__('Mimic Manager optimizes your media, PageSpeed, and SEO with full rollback and proof.', 'mimic-manager') . '</p>',
        ]);
    }

    public function addMediaColumns(array $columns): array
    {
        $columns['mimic_manager_savings'] = __('Mimic Manager', 'mimic-manager');
        return $columns;
    }

    public function renderMediaColumnContent(string $columnName, int $attachmentId): void
    {
        if ($columnName !== 'mimic_manager_savings') {
            return;
        }

        $status = (string) get_post_meta($attachmentId, '_mimic_manager_status', true);
        $savings = (float) get_post_meta($attachmentId, '_mimic_manager_savings_pct', true);

        if ($status === 'optimized') {
            printf(
                '<span style="color:#00a32a; font-weight:600;">%s (-%s%%)</span>',
                esc_html__('WebP', 'mimic-manager'),
                esc_html((string) $savings)
            );
        } else {
            echo '<span style="color:#8c8f94;">' . esc_html__('Original', 'mimic-manager') . '</span>';
        }
    }

    public function onMediaUpload(array $upload): array
    {
        try {
            $filePath = $upload['file'] ?? '';
            if (!$filePath || !file_exists($filePath)) {
                return $upload;
            }

            $optimizer = new LocalOptimizer();
            $result = $optimizer->optimizeLocally($filePath);
            // Non-blocking local optimization
            return $upload;
        } catch (\Throwable $e) {
            error_log('[Mimic Manager] onMediaUpload error: ' . $e->getMessage());
            return $upload;
        }
    }

    public function rewriteContentImages(string $content): string
    {
        try {
            $rewriter = new PictureRewriter();
            return $rewriter->rewriteHtml($content);
        } catch (\Throwable $e) {
            return $content;
        }
    }

    public function registerRestRoutes(): void
    {
        register_rest_route(Brand::REST_NAMESPACE, '/status', [
            'methods' => 'GET',
            'callback' => [$this, 'restGetStatus'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/optimize-local', [
            'methods' => 'POST',
            'callback' => [$this, 'restOptimizeLocal'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/settings', [
            'methods' => 'POST',
            'callback' => [$this, 'restSaveSettings'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);
    }

    public function restGetStatus(): \WP_REST_Response
    {
        $engine = LocalOptimizer::getEngineStatus();
        return new \WP_REST_Response([
            'status' => 'ok',
            'name' => Brand::NAME,
            'version' => Brand::VERSION,
            'localEngine' => $engine,
            'consentGiven' => (bool) get_option('mimic_manager_consent', false),
            'cloudConnected' => (bool) get_option('mimic_manager_api_connected', false),
            'timestamp' => time(),
        ]);
    }

    public function restOptimizeLocal(\WP_REST_Request $request): \WP_REST_Response
    {
        $attachmentId = (int) $request->get_param('attachment_id');
        $file = get_attached_file($attachmentId);
        if (!$file || !file_exists($file)) {
            return new \WP_REST_Response(['success' => false, 'error' => 'Attachment file not found.'], 404);
        }

        $optimizer = new LocalOptimizer();
        $res = $optimizer->optimizeLocally($file);

        if ($res['success']) {
            update_post_meta($attachmentId, '_mimic_manager_status', 'optimized');
            update_post_meta($attachmentId, '_mimic_manager_savings_pct', $res['savingsPercent']);
            update_post_meta($attachmentId, '_mimic_manager_savings_bytes', $res['savingsBytes']);
        }

        return new \WP_REST_Response($res);
    }

    public function restSaveSettings(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params();
        if (isset($params['consent'])) {
            update_option('mimic_manager_consent', (bool) $params['consent']);
        }
        if (isset($params['deleteOnUninstall'])) {
            update_option('mimic_manager_delete_on_uninstall', (bool) $params['deleteOnUninstall']);
        }
        return new \WP_REST_Response(['success' => true]);
    }

    public function registerSiteHealthTests(array $tests): array
    {
        $tests['direct']['mimic_manager_status'] = [
            'label' => sprintf(__('%s Local Engine Status', 'mimic-manager'), Brand::NAME),
            'test' => function () {
                $status = LocalOptimizer::getEngineStatus();
                if ($status['supported']) {
                    return [
                        'label' => sprintf(__('%s local image optimizer is active (%s)', 'mimic-manager'), Brand::NAME, $status['engine']),
                        'status' => 'good',
                        'badge' => ['label' => __('Performance', 'mimic-manager'), 'color' => 'blue'],
                        'description' => sprintf(__('Your server supports local WebP processing via %s.', 'mimic-manager'), $status['engine']),
                    ];
                }
                return [
                    'label' => sprintf(__('%s is in fallback mode', 'mimic-manager'), Brand::NAME),
                    'status' => 'recommended',
                    'badge' => ['label' => __('Performance', 'mimic-manager'), 'color' => 'orange'],
                    'description' => __('Neither Imagick nor GD with WebP support is enabled on this server.', 'mimic-manager'),
                ];
            },
        ];
        return $tests;
    }

    public function registerDebugInfo(array $info): array
    {
        $info['mimic_manager'] = [
            'label' => Brand::NAME,
            'description' => sprintf(__('%s diagnostic information for support and audits.', 'mimic-manager'), Brand::NAME),
            'fields' => [
                'version' => ['label' => __('Version', 'mimic-manager'), 'value' => Brand::VERSION],
                'local_engine' => ['label' => __('Local Image Engine', 'mimic-manager'), 'value' => LocalOptimizer::getEngineStatus()['engine']],
                'external_consent' => ['label' => __('External Service Consent', 'mimic-manager'), 'value' => get_option('mimic_manager_consent') ? 'Enabled' : 'Disabled (Local only)'],
            ],
        ];
        return $info;
    }

    public function registerPrivacyPolicyContent(): void
    {
        if (!function_exists('wp_add_privacy_policy_content')) return;

        $content = sprintf(
            __('%s is designed with 100%% data privacy. By default, all image compression, SEO evaluations, and speed fixes occur locally on your server. No personal data, visitor IP addresses, or telemetry are transmitted to third-party services unless you explicitly consent to cloud offloading in the settings.', 'mimic-manager'),
            Brand::NAME
        );
        wp_add_privacy_policy_content(Brand::NAME, wp_kses_post($content));
    }

    public function renderSafeModeNotice(): void
    {
        echo '<div class="notice notice-warning is-dismissible"><p><strong>' .
             esc_html(Brand::NAME) . ':</strong> ' .
             esc_html__('Running in safe mode. Non-essential hooks and background tasks are temporarily disabled.', 'mimic-manager') .
             '</p></div>';
    }

    // Page view renderers
    public function renderDashboardPage(): void { require dirname(__DIR__) . '/views/dashboard.php'; }
    public function renderMediaPage(): void { require dirname(__DIR__) . '/views/media.php'; }
    public function renderSpeedPage(): void { require dirname(__DIR__) . '/views/speed.php'; }
    public function renderSeoPage(): void { require dirname(__DIR__) . '/views/seo.php'; }
    public function renderFilesPage(): void { require dirname(__DIR__) . '/views/files.php'; }
    public function renderSettingsPage(): void { require dirname(__DIR__) . '/views/settings.php'; }
    public function renderAboutPage(): void { require dirname(__DIR__) . '/views/about.php'; }
}
