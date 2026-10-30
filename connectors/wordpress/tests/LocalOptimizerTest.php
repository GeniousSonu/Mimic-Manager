<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager\Tests;

use PHPUnit\Framework\TestCase;
use Wefik\MimicManager\Media\LocalOptimizer;

final class LocalOptimizerTest extends TestCase
{
    private string $tempDir;

    protected function setUp(): void
    {
        $this->tempDir = sys_get_temp_dir() . '/mm_test_' . uniqid();
        mkdir($this->tempDir);
    }

    protected function tearDown(): void
    {
        if (is_dir($this->tempDir)) {
            array_map('unlink', glob("{$this->tempDir}/*") ?: []);
            rmdir($this->tempDir);
        }
    }

    public function testGetEngineStatusReturnsValidShape(): void
    {
        $status = LocalOptimizer::getEngineStatus();
        $this->assertIsArray($status);
        $this->assertArrayHasKey('supported', $status);
        $this->assertArrayHasKey('engine', $status);
        $this->assertContains($status['engine'], ['imagick', 'gd', 'none']);
    }

    public function testOptimizeLocallyFailsGracefullyOnMissingFile(): void
    {
        $optimizer = new LocalOptimizer();
        $res = $optimizer->optimizeLocally($this->tempDir . '/non_existent.jpg');
        $this->assertFalse($res['success']);
        $this->assertNotEmpty($res['error']);
    }

    public function testOptimizeLocallyConvertsRealImageToWebp(): void
    {
        $status = LocalOptimizer::getEngineStatus();
        if (!$status['supported']) {
            $this->markTestSkipped('Neither GD nor Imagick with WebP support available.');
        }

        // Create a test truecolor JPEG image
        $testJpg = $this->tempDir . '/test.jpg';
        $img = imagecreatetruecolor(100, 100);
        $bg = imagecolorallocate($img, 124, 108, 255);
        imagefilledrectangle($img, 0, 0, 100, 100, $bg);
        imagejpeg($img, $testJpg, 90);
        imagedestroy($img);

        $this->assertFileExists($testJpg);

        $optimizer = new LocalOptimizer();
        $res = $optimizer->optimizeLocally($testJpg);

        $this->assertTrue($res['success']);
        $this->assertFileExists($res['webpPath']);
        $this->assertGreaterThan(0, $res['optimizedSize']);
        $this->assertStringEndsWith('.webp', $res['webpPath']);
    }
}
