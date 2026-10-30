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
  console.log('[4/6] Staging plugin files for both wporg and github flavors...');
  const stagingBaseDir = path.join(ROOT_DIR, 'tmp/plugin-build');
  fs.rmSync(stagingBaseDir, { recursive: true, force: true });
  fs.mkdirSync(stagingBaseDir, { recursive: true });

  const distIgnorePath = path.join(WP_DIR, '.distignore');
  const ignorePatterns = fs.existsSync(distIgnorePath)
    ? fs.readFileSync(distIgnorePath, 'utf-8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    : [];

  const shouldIgnore = (relPath: string, isWpOrg: boolean) => {
    // wporg flavor MUST exclude src/Update
    if (isWpOrg && (relPath.startsWith('src/Update') || relPath.startsWith('src\\Update'))) {
      return true;
    }
    const parts = relPath.split(path.sep);
    for (const pat of ignorePatterns) {
      if (parts.includes(pat) || relPath.startsWith(pat) || relPath.endsWith(pat)) {
        return true;
      }
    }
    return false;
  };

  const allFiles = getAllFiles(WP_DIR);

  // Helper to package a flavor
  const packageFlavor = (flavorName: 'wporg' | 'github') => {
    const isWpOrg = flavorName === 'wporg';
    const flavorStaging = path.join(stagingBaseDir, flavorName, slug);
    fs.mkdirSync(flavorStaging, { recursive: true });

    const packagedFiles: Array<{ path: string; size: number; sha256: string }> = [];

    for (const rel of allFiles) {
      if (shouldIgnore(rel, isWpOrg)) continue;

      const src = path.join(WP_DIR, rel);
      const dest = path.join(flavorStaging, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }

    if (isWpOrg) {
      // Regenerate composer autoloader inside staging so classmaps contain 0 updater references
      try {
        execSync('composer dump-autoload --no-dev --optimize --no-interaction --quiet', {
          cwd: flavorStaging,
        });
      } catch {}
    }

    // Now collect packaged files from the staging directory
    const stagedRelFiles = getAllFiles(flavorStaging);
    for (const rel of stagedRelFiles) {
      const fullPath = path.join(flavorStaging, rel);
      const stat = fs.statSync(fullPath);
      packagedFiles.push({
        path: rel.replace(/\\/g, '/'),
        size: stat.size,
        sha256: computeFileHash(fullPath),
      });
    }

    const zipFileName = isWpOrg ? `${slug}.zip` : `${slug}-github.zip`;
    const zipFilePath = path.join(DIST_DIR, zipFileName);

    execSync(`zip -r -q "${zipFilePath}" "${slug}"`, { cwd: path.join(stagingBaseDir, flavorName) });

    const zipSize = fs.statSync(zipFilePath).size;
    const zipHash = computeFileHash(zipFilePath);
    fs.writeFileSync(`${zipFilePath}.sha256`, `${zipHash}  ${zipFileName}\n`, 'utf-8');

    return {
      zipFileName,
      zipFilePath,
      zipSize,
      zipHash,
      fileCount: packagedFiles.length,
      files: packagedFiles,
    };
  };

  // 5. Build ZIP artifacts
  console.log('[5/6] Creating production installable ZIP packages (wporg + github)...');
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // Clean existing zips in dist/
  const existingZips = fs.readdirSync(DIST_DIR).filter((f) => f.endsWith('.zip') || f.endsWith('.zip.sha256'));
  for (const f of existingZips) {
    fs.rmSync(path.join(DIST_DIR, f), { force: true });
  }

  const wporgArtifact = packageFlavor('wporg');
  const githubArtifact = packageFlavor('github');

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
    flavors: {
      wporg: {
        zipFile: wporgArtifact.zipFileName,
        zipSizeBytes: wporgArtifact.zipSize,
        zipSizeMb: (wporgArtifact.zipSize / (1024 * 1024)).toFixed(2),
        sha256: wporgArtifact.zipHash,
        fileCount: wporgArtifact.fileCount,
      },
      github: {
        zipFile: githubArtifact.zipFileName,
        zipSizeBytes: githubArtifact.zipSize,
        zipSizeMb: (githubArtifact.zipSize / (1024 * 1024)).toFixed(2),
        sha256: githubArtifact.zipHash,
        fileCount: githubArtifact.fileCount,
      },
    },
    // Backwards-compatible root fields mapping to wporg canonical package
    zipFile: wporgArtifact.zipFileName,
    zipSizeBytes: wporgArtifact.zipSize,
    zipSizeMb: (wporgArtifact.zipSize / (1024 * 1024)).toFixed(2),
    sha256: wporgArtifact.zipHash,
    fileCount: wporgArtifact.fileCount,
    files: wporgArtifact.files,
  };

  const manifestPath = path.join(DIST_DIR, 'dist-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  fs.writeFileSync(path.join(WP_DIR, 'dist-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

  // Clean staging
  fs.rmSync(stagingBaseDir, { recursive: true, force: true });

  // Restore dev dependencies in connectors/wordpress so local phpunit remains available
  try {
    execSync('composer install --quiet --no-interaction', { cwd: WP_DIR });
  } catch {}

  console.log(`\n======================================================`);
  console.log(`  WP.org Artifact: dist/${wporgArtifact.zipFileName}`);
  console.log(`  Size:            ${(wporgArtifact.zipSize / 1024).toFixed(1)} KB (Files: ${wporgArtifact.fileCount})`);
  console.log(`  SHA256:          ${wporgArtifact.zipHash}`);
  console.log(`------------------------------------------------------`);
  console.log(`  GitHub Artifact: dist/${githubArtifact.zipFileName}`);
  console.log(`  Size:            ${(githubArtifact.zipSize / 1024).toFixed(1)} KB (Files: ${githubArtifact.fileCount})`);
  console.log(`  SHA256:          ${githubArtifact.zipHash}`);
  console.log(`======================================================\n`);
}

main().catch((err) => {
  console.error('[-] Plugin build failed:', err);
  process.exit(1);
});
