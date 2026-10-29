import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = process.cwd();
const pkgPath = path.join(ROOT_DIR, 'package.json');
const brandPath = path.join(ROOT_DIR, 'brand.config.json');
const mainPhpPath = path.join(ROOT_DIR, 'connectors/wordpress/mimic-manager.php');
const brandPhpPath = path.join(ROOT_DIR, 'connectors/wordpress/includes/Brand.php');
const readmePath = path.join(ROOT_DIR, 'connectors/wordpress/readme.txt');

export function syncVersions(checkOnly = false): boolean {
  const brandJson = JSON.parse(fs.readFileSync(brandPath, 'utf-8'));
  const targetVersion = brandJson.product.version;

  let allMatch = true;

  // 1. Check/Update mimic-manager.php
  const phpContent = fs.readFileSync(mainPhpPath, 'utf-8');
  const phpVersionMatch = phpContent.match(/\* Version:\s+([^\r\n]+)/);
  if (!phpVersionMatch || phpVersionMatch[1] !== targetVersion) {
    allMatch = false;
    if (!checkOnly) {
      const updated = phpContent.replace(/\* Version:\s+[^\r\n]+/, `* Version: ${targetVersion}`);
      fs.writeFileSync(mainPhpPath, updated, 'utf-8');
      console.log(`[version-sync] Updated mimic-manager.php -> ${targetVersion}`);
    }
  }

  // 2. Check/Update Brand.php
  const brandPhpContent = fs.readFileSync(brandPhpPath, 'utf-8');
  const brandPhpMatch = brandPhpContent.match(/public const VERSION = '([^']+)'/);
  if (!brandPhpMatch || brandPhpMatch[1] !== targetVersion) {
    allMatch = false;
    if (!checkOnly) {
      const updated = brandPhpContent.replace(/public const VERSION = '[^']+'/, `public const VERSION = '${targetVersion}'`);
      fs.writeFileSync(brandPhpPath, updated, 'utf-8');
      console.log(`[version-sync] Updated Brand.php -> ${targetVersion}`);
    }
  }

  // 3. Check/Update readme.txt
  const readmeContent = fs.readFileSync(readmePath, 'utf-8');
  const readmeMatch = readmeContent.match(/Stable tag:\s+([^\r\n]+)/);
  if (!readmeMatch || readmeMatch[1] !== targetVersion) {
    allMatch = false;
    if (!checkOnly) {
      const updated = readmeContent.replace(/Stable tag:\s+[^\r\n]+/, `Stable tag: ${targetVersion}`);
      fs.writeFileSync(readmePath, updated, 'utf-8');
      console.log(`[version-sync] Updated readme.txt -> ${targetVersion}`);
    }
  }

  return allMatch;
}

const args = process.argv.slice(2);
const isCheckOnly = args.includes('--check');

console.log('[plugin:version-sync] Checking and synchronizing plugin version across all artifacts...');
const match = syncVersions(isCheckOnly);

if (isCheckOnly && !match) {
  console.error('[-] ERROR: Version mismatch detected across plugin artifacts.');
  process.exit(1);
}

console.log('[✓] Plugin versions are fully synchronized.');
