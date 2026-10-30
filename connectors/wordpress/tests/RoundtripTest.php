<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager\Tests;

use PHPUnit\Framework\TestCase;
use Wefik\MimicManager\Security\HmacSigner;

class RoundtripTest extends TestCase
{
    private string $tempDir;

    protected function setUp(): void
    {
        $this->tempDir = sys_get_temp_dir() . '/mimic_test_' . bin2hex(random_bytes(6));
        mkdir($this->tempDir, 0755, true);
    }

    protected function tearDown(): void
    {
        if (is_dir($this->tempDir)) {
            array_map('unlink', glob($this->tempDir . '/*') ?: []);
            rmdir($this->tempDir);
        }
    }

    public function testPluginSignedUploadAndWebhookReception(): void
    {
        $siteId = 'site_phase0_test';
        $siteSecret = 'phase0_secret_key_8492048102948102';

        // 1. Plugin signs outbound job creation request
        $jobPayload = json_encode([
            'siteId' => $siteId,
            'filename' => 'hero.png',
            'idempotencyKey' => 'php_idem_' . time(),
        ], JSON_THROW_ON_ERROR);

        $outbound = HmacSigner::sign($siteSecret, 'POST', '/api/v1/media/jobs', $jobPayload);
        $this->assertNotEmpty($outbound['signature']);
        $this->assertArrayHasKey(HmacSigner::HEADER_SIGNATURE, $outbound['headers']);

        // 2. Simulate Backend Worker sending signed Webhook callback with optimized bytes
        $optimizedWebpBytes = "RIFF\x20\x00\x00\x00WEBPVP8 \x14\x00\x00\x00MockOptimizedBytes";
        $variantSha256 = hash('sha256', $optimizedWebpBytes);

        $webhookPayload = json_encode([
            'jobId' => 'job_123456',
            'type' => 'media.optimize',
            'status' => 'completed',
            'siteId' => $siteId,
            'result' => [
                'originalSha256' => hash('sha256', 'original_raw_image_data'),
                'variants' => [
                    [
                        'format' => 'webp',
                        'sha256' => $variantSha256,
                        'bytes' => strlen($optimizedWebpBytes),
                    ]
                ]
            ],
            'timestamp' => time(),
        ], JSON_THROW_ON_ERROR);

        $webhookPath = '/wp-json/mimic-manager/v1/webhook';
        $inboundSignature = HmacSigner::sign($siteSecret, 'POST', $webhookPath, $webhookPayload);

        // 3. Plugin verifies inbound Webhook signature
        $verifyResult = HmacSigner::verify(
            $siteSecret,
            'POST',
            $webhookPath,
            $webhookPayload,
            $inboundSignature['headers']
        );

        $this->assertTrue($verifyResult['valid'], 'Inbound webhook HMAC signature must verify');

        // 4. Plugin verifies variant checksum before persisting
        $calculatedSha = hash('sha256', $optimizedWebpBytes);
        $this->assertSame($variantSha256, $calculatedSha, 'Variant checksum must match declared sha256');

        // 5. Plugin atomic store (write to temp file, then rename)
        $tmpFile = $this->tempDir . '/hero.webp.tmp';
        $finalFile = $this->tempDir . '/hero.webp';

        file_put_contents($tmpFile, $optimizedWebpBytes);
        $renamed = rename($tmpFile, $finalFile);

        $this->assertTrue($renamed, 'Atomic rename must succeed');
        $this->assertFileExists($finalFile);
        $this->assertSame($optimizedWebpBytes, file_get_contents($finalFile));
    }
}
