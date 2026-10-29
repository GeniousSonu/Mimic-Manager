<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager\Tests;

use PHPUnit\Framework\TestCase;
use Wefik\MimicManager\Speed\FixEngine;

class ReproD0003Test extends TestCase
{
    public function testDoesNotInjectAttributesWhenInlineStyleDimensionsExist(): void
    {
        $engine = new FixEngine(['FIX-PERF-002' => true]);
        $html = '<img src="logo.png" style="width: 250px; height: 50px;">';
        $optimized = $engine->optimizeHtml($html);

        // Should NOT inject width="800" height="600" if inline style specifies dimensions
        $this->assertStringNotContainsString('width="800"', $optimized);
    }
}
