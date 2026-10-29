import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const BRAND_PATH = path.join(ROOT_DIR, 'brand.config.json');

async function main() {
  console.log('[plugin:verify-zip] Verifying production plugin zip package integrity...');

  const brand = JSON.parse(fs.readFileSync(BRAND_PATH, 'utf-8'));
  const version = brand.product.version;
  const slug = brand.product.slug;
  const zipPath = path.join(DIST_DIR, `${slug}-${version}.zip`);
  const manifestPath = path.join(DIST_DIR, 'dist-manifest.json');

  if (!fs.existsSync(zipPath)) {
    throw new Error(`Zip artifact not found at ${zipPath}. Run pnpm plugin:build first.`);
  }

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}. Run pnpm plugin:build first.`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // 1. Inspect zip entries using unzip -l
  console.log('[1/4] Inspecting ZIP entries and directory hierarchy...');
  const zipListing = execSync(`unzip -Z -1 "${zipPath}"`, { encoding: 'utf-8' }).split('\n').filter(Boolean);

  // Check top-level folder
  for (const entry of zipListing) {
    if (!entry.startsWith(`${slug}/`)) {
      throw new Error(`Invalid zip structure: entry "${entry}" is outside root folder "${slug}/"`);
    }
  }

  // 2. Check forbidden files
  console.log('[2/4] Scanning for forbidden files (tests, git, node_modules, mac artifacts)...');
  const forbiddenPatterns = [
    /\.git/,
    /node_modules/,
    /tests\//,
    /phpunit\.xml/,
    /\.DS_Store/,
    /__MACOSX/,
    /\.env/,
    /\.log$/,
  ];

  for (const entry of zipListing) {
    for (const pat of forbiddenPatterns) {
      if (pat.test(entry)) {
        throw new Error(`Forbidden file detected in production ZIP: ${entry}`);
      }
    }
  }

  // 3. Check essential files
  console.log('[3/4] Verifying essential plugin entrypoints...');
  const essentialFiles = [
    `${slug}/mimic-manager.php`,
    `${slug}/readme.txt`,
    `${slug}/uninstall.php`,
    `${slug}/includes/Brand.php`,
    `${slug}/src/Plugin.php`,
    `${slug}/src/Media/LocalOptimizer.php`,
  ];

  for (const essential of essentialFiles) {
    if (!zipListing.includes(essential)) {
      throw new Error(`Missing essential file in ZIP: ${essential}`);
    }
  }

  // 4. Verify size budget
  console.log('[4/4] Verifying zip size budget...');
  const sizeMb = fs.statSync(zipPath).size / (1024 * 1024);
  const maxBudgetMb = 5.0; // 5 MB budget limit for the WordPress plugin zip
  if (sizeMb > maxBudgetMb) {
    throw new Error(`Zip size ${sizeMb.toFixed(2)} MB exceeds maximum budget of ${maxBudgetMb} MB`);
  }

  console.log(`\n[✓] ZIP Verification PASS!`);
  console.log(`  Package: ${path.basename(zipPath)}`);
  console.log(`  Entries: ${zipListing.length}`);
  console.log(`  Size:    ${sizeMb.toFixed(2)} MB (Budget: < ${maxBudgetMb} MB)`);
  console.log(`  SHA256:  ${manifest.sha256}`);
}

main().catch((err) => {
  console.error('[-] Zip verification failed:', err.message);
  process.exit(1);
});
