<?php
declare(strict_types=1);

namespace {
    // Global WordPress mocks for tests if not already declared
    if (!function_exists('current_user_can')) {
        function current_user_can($cap) {
            return true;
        }
    }
    if (!function_exists('add_menu_page')) {
        function add_menu_page($page_title, $menu_title, $capability, $menu_slug, $function = '', $icon_url = '', $position = null) {
            $GLOBALS['menu'][$menu_slug] = [$page_title, $menu_title, $capability, $menu_slug, $function, $icon_url, $position];
            return "toplevel_page_{$menu_slug}";
        }
    }
    if (!function_exists('add_submenu_page')) {
        function add_submenu_page($parent_slug, $page_title, $menu_title, $capability, $menu_slug, $function = '', $position = null) {
            $GLOBALS['submenu'][$parent_slug][] = [$page_title, $menu_title, $capability, $menu_slug, $function, $position];
            return "mimic-manager_page_{$menu_slug}";
        }
    }
    if (!function_exists('add_action')) {
        function add_action($hook, $callback, $priority = 10, $accepted_args = 1) {
            return true;
        }
    }
    if (!function_exists('__')) {
        function __($text, $domain = 'default') {
            return $text;
        }
    }
    if (!function_exists('esc_html__')) {
        function esc_html__($text, $domain = 'default') {
            return $text;
        }
    }
    if (!function_exists('esc_url')) {
        function esc_url($url) {
            return $url;
        }
    }
    if (!function_exists('admin_url')) {
        function admin_url($path = '') {
            return 'http://example.com/wp-admin/' . ltrim($path, '/');
        }
    }
    if (!function_exists('plugin_basename')) {
        function plugin_basename($file) {
            return basename($file);
        }
    }
    if (!function_exists('add_filter')) {
        function add_filter($hook, $callback, $priority = 10, $accepted_args = 1) {
            return true;
        }
    }
}

namespace Wefik\MimicManager\Tests {

    require_once dirname(__DIR__) . '/includes/Brand.php';

    use PHPUnit\Framework\TestCase;
    use Wefik\MimicManager\Plugin;
    use Wefik\MimicManager\Brand;

    /**
     * Reproduction Tests for Addendum L (PLUGIN-REPAIR)
     * Proves root causes of owner reports before fixing.
     */
    class PluginRepairReproTest extends TestCase
    {
        protected function setUp(): void
        {
            parent::setUp();
            $GLOBALS['submenu'] = [];
            $GLOBALS['menu'] = [];
        }

        /**
         * Report 1 / D-0005: Menu must register all submenus natively in WordPress.
         */
        public function testSubmenusAreRegisteredForMimicManager(): void
        {
            $plugin = Plugin::getInstance();
            $plugin->registerAdminMenus();

            // In WordPress core, submenus are keyed under $submenu[$parent_slug]
            $submenus = $GLOBALS['submenu']['mimic-manager'] ?? [];

            // Currently, registerAdminMenus() registers 0 submenus!
            $this->assertNotEmpty($submenus, 'Expected native WP submenus to be registered under mimic-manager');
            $this->assertGreaterThanOrEqual(7, count($submenus), 'Expected at least 7 submenus: Dashboard, Media, Speed, SEO, Files, Sites, Settings');
        }

        /**
         * Report 1 / D-0005: Plugin action links (Settings, Docs, Support) must be hooked.
         */
        public function testPluginActionLinksAreRegistered(): void
        {
            $plugin = Plugin::getInstance();
            $this->assertTrue(method_exists($plugin, 'addPluginActionLinks'), 'Expected addPluginActionLinks method on Plugin');
            $links = $plugin->addPluginActionLinks([]);
            $this->assertNotEmpty($links, 'Expected action links on plugins.php');
        }

        /**
         * Report 3 / D-0007: Pairing code generation & encryption in WordPress connector.
         */
        public function testPairingCodeAndBackendHandshakeExists(): void
        {
            $this->assertTrue(
                method_exists(Plugin::class, 'restInitPairing') || method_exists(Plugin::class, 'restGeneratePairingCode'),
                'Expected REST endpoint for generating 6-digit pairing code in plugin'
            );
        }
    }
}
