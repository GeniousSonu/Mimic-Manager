import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const rootPkgPath = path.join(ROOT_DIR, 'package.json');
const brandPath = path.join(ROOT_DIR, 'brand.config.json');

async function main() {
  console.log('[version:check] Running version consistency audit across monorepo and built artifacts...');

  if (!fs.existsSync(rootPkgPath)) {
    console.error('[-] Root package.json missing.');
    process.exit(1);
  }

  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
  const authoritativeVersion = rootPkg.version;
  console.log(`  [•] Authoritative root version: ${authoritativeVersion}`);

  const errors: string[] = [];

  // 1. brand.config.json
  if (fs.existsSync(brandPath)) {
    const brand = JSON.parse(fs.readFileSync(brandPath, 'utf-8'));
    if (brand.product.version !== authoritativeVersion) {
      errors.push(`brand.config.json: expected ${authoritativeVersion}, got ${brand.product.version}`);
    }
  }

  // 2. Workspaces
  const workspaces = [
    'apps/api',
    'apps/worker',
    'apps/pwa',
    'packages/config',
    'packages/types',
    'packages/ir',
    'packages/ui',
    'packages/ssrf-guard',
  ];

  for (const ws of workspaces) {
    const wsPkgPath = path.join(ROOT_DIR, ws, 'package.json');
    if (fs.existsSync(wsPkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(wsPkgPath, 'utf-8'));
      if (pkg.version !== authoritativeVersion) {
        errors.push(`${ws}/package.json: expected ${authoritativeVersion}, got ${pkg.version}`);
      }
    }
  }

  // 3. composer.json
  const composerPath = path.join(ROOT_DIR, 'connectors/wordpress/composer.json');
  if (fs.existsSync(composerPath)) {
    const comp = JSON.parse(fs.readFileSync(composerPath, 'utf-8'));
    if (comp.version && comp.version !== authoritativeVersion) {
      errors.push(`composer.json: expected ${authoritativeVersion}, got ${comp.version}`);
    }
  }

  // 4. mimic-manager.php
  const mainPhpPath = path.join(ROOT_DIR, 'connectors/wordpress/mimic-manager.php');
  if (fs.existsSync(mainPhpPath)) {
    const content = fs.readFileSync(mainPhpPath, 'utf-8');
    const match = content.match(/\* Version:\s+([^\r\n]+)/);
    if (!match || match[1] !== authoritativeVersion) {
      errors.push(`mimic-manager.php header: expected ${authoritativeVersion}, got ${match ? match[1] : 'null'}`);
    }
  }

  // 5. Brand.php
  const brandPhpPath = path.join(ROOT_DIR, 'connectors/wordpress/includes/Brand.php');
  if (fs.existsSync(brandPhpPath)) {
    const content = fs.readFileSync(brandPhpPath, 'utf-8');
    const match = content.match(/public const VERSION = '([^']+)';/);
    if (!match || match[1] !== authoritativeVersion) {
      errors.push(`Brand.php constant: expected ${authoritativeVersion}, got ${match ? match[1] : 'null'}`);
    }
  }

  // 6. readme.txt
  const readmePath = path.join(ROOT_DIR, 'connectors/wordpress/readme.txt');
  if (fs.existsSync(readmePath)) {
    const content = fs.readFileSync(readmePath, 'utf-8');
    const match = content.match(/Stable tag:\s+([^\r\n]+)/);
    if (!match || match[1] !== authoritativeVersion) {
      errors.push(`readme.txt Stable tag: expected ${authoritativeVersion}, got ${match ? match[1] : 'null'}`);
    }
  }

  // 7. Inspect built artifacts if present in dist/
  const distManifestPath = path.join(ROOT_DIR, 'dist/dist-manifest.json');
  if (fs.existsSync(distManifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(distManifestPath, 'utf-8'));
    if (manifest.version !== authoritativeVersion) {
      errors.push(`dist/dist-manifest.json: expected ${authoritativeVersion}, got ${manifest.version}`);
    }
  }

  const zipPath = path.join(ROOT_DIR, 'dist/mimic-manager.zip');
  if (fs.existsSync(zipPath)) {
    try {
      const readmeInZip = execSync(`unzip -p "${zipPath}" mimic-manager/readme.txt`, { encoding: 'utf-8' });
      const match = readmeInZip.match(/Stable tag:\s+([^\r\n]+)/);
      if (!match || match[1] !== authoritativeVersion) {
        errors.push(`dist/mimic-manager.zip (readme.txt): expected ${authoritativeVersion}, got ${match ? match[1] : 'null'}`);
      }
    } catch (err: any) {
      errors.push(`Failed inspecting dist/mimic-manager.zip: ${err.message}`);
    }
  }

  if (errors.length > 0) {
    console.error('[-] Version Check FAILED with discrepancies:');
    errors.forEach((e) => console.error(`    ${e}`));
    process.exit(1);
  }

  console.log('[✓] Version Check PASS: all source files and built artifacts are strictly synchronized.');
}

main().catch((err) => {
  console.error('[-] version:check encountered an unhandled error:', err);
  process.exit(1);
});
