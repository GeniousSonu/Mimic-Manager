import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const WPORG_ZIP = path.join(DIST_DIR, 'mimic-manager.zip');
const GITHUB_ZIP = path.join(DIST_DIR, 'mimic-manager-github.zip');

function getAllFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

async function main() {
  console.log('[plugin:scan-updater] Verifying channel flavor separation & WP.org compliance...');

  if (!fs.existsSync(WPORG_ZIP)) {
    throw new Error(`WordPress.org canonical zip missing: ${WPORG_ZIP}`);
  }
  if (!fs.existsSync(GITHUB_ZIP)) {
    throw new Error(`GitHub channel zip missing: ${GITHUB_ZIP}`);
  }

  const tmpDir = path.join(ROOT_DIR, 'tmp/scan-updater');
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  const wporgExtract = path.join(tmpDir, 'wporg');
  const githubExtract = path.join(tmpDir, 'github');
  fs.mkdirSync(wporgExtract, { recursive: true });
  fs.mkdirSync(githubExtract, { recursive: true });

  execSync(`unzip -q "${WPORG_ZIP}" -d "${wporgExtract}"`);
  execSync(`unzip -q "${GITHUB_ZIP}" -d "${githubExtract}"`);

  // 1. Scan wporg build for forbidden updater patterns
  console.log('[1/2] Scanning wporg package for forbidden third-party updater code...');
  const forbiddenPatterns = [
    'pre_set_site_transient_update_plugins',
    'api.github.com',
    'GitHubUpdater',
  ];

  const wporgFiles = getAllFiles(wporgExtract).filter(
    (f) => f.endsWith('.php') || f.endsWith('.js')
  );

  const violations: string[] = [];
  for (const file of wporgFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    for (const pat of forbiddenPatterns) {
      if (content.includes(pat)) {
        violations.push(`${path.relative(wporgExtract, file)} contains forbidden string "${pat}"`);
      }
    }
  }

  if (violations.length > 0) {
    console.error('[-] WP.org updater scan FAILED with violations:');
    violations.forEach((v) => console.error(`    ${v}`));
    process.exit(1);
  }
  console.log('  [✓] wporg package contains ZERO third-party updater code or endpoints.');

  // 2. Scan github build for presence of GitHubUpdater
  console.log('[2/2] Scanning github package for auditable updater implementation...');
  const githubUpdaterPath = path.join(githubExtract, 'mimic-manager/src/Update/GitHubUpdater.php');
  if (!fs.existsSync(githubUpdaterPath)) {
    console.error('[-] github package is missing src/Update/GitHubUpdater.php');
    process.exit(1);
  }

  const updaterContent = fs.readFileSync(githubUpdaterPath, 'utf-8');
  if (!updaterContent.includes('filterPluginUpdates') || !updaterContent.includes('mimic_manager_update_consent')) {
    console.error('[-] GitHubUpdater.php missing consent guard or update filter.');
    process.exit(1);
  }
  console.log('  [✓] github package correctly includes auditable GitHubUpdater with consent guard.');

  // Clean temp
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log('[✓] Channel flavor separation PASS: wporg is 100% clean and github channel is fully verified.');
}

main().catch((err) => {
  console.error('[-] scan-updater failed:', err);
  process.exit(1);
});
