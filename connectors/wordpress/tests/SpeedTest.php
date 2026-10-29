<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager\Tests;

use PHPUnit\Framework\TestCase;
use Wefik\MimicManager\Speed\FixEngine;

class SpeedTest extends TestCase
{
    private FixEngine $engine;

    protected function setUp(): void
    {
        $this->engine = new FixEngine();
    }

    public function testTierClassification(): void
    {
        $this->assertSame(FixEngine::TIER_SAFE, $this->engine->getFixTier('FIX-PERF-001'));
        $this->assertSame(FixEngine::TIER_SAFE, $this->engine->getFixTier('FIX-PERF-002'));
        $this->assertSame(FixEngine::TIER_SAFE, $this->engine->getFixTier('FIX-PERF-003'));
        $this->assertSame(FixEngine::TIER_MODERATE, $this->engine->getFixTier('FIX-PERF-004'));
        $this->assertSame(FixEngine::TIER_MODERATE, $this->engine->getFixTier('FIX-PERF-005'));
        $this->assertSame(FixEngine::TIER_GUIDED, $this->engine->getFixTier('FIX-PERF-006'));
    }

    public function testDnsPreconnect(): void
    {
        $this->engine->enableFix('FIX-PERF-001');
        $html = '<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>';
        $optimized = $this->engine->optimizeHtml($html);

        $this->assertStringContainsString('<!-- Mimic Manager DNS Preconnect -->', $optimized);
        $this->assertStringContainsString('<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>', $optimized);
        $this->assertStringContainsString('<link rel="dns-prefetch" href="https://fonts.gstatic.com">', $optimized);
    }

    public function testMissingImageDimensions(): void
    {
        $this->engine->enableFix('FIX-PERF-002');
        $html = '<p><img src="hero.jpg" alt="Hero"></p><p><img src="thumb.jpg" width="100" height="100"></p>';
        $optimized = $this->engine->optimizeHtml($html);

        // Hero missing dimensions should receive width, height, and aspect-ratio reservation
        $this->assertStringContainsString('width="800" height="600"', $optimized);
        // Thumb already having dimensions should remain unaltered
        $this->assertStringContainsString('<img src="thumb.jpg" width="100" height="100">', $optimized);
    }

    public function testFontDisplaySwap(): void
    {
        $this->engine->enableFix('FIX-PERF-003');
        $html = '<html><head>'
            . '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700">'
            . '<style>@font-face { font-family: "Custom"; src: url("custom.woff2"); }</style>'
            . '</head></html>';

        $optimized = $this->engine->optimizeHtml($html);

        $this->assertStringContainsString('display=swap', $optimized);
        $this->assertStringContainsString('font-display: swap;', $optimized);
    }

    public function testScriptDeferralWithExclusions(): void
    {
        $this->engine->enableFix('FIX-PERF-004');
        $html = '<html><head>'
            . '<script src="/wp-includes/js/jquery/jquery.min.js"></script>'
            . '<script src="/wp-content/themes/custom/main.js"></script>'
            . '<script src="/wp-content/plugins/tracker.js" async></script>'
            . '</head></html>';

        $optimized = $this->engine->optimizeHtml($html);

        // jQuery must NOT be deferred
        $this->assertStringContainsString('<script src="/wp-includes/js/jquery/jquery.min.js"></script>', $optimized);
        // Main theme script must receive defer
        $this->assertStringContainsString('<script src="/wp-content/themes/custom/main.js" defer></script>', $optimized);
        // Async script must remain async
        $this->assertStringContainsString('<script src="/wp-content/plugins/tracker.js" async></script>', $optimized);
    }

    public function testLazyLoadIframes(): void
    {
        $this->engine->enableFix('FIX-PERF-005');
        $html = '<div><iframe src="https://www.youtube.com/embed/xyz"></iframe><iframe src="map.html" loading="eager"></iframe></div>';
        $optimized = $this->engine->optimizeHtml($html);

        $this->assertStringContainsString('<iframe src="https://www.youtube.com/embed/xyz" loading="lazy">', $optimized);
        $this->assertStringContainsString('<iframe src="map.html" loading="eager">', $optimized);
    }

    public function testCriticalCssInlining(): void
    {
        $this->engine->enableFix('FIX-PERF-006');
        $this->engine->setOption('critical_css', 'body{background:#000;color:#fff;}');

        $html = '<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>';
        $optimized = $this->engine->optimizeHtml($html);

        $this->assertStringContainsString('<style id="mm-critical-css">body{background:#000;color:#fff;}</style>', $optimized);
    }

    public function testRollbackAndAuditLog(): void
    {
        $this->engine->enableFix('FIX-PERF-004');
        $this->assertTrue($this->engine->isFixEnabled('FIX-PERF-004'));

        $this->engine->rollback('FIX-PERF-004');
        $this->assertFalse($this->engine->isFixEnabled('FIX-PERF-004'));

        $log = $this->engine->getAuditLog();
        $this->assertCount(2, $log);
        $this->assertSame('enabled', $log[0]['action']);
        $this->assertSame('auto_reverted', $log[1]['action']);
    }
}
