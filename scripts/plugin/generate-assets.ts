import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const ROOT_DIR = process.cwd();
const WP_ORG_DIR = path.join(ROOT_DIR, 'connectors/wordpress/.wordpress-org');
const MARK_SVG_PATH = path.join(ROOT_DIR, 'packages/ui/brand/mark.svg');

async function main() {
  console.log('[plugin:assets] Generating WordPress.org directory assets...');
  fs.mkdirSync(WP_ORG_DIR, { recursive: true });
  fs.mkdirSync(path.join(WP_ORG_DIR, 'blueprints'), { recursive: true });

  const svgBuffer = fs.readFileSync(MARK_SVG_PATH);

  // 1. icon.svg
  fs.copyFileSync(MARK_SVG_PATH, path.join(WP_ORG_DIR, 'icon.svg'));
  console.log('  [✓] Generated icon.svg');

  // 2. icon-128x128.png
  await sharp(svgBuffer)
    .resize(128, 128)
    .png()
    .toFile(path.join(WP_ORG_DIR, 'icon-128x128.png'));
  console.log('  [✓] Generated icon-128x128.png');

  // 3. icon-256x256.png
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile(path.join(WP_ORG_DIR, 'icon-256x256.png'));
  console.log('  [✓] Generated icon-256x256.png');

  // 4. Banners: Dark theme with centered mark, brand title, and tagline
  const createBannerSvg = (width: number, height: number, fontSizeTitle: number, fontSizeSubtitle: number) => `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0a0c10"/>
          <stop offset="50%" stop-color="#141824"/>
          <stop offset="100%" stop-color="#0d1017"/>
        </linearGradient>
        <radialGradient id="accentGlow" cx="20%" cy="50%" r="60%">
          <stop offset="0%" stop-color="#7c6cff" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#7c6cff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <rect width="${width}" height="${height}" fill="url(#accentGlow)"/>
      <text x="${width * 0.42}" y="${height * 0.45}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="800" font-size="${fontSizeTitle}" fill="#ffffff" letter-spacing="-0.5px">Mimic Manager</text>
      <text x="${width * 0.42}" y="${height * 0.65}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="500" font-size="${fontSizeSubtitle}" fill="#a5aec0">High-Performance Image, PageSpeed &amp; SEO Engine</text>
    </svg>
  `;

  // Banner 772x250
  const banner772Svg = Buffer.from(createBannerSvg(772, 250, 42, 18));
  const markResized772 = await sharp(svgBuffer).resize(160, 160).png().toBuffer();
  await sharp(banner772Svg)
    .composite([{ input: markResized772, top: 45, left: 60 }])
    .png()
    .toFile(path.join(WP_ORG_DIR, 'banner-772x250.png'));
  console.log('  [✓] Generated banner-772x250.png');

  // Banner 1544x500 (Retina)
  const banner1544Svg = Buffer.from(createBannerSvg(1544, 500, 84, 36));
  const markResized1544 = await sharp(svgBuffer).resize(320, 320).png().toBuffer();
  await sharp(banner1544Svg)
    .composite([{ input: markResized1544, top: 90, left: 120 }])
    .png()
    .toFile(path.join(WP_ORG_DIR, 'banner-1544x500.png'));
  console.log('  [✓] Generated banner-1544x500.png');

  // 5. Generate Screenshots (1 to 5) matching readme captions
  const screenshots = [
    { name: 'screenshot-1.png', caption: 'Dashboard: Local Image Optimizer & Telemetry-Free Privacy' },
    { name: 'screenshot-2.png', caption: 'Media Library: Native WebP Compression & Savings' },
    { name: 'screenshot-3.png', caption: 'PageSpeed Engine: Core Web Vitals Tier 1 Fixes' },
    { name: 'screenshot-4.png', caption: 'SEO Gap Fill: Native Schema & Plugin Metadata Sync' },
    { name: 'screenshot-5.png', caption: 'Sandboxed File Manager: wp-content Jailed Explorer' },
  ];

  for (let i = 0; i < screenshots.length; i++) {
    const s = screenshots[i];
    const escapedCaption = s.caption.replace(/&/g, '&amp;');
    const sSvg = Buffer.from(`
      <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
        <rect width="1280" height="720" fill="#0d1117"/>
        <rect x="40" y="40" width="1200" height="640" rx="12" fill="#161b22" stroke="#30363d" stroke-width="2"/>
        <circle cx="70" cy="70" r="6" fill="#f85149"/>
        <circle cx="90" cy="70" r="6" fill="#d29922"/>
        <circle cx="110" cy="70" r="6" fill="#238636"/>
        <text x="640" y="75" font-family="-apple-system, sans-serif" font-weight="600" font-size="16" fill="#8b949e" text-anchor="middle">Mimic Manager — ${escapedCaption}</text>
        <line x1="40" y1="100" x2="1240" y2="100" stroke="#30363d" stroke-width="1"/>
        <rect x="80" y="140" width="340" height="200" rx="8" fill="#21262d" stroke="#30363d"/>
        <rect x="460" y="140" width="340" height="200" rx="8" fill="#21262d" stroke="#30363d"/>
        <rect x="840" y="140" width="360" height="200" rx="8" fill="#21262d" stroke="#30363d"/>
        <rect x="80" y="380" width="1120" height="260" rx="8" fill="#21262d" stroke="#30363d"/>
        <text x="640" y="520" font-family="-apple-system, sans-serif" font-weight="700" font-size="28" fill="#e6edf3" text-anchor="middle">${escapedCaption}</text>
      </svg>
    `);
    await sharp(sSvg).png().toFile(path.join(WP_ORG_DIR, s.name));
    console.log(`  [✓] Generated ${s.name}`);
  }

  // 6. Playground Blueprint (blueprints/blueprint.json)
  const blueprint = {
    $schema: 'https://playground.wordpress.net/blueprint-schema.json',
    landingPage: '/wp-admin/admin.php?page=mimic-manager',
    preferredVersions: {
      php: '8.2',
      wp: '6.7',
    },
    steps: [
      {
        step: 'installPlugin',
        pluginZipFile: {
          resource: 'wordpress.org/plugins',
          slug: 'mimic-manager',
        },
        options: {
          activate: true,
        },
      },
    ],
  };

  fs.writeFileSync(
    path.join(WP_ORG_DIR, 'blueprints/blueprint.json'),
    JSON.stringify(blueprint, null, 2) + '\n',
    'utf-8',
  );
  console.log('  [✓] Generated blueprints/blueprint.json');

  console.log('[✓] All WordPress.org assets successfully generated.');
}

main().catch((err) => {
  console.error('[-] Asset generation failed:', err);
  process.exit(1);
});
