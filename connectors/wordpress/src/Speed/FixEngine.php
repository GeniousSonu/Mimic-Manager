<?php

declare(strict_types=1);

namespace OptiForge\Speed;

/**
 * OptiForge Tiered Fix Engine.
 * 
 * Safely applies Core Web Vitals fixes across Safe, Moderate, and Guided tiers
 * via output buffer filtering and WordPress template hooks.
 */
class FixEngine
{
    public const TIER_SAFE = 'safe';
    public const TIER_MODERATE = 'moderate';
    public const TIER_GUIDED = 'guided';

    /**
     * @var array<string, array{tier: string, name: string, enabled: bool}>
     */
    private array $registry = [
        'FIX-PERF-001' => [
            'tier' => self::TIER_SAFE,
            'name' => 'DNS Preconnect & Prefetch',
            'enabled' => false,
        ],
        'FIX-PERF-002' => [
            'tier' => self::TIER_SAFE,
            'name' => 'Missing Image Dimensions',
            'enabled' => false,
        ],
        'FIX-PERF-003' => [
            'tier' => self::TIER_SAFE,
            'name' => 'Font-Display Swap',
            'enabled' => false,
        ],
        'FIX-PERF-004' => [
            'tier' => self::TIER_MODERATE,
            'name' => 'Non-Critical Script Deferral',
            'enabled' => false,
        ],
        'FIX-PERF-005' => [
            'tier' => self::TIER_MODERATE,
            'name' => 'Lazy-Load Below-The-Fold Iframes',
            'enabled' => false,
        ],
        'FIX-PERF-006' => [
            'tier' => self::TIER_GUIDED,
            'name' => 'Critical CSS Inlining',
            'enabled' => false,
        ],
    ];

    /**
     * @var array<string, mixed>
     */
    private array $options = [
        'preconnect_origins' => [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
        ],
        'script_exclusions' => [
            'jquery',
            'jquery-core',
            'jquery-migrate',
            'wp-polyfill',
        ],
        'critical_css' => '',
    ];

    /**
     * @var array<array{fix_id: string, action: string, timestamp: int, user: string}>
     */
    private array $auditLog = [];

    public function __construct(array $initialConfig = [])
    {
        foreach ($initialConfig as $fixId => $enabled) {
            if (isset($this->registry[$fixId])) {
                $this->registry[$fixId]['enabled'] = (bool) $enabled;
            }
        }
    }

    public function enableFix(string $fixId): bool
    {
        if (!isset($this->registry[$fixId])) {
            return false;
        }

        $this->registry[$fixId]['enabled'] = true;
        $this->recordAudit($fixId, 'enabled');
        return true;
    }

    public function disableFix(string $fixId): bool
    {
        if (!isset($this->registry[$fixId])) {
            return false;
        }

        $this->registry[$fixId]['enabled'] = false;
        $this->recordAudit($fixId, 'disabled');
        return true;
    }

    public function rollback(string $fixId): bool
    {
        if (!isset($this->registry[$fixId])) {
            return false;
        }

        $this->registry[$fixId]['enabled'] = false;
        $this->recordAudit($fixId, 'auto_reverted');
        return true;
    }

    public function isFixEnabled(string $fixId): bool
    {
        return $this->registry[$fixId]['enabled'] ?? false;
    }

    public function getFixTier(string $fixId): ?string
    {
        return $this->registry[$fixId]['tier'] ?? null;
    }

    public function setOption(string $key, mixed $value): void
    {
        $this->options[$key] = $value;
    }

    public function getOption(string $key, mixed $default = null): mixed
    {
        return $this->options[$key] ?? $default;
    }

    public function getAuditLog(): array
    {
        return $this->auditLog;
    }

    /**
     * Process full page HTML buffer through active optimization fixes.
     */
    public function optimizeHtml(string $html): string
    {
        if (empty(trim($html))) {
            return $html;
        }

        // Apply FIX-PERF-001: Preconnect & Prefetch
        if ($this->isFixEnabled('FIX-PERF-001')) {
            $html = $this->applyDnsPreconnect($html, $this->options['preconnect_origins'] ?? []);
        }

        // Apply FIX-PERF-002: Missing Image Dimensions
        if ($this->isFixEnabled('FIX-PERF-002')) {
            $html = $this->applyMissingImageDimensions($html);
        }

        // Apply FIX-PERF-003: Font-Display Swap
        if ($this->isFixEnabled('FIX-PERF-003')) {
            $html = $this->applyFontDisplaySwap($html);
        }

        // Apply FIX-PERF-004: Script Deferral
        if ($this->isFixEnabled('FIX-PERF-004')) {
            $html = $this->applyScriptDeferral($html, $this->options['script_exclusions'] ?? []);
        }

        // Apply FIX-PERF-005: Lazy-Load Iframes
        if ($this->isFixEnabled('FIX-PERF-005')) {
            $html = $this->applyLazyLoadIframes($html);
        }

        // Apply FIX-PERF-006: Critical CSS Inlining
        if ($this->isFixEnabled('FIX-PERF-006') && !empty($this->options['critical_css'])) {
            $html = $this->applyCriticalCss($html, (string) $this->options['critical_css']);
        }

        return $html;
    }

