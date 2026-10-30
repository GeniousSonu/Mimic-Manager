<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager\Update;

use Wefik\MimicManager\Brand;

final class GitHubUpdater
{
    private const GITHUB_REPO = 'GeniousSonu/Mimic-Manager';
    private const TRANSIENT_KEY = 'mimic_manager_github_release_info';
    private const ETAG_KEY = 'mimic_manager_github_release_etag';
    private const CACHE_TTL = 43200; // 12 hours in seconds

    private string $pluginSlug;
    private string $pluginFile;

    public function __construct(string $pluginFile)
    {
        $this->pluginFile = $pluginFile;
        $this->pluginSlug = plugin_basename($pluginFile);
    }

    public static function register(string $pluginFile): ?self
    {
        if (defined('DISALLOW_FILE_MODS') && constant('DISALLOW_FILE_MODS')) {
            return null;
        }

        $instance = new self($pluginFile);
        $instance->bindHooks();
        return $instance;
    }

    public function bindHooks(): void
    {
        if (!function_exists('add_filter') || !function_exists('add_action')) {
            return;
        }

        add_filter('pre_set_site_transient_update_plugins', [$this, 'filterPluginUpdates']);
        add_filter('plugins_api', [$this, 'filterPluginsApi'], 10, 3);
        add_action('upgrader_process_complete', [$this, 'onUpgraderComplete'], 10, 2);
    }

    public function filterPluginUpdates(object $transient): object
    {
        if (empty($transient->checked)) {
            return $transient;
        }

        // Strict opt-in consent: fresh installs make ZERO outbound calls
        if (!get_option('mimic_manager_update_consent', false)) {
            return $transient;
        }

        $release = $this->fetchLatestRelease();
        if (!$release || empty($release['tag_name'])) {
            return $transient;
        }

        $remoteVersion = ltrim($release['tag_name'], 'v');
        if (version_compare(Brand::VERSION, $remoteVersion, '<')) {
            $asset = $this->findReleaseAsset($release);
            if ($asset && !empty($asset['browser_download_url'])) {
                $item = new \stdClass();
                $item->slug = Brand::SLUG;
                $item->plugin = $this->pluginSlug;
                $item->new_version = $remoteVersion;
                $item->url = $release['html_url'] ?? "https://github.com/" . self::GITHUB_REPO;
                $item->package = $asset['browser_download_url'];
                $item->tested = '6.7';
                $item->requires = '6.0';
                $item->requires_php = '8.0';

                $iconPath = plugins_url('assets/icon-20.svg', dirname(__FILE__, 2));
                $item->icons = [
                    'svg' => $iconPath,
                    '1x' => $iconPath,
                    '2x' => $iconPath,
                ];

                $transient->response[$this->pluginSlug] = $item;
            }
        }

        return $transient;
    }

    public function filterPluginsApi($result, string $action, object $args)
    {
        if ($action !== 'plugin_information' || !isset($args->slug) || $args->slug !== Brand::SLUG) {
            return $result;
        }

        $release = $this->fetchLatestRelease();
        if (!$release) {
            return $result;
        }

        $remoteVersion = ltrim($release['tag_name'] ?? Brand::VERSION, 'v');
        $asset = $this->findReleaseAsset($release);

        $info = new \stdClass();
        $info->name = Brand::NAME;
        $info->slug = Brand::SLUG;
        $info->version = $remoteVersion;
        $info->author = '<a href="' . esc_url(Brand::CREATOR_URL) . '">' . esc_html(Brand::CREATOR) . '</a>';
        $info->homepage = esc_url(Brand::OWNER_URL);
        $info->requires = '6.0';
        $info->tested = '6.7';
        $info->requires_php = '8.0';
        $info->download_link = $asset['browser_download_url'] ?? '';
        $info->sections = [
            'description' => esc_html__('High-performance image, PageSpeed, and SEO engine for WordPress.', 'mimic-manager'),
            'changelog' => nl2br(esc_html($release['body'] ?? 'No changelog notes available.')),
        ];

        return $info;
    }

    public function onUpgraderComplete(object $upgrader, array $options): void
    {
        if (isset($options['action'], $options['type']) && $options['action'] === 'update' && $options['type'] === 'plugin') {
            if (isset($options['plugins']) && in_array($this->pluginSlug, $options['plugins'], true)) {
                delete_transient(self::TRANSIENT_KEY);
                delete_transient(self::ETAG_KEY);
            }
        }
    }

    private function fetchLatestRelease(): ?array
    {
        $cached = get_transient(self::TRANSIENT_KEY);
        if (is_array($cached)) {
            return $cached;
        }

        $etag = (string) get_transient(self::ETAG_KEY);
        $url = 'https://api.github.com/repos/' . self::GITHUB_REPO . '/releases/latest';

        $args = [
            'timeout' => 4,
            'headers' => [
                'Accept' => 'application/vnd.github+json',
                'User-Agent' => Brand::USER_AGENT,
            ],
        ];

        if (!empty($etag)) {
            $args['headers']['If-None-Match'] = $etag;
        }

        $response = wp_remote_get($url, $args);
        if (is_wp_error($response)) {
            return null;
        }

        $statusCode = wp_remote_retrieve_response_code($response);
        if ($statusCode === 304 && is_array($cached)) {
            set_transient(self::TRANSIENT_KEY, $cached, self::CACHE_TTL);
            return $cached;
        }

        if ($statusCode !== 200) {
            return null;
        }

        $newEtag = wp_remote_retrieve_header($response, 'etag');
        if ($newEtag) {
            set_transient(self::ETAG_KEY, $newEtag, self::CACHE_TTL);
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        if (is_array($data) && !empty($data['tag_name'])) {
            set_transient(self::TRANSIENT_KEY, $data, self::CACHE_TTL);
            return $data;
        }

        return null;
    }

    private function findReleaseAsset(array $release): ?array
    {
        if (empty($release['assets']) || !is_array($release['assets'])) {
            return null;
        }

        // Prefer github-channel package if available, else standard zip
        foreach ($release['assets'] as $asset) {
            $name = $asset['name'] ?? '';
            if (str_ends_with($name, '-github.zip')) {
                return $asset;
            }
        }

        foreach ($release['assets'] as $asset) {
            $name = $asset['name'] ?? '';
            if ($name === 'mimic-manager.zip' || (str_starts_with($name, 'mimic-manager') && str_ends_with($name, '.zip'))) {
                return $asset;
            }
        }

        return null;
    }
}
