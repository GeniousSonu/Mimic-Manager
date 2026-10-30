<?php
/**
 * Plugin Name: Mimic Manager
 * Plugin URI: https://www.wefik.in
 * Description: Free and Secure platform for image optimization, PageSpeed and SEO fixes, UI section replication, and visual file management, with a WordPress connector and a PWA command center. Created by SK Sahinur Islam. A Wefik project.
 * Version: 1.0.0-rc.1
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Author: SK Sahinur Islam
 * Author URI: https://www.genioussonu.me
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: mimic-manager
 * Domain Path: /languages
 */

/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager;

defined('ABSPATH') || exit;

// Autoloader fallback
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}
require_once __DIR__ . '/includes/Brand.php';

// Bootstrap plugin lifecycle
add_action('plugins_loaded', static function (): void {
    Plugin::getInstance();
});