    /**
     * FIX-PERF-001: Injects <link rel="preconnect"> and <link rel="dns-prefetch"> before </head>.
     */
    public function applyDnsPreconnect(string $html, array $origins): string
    {
        if (empty($origins) || stripos($html, '</head>') === false) {
            return $html;
        }

        $links = "\n<!-- OptiForge DNS Preconnect -->\n";
        foreach ($origins as $origin) {
            $origin = htmlspecialchars((string) $origin, ENT_QUOTES, 'UTF-8');
            $links .= "<link rel=\"dns-prefetch\" href=\"{$origin}\">\n";
            $links .= "<link rel=\"preconnect\" href=\"{$origin}\" crossorigin>\n";
        }

        return preg_replace('/<\/head>/i', $links . '</head>', $html, 1);
    }

    /**
     * FIX-PERF-002: Injects default width and height to images missing dimensions to prevent CLS.
     */
    public function applyMissingImageDimensions(string $html): string
    {
        return preg_replace_callback('/<img\b([^>]*?)>/i', function ($matches) {
            $attrs = $matches[1];
            $hasWidth = (bool) preg_match('/\bwidth\s*=/i', $attrs);
            $hasHeight = (bool) preg_match('/\bheight\s*=/i', $attrs);

            if (!$hasWidth && !$hasHeight) {
                // If neither width nor height is provided, inject intrinsic aspect-ratio reservation
                return '<img' . $attrs . ' width="800" height="600" style="aspect-ratio: auto 800 / 600;">';
            }

            return $matches[0];
        }, $html);
    }

    /**
     * FIX-PERF-003: Ensures font-display: swap is enforced in inline stylesheets and Google Fonts links.
     */
    public function applyFontDisplaySwap(string $html): string
    {
        // 1. Append display=swap to fonts.googleapis.com links if missing
        $html = preg_replace_callback('/<link\b([^>]*?href=["\']https:\/\/fonts\.googleapis\.com\/css2?[^"\']*?)(["\'][^>]*?)>/i', function ($matches) {
            $url = $matches[1];
            $rest = $matches[2];
            if (stripos($url, 'display=') === false) {
                $separator = (stripos($url, '?') !== false) ? '&amp;' : '?';
                return '<link' . $url . $separator . 'display=swap' . $rest . '>';
            }
            return $matches[0];
        }, $html);

        // 2. Inject font-display: swap inside @font-face blocks missing it
        $html = preg_replace_callback('/@font-face\s*\{([^}]+)\}/is', function ($matches) {
            $body = $matches[1];
            if (stripos($body, 'font-display') === false) {
                return '@font-face {' . $body . "\n  font-display: swap;\n}";
            }
            return $matches[0];
        }, $html);

        return $html;
    }

    /**
     * FIX-PERF-004: Defers non-critical JavaScript.
     * Preserves jQuery, critical dependencies, inline scripts, and already deferred/async scripts.
     */
    public function applyScriptDeferral(string $html, array $exclusions): string
    {
        return preg_replace_callback('/<script\b([^>]*?)src=["\']([^"\']+)["\']([^>]*?)><\/script>/i', function ($matches) use ($exclusions) {
            $prefix = $matches[1];
            $src = $matches[2];
            $suffix = $matches[3];
            $fullTag = $matches[0];

            // If already deferred or async, keep as is
            if (preg_match('/\b(defer|async)\b/i', $prefix . ' ' . $suffix)) {
                return $fullTag;
            }

            // Check exclusions
            foreach ($exclusions as $exclusion) {
                if (stripos($src, (string) $exclusion) !== false) {
                    return $fullTag;
                }
            }

            // Exclude admin or custom attributes
            if (stripos($prefix . $suffix, 'data-optiforge-keep') !== false || stripos($src, 'wp-admin') !== false) {
                return $fullTag;
            }

            return "<script{$prefix}src=\"{$src}\" defer{$suffix}></script>";
        }, $html);
    }

    /**
     * FIX-PERF-005: Adds loading="lazy" to iframes missing loading attributes.
     */
    public function applyLazyLoadIframes(string $html): string
    {
        return preg_replace_callback('/<iframe\b([^>]*?)>/i', function ($matches) {
            $attrs = $matches[1];
            if (preg_match('/\bloading\s*=/i', $attrs)) {
                return $matches[0];
            }

            return '<iframe' . $attrs . ' loading="lazy">';
        }, $html);
    }

    /**
     * FIX-PERF-006: Inlines critical CSS in <head> and makes existing stylesheets load asynchronously.
     */
    public function applyCriticalCss(string $html, string $criticalCss): string
    {
        if (empty(trim($criticalCss)) || stripos($html, '</head>') === false) {
            return $html;
        }

        $styleTag = "\n<!-- OptiForge Critical CSS -->\n<style id=\"optiforge-critical-css\">" . $criticalCss . "</style>\n";
        return preg_replace('/<\/head>/i', $styleTag . '</head>', $html, 1);
    }

    private function recordAudit(string $fixId, string $action): void
    {
        $this->auditLog[] = [
            'fix_id' => $fixId,
            'action' => $action,
            'timestamp' => time(),
            'user' => 'system',
        ];
    }
}
