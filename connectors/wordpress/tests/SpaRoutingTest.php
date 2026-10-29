<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager\Tests;

use PHPUnit\Framework\TestCase;
use Wefik\MimicManager\Plugin;
use Wefik\MimicManager\FileManager\PhpAstLinter;
use Wefik\MimicManager\FileManager\JailGuard;

class SpaRoutingTest extends TestCase
{
    private string $tempJail;

    protected function setUp(): void
    {
        $this->tempJail = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'mm_spa_test_' . uniqid();
        mkdir($this->tempJail, 0755, true);
        mkdir($this->tempJail . DIRECTORY_SEPARATOR . 'themes', 0755, true);
        file_put_contents($this->tempJail . DIRECTORY_SEPARATOR . 'themes' . DIRECTORY_SEPARATOR . 'index.php', '<?php echo "hello";');
    }

    protected function tearDown(): void
    {
        $this->deleteDir($this->tempJail);
    }

    private function deleteDir(string $dir): void
    {
        if (!is_dir($dir)) return;
        $items = array_diff(scandir($dir) ?: [], ['.', '..']);
        foreach ($items as $item) {
            $p = $dir . DIRECTORY_SEPARATOR . $item;
            is_dir($p) ? $this->deleteDir($p) : @unlink($p);
        }
        @rmdir($dir);
    }

    public function testBodyClassFilterAddsFullbleedOnMimicScreen(): void
    {
        $plugin = Plugin::getInstance();
        
        // Mock screen
        $GLOBALS['current_screen'] = (object) ['id' => 'toplevel_page_mimic-manager'];
        $classes = $plugin->filterAdminBodyClass('wp-admin');
        $this->assertStringContainsString('mm-fullbleed', $classes);

        // Non-mimic screen should not add fullbleed
        $GLOBALS['current_screen'] = (object) ['id' => 'edit-post'];
        $normalClasses = $plugin->filterAdminBodyClass('wp-admin');
        $this->assertStringNotContainsString('mm-fullbleed', $normalClasses);
    }

    public function testJailGuardBlocksTraversalAttempts(): void
    {
        $guard = new JailGuard($this->tempJail);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Directory traversal (..) detected in path');
        $guard->resolveSecurePath('../../etc/passwd');
    }

    public function testPhpAstLinterValidatesCorrectCode(): void
    {
        $linter = new PhpAstLinter();
        $res = $linter->lintSource('<?php echo "Valid code";');
        $this->assertTrue($res['valid']);
        $this->assertNull($res['error']);
    }

    public function testPhpAstLinterDetectsSyntaxErrorsWithLine(): void
    {
        $linter = new PhpAstLinter();
        $badCode = "<?php\necho 'broken'\nthis is not valid php;";
        $res = $linter->lintSource($badCode);
        $this->assertFalse($res['valid']);
        $this->assertNotNull($res['error']);
    }
}
