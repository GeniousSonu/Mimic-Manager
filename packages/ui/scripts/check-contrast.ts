/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */
import tokens from '../tokens/tokens.json' with { type: 'json' };

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  throw new Error(`Unsupported hex color: ${hex}`);
}

function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (a[0] ?? 0) + 0.7152 * (a[1] ?? 0) + 0.0722 * (a[2] ?? 0);
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = parseHex(hex1);
  const [r2, g2, b2] = parseHex(hex2);

  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);

  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);

  return (brightest + 0.05) / (darkest + 0.05);
}

export interface ContrastAuditResult {
  theme: string;
  foreground: string;
  background: string;
  fgHex: string;
  bgHex: string;
  ratio: number;
  minRatio: number;
  passed: boolean;
}

export function runContrastAudit(): ContrastAuditResult[] {
  const results: ContrastAuditResult[] = [];

  const check = (
    theme: 'dark' | 'light',
    fgName: string,
    fgHex: string,
    bgName: string,
    bgHex: string,
    minRatio: number,
  ) => {
    if (!fgHex.startsWith('#') || !bgHex.startsWith('#')) return; // Skip rgba for now
    const ratio = Number(getContrastRatio(fgHex, bgHex).toFixed(2));
    results.push({
      theme,
      foreground: fgName,
      background: bgName,
      fgHex,
      bgHex,
      ratio,
      minRatio,
      passed: ratio >= minRatio,
    });
  };

  // 1. Audit Dark Theme
  const dark = tokens.color.dark;
  const darkBgs = [
    ['bg.canvas', dark.bg.canvas],
    ['bg.surface', dark.bg.surface],
    ['bg.raised', dark.bg.raised],
    ['bg.overlay', dark.bg.overlay],
  ] as const;

  for (const [bgName, bgHex] of darkBgs) {
    check('dark', 'text.primary', dark.text.primary, bgName, bgHex, 4.5);
    check('dark', 'text.secondary', dark.text.secondary, bgName, bgHex, 4.5);
    check('dark', 'border.strong', dark.border.strong, bgName, bgHex, 3.0);
  }

  // Accent and boundary checks per Addendum I U3
  check('dark', 'accent.onAccent (dark text)', dark.accent.onAccent, 'accent.default (cyan fill)', dark.accent.default, 4.5);
  check('dark', 'accent.violet (UI boundary)', dark.accent.violet, 'bg.surface', dark.bg.surface, 3.0);
  check('dark', 'accent.violet (UI boundary)', dark.accent.violet, 'bg.canvas', dark.bg.canvas, 3.0);

  // 2. Audit Light Theme
  const light = tokens.color.light;
  const lightBgs = [
    ['bg.canvas', light.bg.canvas],
    ['bg.surface', light.bg.surface],
    ['bg.raised', light.bg.raised],
  ] as const;

  for (const [bgName, bgHex] of lightBgs) {
    check('light', 'text.primary', light.text.primary, bgName, bgHex, 4.5);
    check('light', 'text.secondary', light.text.secondary, bgName, bgHex, 4.5);
    check('light', 'border.strong', light.border.strong, bgName, bgHex, 3.0);
    check('light', 'semantic.success', light.semantic.success, bgName, bgHex, 4.5);
    check('light', 'semantic.danger', light.semantic.danger, bgName, bgHex, 4.5);
    check('light', 'semantic.info', light.semantic.info, bgName, bgHex, 4.5);
  }

  return results;
}

// Run if called directly
if (process.argv[1]?.endsWith('check-contrast.ts')) {
  console.log('Running Mimic Manager Design Tokens Contrast Audit...\n');
  const results = runContrastAudit();
  let failures = 0;

  for (const r of results) {
    const status = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(
      `${status} [${r.theme}] ${r.foreground} (${r.fgHex}) on ${r.background} (${r.bgHex}) => ${r.ratio}:1 (min: ${r.minRatio}:1)`,
    );
    if (!r.passed) failures++;
  }

  if (failures > 0) {
    console.error(`\nContrast Audit Failed: ${failures} token pairs violated WCAG standards.`);
    process.exit(1);
  } else {
    console.log(`\nAll ${results.length} token contrast pairs passed WCAG standards!`);
  }
}
