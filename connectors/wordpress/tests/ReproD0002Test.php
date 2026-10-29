<?php

declare(strict_types=1);

namespace OptiForge\Tests;

use PHPUnit\Framework\TestCase;
use OptiForge\FileManager\JailGuard;
use RuntimeException;

class ReproD0002Test extends TestCase
{
    private string $tempJail;
    private JailGuard $jailGuard;

    protected function setUp(): void
    {
        $this->tempJail = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'optiforge_repro2_' . uniqid();
        mkdir($this->tempJail, 0755, true);
        $this->jailGuard = new JailGuard($this->tempJail);
    }

    protected function tearDown(): void
    {
        @rmdir($this->tempJail);
    }

    public function testTrailingDotOnSensitiveFileMustBeBlocked(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Access denied');
        // A trailing dot should be stripped before blacklist checking
        $this->jailGuard->assertNotSensitive('wp-config.php.');
    }
}
