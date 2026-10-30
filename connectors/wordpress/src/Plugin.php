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
        if (!function_exists('add_action')) {
            return;
        }

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
            'mimic-manager-settings' => '#/settings',
            'mimic-manager-about' => '#/about',
        ];

        if (isset($legacyRoutes[$page]) && function_exists('wp_safe_redirect') && function_exists('admin_url')) {
            wp_safe_redirect(admin_url('admin.php?page=mimic-manager' . $legacyRoutes[$page]), 301);
            exit;
        }
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

        $mainHook = add_menu_page(
            Brand::NAME,
            Brand::NAME,
            'manage_options',
            'mimic-manager',
            [$this, 'renderSpaShellPage'],
            $iconSvg,
            58
        );

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

        register_rest_route(Brand::REST_NAMESPACE, '/files/list', [
            'methods' => 'GET',
            'callback' => [$this, 'restListFiles'],
            'permission_callback' => fn() => current_user_can('manage_options'),
        ]);

        register_rest_route(Brand::REST_NAMESPACE, '/files/lint', [
            'methods' => 'POST',
            'callback' => [$this, 'restLintFile'],
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
