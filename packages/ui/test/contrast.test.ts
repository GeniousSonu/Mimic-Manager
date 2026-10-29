import { describe, it, expect } from 'vitest';
import { runContrastAudit } from '../scripts/check-contrast.js';

describe('Design Tokens WCAG 2.2 AA Contrast Audit', () => {
  const auditResults = runContrastAudit();

  it('audits at least 15 critical token pairs across dark and light themes', () => {
    expect(auditResults.length).toBeGreaterThanOrEqual(15);
  });

  auditResults.forEach((res) => {
    it(`[${res.theme}] ${res.foreground} on ${res.background} ratio (${res.ratio}:1 >= ${res.minRatio}:1)`, () => {
      expect(res.passed).toBe(true);
    });
  });
});
