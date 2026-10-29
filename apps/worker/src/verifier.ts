/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */
/**
 * Mimic Manager Speed Preview Verifier & Auto-Revert Coordinator
 * 
 * Conducts automated preview verification before and after applying tiered performance fixes.
 * Enforces zero console error tolerance and <= 1.0% visual difference threshold.
 */

export interface VerificationTarget {
  siteId: string;
  url: string;
  fixId: string;
  tier: 'safe' | 'moderate' | 'guided';
}

export interface VerificationResult {
  passed: boolean;
  fixId: string;
  siteId: string;
  jsErrors: string[];
  visualDiffRatio: number;
  revertTriggered: boolean;
  revertReason?: string | undefined;
  timestamp: string;
  metrics: {
    lcpBeforeMs: number;
    lcpAfterMs: number;
    clsBefore: number;
    clsAfter: number;
  };
}

export interface RevertPayload {
  siteId: string;
  fixId: string;
  reason: string;
  timestamp: string;
  signature?: string;
}

export class PreviewVerifier {
  public static readonly MAX_ALLOWED_VISUAL_DIFF = 0.01; // 1.0% maximum diff threshold

  /**
   * Evaluates verification telemetry and determines whether to accept or automatically revert.
   */
  public evaluateVerification(
    target: VerificationTarget,
    telemetry: {
      consoleErrors: string[];
      visualDiffRatio: number;
      metrics: {
        lcpBeforeMs: number;
        lcpAfterMs: number;
        clsBefore: number;
        clsAfter: number;
      };
    }
  ): VerificationResult {
    const jsErrors = telemetry.consoleErrors;
    const visualDiffRatio = telemetry.visualDiffRatio;
    // Pre-flight check: Telemetry metric sanity (guard against NaN or corrupt bounds)
    if (
      !Number.isFinite(visualDiffRatio) ||
      visualDiffRatio < 0 ||
      !Number.isFinite(telemetry.metrics.lcpBeforeMs) ||
      !Number.isFinite(telemetry.metrics.lcpAfterMs) ||
      telemetry.metrics.lcpBeforeMs <= 0 ||
      telemetry.metrics.lcpAfterMs <= 0
    ) {
      return {
        passed: false,
        fixId: target.fixId,
        siteId: target.siteId,
        jsErrors,
        visualDiffRatio: Number.isFinite(visualDiffRatio) ? visualDiffRatio : 1.0,
        revertTriggered: true,
        revertReason: 'Corrupted or out-of-bounds telemetry metrics received (NaN or non-positive value)',
        timestamp: new Date().toISOString(),
        metrics: telemetry.metrics,
      };
    }

    let passed = true;
    let revertTriggered = false;
    let revertReason: string | undefined;

    // Rule 1: Zero tolerance for JavaScript errors
    if (jsErrors.length > 0) {
      passed = false;
      revertTriggered = true;
      revertReason = `Console JavaScript error detected: ${jsErrors[0]}`;
    }
    // Rule 2: Visual regression threshold exceeded
    else if (visualDiffRatio > PreviewVerifier.MAX_ALLOWED_VISUAL_DIFF) {
      passed = false;
      revertTriggered = true;
      revertReason = `Visual diff ratio ${(visualDiffRatio * 100).toFixed(2)}% exceeds allowed threshold of ${(PreviewVerifier.MAX_ALLOWED_VISUAL_DIFF * 100).toFixed(1)}%`;
    }
    // Rule 3: Severe Core Web Vitals regression (e.g. LCP degraded by > 50%)
    else if (telemetry.metrics.lcpAfterMs > telemetry.metrics.lcpBeforeMs * 1.5) {
      passed = false;
      revertTriggered = true;
      revertReason = `LCP metric regressed from ${telemetry.metrics.lcpBeforeMs}ms to ${telemetry.metrics.lcpAfterMs}ms`;
    }

    return {
      passed,
      fixId: target.fixId,
      siteId: target.siteId,
      jsErrors,
      visualDiffRatio,
      revertTriggered,
      revertReason,
      timestamp: new Date().toISOString(),
      metrics: telemetry.metrics,
    };
  }

  /**
   * Creates an auto-revert payload to dispatch back to the connector.
   */
  public createRevertPayload(result: VerificationResult): RevertPayload {
    if (!result.revertTriggered) {
      throw new Error('Cannot construct revert payload for a passing verification result');
    }

    return {
      siteId: result.siteId,
      fixId: result.fixId,
      reason: result.revertReason || 'Automated verification check failed',
      timestamp: new Date().toISOString(),
    };
  }
}
