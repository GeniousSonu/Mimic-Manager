<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager\Tests;

use PHPUnit\Framework\TestCase;
use Wefik\MimicManager\Media\PictureRewriter;
use Wefik\MimicManager\Media\AttachmentHook;

final class MediaTest extends TestCase {
    private PictureRewriter $rewriter;
    private AttachmentHook $hook;

    protected function setUp(): void {
        parent::setUp();
        $this->rewriter = new PictureRewriter();
        $this->hook = new AttachmentHook();
    }

    public function testRewritesJpegToPictureTagWithAvifAndWebp(): void {
        $html = '<div class="banner"><img src="https://example.com/wp-content/uploads/hero.jpg" alt="Hero Banner" class="w-full" /></div>';
        $rewritten = $this->rewriter->rewriteContent($html);

        $this->assertStringContainsString('<picture>', $rewritten);
        $this->assertStringContainsString('<source srcset="https://example.com/wp-content/uploads/hero.avif" type="image/avif">', $rewritten);
        $this->assertStringContainsString('<source srcset="https://example.com/wp-content/uploads/hero.webp" type="image/webp">', $rewritten);
        $this->assertStringContainsString('src="https://example.com/wp-content/uploads/hero.jpg"', $rewritten);
        $this->assertStringContainsString('alt="Hero Banner"', $rewritten);
        $this->assertStringContainsString('loading="lazy"', $rewritten);
    }

    public function testIgnoresNonImageHtml(): void {
        $html = '<p>Just normal text without any media.</p>';
        $this->assertSame($html, $this->rewriter->rewriteContent($html));
    }

    public function testAttachmentHookRegistersPendingOptimization(): void {
        $metadata = [
            'file' => '2026/10/banner.jpg',
            'mime_type' => 'image/jpeg',
            'width' => 1920,
            'height' => 1080
        ];

        $updated = $this->hook->handleAttachmentMetadata($metadata, 42);

        $this->assertSame('pending', $updated['mimic_manager_status']);
        $this->assertSame('2026/10/banner.jpg', $updated['mimic_manager_original']);
    }

    public function testAttachmentHookIgnoresUnsupportedMime(): void {
        $metadata = [
            'file' => '2026/10/document.pdf',
            'mime_type' => 'application/pdf'
        ];

        $updated = $this->hook->handleAttachmentMetadata($metadata, 43);
        $this->assertArrayNotHasKey('mimic_manager_status', $updated);
    }
}
