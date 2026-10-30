import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = process.cwd();
const rootPkgPath = path.join(ROOT_DIR, 'package.json');
const brandPath = path.join(ROOT_DIR, 'brand.config.json');

export function syncAllVersions(): string {
  if (!fs.existsSync(rootPkgPath)) {
    throw new Error('Root package.json not found!');
  }

  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
  const version = rootPkg.version;
  console.log(`[version:sync] Synchronizing authoritative SemVer: ${version}`);

  // 1. brand.config.json
  if (fs.existsSync(brandPath)) {
    const brand = JSON.parse(fs.readFileSync(brandPath, 'utf-8'));
    if (brand.product.version !== version) {
      brand.product.version = version;
      fs.writeFileSync(brandPath, JSON.stringify(brand, null, 2) + '\n', 'utf-8');
      console.log(`  [✓] Updated brand.config.json -> ${version}`);
    }
  }

  // 2. Workspace package.json files
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
      if (pkg.version !== version) {
        pkg.version = version;
        fs.writeFileSync(wsPkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
        console.log(`  [✓] Updated ${ws}/package.json -> ${version}`);
      }
    }
  }

  // 3. connectors/wordpress/composer.json
  const composerPath = path.join(ROOT_DIR, 'connectors/wordpress/composer.json');
  if (fs.existsSync(composerPath)) {
    const comp = JSON.parse(fs.readFileSync(composerPath, 'utf-8'));
    if (comp.version !== version) {
      comp.version = version;
      fs.writeFileSync(composerPath, JSON.stringify(comp, null, 2) + '\n', 'utf-8');
      console.log(`  [✓] Updated connectors/wordpress/composer.json -> ${version}`);
    }
  }

  // 4. connectors/wordpress/mimic-manager.php
  const mainPhpPath = path.join(ROOT_DIR, 'connectors/wordpress/mimic-manager.php');
  if (fs.existsSync(mainPhpPath)) {
    const content = fs.readFileSync(mainPhpPath, 'utf-8');
    const updated = content.replace(/\* Version:\s+[^\r\n]+/, `* Version: ${version}`);
    if (updated !== content) {
      fs.writeFileSync(mainPhpPath, updated, 'utf-8');
      console.log(`  [✓] Updated mimic-manager.php -> ${version}`);
    }
  }

  // 5. connectors/wordpress/includes/Brand.php
  const brandPhpPath = path.join(ROOT_DIR, 'connectors/wordpress/includes/Brand.php');
  if (fs.existsSync(brandPhpPath)) {
    let brandPhp = fs.readFileSync(brandPhpPath, 'utf-8');
    brandPhp = brandPhp.replace(/public const VERSION = '[^']+';/, `public const VERSION = '${version}';`);
    brandPhp = brandPhp.replace(/public const USER_AGENT = 'MimicManager\/[^' ]+/, `public const USER_AGENT = 'MimicManager/${version}`);
    fs.writeFileSync(brandPhpPath, brandPhp, 'utf-8');
    console.log(`  [✓] Updated Brand.php -> ${version}`);
  }

  // 6. connectors/wordpress/readme.txt
  const readmePath = path.join(ROOT_DIR, 'connectors/wordpress/readme.txt');
  if (fs.existsSync(readmePath)) {
    const readme = fs.readFileSync(readmePath, 'utf-8');
    const updated = readme.replace(/Stable tag:\s+[^\r\n]+/, `Stable tag: ${version}`);
    if (updated !== readme) {
      fs.writeFileSync(readmePath, updated, 'utf-8');
      console.log(`  [✓] Updated readme.txt -> ${version}`);
    }
  }

  // 7. apps/pwa/public/manifest.webmanifest
  const manifestPath = path.join(ROOT_DIR, 'apps/pwa/public/manifest.webmanifest');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      manifest.version = version;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
      console.log(`  [✓] Updated manifest.webmanifest -> ${version}`);
    } catch {
      // ignore
    }
  }

  return version;
}

if (process.argv[1] && process.argv[1].endsWith('version-sync.ts')) {
  syncAllVersions();
  console.log('[✓] Version synchronization complete.');
}
