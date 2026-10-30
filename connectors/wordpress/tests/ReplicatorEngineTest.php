<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager\Tests;

use PHPUnit\Framework\TestCase;
use Wefik\MimicManager\Replicator\ReplicatorEngine;
use RuntimeException;
use InvalidArgumentException;

class ReplicatorEngineTest extends TestCase
{
    private ReplicatorEngine $engine;
    private string $fixturesDir;

    protected function setUp(): void
    {
        $this->engine = new ReplicatorEngine();
        $this->fixturesDir = dirname(__DIR__, 3) . '/test/fixtures/replicator';
    }

    public function testCompilesAllTwentyFixturesWithoutCrashing(): void
    {
        $fixtureFiles = glob($this->fixturesDir . '/*.html');
        $this->assertNotEmpty($fixtureFiles, 'Fixtures directory must contain HTML test files');
        $this->assertCount(20, $fixtureFiles, 'Must contain exactly 20 replicator test fixtures');

        $totalFidelity = 0;
        $scores = [];

        foreach ($fixtureFiles as $filePath) {
            $baseName = basename($filePath);
            $rawHtml = file_get_contents($filePath);
            $this->assertNotEmpty($rawHtml, "Fixture {$baseName} should not be empty");

            $result = $this->engine->extract(['rawHtml' => $rawHtml]);

            $this->assertTrue($result['success'], "Fixture {$baseName} extraction failed");
            $this->assertNotEmpty($result['gutenbergMarkup'], "Fixture {$baseName} produced empty block markup");
            $this->assertStringContainsString('<!-- wp:', $result['gutenbergMarkup'], "Fixture {$baseName} missing WP block comment");

            $fidelity = $result['fidelity']['score'];
            $this->assertGreaterThanOrEqual(70, $fidelity, "Fixture {$baseName} fidelity below 70%");
            $scores[$baseName] = $fidelity;
            $totalFidelity += $fidelity;
        }

        $averageFidelity = $totalFidelity / count($fixtureFiles);
        $this->assertGreaterThanOrEqual(85.0, $averageFidelity, "Average fixture fidelity must be >= 85%");
    }

    public function testBlocksHostileScriptsIframesAndEventHandlers(): void
    {
        $hostilePath = $this->fixturesDir . '/19-hostile-page-scripts-redirects.html';
        $rawHtml = file_get_contents($hostilePath);

        $result = $this->engine->extract(['rawHtml' => $rawHtml]);

        $this->assertTrue($result['success']);
        $markup = $result['gutenbergMarkup'];
        $scoped = $result['scopedHtml'];

        // Assert scripts, iframes, on* handlers and javascript: URLs are stripped
        $this->assertStringNotContainsString('<script', $markup);
        $this->assertStringNotContainsString('<script', $scoped);
        $this->assertStringNotContainsString('iframe', $markup);
        $this->assertStringNotContainsString('iframe', $scoped);
        $this->assertStringNotContainsString('onclick', $markup);
        $this->assertStringNotContainsString('onclick', $scoped);
        $this->assertStringNotContainsString('onload', $markup);
        $this->assertStringNotContainsString('onload', $scoped);
        $this->assertStringNotContainsString('onmouseover', $markup);
        $this->assertStringNotContainsString('onmouseover', $scoped);
        $this->assertStringNotContainsString('javascript:', $markup);
        $this->assertStringNotContainsString('javascript:', $scoped);

        // Assert legitimate content is preserved
        $this->assertStringContainsString('Clean Heading Title', $markup);
    }

    public function testSsrfGuardBlocksPrivateAndInternalIps(): void
    {
        $blockedUrls = [
            'http://localhost/admin',
            'http://127.0.0.1:8080/secret',
            'http://169.254.169.254/latest/meta-data',
            'http://10.0.0.5/internal',
            'http://192.168.1.1/router',
            'http://172.16.0.1/intranet',
            'file:///etc/passwd',
            'ftp://example.com/file',
        ];

        foreach ($blockedUrls as $url) {
            $threw = false;
            try {
                $this->engine->assertSsrfSafe($url);
            } catch (RuntimeException | InvalidArgumentException $e) {
                $threw = true;
            }
            $this->assertTrue($threw, "SSRF Guard failed to block malicious URL: {$url}");
        }
    }

    public function testReplicatorStatusReportsModeAAndModeBDetails(): void
    {
        $status = ReplicatorEngine::getStatus();

        $this->assertArrayHasKey('modeA', $status);
        $this->assertArrayHasKey('modeB', $status);
        $this->assertTrue($status['modeA']['available']);
        $this->assertStringContainsString('85%+', $status['modeA']['targetFidelity']);
        $this->assertArrayHasKey('activeMode', $status);
    }
}
