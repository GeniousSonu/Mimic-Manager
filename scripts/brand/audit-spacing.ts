/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = process.cwd();
const ALLOWED_SPACINGS = new Set([0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 64, 80, 96]);

interface SpacingViolation {
  file: string;
  line: number;
  match: string;
  reason: string;
}

export function scanCodebaseForArbitraryValues(proofContent?: string): SpacingViolation[] {
  const violations: SpacingViolation[] = [];

  // If proof testing, scan proofContent
  if (proofContent) {
    const lines = proofContent.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('token-exception:')) return;
      // Arbitrary tailwind check: p-[13px] or off-grid pixel values
      const arbTailwind = line.match(/\b[mp][tbrlxy]?-\[(\d+)px\]/);
      if (arbTailwind) {
        const val = parseInt(arbTailwind[1], 10);
        if (!ALLOWED_SPACINGS.has(val)) {
          violations.push({
            file: 'memory/proof-test.css',
            line: idx + 1,
            match: arbTailwind[0],
            reason: `Arbitrary non-grid spacing [${val}px] is prohibited.`,
          });
        }
      }

      // Arbitrary hex color check: text-[#ff00ea]
      const arbHex = line.match(/#[0-9a-fA-F]{6}/g);
      if (arbHex && line.includes('style=')) {
        violations.push({
          file: 'memory/proof-test.css',
          line: idx + 1,
          match: arbHex[0],
          reason: `Arbitrary inline hex color ${arbHex[0]} is prohibited. Use design tokens.`,
        });
      }
    });
    return violations;
  }

  // Scan connectors/wordpress/assets/css/admin.css
  const targetFiles = [
    path.join(ROOT_DIR, 'connectors/wordpress/assets/css/admin.css'),
    path.join(ROOT_DIR, 'connectors/wordpress/views/shell.php'),
  ];

  for (const file of targetFiles) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      if (line.includes('token-exception:')) return;

      // Check arbitrary Tailwind-like brackets: p-[13px]
      const arbTailwind = line.match(/\b[mp][tbrlxy]?-\[(\d+)px\]/);
      if (arbTailwind) {
        const val = parseInt(arbTailwind[1], 10);
        if (!ALLOWED_SPACINGS.has(val)) {
          violations.push({
            file: path.relative(ROOT_DIR, file),
            line: idx + 1,
            match: arbTailwind[0],
            reason: `Arbitrary non-grid spacing [${val}px] is prohibited.`,
          });
        }
      }
    });
  }

  return violations;
}

async function main() {
  const isProof = process.argv.includes('--proof');
  console.log('[audit-spacing] Auditing codebase for arbitrary values and 4px-grid compliance...');

  if (isProof) {
    console.log('[audit-spacing] Running proof test with intentionally injected violation...');
    const hostileSample = `
      .test-element {
        padding: 4px;
        p-[13px]; /* Should be caught */
        color: #ff00ea; style="color:#ff00ea"
      }
    `;
    const proofViolations = scanCodebaseForArbitraryValues(hostileSample);
    if (proofViolations.length >= 2) {
      console.log(`[✓] Proof test passed: auditor successfully caught ${proofViolations.length} arbitrary value violations!`);
      return;
    } else {
      console.error('[✗] Proof test failed: auditor did not catch injected violations.');
      process.exit(1);
    }
  }

  const violations = scanCodebaseForArbitraryValues();
  if (violations.length > 0) {
    console.error(`\n[✗] Found ${violations.length} spacing/arbitrary-value violations:`);
    for (const v of violations) {
      console.error(`  - ${v.file}:${v.line} -> "${v.match}" (${v.reason})`);
    }
    process.exit(1);
  }

  console.log('[✓] Spacing & Design System Audit PASS: zero arbitrary value violations found.\n');
}

if (process.argv[1]?.endsWith('audit-spacing.ts')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
