import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const ROOT_DIR = process.cwd();
const GITHUB_ASSETS_DIR = path.join(ROOT_DIR, '.github/assets');
const UI_BRAND_DIR = path.join(ROOT_DIR, 'packages/ui/brand');
const PWA_PUBLIC_DIR = path.join(ROOT_DIR, 'apps/pwa/public');
const MARK_SVG_PATH = path.join(UI_BRAND_DIR, 'mark.svg');

async function main() {
  console.log('[brand:assets] Generating GitHub repository branding & social preview assets...');

  fs.mkdirSync(GITHUB_ASSETS_DIR, { recursive: true });
  fs.mkdirSync(UI_BRAND_DIR, { recursive: true });
  fs.mkdirSync(PWA_PUBLIC_DIR, { recursive: true });

  const svgBuffer = fs.readFileSync(MARK_SVG_PATH);

  // 1. Copy mark.svg to .github/assets/
  fs.copyFileSync(MARK_SVG_PATH, path.join(GITHUB_ASSETS_DIR, 'mark.svg'));

  // 2. Generate logo-dark.svg & logo-light.svg
  const createLogoSvg = (isDark: boolean) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 80" width="400" height="80" fill="none">
      <g transform="translate(10, 8) scale(0.0625)">
        <path d="M512 621 838 805Q855 815 838 829L538 1000Q512 1015 486 1000L186 829Q169 815 186 805Z" fill="#6C2A00"/>
        <path d="M512 432 837 616Q856 627 837 641L538 812Q512 827 486 812L187 641Q168 627 187 616Z" fill="#FFB13A"/>
        <path d="M512 234 837 418Q856 429 837 443L538 614Q512 629 486 614L187 443Q168 429 187 418Z" fill="#00E5FF"/>
      </g>
      <text x="80" y="52" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="32" font-weight="800" fill="${isDark ? '#F4F4F6' : '#0A0A0B'}" letter-spacing="-0.8px">
        Mimic <tspan fill="#7B61FF">Manager</tspan>
      </text>
    </svg>
  `;

  fs.writeFileSync(path.join(GITHUB_ASSETS_DIR, 'logo-dark.svg'), createLogoSvg(true), 'utf-8');
  fs.writeFileSync(path.join(GITHUB_ASSETS_DIR, 'logo-light.svg'), createLogoSvg(false), 'utf-8');
  fs.writeFileSync(path.join(UI_BRAND_DIR, 'logo-dark.svg'), createLogoSvg(true), 'utf-8');
  fs.writeFileSync(path.join(UI_BRAND_DIR, 'logo-light.svg'), createLogoSvg(false), 'utf-8');
  console.log('  [✓] Generated logo-dark.svg and logo-light.svg');

  // 3. Social Preview (1280x640) for GitHub repo
  const socialSvg = Buffer.from(`
    <svg width="1280" height="640" viewBox="0 0 1280 640" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0A0A0B"/>
          <stop offset="50%" stop-color="#161618"/>
          <stop offset="100%" stop-color="#0A0A0B"/>
        </linearGradient>
        <radialGradient id="cyanGlow" cx="20%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#00E5FF" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="violetGlow" cx="80%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#7B61FF" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#7B61FF" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1280" height="640" fill="url(#bg)"/>
      <rect width="1280" height="640" fill="url(#cyanGlow)"/>
      <rect width="1280" height="640" fill="url(#violetGlow)"/>

      <text x="440" y="270" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="900" font-size="64" fill="#F4F4F6" letter-spacing="-1.5px">Mimic <tspan fill="#7B61FF">Manager</tspan></text>
      <text x="440" y="340" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="500" font-size="24" fill="#00E5FF" letter-spacing="-0.5px">High-Performance Image, PageSpeed &amp; SEO Engine</text>
      <text x="440" y="390" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="400" font-size="18" fill="#A1A1AA">Headless Self-Hosted Backend + WordPress SPA Command Center</text>

      <g transform="translate(440, 440)">
        <rect width="150" height="36" rx="6" fill="#1F1F23" stroke="#28282E" stroke-width="1"/>
        <text x="75" y="23" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#28C76F" text-anchor="middle">AGPL-3.0 / GPL-2.0+</text>
      </g>
      <g transform="translate(610, 440)">
        <rect width="140" height="36" rx="6" fill="#1F1F23" stroke="#28282E" stroke-width="1"/>
        <text x="70" y="23" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#00E5FF" text-anchor="middle">100% Free &amp; Local</text>
      </g>
    </svg>
  `);

  const markPng280 = await sharp(svgBuffer).resize(280, 280).png().toBuffer();
  await sharp(socialSvg)
    .composite([{ input: markPng280, top: 180, left: 100 }])
    .png()
    .toFile(path.join(GITHUB_ASSETS_DIR, 'social-preview.png'));
  console.log('  [✓] Generated 1280x640 social-preview.png');

  // 4. PWA Icons (192, 512, favicon)
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(PWA_PUBLIC_DIR, 'icon-192.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(PWA_PUBLIC_DIR, 'icon-512.png'));
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(PWA_PUBLIC_DIR, 'favicon.png'));
  fs.copyFileSync(MARK_SVG_PATH, path.join(PWA_PUBLIC_DIR, 'favicon.svg'));
  console.log('  [✓] Generated PWA icons & favicons');

  console.log('[✓] Repository brand assets successfully generated.');
}

main().catch((err) => {
  console.error('[-] Asset generation failed:', err);
  process.exit(1);
});
