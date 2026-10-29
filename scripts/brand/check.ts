#!/usr/bin/env node
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = path.resolve(import.meta.dirname, '../..');
const BRAND_CONFIG_PATH = path.join(ROOT_DIR, 'brand.config.json');

const args = process.argv.slice(2);
const isReleaseGate = args.includes('--release');

console.log('[brand:check] Executing Brand & Identity Integrity Check...');

// 1. Verify brand.config.json exists
if (!fs.existsSync(BRAND_CONFIG_PATH)) {
  console.error('[FAIL] brand.config.json not found at repository root!');
  process.exit(1);
}

const brand = JSON.parse(fs.readFileSync(BRAND_CONFIG_PATH, 'utf-8'));

// 2. Release Gate Assertions
if (isReleaseGate) {
  console.log('[brand:check] Running release gate verification...');
  if (!brand.product.verified) {
    console.error('[FAIL] Release Gate: product.verified is false. Product name must be confirmed!');
    process.exit(1);
  }
  if (!brand.creator.websiteVerified) {
    console.error('[FAIL] Release Gate: creator.websiteVerified is false. Creator website must be confirmed!');
    process.exit(1);
  }
}

// 3. Legacy Name & Typo Scan (Addendum H)
console.log('[brand:check] Scanning codebase for forbidden legacy placeholders and typos (OptiForge, Manger, genioussonu.em, etc.)...');

let legacyViolationsCount = 0;

try {
  // Use git grep to scan non-ignored source files
  const grepPattern = "OptiForge|optiforge|OPTIFORGE|optiforge_|Manger|manger|MANGER|mimic-manger|mimic_manger|MimicManger|genioussonu\\.em";
  const grepCmd = `git grep -inE "${grepPattern}" -- ":!pnpm-lock.yaml" ":!scripts/brand/check.ts" ":!docs/architecture/adr/" ":!docs/project/SESSION_LOG.md" ":!docs/project/DECISIONS.md" || true`;
  const output = execSync(grepCmd, { cwd: ROOT_DIR, encoding: 'utf-8' }).trim();

  if (output.length > 0) {
    const lines = output.split('\n').filter(Boolean);
    console.error(`[FAIL] Found ${lines.length} occurrences of forbidden legacy placeholder or typo strings:`);
    for (const line of lines.slice(0, 20)) {
      console.error(`  ${line}`);
    }
    if (lines.length > 20) {
      console.error(`  ... and ${lines.length - 20} more lines.`);
    }
    legacyViolationsCount = lines.length;
  }
} catch (e) {
  console.error('[ERROR] Failed executing legacy name scan:', e);
}

if (legacyViolationsCount > 0) {
  console.error(`[FAIL] brand:check failed with ${legacyViolationsCount} legacy name violations.`);
  process.exit(1);
}

console.log('[PASS] Zero legacy name violations found across active codebase.');
console.log(`[PASS] Brand identity "${brand.product.name}" (Wefik) verified successfully.`);
