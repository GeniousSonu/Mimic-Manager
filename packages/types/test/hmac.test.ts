import { describe, it, expect } from 'vitest';
import { HmacSigner } from '../src/hmac-signer.js';
import { HmacHeaders } from '../src/hmac.js';
import vectors from '../src/hmac-vectors.json';

describe('HMAC Cross-Language Test Vectors', () => {
  vectors.forEach((vec, idx) => {
    it(`Vector ${idx}: ${vec.description}`, () => {
      const hash = HmacSigner.hashBody(vec.body);
      expect(hash).toBe(vec.expectedBodySha256);

      const canonical = HmacSigner.buildCanonicalString(
        vec.method,
        vec.path,
        hash,
        vec.timestamp,
        vec.nonce,
      );
      expect(canonical).toBe(vec.expectedCanonicalString);

      const sig = HmacSigner.computeSignature(vec.secret, canonical);
      expect(sig).toBe(vec.expectedSignature);

      // Verify with HmacSigner.verify
      const headers = {
        [HmacHeaders.TIMESTAMP]: vec.timestamp.toString(),
        [HmacHeaders.NONCE]: vec.nonce,
        [HmacHeaders.SIGNATURE]: sig,
      };

      const result = HmacSigner.verify({
        secret: vec.secret,
        method: vec.method,
        path: vec.path,
        body: vec.body,
        headers,
        maxSkewSeconds: 999999999, // Ignore skew for static test vectors
      });

      expect(result.valid).toBe(true);
    });
  });

  it('rejects tampered body', () => {
    const vec = vectors[1]!;
    const headers = {
      [HmacHeaders.TIMESTAMP]: vec.timestamp.toString(),
      [HmacHeaders.NONCE]: vec.nonce,
      [HmacHeaders.SIGNATURE]: vec.expectedSignature,
    };

    const result = HmacSigner.verify({
      secret: vec.secret,
      method: vec.method,
      path: vec.path,
      body: '{"siteId":"site_01","filename":"tampered.jpg"}',
      headers,
      maxSkewSeconds: 999999999,
    });

    expect(result.valid).toBe(false);
    expect(result.code).toBe('AUTH_INVALID_SIGNATURE');
  });

  it('rejects timestamp skew exceeding maxSkewSeconds', () => {
    const vec = vectors[0]!;
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
    const signResult = HmacSigner.sign({
      secret: vec.secret,
      method: vec.method,
      path: vec.path,
      body: '',
      timestamp: oldTimestamp,
    });

    const result = HmacSigner.verify({
      secret: vec.secret,
      method: vec.method,
      path: vec.path,
      body: '',
      headers: signResult.headers,
      maxSkewSeconds: 300,
    });

    expect(result.valid).toBe(false);
    expect(result.code).toBe('AUTH_TIMESTAMP_SKEW');
  });
});
