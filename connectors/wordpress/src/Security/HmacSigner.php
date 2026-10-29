<?php

declare(strict_types=1);

namespace MimicManager\Security;

class HmacSigner
{
    public const HEADER_SITE_ID   = 'x-mimic-site-id';
    public const HEADER_TIMESTAMP = 'x-mimic-timestamp';
    public const HEADER_NONCE     = 'x-mimic-nonce';
    public const HEADER_SIGNATURE = 'x-mimic-signature';

    public const DEFAULT_MAX_SKEW_SECONDS = 300; // 5 minutes

    public static function hashBody(string $body): string
    {
        return hash('sha256', $body);
    }

    public static function buildCanonicalString(
        string $method,
        string $path,
        string $bodySha256,
        int $timestamp,
        string $nonce
    ): string {
        return strtoupper($method) . "\n" . $path . "\n" . $bodySha256 . "\n" . $timestamp . "\n" . $nonce;
    }

    public static function computeSignature(string $secret, string $canonicalString): string
    {
        return hash_hmac('sha256', $canonicalString, $secret);
    }

    /**
     * Creates an HMAC-SHA256 signature and returns the required headers.
     *
     * @return array{
     *   signature: string,
     *   timestamp: int,
     *   nonce: string,
     *   bodySha256: string,
     *   canonicalString: string,
     *   headers: array<string, string>
     * }
     */
    public static function sign(
        string $secret,
        string $method,
        string $path,
        string $body,
        ?int $timestamp = null,
        ?string $nonce = null
    ): array {
        $timestamp = $timestamp ?? time();
        $nonce     = $nonce ?? bin2hex(random_bytes(16));
        $bodyHash  = self::hashBody($body);
        $canonical = self::buildCanonicalString($method, $path, $bodyHash, $timestamp, $nonce);
        $signature = self::computeSignature($secret, $canonical);

        return [
            'signature'       => $signature,
            'timestamp'       => $timestamp,
            'nonce'           => $nonce,
            'bodySha256'      => $bodyHash,
            'canonicalString' => $canonical,
            'headers'         => [
                self::HEADER_TIMESTAMP => (string) $timestamp,
                self::HEADER_NONCE     => $nonce,
                self::HEADER_SIGNATURE => $signature,
            ],
        ];
    }

    /**
     * Verifies an inbound request signature.
     *
     * @param array<string, string|array<string>> $headers
     * @return array{valid: bool, code?: string, message?: string}
     */
    public static function verify(
        string $secret,
        string $method,
        string $path,
        string $body,
        array $headers,
        int $maxSkewSeconds = self::DEFAULT_MAX_SKEW_SECONDS
    ): array {
        $normalizedHeaders = [];
        foreach ($headers as $k => $v) {
            $key = strtolower((string) $k);
            $normalizedHeaders[$key] = is_array($v) ? ($v[0] ?? '') : (string) $v;
        }

        $sigKey   = strtolower(self::HEADER_SIGNATURE);
        $tsKey    = strtolower(self::HEADER_TIMESTAMP);
        $nonceKey = strtolower(self::HEADER_NONCE);

        if (
            empty($normalizedHeaders[$sigKey]) ||
            empty($normalizedHeaders[$tsKey]) ||
            empty($normalizedHeaders[$nonceKey])
        ) {
            return [
                'valid'   => false,
                'code'    => 'AUTH_MISSING_HEADERS',
                'message' => 'Missing required HMAC signature headers',
            ];
        }

        $signature = $normalizedHeaders[$sigKey];
        $timestamp = (int) $normalizedHeaders[$tsKey];
        $nonce     = $normalizedHeaders[$nonceKey];

        $now = time();
        if (abs($now - $timestamp) > $maxSkewSeconds) {
            return [
                'valid'   => false,
                'code'    => 'AUTH_TIMESTAMP_SKEW',
                'message' => sprintf('Timestamp skew exceeds %d seconds (server: %d, req: %d)', $maxSkewSeconds, $now, $timestamp),
            ];
        }

        $bodyHash  = self::hashBody($body);
        $canonical = self::buildCanonicalString($method, $path, $bodyHash, $timestamp, $nonce);
        $expected  = self::computeSignature($secret, $canonical);

        if (!hash_equals($expected, $signature)) {
            return [
                'valid'   => false,
                'code'    => 'AUTH_INVALID_SIGNATURE',
                'message' => 'HMAC signature verification failed',
            ];
        }

        return ['valid' => true];
    }
}
