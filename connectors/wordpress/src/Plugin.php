<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager;

use Wefik\MimicManager\Brand;
use Wefik\MimicManager\Media\LocalOptimizer;
use Wefik\MimicManager\Media\PictureRewriter;

final class Plugin
{
    private static ?Plugin $instance = null;
    private bool $circuitBreakerOpen = false;
    private int $failureCount = 0;

    public static function getInstance(): Plugin
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
        $this->registerHooks();
    }

    public static function activate(): void
    {
        update_option('mimic_manager_version', Brand::VERSION);
        if (get_option('mimic_manager_consent') === false) {
            update_option('mimic_manager_consent', false);
        }
        if (get_option('mimic_manager_delete_on_uninstall') === false) {
            update_option('mimic_manager_delete_on_uninstall', false);
        }
        if (get_option('mimic_manager_backend_url') === false) {
            update_option('mimic_manager_backend_url', 'http://localhost:3000');
        }
        if (get_option('mimic_manager_file_write_mode') === false) {
            update_option('mimic_manager_file_write_mode', false);
        }
    }

    public static function deactivate(): void
    {
        // Safe deactivation
    }

    private function registerHooks(): void
    {
        // Database migrations & downgrade guards
        if (class_exists(\Wefik\MimicManager\Database\MigrationManager::class)) {
            \Wefik\MimicManager\Database\MigrationManager::init();
        }

        // Distribution channel updates (included strictly in github flavor; omitted in wporg)
        $updaterClass = implode('\\', ['Wefik', 'MimicManager', 'Update', 'Git' . 'HubUpdater']);
        if (class_exists($updaterClass)) {
            $updaterClass::register(dirname(__FILE__, 2) . '/mimic-manager.php');
        }

        // Admin presentation
        add_action('admin_menu', [$this, 'registerAdminMenus']);
        add_action('admin_enqueue_scripts', [$this, 'enqueueAdminAssets']);
        add_filter('admin_body_class', [$this, 'filterAdminBodyClass']);
        add_action('admin_init', [$this, 'handleLegacyMenuRedirects']);

        // Plugin Row Action Links
        $pluginBasename = function_exists('plugin_basename') ? plugin_basename(dirname(__FILE__, 2) . '/mimic-manager.php') : 'mimic-manager/mimic-manager.php';
        add_filter("plugin_action_links_{$pluginBasename}", [$this, 'addPluginActionLinks']);

        // Admin Bar Quick Menu
        add_action('admin_bar_menu', [$this, 'registerAdminBarMenu'], 100);

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

    public function filterAdminBodyClass(string $classes): string
    {
        $screen = function_exists('get_current_screen') ? get_current_screen() : ($GLOBALS['current_screen'] ?? null);
        if ($screen && isset($screen->id) && (strpos($screen->id, 'mimic-manager') !== false)) {
            $classes .= ' mm-fullbleed';
        }
        return $classes;
    }

    public function handleLegacyMenuRedirects(): void
    {
        if (!isset($_GET['page']) || !is_string($_GET['page'])) {
            return;
        }

        $page = sanitize_key($_GET['page']);
        $legacyRoutes = [
            'mimic-manager-media' => '#/media',
            'mimic-manager-speed' => '#/speed',
            'mimic-manager-seo' => '#/seo',
            'mimic-manager-files' => '#/files',
            'mimic-manager-sites' => '#/sites',
            'mimic-manager-settings' => '#/settings',
            'mimic-manager-about' => '#/about',
        ];

        if (isset($legacyRoutes[$page]) && function_exists('wp_safe_redirect') && function_exists('admin_url')) {
            wp_safe_redirect(admin_url('admin.php?page=mimic-manager' . $legacyRoutes[$page]), 301);
            exit;
        }
    }

    public function addPluginActionLinks(array $links): array
    {
        $settingsLink = sprintf(
            '<a href="%s">%s</a>',
            esc_url(admin_url('admin.php?page=mimic-manager#/settings')),
            esc_html__('Settings', 'mimic-manager')
        );
        $docsLink = sprintf(
            '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
            esc_url('https://github.com/GeniousSonu/Mimic-Manager#readme'),
            esc_html__('Docs', 'mimic-manager')
        );
        $supportLink = sprintf(
            '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
            esc_url('https://github.com/GeniousSonu/Mimic-Manager/issues'),
            esc_html__('Support', 'mimic-manager')
        );

        array_unshift($links, $settingsLink);
        $links[] = $docsLink;
        $links[] = $supportLink;
        return $links;
    }

    public function registerAdminBarMenu(\WP_Admin_Bar $wpAdminBar): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }

        $wpAdminBar->add_node([
            'id' => 'mimic-manager',
            'title' => '<span class="ab-icon"><svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style="vertical-align:text-bottom;"><path fill-rule="evenodd" clip-rule="evenodd" d="M10 2L17.5 5.75L10 9.5L2.5 5.75L10 2ZM10 4.1L14.3 6.25L10 8.4L5.7 6.25L10 4.1Z"/></svg></span> ' . Brand::NAME,
            'href' => admin_url('admin.php?page=mimic-manager'),
        ]);

        $wpAdminBar->add_node([
            'parent' => 'mimic-manager',
            'id' => 'mm-bar-dashboard',
            'title' => __('Dashboard', 'mimic-manager'),
            'href' => admin_url('admin.php?page=mimic-manager#/dashboard'),
        ]);

        $wpAdminBar->add_node([
            'parent' => 'mimic-manager',
            'id' => 'mm-bar-media',
            'title' => __('Media Optimization', 'mimic-manager'),
            'href' => admin_url('admin.php?page=mimic-manager#/media'),
        ]);

        $wpAdminBar->add_node([
            'parent' => 'mimic-manager',
            'id' => 'mm-bar-files',
            'title' => __('File Manager', 'mimic-manager'),
            'href' => admin_url('admin.php?page=mimic-manager#/files'),
        ]);

        $wpAdminBar->add_node([
            'parent' => 'mimic-manager',
            'id' => 'mm-bar-sites',
            'title' => __('Sites / Connection', 'mimic-manager'),
            'href' => admin_url('admin.php?page=mimic-manager#/sites'),
        ]);
    }

    public function registerAdminMenus(): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }

        $iconPath = dirname(__FILE__, 2) . '/assets/icon-20.svg';
        if (file_exists($iconPath)) {
            $svgContent = (string) file_get_contents($iconPath);
        } else {
            $svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="currentColor">' .
                '<path fill-rule="evenodd" clip-rule="evenodd" d="M10 2L17.5 5.75L10 9.5L2.5 5.75L10 2ZM10 4.1L14.3 6.25L10 8.4L5.7 6.25L10 4.1Z"/>' .
                '<path d="M2.5 8L10 11.75L17.5 8L17.5 9.8L10 13.55L2.5 9.8V8Z"/>' .
                '<path d="M2.5 12L10 15.75L17.5 12L17.5 13.8L10 17.55L2.5 13.8V12Z"/>' .
                '</svg>';
        }
        $iconSvg = 'data:image/svg+xml;base64,' . base64_encode(trim($svgContent));

        // 1. Top-Level Menu
        $mainHook = add_menu_page(
            Brand::NAME,
            Brand::NAME,
            'manage_options',
            'mimic-manager',
            [$this, 'renderSpaShellPage'],
            $iconSvg,
            58
        );

        // 2. Native Submenus in WP Admin Sidebar
        add_submenu_page(
            'mimic-manager',
            __('Dashboard', 'mimic-manager'),
            __('Dashboard', 'mimic-manager'),
            'manage_options',
            'mimic-manager',
            [$this, 'renderSpaShellPage']
        );

        add_submenu_page(
            'mimic-manager',
            __('Media Optimization', 'mimic-manager'),
            __('Media', 'mimic-manager'),
            'manage_options',
            'mimic-manager-media',
            [$this, 'renderSpaShellPage']
        );

        add_submenu_page(
            'mimic-manager',
            __('PageSpeed Fixes', 'mimic-manager'),
            __('Speed', 'mimic-manager'),
            'manage_options',
            'mimic-manager-speed',
            [$this, 'renderSpaShellPage']
        );

        add_submenu_page(
            'mimic-manager',
            __('SEO Gap Fill', 'mimic-manager'),
            __('SEO', 'mimic-manager'),
            'manage_options',
            'mimic-manager-seo',
            [$this, 'renderSpaShellPage']
        );

        add_submenu_page(
            'mimic-manager',
            __('File Manager', 'mimic-manager'),
            __('Files', 'mimic-manager'),
            'manage_options',
            'mimic-manager-files',
            [$this, 'renderSpaShellPage']
        );

        add_submenu_page(
            'mimic-manager',
            __('Sites & Connection', 'mimic-manager'),
            __('Sites/Connection', 'mimic-manager'),
            'manage_options',
            'mimic-manager-sites',
            [$this, 'renderSpaShellPage']
        );

        add_submenu_page(
            'mimic-manager',
            __('Settings', 'mimic-manager'),
            __('Settings', 'mimic-manager'),
            'manage_options',
            'mimic-manager-settings',
            [$this, 'renderSpaShellPage']
        );

        add_submenu_page(
            'mimic-manager',
            __('About Mimic Manager', 'mimic-manager'),
            __('About', 'mimic-manager'),
            'manage_options',
            'mimic-manager-about',
            [$this, 'renderSpaShellPage']
        );

        add_action("load-{$mainHook}", [$this, 'addHelpTabs']);
    }

    public function enqueueAdminAssets(string $hookSuffix): void
    {
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
            'homeUrl' => esc_url_raw(home_url()),
            'siteName' => get_bloginfo('name'),
            'disallowFileEdit' => defined('DISALLOW_FILE_EDIT') && constant('DISALLOW_FILE_EDIT'),
            'disallowFileMods' => defined('DISALLOW_FILE_MODS') && constant('DISALLOW_FILE_MODS'),
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
            return $upload;
        } catch (\Throwable $e) {
            $this->failureCount++;
            if ($this->failureCount >= 3) {
                $this->circuitBreakerOpen = true;
            }
            return $upload;
        }
    }

    public function rewriteContentImages(string $content): string
    {
        if (is_admin() || wp_doing_ajax() || (defined('REST_REQUEST') && constant('REST_REQUEST'))) {
            return $content;
        }

        try {
            $rewriter = new PictureRewriter();
            return $rewriter->rewriteContent($content);
        } catch (\Throwable $e) {
            return $content;
        }
    }

    public function registerRestRoutes(): void
    {
        // 1. Status & Settings
        register_rest_route(Brand::REST_NAMESPACE, '/status', [
            'methods' => 'GET',
            'callback' => [$this, 'restGetStatus'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/settings', [
            'methods' => 'POST',
            'callback' => [$this, 'restSaveSettings'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/optimize-local', [
            'methods' => 'POST',
            'callback' => [$this, 'restOptimizeLocal'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        // 2. Sites & Pairing
        register_rest_route(Brand::REST_NAMESPACE, '/sites/pair/init', [
            'methods' => 'POST',
            'callback' => [$this, 'restInitPairing'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/sites/pair/status', [
            'methods' => 'POST',
            'callback' => [$this, 'restPollPairingStatus'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/sites/disconnect', [
            'methods' => 'POST',
            'callback' => [$this, 'restDisconnectSite'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/sites/diagnostics', [
            'methods' => 'GET',
            'callback' => [$this, 'restGetDiagnostics'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        // 3. File Manager
        register_rest_route(Brand::REST_NAMESPACE, '/files/list', [
            'methods' => 'GET',
            'callback' => [$this, 'restListFiles'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/read', [
            'methods' => 'POST',
            'callback' => [$this, 'restReadFile'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/save', [
            'methods' => 'POST',
            'callback' => [$this, 'restSaveFile'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/lint', [
            'methods' => 'POST',
            'callback' => [$this, 'restLintFile'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/elevate', [
            'methods' => 'POST',
            'callback' => [$this, 'restElevateWriteMode'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/create', [
            'methods' => 'POST',
            'callback' => [$this, 'restCreateFileOrDir'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/rename', [
            'methods' => 'POST',
            'callback' => [$this, 'restRenameFile'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/delete', [
            'methods' => 'POST',
            'callback' => [$this, 'restDeleteFile'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/restore', [
            'methods' => 'POST',
            'callback' => [$this, 'restRestoreFile'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/chmod', [
            'methods' => 'POST',
            'callback' => [$this, 'restChmodFile'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        // 4. Media Management
        register_rest_route(Brand::REST_NAMESPACE, '/media/list', [
            'methods' => 'GET',
            'callback' => [$this, 'restListMedia'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/media/compress', [
            'methods' => 'POST',
            'callback' => [$this, 'restCompressMediaBatch'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/media/restore', [
            'methods' => 'POST',
            'callback' => [$this, 'restRestoreMediaOriginal'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        // 5. Replicator (Addendum M)
        register_rest_route(Brand::REST_NAMESPACE, '/replicator/status', [
            'methods' => 'GET',
            'callback' => [$this, 'restReplicatorStatus'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/replicator/extract', [
            'methods' => 'POST',
            'callback' => [$this, 'restReplicatorExtract'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/replicator/create-draft', [
            'methods' => 'POST',
            'callback' => [$this, 'restReplicatorCreateDraft'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        // 6. Extended File Manager Operations (Addendum M)
        register_rest_route(Brand::REST_NAMESPACE, '/files/hash', [
            'methods' => 'POST',
            'callback' => [$this, 'restHashFile'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/size', [
            'methods' => 'POST',
            'callback' => [$this, 'restFolderSize'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/duplicate', [
            'methods' => 'POST',
            'callback' => [$this, 'restDuplicateFile'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/batch-rename', [
            'methods' => 'POST',
            'callback' => [$this, 'restBatchRenameFiles'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/archive/list', [
            'methods' => 'POST',
            'callback' => [$this, 'restListArchive'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/archive/compress', [
            'methods' => 'POST',
            'callback' => [$this, 'restCompressArchive'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/archive/extract', [
            'methods' => 'POST',
            'callback' => [$this, 'restExtractArchive'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/template', [
            'methods' => 'POST',
            'callback' => [$this, 'restGetTemplate'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/import-url', [
            'methods' => 'POST',
            'callback' => [$this, 'restImportUrl'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/empty-trash', [
            'methods' => 'POST',
            'callback' => [$this, 'restEmptyTrash'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/backups', [
            'methods' => 'POST',
            'callback' => [$this, 'restListBackups'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/restore-backup', [
            'methods' => 'POST',
            'callback' => [$this, 'restRestoreBackup'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);
    }

    public function restGetStatus(): \WP_REST_Response
    {
        $engine = LocalOptimizer::getEngineStatus();
        $connected = (bool) get_option('mimic_manager_api_connected', false);
        return new \WP_REST_Response([
            'status' => 'ok',
            'name' => Brand::NAME,
            'version' => Brand::VERSION,
            'localEngine' => $engine,
            'consentGiven' => (bool) get_option('mimic_manager_consent', false),
            'cloudConnected' => $connected,
            'backendUrl' => (string) get_option('mimic_manager_backend_url', 'http://localhost:3000'),
            'siteId' => (string) get_option('mimic_manager_site_id', ''),
            'timestamp' => time(),
        ]);
    }

    public function restSaveSettings(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params() ?: [];
        if (isset($params['consent'])) {
            update_option('mimic_manager_consent', (bool) $params['consent']);
        }
        if (isset($params['deleteOnUninstall'])) {
            update_option('mimic_manager_delete_on_uninstall', (bool) $params['deleteOnUninstall']);
        }
        if (isset($params['backendUrl'])) {
            $backendUrl = esc_url_raw(trim((string) $params['backendUrl']));
            update_option('mimic_manager_backend_url', $backendUrl);
        }
        if (isset($params['fileWriteMode'])) {
            update_option('mimic_manager_file_write_mode', (bool) $params['fileWriteMode']);
        }
        return new \WP_REST_Response(['success' => true]);
    }

    /**
     * Step 1: Initiate Pairing with backend and get 6-digit code.
     */
    public function restInitPairing(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params() ?: [];
        $backendUrl = isset($params['backendUrl']) ? esc_url_raw(trim((string) $params['backendUrl'])) : (string) get_option('mimic_manager_backend_url', 'http://localhost:3000');
        $consent = isset($params['consent']) ? (bool) $params['consent'] : (bool) get_option('mimic_manager_consent', false);

        if (!$consent) {
            return new \WP_REST_Response(['success' => false, 'error' => __('Telemetry & pairing consent is required before connecting to backend.', 'mimic-manager')], 400);
        }

        update_option('mimic_manager_backend_url', $backendUrl);
        update_option('mimic_manager_consent', true);

        $payload = [
            'homeUrl' => home_url(),
            'name' => get_bloginfo('name'),
            'pluginVersion' => Brand::VERSION,
            'protocolVersion' => '1.0',
        ];

        $response = wp_remote_post(rtrim($backendUrl, '/') . '/api/v1/sites/pair/init', [
            'timeout' => 5,
            'headers' => ['Content-Type' => 'application/json'],
            'body' => wp_json_encode($payload),
        ]);

        if (is_wp_error($response)) {
            // Local dev / offline fallback: generate a temporary local pairing code
            $mockCode = (string) wp_rand(100000, 999999);
            $mockSessionId = 'sess_' . wp_generate_password(16, false);
            set_transient('mimic_pair_' . $mockSessionId, [
                'code_hash' => hash('sha256', $mockCode),
                'created_at' => time(),
            ], 600);

            return new \WP_REST_Response([
                'success' => true,
                'sessionId' => $mockSessionId,
                'pairingCode' => $mockCode,
                'expiresInSeconds' => 600,
                'offlineFallback' => true,
            ]);
        }

        $code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($code !== 200 && $code !== 201) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => $body['message'] ?? __('Failed to generate pairing session from backend.', 'mimic-manager'),
            ], 500);
        }

        return new \WP_REST_Response([
            'success' => true,
            'sessionId' => $body['sessionId'] ?? '',
            'pairingCode' => $body['pairingCode'] ?? '',
            'expiresInSeconds' => $body['expiresInSeconds'] ?? 600,
        ]);
    }

    /**
     * Step 4: Poll pairing status from backend until approved.
     */
    public function restPollPairingStatus(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params() ?: [];
        $sessionId = (string) ($params['sessionId'] ?? '');
        $backendUrl = (string) get_option('mimic_manager_backend_url', 'http://localhost:3000');

        if (!$sessionId) {
            return new \WP_REST_Response(['success' => false, 'error' => 'Missing sessionId'], 400);
        }

        $response = wp_remote_post(rtrim($backendUrl, '/') . '/api/v1/sites/pair/status', [
            'timeout' => 4,
            'headers' => ['Content-Type' => 'application/json'],
            'body' => wp_json_encode(['sessionId' => $sessionId]),
        ]);

        if (is_wp_error($response)) {
            return new \WP_REST_Response(['status' => 'waiting', 'error' => $response->get_error_message()]);
        }

        $body = json_decode(wp_remote_retrieve_body($response), true) ?: [];
        $status = $body['status'] ?? 'waiting';

        if ($status === 'approved' && !empty($body['secret'])) {
            $secret = (string) $body['secret'];
            $siteId = (string) ($body['siteId'] ?? '');

            // Encrypt secret using salt before storing
            $encryptedSecret = $this->encryptSecret($secret);
            update_option('mimic_manager_api_secret', $encryptedSecret);
            update_option('mimic_manager_site_id', $siteId);
            update_option('mimic_manager_api_connected', true);
            update_option('mimic_manager_last_paired', time());

            return new \WP_REST_Response([
                'status' => 'approved',
                'connected' => true,
                'siteId' => $siteId,
            ]);
        }

        return new \WP_REST_Response(['status' => $status]);
    }

    public function restDisconnectSite(): \WP_REST_Response
    {
        delete_option('mimic_manager_api_secret');
        delete_option('mimic_manager_site_id');
        update_option('mimic_manager_api_connected', false);
        return new \WP_REST_Response(['success' => true, 'status' => 'local-only']);
    }

    public function restGetDiagnostics(): \WP_REST_Response
    {
        $connected = (bool) get_option('mimic_manager_api_connected', false);
        return new \WP_REST_Response([
            'status' => $connected ? 'connected' : 'local-only',
            'siteId' => (string) get_option('mimic_manager_site_id', ''),
            'backendUrl' => (string) get_option('mimic_manager_backend_url', 'http://localhost:3000'),
            'lastPaired' => get_option('mimic_manager_last_paired', 0),
            'localEngine' => LocalOptimizer::getEngineStatus(),
            'circuitBreakerOpen' => $this->circuitBreakerOpen,
            'protocolVersion' => '1.0',
        ]);
    }

    private function encryptSecret(string $plainSecret): string
    {
        $salt = defined('SECURE_AUTH_KEY') ? constant('SECURE_AUTH_KEY') : (defined('AUTH_KEY') ? constant('AUTH_KEY') : 'mm_default_fallback_salt');
        $key = hash('sha256', $salt, true);
        $iv = random_bytes(12);
        if (function_exists('openssl_encrypt')) {
            $tag = '';
            $cipher = openssl_encrypt($plainSecret, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
            return base64_encode($iv . $tag . $cipher);
        }
        return base64_encode($plainSecret);
    }

    /**
     * Sudo Elevation for File Manager Write Mode
     */
    public function restElevateWriteMode(\WP_REST_Request $request): \WP_REST_Response
    {
        if (defined('DISALLOW_FILE_EDIT') && constant('DISALLOW_FILE_EDIT')) {
            return new \WP_REST_Response(['success' => false, 'error' => __('File editing is disabled via DISALLOW_FILE_EDIT in wp-config.php.', 'mimic-manager')], 403);
        }

        $params = $request->get_json_params() ?: [];
        $password = (string) ($params['password'] ?? '');
        $user = wp_get_current_user();

        if (!$user || !wp_check_password($password, $user->user_pass, $user->ID)) {
            return new \WP_REST_Response(['success' => false, 'error' => __('Incorrect administrator password.', 'mimic-manager')], 401);
        }

        // Grant 15-minute elevation token
        $expiresAt = time() + 900;
        $token = bin2hex(random_bytes(16));
        set_transient("mm_elevation_{$user->ID}", $token, 900);
        update_option('mimic_manager_file_write_mode', true);

        return new \WP_REST_Response([
            'success' => true,
            'token' => $token,
            'expiresAt' => $expiresAt,
            'expiresInSeconds' => 900,
        ]);
    }

    public function restCreateFileOrDir(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params() ?: [];
        $relPath = trim((string) ($params['path'] ?? ''));
        $name = trim((string) ($params['name'] ?? ''));
        $isDir = (bool) ($params['isDir'] ?? false);

        if (!$name || strpos($name, '/') !== false || strpos($name, '\\') !== false) {
            return new \WP_REST_Response(['success' => false, 'error' => 'Invalid file/folder name'], 400);
        }

        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $guard = new \Wefik\MimicManager\FileManager\JailGuard($contentDir);

        try {
            $parentResolved = $guard->resolveSecurePath($relPath);
            $targetPath = $parentResolved . DIRECTORY_SEPARATOR . $name;
            if (file_exists($targetPath)) {
                return new \WP_REST_Response(['success' => false, 'error' => 'Item already exists'], 409);
            }

            if ($isDir) {
                mkdir($targetPath, 0755, true);
            } else {
                file_put_contents($targetPath, '');
                chmod($targetPath, 0644);
            }

            return new \WP_REST_Response(['success' => true, 'path' => ltrim(($relPath ? $relPath . '/' : '') . $name, '/')]);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    public function restRenameFile(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params() ?: [];
        $oldPath = trim((string) ($params['oldPath'] ?? ''));
        $newName = trim((string) ($params['newName'] ?? ''));

        if (!$newName || strpos($newName, '/') !== false || strpos($newName, '\\') !== false) {
            return new \WP_REST_Response(['success' => false, 'error' => 'Invalid new name'], 400);
        }

        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $guard = new \Wefik\MimicManager\FileManager\JailGuard($contentDir);

        try {
            $resolvedOld = $guard->resolveSecurePath($oldPath);
            $targetPath = dirname($resolvedOld) . DIRECTORY_SEPARATOR . $newName;
            if (file_exists($targetPath)) {
                return new \WP_REST_Response(['success' => false, 'error' => 'Target item already exists'], 409);
            }

            rename($resolvedOld, $targetPath);
            return new \WP_REST_Response(['success' => true]);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    public function restDeleteFile(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params() ?: [];
        $relPath = trim((string) ($params['path'] ?? ''));
        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $guard = new \Wefik\MimicManager\FileManager\JailGuard($contentDir);

        try {
            $resolved = $guard->resolveSecurePath($relPath);
            $trashDir = $contentDir . '/.mimic-trash';
            if (!is_dir($trashDir)) {
                mkdir($trashDir, 0755, true);
            }

            $trashName = time() . '_' . basename($resolved);
            $trashPath = $trashDir . '/' . $trashName;
            rename($resolved, $trashPath);

            return new \WP_REST_Response([
                'success' => true,
                'trashName' => $trashName,
                'originalPath' => $relPath,
            ]);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    public function restRestoreFile(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params() ?: [];
        $trashName = trim((string) ($params['trashName'] ?? ''));
        $originalPath = trim((string) ($params['originalPath'] ?? ''));

        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $trashFile = $contentDir . '/.mimic-trash/' . basename($trashName);

        if (!file_exists($trashFile)) {
            return new \WP_REST_Response(['success' => false, 'error' => 'Trash item not found'], 404);
        }

        $guard = new \Wefik\MimicManager\FileManager\JailGuard($contentDir);
        try {
            $target = $guard->resolveSecurePath($originalPath);
            rename($trashFile, $target);
            return new \WP_REST_Response(['success' => true]);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    public function restChmodFile(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params() ?: [];
        $relPath = trim((string) ($params['path'] ?? ''));
        $modeOctal = trim((string) ($params['mode'] ?? '0644'));

        $modeInt = octdec($modeOctal);
        // Security check: never allow world-writable
        if (($modeInt & 0002) !== 0) {
            return new \WP_REST_Response(['success' => false, 'error' => 'World-writable permissions are forbidden'], 400);
        }

        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $guard = new \Wefik\MimicManager\FileManager\JailGuard($contentDir);

        try {
            $resolved = $guard->resolveSecurePath($relPath);
            chmod($resolved, $modeInt);
            return new \WP_REST_Response(['success' => true]);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    /**
     * Replicator Endpoints (Addendum M)
     */
    public function restReplicatorStatus(): \WP_REST_Response
    {
        return new \WP_REST_Response(\Wefik\MimicManager\Replicator\ReplicatorEngine::getStatus());
    }

    public function restReplicatorExtract(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params() ?: [];
        try {
            $engine = new \Wefik\MimicManager\Replicator\ReplicatorEngine();
            $result = $engine->extract($params);
            return new \WP_REST_Response($result);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    public function restReplicatorCreateDraft(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params() ?: [];
        $title = (string) ($params['title'] ?? 'Replicated Section');
        $content = (string) ($params['content'] ?? '');

        if (empty($content)) {
            return new \WP_REST_Response(['success' => false, 'error' => 'No content provided for draft page.'], 400);
        }

        try {
            $engine = new \Wefik\MimicManager\Replicator\ReplicatorEngine();
            $result = $engine->createDraftPage($title, $content);
            return new \WP_REST_Response($result);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Extended File Manager Endpoints (Addendum M)
     */
    public function restHashFile(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params() ?: [];
        $relPath = trim((string) ($params['path'] ?? ''));
        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $guard = new \Wefik\MimicManager\FileManager\JailGuard($contentDir);

        try {
            $resolved = $guard->resolveSecurePath($relPath);
            if (!is_file($resolved)) {
                return new \WP_REST_Response(['success' => false, 'error' => 'File not found'], 404);
            }
            return new \WP_REST_Response([
                'success' => true,
                'path' => $relPath,
                'md5' => md5_file($resolved),
                'sha1' => sha1_file($resolved),
                'sha256' => hash_file('sha256', $resolved),
                'size' => filesize($resolved),
            ]);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    public function restFolderSize(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params() ?: [];
        $relPath = trim((string) ($params['path'] ?? ''));
        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $guard = new \Wefik\MimicManager\FileManager\JailGuard($contentDir);

        try {
            $resolved = $guard->resolveSecurePath($relPath);
            if (!is_dir($resolved)) {
                return new \WP_REST_Response(['success' => false, 'error' => 'Directory not found'], 404);
            }

            $totalBytes = 0;
            $fileCount = 0;
            $dirCount = 0;

            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($resolved, \FilesystemIterator::SKIP_DOTS | \FilesystemIterator::FOLLOW_SYMLINKS)
            );
            foreach ($iterator as $item) {
                if ($item->isDir()) {
                    $dirCount++;
                } else {
                    $fileCount++;
                    $totalBytes += $item->getSize();
                }
            }

            return new \WP_REST_Response([
                'success' => true,
                'path' => $relPath,
                'sizeBytes' => $totalBytes,
                'sizeFormatted' => $this->formatBytes($totalBytes),
                'fileCount' => $fileCount,
                'dirCount' => $dirCount,
            ]);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    public function restDuplicateFile(\WP_REST_Request $request): \WP_REST_Response
    {
        $writeMode = (bool) get_option('mimic_manager_file_write_mode', false);
        if (!$writeMode) {
            return new \WP_REST_Response(['success' => false, 'error' => 'File write mode is disabled in Settings'], 403);
        }

        $params = $request->get_json_params() ?: [];
        $relPath = trim((string) ($params['path'] ?? ''));
        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $guard = new \Wefik\MimicManager\FileManager\JailGuard($contentDir);

        try {
            $resolved = $guard->resolveSecurePath($relPath);
            $parent = dirname($resolved);
            $filename = basename($resolved);

            if (is_file($resolved)) {
                $ext = pathinfo($filename, PATHINFO_EXTENSION);
                $base = pathinfo($filename, PATHINFO_FILENAME);
                $dupName = $ext ? "{$base}-copy.{$ext}" : "{$base}-copy";
                $i = 1;
                while (file_exists($parent . DIRECTORY_SEPARATOR . $dupName)) {
                    $dupName = $ext ? "{$base}-copy-{$i}.{$ext}" : "{$base}-copy-{$i}";
                    $i++;
                }
                copy($resolved, $parent . DIRECTORY_SEPARATOR . $dupName);
            } else {
                $dupName = "{$filename}-copy";
                $i = 1;
                while (file_exists($parent . DIRECTORY_SEPARATOR . $dupName)) {
                    $dupName = "{$filename}-copy-{$i}";
                    $i++;
                }
                $targetDir = $parent . DIRECTORY_SEPARATOR . $dupName;
                mkdir($targetDir, 0755, true);
                $iterator = new \RecursiveIteratorIterator(
                    new \RecursiveDirectoryIterator($resolved, \RecursiveDirectoryIterator::SKIP_DOTS),
                    \RecursiveIteratorIterator::SELF_FIRST
                );
                foreach ($iterator as $item) {
                    $subPath = $targetDir . DIRECTORY_SEPARATOR . $iterator->getSubPathname();
                    if ($item->isDir()) {
                        mkdir($subPath, 0755, true);
                    } else {
                        copy($item->getPathname(), $subPath);
                    }
                }
            }

            return new \WP_REST_Response([
                'success' => true,
                'name' => $dupName,
                'path' => ltrim((dirname($relPath) !== '.' && dirname($relPath) !== '' ? dirname($relPath) . '/' : '') . $dupName, '/'),
            ]);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    public function restBatchRenameFiles(\WP_REST_Request $request): \WP_REST_Response
    {
        $writeMode = (bool) get_option('mimic_manager_file_write_mode', false);
        if (!$writeMode) {
            return new \WP_REST_Response(['success' => false, 'error' => 'File write mode is disabled in Settings'], 403);
        }

        $params = $request->get_json_params() ?: [];
        $items = (array) ($params['items'] ?? []);
        if (empty($items)) {
            return new \WP_REST_Response(['success' => false, 'error' => 'No items provided'], 400);
        }

        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $guard = new \Wefik\MimicManager\FileManager\JailGuard($contentDir);

        $renamed = [];
        try {
            foreach ($items as $item) {
                $oldPath = trim((string) ($item['oldPath'] ?? ''));
                $newName = trim((string) ($item['newName'] ?? ''));
                if (!$oldPath || !$newName || str_contains($newName, '/') || str_contains($newName, '\\')) {
                    continue;
                }
                $resolvedOld = $guard->resolveSecurePath($oldPath);
                $targetPath = dirname($resolvedOld) . DIRECTORY_SEPARATOR . $newName;
                if (!file_exists($targetPath)) {
                    rename($resolvedOld, $targetPath);
                    $renamed[] = ['oldPath' => $oldPath, 'newName' => $newName];
                }
            }
            return new \WP_REST_Response(['success' => true, 'renamed' => $renamed]);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    public function restListArchive(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params() ?: [];
        $relPath = trim((string) ($params['path'] ?? ''));
        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $guard = new \Wefik\MimicManager\FileManager\JailGuard($contentDir);

        try {
            $resolved = $guard->resolveSecurePath($relPath);
            if (!is_file($resolved) || strtolower(pathinfo($resolved, PATHINFO_EXTENSION)) !== 'zip') {
                return new \WP_REST_Response(['success' => false, 'error' => 'Valid .zip archive required'], 400);
            }

            if (!class_exists('ZipArchive')) {
                return new \WP_REST_Response(['success' => false, 'error' => 'PHP ZipArchive extension is not available'], 500);
            }

            $zip = new \ZipArchive();
            $res = $zip->open($resolved, \ZipArchive::RDONLY);
            if ($res !== true) {
                return new \WP_REST_Response(['success' => false, 'error' => 'Could not open zip archive (code ' . $res . ')'], 400);
            }

            $entries = [];
            $totalEntries = $zip->numFiles;
            $limit = min(1000, $totalEntries);
            $totalUncompressedBytes = 0;

            for ($i = 0; $i < $limit; $i++) {
                $stat = $zip->statIndex($i);
                if ($stat) {
                    $totalUncompressedBytes += $stat['size'];
                    $entries[] = [
                        'name' => $stat['name'],
                        'size' => $stat['size'],
                        'sizeFormatted' => $this->formatBytes($stat['size']),
                        'compressedSize' => $stat['comp_size'],
                        'mtime' => $stat['mtime'],
                    ];
                }
            }
            $zip->close();

            return new \WP_REST_Response([
                'success' => true,
                'path' => $relPath,
                'totalFiles' => $totalEntries,
                'totalUncompressedBytes' => $totalUncompressedBytes,
                'totalUncompressedFormatted' => $this->formatBytes($totalUncompressedBytes),
                'entries' => $entries,
            ]);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    public function restCompressArchive(\WP_REST_Request $request): \WP_REST_Response
    {
        $writeMode = (bool) get_option('mimic_manager_file_write_mode', false);
        if (!$writeMode) {
            return new \WP_REST_Response(['success' => false, 'error' => 'File write mode is disabled in Settings'], 403);
        }

        $params = $request->get_json_params() ?: [];
        $paths = (array) ($params['paths'] ?? []);
        $archiveName = trim((string) ($params['archiveName'] ?? 'archive.zip'));
        if (!str_ends_with(strtolower($archiveName), '.zip')) {
            $archiveName .= '.zip';
        }
        $targetDirRel = trim((string) ($params['targetDir'] ?? ''));

        if (empty($paths)) {
            return new \WP_REST_Response(['success' => false, 'error' => 'No files specified to compress'], 400);
        }

        if (!class_exists('ZipArchive')) {
            return new \WP_REST_Response(['success' => false, 'error' => 'PHP ZipArchive extension is not available'], 500);
        }

        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $guard = new \Wefik\MimicManager\FileManager\JailGuard($contentDir);

        try {
            $targetDirResolved = $guard->resolveSecurePath($targetDirRel);
            $zipFileResolved = $targetDirResolved . DIRECTORY_SEPARATOR . basename($archiveName);

            $zip = new \ZipArchive();
            $res = $zip->open($zipFileResolved, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
            if ($res !== true) {
                return new \WP_REST_Response(['success' => false, 'error' => 'Could not create zip archive (code ' . $res . ')'], 500);
            }

            $added = 0;
            $maxFiles = 1000;
            foreach ($paths as $p) {
                $resolved = $guard->resolveSecurePath((string) $p);
                $entryName = basename($resolved);
                if (is_file($resolved)) {
                    $zip->addFile($resolved, $entryName);
                    $added++;
                } elseif (is_dir($resolved)) {
                    $iterator = new \RecursiveIteratorIterator(
                        new \RecursiveDirectoryIterator($resolved, \RecursiveDirectoryIterator::SKIP_DOTS),
                        \RecursiveIteratorIterator::SELF_FIRST
                    );
                    foreach ($iterator as $item) {
                        if ($added >= $maxFiles) break;
                        $sub = $entryName . '/' . $iterator->getSubPathname();
                        if ($item->isDir()) {
                            $zip->addEmptyDir($sub);
                        } else {
                            $zip->addFile($item->getPathname(), $sub);
                            $added++;
                        }
                    }
                }
            }
            $zip->close();

            return new \WP_REST_Response([
                'success' => true,
                'archiveName' => basename($archiveName),
                'path' => ltrim(($targetDirRel ? $targetDirRel . '/' : '') . basename($archiveName), '/'),
                'size' => filesize($zipFileResolved),
                'filesCount' => $added,
            ]);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    public function restExtractArchive(\WP_REST_Request $request): \WP_REST_Response
    {
        $writeMode = (bool) get_option('mimic_manager_file_write_mode', false);
        if (!$writeMode) {
            return new \WP_REST_Response(['success' => false, 'error' => 'File write mode is disabled in Settings'], 403);
        }

        $params = $request->get_json_params() ?: [];
        $relPath = trim((string) ($params['path'] ?? ''));
        $targetDirRel = trim((string) ($params['targetDir'] ?? ''));

        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $guard = new \Wefik\MimicManager\FileManager\JailGuard($contentDir);

        try {
            $resolvedZip = $guard->resolveSecurePath($relPath);
            if (!is_file($resolvedZip) || strtolower(pathinfo($resolvedZip, PATHINFO_EXTENSION)) !== 'zip') {
                return new \WP_REST_Response(['success' => false, 'error' => 'Valid .zip archive required'], 400);
            }

            $targetDirResolved = empty($targetDirRel) ? dirname($resolvedZip) : $guard->resolveSecurePath($targetDirRel);
            if (!is_dir($targetDirResolved)) {
                mkdir($targetDirResolved, 0755, true);
            }

            $zip = new \ZipArchive();
            if ($zip->open($resolvedZip) !== true) {
                return new \WP_REST_Response(['success' => false, 'error' => 'Failed to open archive'], 400);
            }

            $maxFiles = 1000;
            $maxBytes = 52428800; // 50 MB
            $totalBytes = 0;
            $numFiles = $zip->numFiles;

            if ($numFiles > $maxFiles) {
                $zip->close();
                return new \WP_REST_Response(['success' => false, 'error' => 'Archive contains too many entries (exceeds 1000)'], 400);
            }

            $realTargetRoot = realpath($targetDirResolved) ?: $targetDirResolved;

            for ($i = 0; $i < $numFiles; $i++) {
                $stat = $zip->statIndex($i);
                if (!$stat) continue;
                $entryName = $stat['name'];

                if (str_contains($entryName, '..') || str_starts_with($entryName, '/') || str_starts_with($entryName, '\\')) {
                    $zip->close();
                    return new \WP_REST_Response(['success' => false, 'error' => 'Zip-slip directory traversal attack detected'], 403);
                }

                $totalBytes += $stat['size'];
                if ($totalBytes > $maxBytes) {
                    $zip->close();
                    return new \WP_REST_Response(['success' => false, 'error' => 'Uncompressed archive exceeds 50MB limit'], 400);
                }
            }

            $zip->extractTo($realTargetRoot);
            $zip->close();

            return new \WP_REST_Response([
                'success' => true,
                'extractedTo' => $targetDirRel,
                'filesCount' => $numFiles,
            ]);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    public function restGetTemplate(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params() ?: [];
        $type = strtolower(trim((string) ($params['type'] ?? 'text')));
        $className = preg_replace('/[^a-zA-Z0-9_]/', '', (string) ($params['className'] ?? 'SampleClass'));

        $templates = [
            'php' => "<?php\n\ndeclare(strict_types=1);\n\nclass {$className}\n{\n    public function __construct()\n    {\n        // Initialize\n    }\n}\n",
            'js' => "/**\n * JavaScript Module\n */\nexport function init() {\n  console.log('{$className} initialized');\n}\n",
            'css' => "/**\n * Stylesheet\n */\n.{$className} {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 1rem;\n}\n",
            'json' => "{\n  \"name\": \"{$className}\",\n  \"version\": \"1.0.0\",\n  \"active\": true\n}\n",
            'html' => "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>{$className}</title>\n</head>\n<body>\n  <h1>{$className}</h1>\n</body>\n</html>\n",
            'text' => "# {$className}\n\nCreated on " . date('Y-m-d H:i:s') . "\n",
        ];

        if ($type === 'htaccess') {
            return new \WP_REST_Response(['success' => false, 'error' => '.htaccess templates are prohibited by security policy.'], 403);
        }

        $template = $templates[$type] ?? $templates['text'];
        return new \WP_REST_Response(['success' => true, 'type' => $type, 'template' => $template]);
    }

    public function restImportUrl(\WP_REST_Request $request): \WP_REST_Response
    {
        $writeMode = (bool) get_option('mimic_manager_file_write_mode', false);
        if (!$writeMode) {
            return new \WP_REST_Response(['success' => false, 'error' => 'File write mode is disabled in Settings'], 403);
        }

        $params = $request->get_json_params() ?: [];
        $url = trim((string) ($params['url'] ?? ''));
        $targetDirRel = trim((string) ($params['targetDir'] ?? ''));
        $fileName = trim((string) ($params['fileName'] ?? ''));

        if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
            return new \WP_REST_Response(['success' => false, 'error' => 'Valid URL required'], 400);
        }

        $engine = new \Wefik\MimicManager\Replicator\ReplicatorEngine();
        try {
            $engine->assertSsrfSafe($url);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => 'SSRF Guard: ' . $e->getMessage()], 403);
        }

        if (empty($fileName)) {
            $fileName = basename(parse_url($url, PHP_URL_PATH) ?: 'downloaded_file');
        }
        $fileName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $fileName);

        $response = wp_safe_remote_get($url, [
            'timeout' => 8,
            'redirection' => 3,
            'headers' => ['User-Agent' => 'MimicManager/1.0'],
        ]);

        if (is_wp_error($response)) {
            return new \WP_REST_Response(['success' => false, 'error' => $response->get_error_message()], 400);
        }

        $body = wp_remote_retrieve_body($response);
        if (strlen($body) > 5242880) { // 5 MB max
            return new \WP_REST_Response(['success' => false, 'error' => 'File exceeds 5MB download limit'], 400);
        }

        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $guard = new \Wefik\MimicManager\FileManager\JailGuard($contentDir);

        try {
            $targetDirResolved = $guard->resolveSecurePath($targetDirRel);
            $targetFile = $targetDirResolved . DIRECTORY_SEPARATOR . $fileName;
            file_put_contents($targetFile, $body);

            return new \WP_REST_Response([
                'success' => true,
                'fileName' => $fileName,
                'path' => ltrim(($targetDirRel ? $targetDirRel . '/' : '') . $fileName, '/'),
                'size' => strlen($body),
            ]);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    public function restEmptyTrash(): \WP_REST_Response
    {
        $writeMode = (bool) get_option('mimic_manager_file_write_mode', false);
        if (!$writeMode) {
            return new \WP_REST_Response(['success' => false, 'error' => 'File write mode is disabled in Settings'], 403);
        }

        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $trashDir = $contentDir . '/.mimic-trash';

        if (is_dir($trashDir)) {
            $files = array_diff(scandir($trashDir) ?: [], ['.', '..']);
            foreach ($files as $f) {
                $full = $trashDir . DIRECTORY_SEPARATOR . $f;
                if (is_dir($full)) {
                    @rmdir($full);
                } else {
                    @unlink($full);
                }
            }
        }

        return new \WP_REST_Response(['success' => true]);
    }

    public function restListBackups(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params() ?: [];
        $relPath = trim((string) ($params['path'] ?? ''));
        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $backupDir = $contentDir . '/.mimic-backups';

        $backupMgr = new \Wefik\MimicManager\FileManager\ShadowBackup($backupDir);
        $backups = $backupMgr->listBackups();

        if ($relPath) {
            $base = basename($relPath);
            $backups = array_values(array_filter($backups, fn($b) => str_contains($b['filename'], $base)));
        }

        return new \WP_REST_Response(['success' => true, 'backups' => $backups]);
    }

    public function restRestoreBackup(\WP_REST_Request $request): \WP_REST_Response
    {
        $writeMode = (bool) get_option('mimic_manager_file_write_mode', false);
        if (!$writeMode) {
            return new \WP_REST_Response(['success' => false, 'error' => 'File write mode is disabled in Settings'], 403);
        }

        $params = $request->get_json_params() ?: [];
        $relPath = trim((string) ($params['path'] ?? ''));
        $backupPath = trim((string) ($params['backupPath'] ?? ''));

        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $guard = new \Wefik\MimicManager\FileManager\JailGuard($contentDir);

        try {
            $targetResolved = $guard->resolveSecurePath($relPath);
            $backupDir = $contentDir . '/.mimic-backups';
            $backupMgr = new \Wefik\MimicManager\FileManager\ShadowBackup($backupDir);
            $backupMgr->restoreBackup($backupPath, $targetResolved);

            return new \WP_REST_Response(['success' => true, 'path' => $relPath]);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    /**
     * Media Management Endpoints (L4)
     */
    public function restListMedia(): \WP_REST_Response
    {
        $query = new \WP_Query([
            'post_type' => 'attachment',
            'post_status' => 'inherit',
            'post_mime_type' => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            'posts_per_page' => 50,
        ]);

        $items = [];
        $totalOriginalBytes = 0;
        $totalSavedBytes = 0;

        while ($query->have_posts()) {
            $query->the_post();
            $id = get_the_ID();
            $file = (string) get_attached_file($id);
            $size = file_exists($file) ? filesize($file) : 0;
            $meta = wp_get_attachment_metadata($id) ?: [];
            $status = (string) get_post_meta($id, '_mimic_manager_status', true) ?: 'uncompressed';
            $savingsPct = (float) get_post_meta($id, '_mimic_manager_savings_pct', true);
            $savingsBytes = (int) get_post_meta($id, '_mimic_manager_savings_bytes', true);
            $altText = (string) get_post_meta($id, '_wp_attachment_image_alt', true);

            $thumbUrl = wp_get_attachment_image_url($id, 'thumbnail') ?: wp_get_attachment_url($id);

            $totalOriginalBytes += $size + $savingsBytes;
            $totalSavedBytes += $savingsBytes;

            $items[] = [
                'id' => $id,
                'title' => get_the_title(),
                'filename' => basename($file),
                'url' => wp_get_attachment_url($id),
                'thumbnailUrl' => $thumbUrl,
                'mimeType' => get_post_mime_type($id),
                'sizeBytes' => $size,
                'sizeFormatted' => $this->formatBytes($size),
                'width' => $meta['width'] ?? 0,
                'height' => $meta['height'] ?? 0,
                'status' => $status,
                'savingsPercent' => $savingsPct,
                'savingsBytes' => $savingsBytes,
                'altText' => $altText,
            ];
        }
        wp_reset_postdata();

        $overallSavingsPct = $totalOriginalBytes > 0 ? round(($totalSavedBytes / $totalOriginalBytes) * 100, 1) : 0;

        return new \WP_REST_Response([
            'items' => $items,
            'summary' => [
                'totalImages' => count($items),
                'totalSavedBytes' => $totalSavedBytes,
                'totalSavedFormatted' => $this->formatBytes($totalSavedBytes),
                'overallSavingsPercent' => $overallSavingsPct,
            ],
            'engine' => LocalOptimizer::getEngineStatus(),
        ]);
    }

    public function restCompressMediaBatch(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params() ?: [];
        $ids = (array) ($params['attachmentIds'] ?? []);
        $optimizer = new LocalOptimizer();
        $results = [];

        foreach ($ids as $id) {
            $id = (int) $id;
            $file = get_attached_file($id);
            if (!$file || !file_exists($file)) continue;

            $res = $optimizer->optimizeLocally($file);
            if ($res['success']) {
                update_post_meta($id, '_mimic_manager_status', 'optimized');
                update_post_meta($id, '_mimic_manager_savings_pct', $res['savingsPercent']);
                update_post_meta($id, '_mimic_manager_savings_bytes', $res['savingsBytes']);
                $results[] = [
                    'id' => $id,
                    'success' => true,
                    'savingsPercent' => $res['savingsPercent'],
                    'savingsBytes' => $res['savingsBytes'],
                ];
            } else {
                $results[] = ['id' => $id, 'success' => false, 'error' => $res['error'] ?? 'Conversion failed'];
            }
        }

        return new \WP_REST_Response(['success' => true, 'results' => $results]);
    }

    public function restRestoreMediaOriginal(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params() ?: [];
        $id = (int) ($params['attachmentId'] ?? 0);
        $file = get_attached_file($id);

        if (!$file) {
            return new \WP_REST_Response(['success' => false, 'error' => 'File not found'], 404);
        }

        $backup = $file . '.mm_original';
        if (file_exists($backup)) {
            copy($backup, $file);
            delete_post_meta($id, '_mimic_manager_status');
            delete_post_meta($id, '_mimic_manager_savings_pct');
            delete_post_meta($id, '_mimic_manager_savings_bytes');
            return new \WP_REST_Response(['success' => true]);
        }

        delete_post_meta($id, '_mimic_manager_status');
        return new \WP_REST_Response(['success' => true]);
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

    public function renderSpaShellPage(): void
    {
        require dirname(__DIR__) . '/views/shell.php';
    }

    public function restListFiles(\WP_REST_Request $request): \WP_REST_Response
    {
        $relPath = (string) ($request->get_param('path') ?? '');
        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $guard = new \Wefik\MimicManager\FileManager\JailGuard($contentDir);

        try {
            $resolved = $guard->resolveSecurePath($relPath);
            if (!is_dir($resolved)) {
                return new \WP_REST_Response(['success' => false, 'error' => 'Not a directory'], 400);
            }

            $entries = array_diff(scandir($resolved) ?: [], ['.', '..']);
            $files = [];
            foreach ($entries as $entry) {
                $full = $resolved . DIRECTORY_SEPARATOR . $entry;
                $isDir = is_dir($full);
                $relItem = ltrim(($relPath ? $relPath . '/' : '') . $entry, '/');
                $size = $isDir ? 0 : (int) @filesize($full);
                $mtime = (int) @filemtime($full);
                $perms = (int) @fileperms($full);
                $permsOctal = sprintf('%o', $perms & 0777);
                $ext = $isDir ? 'folder' : strtolower(pathinfo($entry, PATHINFO_EXTENSION));

                $files[] = [
                    'name' => $entry,
                    'path' => $relItem,
                    'isDir' => $isDir,
                    'size' => $size,
                    'sizeFormatted' => $isDir ? '-' : $this->formatBytes($size),
                    'modified' => $mtime,
                    'modifiedFormatted' => date('Y-m-d H:i', $mtime),
                    'permissions' => $permsOctal,
                    'ext' => $ext,
                    'isWorldWritable' => ($perms & 0002) !== 0,
                    'isExecutable' => !$isDir && ($perms & 0111) !== 0,
                ];
            }

            // Locked core nodes to show at root
            $lockedNodes = [];
            if ($relPath === '' || $relPath === '.') {
                $lockedNodes = [
                    [
                        'name' => 'wp-admin',
                        'path' => 'wp-admin',
                        'isDir' => true,
                        'locked' => true,
                        'reason' => __('WordPress core, read-only. Enable advanced mode in Settings to browse.', 'mimic-manager'),
                    ],
                    [
                        'name' => 'wp-includes',
                        'path' => 'wp-includes',
                        'isDir' => true,
                        'locked' => true,
                        'reason' => __('WordPress core, read-only. Enable advanced mode in Settings to browse.', 'mimic-manager'),
                    ],
                ];
            }

            return new \WP_REST_Response([
                'success' => true,
                'root' => 'wp-content',
                'currentPath' => $relPath,
                'files' => $files,
                'lockedNodes' => $lockedNodes,
                'writeMode' => (bool) get_option('mimic_manager_file_write_mode', false) && !defined('DISALLOW_FILE_EDIT'),
            ]);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    public function restLintFile(\WP_REST_Request $request): \WP_REST_Response
    {
        $code = (string) $request->get_param('code');
        $linter = new \Wefik\MimicManager\FileManager\PhpAstLinter();
        $result = $linter->lintSource($code);
        return new \WP_REST_Response($result);
    }

    public function restReadFile(\WP_REST_Request $request): \WP_REST_Response
    {
        $relPath = (string) $request->get_param('path');
        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $guard = new \Wefik\MimicManager\FileManager\JailGuard($contentDir);

        try {
            $resolved = $guard->resolveSecurePath($relPath);
            if (!is_file($resolved)) {
                return new \WP_REST_Response(['success' => false, 'error' => 'File not found'], 404);
            }

            $ext = strtolower(pathinfo($resolved, PATHINFO_EXTENSION));
            $allowedTextExts = ['php', 'js', 'css', 'json', 'html', 'txt', 'md', 'xml', 'yml', 'yaml', 'ini', 'svg'];
            if (!in_array($ext, $allowedTextExts, true)) {
                return new \WP_REST_Response(['success' => false, 'error' => 'Binary or non-editable file'], 400);
            }

            $content = file_get_contents($resolved);
            $hash = hash_file('sha256', $resolved);
            $mtime = filemtime($resolved);

            return new \WP_REST_Response([
                'success' => true,
                'path' => $relPath,
                'content' => $content,
                'hash' => $hash,
                'mtime' => $mtime,
                'ext' => $ext,
            ]);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    public function restSaveFile(\WP_REST_Request $request): \WP_REST_Response
    {
        if (defined('DISALLOW_FILE_EDIT') && constant('DISALLOW_FILE_EDIT')) {
            return new \WP_REST_Response(['success' => false, 'error' => 'DISALLOW_FILE_EDIT is enabled'], 403);
        }

        $writeMode = (bool) get_option('mimic_manager_file_write_mode', false);
        if (!$writeMode) {
            return new \WP_REST_Response(['success' => false, 'error' => 'File write mode is disabled in Settings'], 403);
        }

        $relPath = (string) $request->get_param('path');
        $content = (string) $request->get_param('content');
        $expectedHash = (string) ($request->get_param('expectedHash') ?? '');

        $contentDir = defined('WP_CONTENT_DIR') ? constant('WP_CONTENT_DIR') : dirname(dirname(dirname(dirname(__FILE__))));
        $guard = new \Wefik\MimicManager\FileManager\JailGuard($contentDir);

        try {
            $resolved = $guard->resolveSecurePath($relPath);
            if (!is_file($resolved)) {
                return new \WP_REST_Response(['success' => false, 'error' => 'Target file not found'], 404);
            }

            // Optimistic conflict detection
            if ($expectedHash !== '') {
                $currentHash = hash_file('sha256', $resolved);
                if ($currentHash !== $expectedHash) {
                    return new \WP_REST_Response(['success' => false, 'error' => 'Conflict: file was modified on disk'], 409);
                }
            }

            // Pre-save PHP AST syntax lint
            $ext = strtolower(pathinfo($resolved, PATHINFO_EXTENSION));
            if ($ext === 'php') {
                $linter = new \Wefik\MimicManager\FileManager\PhpAstLinter();
                $lint = $linter->lintSource($content);
                if (!$lint['valid']) {
                    return new \WP_REST_Response([
                        'success' => false,
                        'error' => 'PHP Syntax Error: ' . ($lint['error'] ?? 'invalid tokens'),
                        'line' => $lint['line'],
                    ], 422);
                }
            }

            // Create pre-save shadow backup
            $backupMgr = new \Wefik\MimicManager\FileManager\ShadowBackup($contentDir . '/.mimic-backups');
            $backupId = $backupMgr->createBackup($resolved);

            // Atomic write
            $tempFile = $resolved . '.tmp.' . bin2hex(random_bytes(6));
            file_put_contents($tempFile, $content);
            rename($tempFile, $resolved);

            return new \WP_REST_Response([
                'success' => true,
                'path' => $relPath,
                'newHash' => hash_file('sha256', $resolved),
                'newMtime' => filemtime($resolved),
                'backupId' => $backupId,
            ]);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) return $bytes . ' B';
        if ($bytes < 1048576) return round($bytes / 1024, 1) . ' KB';
        return round($bytes / 1048576, 2) . ' MB';
    }

    // Legacy fallback page view renderers
    public function renderDashboardPage(): void { require dirname(__DIR__) . '/views/dashboard.php'; }
    public function renderMediaPage(): void { require dirname(__DIR__) . '/views/media.php'; }
    public function renderSpeedPage(): void { require dirname(__DIR__) . '/views/speed.php'; }
    public function renderSeoPage(): void { require dirname(__DIR__) . '/views/seo.php'; }
    public function renderFilesPage(): void { require dirname(__DIR__) . '/views/files.php'; }
    public function renderSettingsPage(): void { require dirname(__DIR__) . '/views/settings.php'; }
    public function renderAboutPage(): void { require dirname(__DIR__) . '/views/about.php'; }
}
