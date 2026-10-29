import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const WP_DIR = path.join(ROOT_DIR, 'connectors/wordpress');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const BRAND_PATH = path.join(ROOT_DIR, 'brand.config.json');

function computeFileHash(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else {
      results.push(path.relative(baseDir, fullPath));
    }
  }
  return results;
}

async function main() {
  console.log('[plugin:build] Starting production WordPress plugin build & packaging...');

  const brand = JSON.parse(fs.readFileSync(BRAND_PATH, 'utf-8'));
  const version = brand.product.version;
  const slug = brand.product.slug; // mimic-manager

  // 1. Sync versions
  console.log('[1/6] Synchronizing artifact versions...');
  execSync('tsx scripts/plugin/version-sync.ts', { cwd: ROOT_DIR, stdio: 'inherit' });

  // 2. Generate WP.org directory assets
  console.log('[2/6] Generating WordPress.org directory assets...');
  execSync('tsx scripts/plugin/generate-assets.ts', { cwd: ROOT_DIR, stdio: 'inherit' });

  // 3. Production composer install
  console.log('[3/6] Running production Composer optimization in connectors/wordpress...');
  execSync('composer install --no-dev --optimize-autoloader --no-interaction --quiet', {
    cwd: WP_DIR,
    stdio: 'inherit',
  });

  // 4. Staging preparation
  console.log('[4/6] Staging plugin files with .distignore filtering...');
  const stagingDir = path.join(ROOT_DIR, 'tmp/plugin-build');
  const pluginStaging = path.join(stagingDir, slug);
  fs.rmSync(stagingDir, { recursive: true, force: true });
  fs.mkdirSync(pluginStaging, { recursive: true });

  const distIgnorePath = path.join(WP_DIR, '.distignore');
  const ignorePatterns = fs.existsSync(distIgnorePath)
    ? fs.readFileSync(distIgnorePath, 'utf-8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    : [];

  const shouldIgnore = (relPath: string) => {
    const parts = relPath.split(path.sep);
    for (const pat of ignorePatterns) {
      if (parts.includes(pat) || relPath.startsWith(pat) || relPath.endsWith(pat)) {
        return true;
      }
    }
    return false;
  };

  const allFiles = getAllFiles(WP_DIR);
  const packagedFiles: Array<{ path: string; size: number; sha256: string }> = [];

  for (const rel of allFiles) {
    if (shouldIgnore(rel)) continue;

    const src = path.join(WP_DIR, rel);
    const dest = path.join(pluginStaging, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);

    const stat = fs.statSync(src);
    packagedFiles.push({
      path: rel.replace(/\\/g, '/'),
      size: stat.size,
      sha256: computeFileHash(src),
    });
  }

  // 5. Build ZIP artifact (Single canonical package)
  console.log('[5/6] Creating production installable ZIP package...');
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // Clean existing zip files in dist/
  const existingZips = fs.readdirSync(DIST_DIR).filter(f => f.endsWith('.zip') || f.endsWith('.zip.sha256'));
  for (const f of existingZips) {
    fs.rmSync(path.join(DIST_DIR, f), { force: true });
  }

  const zipName = `${slug}.zip`;
  const zipPath = path.join(DIST_DIR, zipName);

  // Use system zip tool for standard POSIX zip with forward slashes
  execSync(`zip -r -q "${zipPath}" "${slug}"`, { cwd: stagingDir });

  const zipSize = fs.statSync(zipPath).size;
  const zipHash = computeFileHash(zipPath);

  // Write SHA256 checksum file
  fs.writeFileSync(`${zipPath}.sha256`, `${zipHash}  ${zipName}\n`, 'utf-8');

  // 6. Generate Manifest
  console.log('[6/6] Generating build manifest JSON...');
  let gitCommit = 'unknown';
  try {
    gitCommit = execSync('git rev-parse HEAD', { cwd: ROOT_DIR, encoding: 'utf-8' }).trim();
  } catch {}

  const manifest = {
    plugin: slug,
    version,
    builtAt: new Date().toISOString(),
    gitCommit,
    zipFile: zipName,
    zipSizeBytes: zipSize,
    zipSizeMb: (zipSize / (1024 * 1024)).toFixed(2),
    sha256: zipHash,
    fileCount: packagedFiles.length,
    files: packagedFiles,
  };

  const manifestPath = path.join(DIST_DIR, 'dist-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  fs.writeFileSync(path.join(WP_DIR, 'dist-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

  // Clean staging directory
  fs.rmSync(stagingDir, { recursive: true, force: true });

  // Restore dev dependencies in connectors/wordpress so local phpunit remains available
  try {
    execSync('composer install --quiet --no-interaction', { cwd: WP_DIR });
  } catch {}

  console.log(`\n======================================================`);
  console.log(`  Artifact: dist/${zipName}`);
  console.log(`  Size:     ${(zipSize / 1024).toFixed(1)} KB`);
  console.log(`  Files:    ${packagedFiles.length}`);
  console.log(`  SHA256:   ${zipHash}`);
  console.log(`======================================================\n`);
}

main().catch((err) => {
  console.error('[-] Plugin build failed:', err);
  process.exit(1);
});
