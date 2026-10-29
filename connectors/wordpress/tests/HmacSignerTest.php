<?php

declare(strict_types=1);

namespace MimicManager\Tests;

use PHPUnit\Framework\TestCase;
use MimicManager\Security\HmacSigner;

class HmacSignerTest extends TestCase
{
    private function getVectors(): array
    {
        $path = __DIR__ . '/../../../packages/types/src/hmac-vectors.json';
        $content = file_get_contents($path);
        $this->assertNotFalse($content, 'Failed to read hmac-vectors.json');
        return json_decode($content, true);
    }

    public function testCrossLanguageVectors(): void
    {
        $vectors = $this->getVectors();
        $this->assertNotEmpty($vectors);

        foreach ($vectors as $i => $v) {
            $bodyHash = HmacSigner::hashBody($v['body']);
            $this->assertSame($v['expectedBodySha256'], $bodyHash, "Vector $i: Body hash mismatch");

            $canonical = HmacSigner::buildCanonicalString(
                $v['method'],
                $v['path'],
                $bodyHash,
                $v['timestamp'],
                $v['nonce']
            );
            $this->assertSame($v['expectedCanonicalString'], $canonical, "Vector $i: Canonical mismatch");

            $sig = HmacSigner::computeSignature($v['secret'], $canonical);
            $this->assertSame($v['expectedSignature'], $sig, "Vector $i: Signature mismatch");

            $headers = [
                HmacSigner::HEADER_TIMESTAMP => (string) $v['timestamp'],
                HmacSigner::HEADER_NONCE     => $v['nonce'],
                HmacSigner::HEADER_SIGNATURE => $sig,
            ];

            $res = HmacSigner::verify(
                $v['secret'],
                $v['method'],
                $v['path'],
                $v['body'],
                $headers,
                999999999
            );

            $this->assertTrue($res['valid'], "Vector $i: Expected valid verification");
        }
    }

    public function testRejectsTamperedBody(): void
    {
        $vectors = $this->getVectors();
        $v = $vectors[1];

        $headers = [
            HmacSigner::HEADER_TIMESTAMP => (string) $v['timestamp'],
            HmacSigner::HEADER_NONCE     => $v['nonce'],
            HmacSigner::HEADER_SIGNATURE => $v['expectedSignature'],
        ];

        $res = HmacSigner::verify(
            $v['secret'],
            $v['method'],
            $v['path'],
            '{"siteId":"site_01","filename":"tampered.jpg"}',
            $headers,
            999999999
        );

        $this->assertFalse($res['valid']);
        $this->assertSame('AUTH_INVALID_SIGNATURE', $res['code']);
    }

    public function testRejectsTimestampSkew(): void
    {
        $secret = 'test_secret';
        $oldTs = time() - 600;
        $sign = HmacSigner::sign($secret, 'GET', '/api/test', '', $oldTs);

        $res = HmacSigner::verify($secret, 'GET', '/api/test', '', $sign['headers'], 300);
        $this->assertFalse($res['valid']);
        $this->assertSame('AUTH_TIMESTAMP_SKEW', $res['code']);
    }
}
