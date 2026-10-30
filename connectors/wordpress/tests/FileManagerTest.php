<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager\Tests;

use PHPUnit\Framework\TestCase;
use Wefik\MimicManager\FileManager\JailGuard;
use Wefik\MimicManager\FileManager\PhpAstLinter;
use Wefik\MimicManager\FileManager\ShadowBackup;
use RuntimeException;

class FileManagerTest extends TestCase
{
    private string $tempJail;
    private JailGuard $jailGuard;
    private PhpAstLinter $linter;

    protected function setUp(): void
    {
        $this->tempJail = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'mimic_manager_test_jail_' . uniqid();
        mkdir($this->tempJail, 0755, true);
        mkdir($this->tempJail . DIRECTORY_SEPARATOR . 'themes', 0755, true);
        mkdir($this->tempJail . DIRECTORY_SEPARATOR . 'plugins', 0755, true);

        // Put a sample file in themes
        file_put_contents($this->tempJail . DIRECTORY_SEPARATOR . 'themes' . DIRECTORY_SEPARATOR . 'functions.php', '<?php echo "ok";');

        $this->jailGuard = new JailGuard($this->tempJail);
        $this->linter = new PhpAstLinter();
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->tempJail);
    }

    private function removeDirectory(string $dir): void
    {
        if (!is_dir($dir)) return;
        $files = array_diff(scandir($dir) ?: [], ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . DIRECTORY_SEPARATOR . $file;
            is_dir($path) ? $this->removeDirectory($path) : @unlink($path);
        }
        @rmdir($dir);
    }

    public function testAllowsSafePathInsideJail(): void
    {
        $resolved = $this->jailGuard->resolveSecurePath('themes/functions.php');
        $this->assertFileExists($resolved);
        $this->assertStringStartsWith($this->tempJail, $resolved);
    }

    public function testBlocksSimpleTraversal(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Directory traversal (..) detected in path');
        $this->jailGuard->resolveSecurePath('../wp-config.php');
    }

    public function testBlocksEncodedTraversal(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Directory traversal (..) detected in path');
        $this->jailGuard->resolveSecurePath('%2e%2e%2fwp-config.php');
    }

    public function testBlocksNullByteInjection(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Null byte injection detected in path');
        $this->jailGuard->resolveSecurePath("themes/functions.php\0.jpg");
    }

    public function testBlocksSensitiveFiles(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Access denied');
        $this->jailGuard->resolveSecurePath('themes/.env');
    }

    public function testBlocksSensitiveSqlExtension(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Access denied: extension .sql is restricted');
        $this->jailGuard->resolveSecurePath('themes/database_dump.sql');
    }

    public function testPhpLinterPassesValidPhp(): void
    {
        $code = '<?php' . "\n" . 'function test() { return 42; }';
        $result = $this->linter->lintSource($code);

        $this->assertTrue($result['valid']);
        $this->assertNull($result['error']);
    }

    public function testPhpLinterCatchesSyntaxError(): void
    {
        $brokenCode = '<?php' . "\n" . 'function broken( { echo "oops"; }';
        $result = $this->linter->lintSource($brokenCode);

        $this->assertFalse($result['valid']);
        $this->assertNotNull($result['error']);
    }

    public function testShadowBackupAndRestore(): void
    {
        $backupDir = $this->tempJail . DIRECTORY_SEPARATOR . '.mm-backups';
        $backupManager = new ShadowBackup($backupDir);

        $filePath = $this->tempJail . DIRECTORY_SEPARATOR . 'themes' . DIRECTORY_SEPARATOR . 'functions.php';
        $originalContent = file_get_contents($filePath);

        // 1. Create backup
        $backupPath = $backupManager->createBackup($filePath);
        $this->assertNotNull($backupPath);
        $this->assertFileExists($backupPath);

        // 2. Mutate original file
        file_put_contents($filePath, '<?php echo "MODIFIED";');
        $this->assertSame('<?php echo "MODIFIED";', file_get_contents($filePath));

        // 3. Restore backup
        $restored = $backupManager->restoreBackup($backupPath, $filePath);
        $this->assertTrue($restored);
        $this->assertSame($originalContent, file_get_contents($filePath));

        // 4. List backups
        $list = $backupManager->listBackups();
        $this->assertCount(1, $list);
    }
}
