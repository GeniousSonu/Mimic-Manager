#!/usr/bin/env node
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = path.resolve(import.meta.dirname, '../..');
const BRAND_CONFIG_PATH = path.join(ROOT_DIR, 'brand.config.json');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const newName = args.find(arg => !arg.startsWith('--'));

if (!newName) {
  console.error('Usage: pnpm brand:rename "<New Name>" [--dry-run]');
  process.exit(1);
}

const brand = JSON.parse(fs.readFileSync(BRAND_CONFIG_PATH, 'utf-8'));
const currentName = brand.product.name;

console.log(`[brand:rename] Target Rebrand: "${currentName}" -> "${newName}" ${isDryRun ? '(DRY RUN)' : ''}`);

const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const snake = newName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^-|-$)/g, '');
const pascal = newName.replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^[a-z]/, c => c.toUpperCase());
const constantPrefix = snake.toUpperCase();

console.log(`  Derived slug:           ${slug}`);
console.log(`  Derived snake:          ${snake}`);
console.log(`  Derived pascal:         ${pascal}`);
console.log(`  Derived constantPrefix: ${constantPrefix}`);

if (isDryRun) {
  console.log('[brand:rename] Impacted surfaces:');
  console.log('  - brand.config.json (Single source of truth)');
  console.log('  - packages/config/src/brand.generated.ts (TypeScript constants)');
  console.log('  - connectors/wordpress/includes/Brand.php (PHP constants)');
  console.log('  - connectors/wordpress/composer.json (Composer package metadata)');
  console.log('  - connectors/wordpress/mimic-manager.php (WordPress plugin header)');
  console.log('  - connectors/wordpress/readme.txt (WordPress repository readme)');
  console.log('  - apps/pwa/public/manifest.json (Web App Manifest)');
  console.log('  - NOTICE (Legal attribution notice)');
  console.log('  - TRADEMARKS.md (Trademark and fork policy)');
  console.log('[brand:rename] Dry run completed with 0 disk mutations.');
  process.exit(0);
}

brand.product.name = newName;
brand.product.slug = slug;
brand.product.snake = snake;
brand.product.pascal = pascal;
brand.product.constantPrefix = constantPrefix;

fs.writeFileSync(BRAND_CONFIG_PATH, JSON.stringify(brand, null, 2) + '\n', 'utf-8');
console.log(`[brand:rename] Updated brand.config.json.`);

// Re-apply generated files
execSync('node scripts/brand/apply.ts', { cwd: ROOT_DIR, stdio: 'inherit' });
console.log(`[brand:rename] Rebrand to "${newName}" finished successfully.`);
