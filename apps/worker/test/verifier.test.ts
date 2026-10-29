import { describe, it, expect } from 'vitest';
import { PreviewVerifier, VerificationTarget } from '../src/verifier';

describe('PreviewVerifier & Auto-Revert Coordinator', () => {
  const verifier = new PreviewVerifier();
  const target: VerificationTarget = {
    siteId: 'site_test_123',
    url: 'https://example.com/sample-page',
    fixId: 'FIX-PERF-004',
    tier: 'moderate',
  };

  it('approves fixes when telemetry is within clean thresholds', () => {
    const result = verifier.evaluateVerification(target, {
      consoleErrors: [],
      visualDiffRatio: 0.003, // 0.3% diff (below 1.0% limit)
      metrics: {
        lcpBeforeMs: 2400,
        lcpAfterMs: 1800, // improved!
        clsBefore: 0.08,
        clsAfter: 0.02,
      },
    });

    expect(result.passed).toBe(true);
    expect(result.revertTriggered).toBe(false);
    expect(result.revertReason).toBeUndefined();
    expect(result.fixId).toBe('FIX-PERF-004');
  });

  it('triggers auto-revert if any JavaScript error is thrown', () => {
    const result = verifier.evaluateVerification(target, {
      consoleErrors: ['Uncaught TypeError: jQuery(...).slick is not a function'],
      visualDiffRatio: 0.002,
      metrics: {
        lcpBeforeMs: 2200,
        lcpAfterMs: 2100,
        clsBefore: 0.05,
        clsAfter: 0.05,
      },
    });

    expect(result.passed).toBe(false);
    expect(result.revertTriggered).toBe(true);
    expect(result.revertReason).toContain('Console JavaScript error detected');

    const revertPayload = verifier.createRevertPayload(result);
    expect(revertPayload.fixId).toBe('FIX-PERF-004');
    expect(revertPayload.siteId).toBe('site_test_123');
    expect(revertPayload.reason).toContain('jQuery(...).slick is not a function');
  });

  it('triggers auto-revert when visual diff ratio exceeds 1.0%', () => {
    const result = verifier.evaluateVerification(target, {
      consoleErrors: [],
      visualDiffRatio: 0.025, // 2.5% diff (> 1.0%)
      metrics: {
        lcpBeforeMs: 2000,
        lcpAfterMs: 1900,
        clsBefore: 0.05,
        clsAfter: 0.05,
      },
    });

    expect(result.passed).toBe(false);
    expect(result.revertTriggered).toBe(true);
    expect(result.revertReason).toContain('exceeds allowed threshold of 1.0%');
  });

  it('triggers auto-revert if LCP degrades by over 50%', () => {
    const result = verifier.evaluateVerification(target, {
      consoleErrors: [],
      visualDiffRatio: 0.005,
      metrics: {
        lcpBeforeMs: 1500,
        lcpAfterMs: 2800, // regressed by > 50%
        clsBefore: 0.05,
        clsAfter: 0.05,
      },
    });

    expect(result.passed).toBe(false);
    expect(result.revertTriggered).toBe(true);
    expect(result.revertReason).toContain('LCP metric regressed from 1500ms to 2800ms');
  });
});
