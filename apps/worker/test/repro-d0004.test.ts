import { describe, it, expect } from 'vitest';
import { PreviewVerifier, VerificationTarget } from '../src/verifier';

describe('Reproduction: D-0004 (NaN Telemetry in PreviewVerifier)', () => {
  const verifier = new PreviewVerifier();
  const target: VerificationTarget = {
    siteId: 'site_123',
    url: 'https://example.com',
    fixId: 'FIX-PERF-004',
    tier: 'moderate',
  };

  it('rejects corrupt or NaN telemetry metrics', () => {
    const result = verifier.evaluateVerification(target, {
      consoleErrors: [],
      visualDiffRatio: NaN, // corrupted
      metrics: {
        lcpBeforeMs: 2000,
        lcpAfterMs: 2000,
        clsBefore: 0.05,
        clsAfter: 0.05,
      },
    });

    // Should NOT pass when telemetry is corrupted with NaN
    expect(result.passed).toBe(false);
    expect(result.revertTriggered).toBe(true);
  });
});
