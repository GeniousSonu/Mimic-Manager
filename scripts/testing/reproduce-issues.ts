import { chromium } from 'playwright-core';
import * as fs from 'fs';
import * as path from 'path';

async function reproduce() {
  const evidenceDir = path.join(process.cwd(), 'docs/project/evidence/plugin-repair/before');
  fs.mkdirSync(evidenceDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const consoleLogs: string[] = [];
  const networkErrors: any[] = [];

  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('requestfailed', req => {
    networkErrors.push({
      url: req.url(),
      failure: req.failure()?.errorText
    });
  });

  console.log('[M1] 1. Logging into WordPress wp-admin...');
  await page.goto('http://localhost:8888/wp-login.php', { waitUntil: 'networkidle' });
  await page.fill('#user_login', 'admin');
  await page.fill('#user_pass', 'password');
  await page.click('#wp-submit');
  await page.waitForNavigation({ waitUntil: 'networkidle' });

  // Report 1: Inspect Left-Side Menu
  console.log('[M1] 2. Checking Left Menu in wp-admin dashboard...');
  await page.screenshot({ path: path.join(evidenceDir, '01-wp-admin-dashboard-left-menu.png'), fullPage: false });

  const menuSelector = 'a.toplevel_page_mimic-manager';
  const menuExists = await page.$(menuSelector);
  const submenus = await page.$$('li.toplevel_page_mimic-manager .wp-submenu li');
  console.log(`Menu exists: ${!!menuExists}, Submenu items count: ${submenus.length}`);

  // Click on Mimic Manager menu
  if (menuExists) {
    await page.click(menuSelector);
    await page.waitForSelector('#mimic-manager-root', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(evidenceDir, '01-mimic-manager-dashboard.png') });
  }

  // Report 2: File Manager
  console.log('[M1] 3. Checking File Manager screen...');
  await page.goto('http://localhost:8888/wp-admin/admin.php?page=mimic-manager#/files', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(evidenceDir, '02-file-manager-read-only.png') });

  // Attempt right click on file manager grid
  const fmGrid = await page.$('.mm-fm-grid');
  if (fmGrid) {
    await fmGrid.click({ button: 'right' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(evidenceDir, '02-file-manager-right-click-attempt.png') });
  }

  // Report 3: Pairing / Sites
  console.log('[M1] 4. Checking Sites / Connection screen in plugin...');
  await page.goto('http://localhost:8888/wp-admin/admin.php?page=mimic-manager#/sites', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(evidenceDir, '03-sites-connection-screen.png') });

  // Report 4: Media UI
  console.log('[M1] 5. Checking Media UI screen...');
  await page.goto('http://localhost:8888/wp-admin/admin.php?page=mimic-manager#/media', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(evidenceDir, '04-media-ui-screen.png') });

  // Also check upload image via WP-CLI and check if it shows in Mimic Manager
  fs.writeFileSync(
    path.join(evidenceDir, 'logs-and-diagnostics.json'),
    JSON.stringify({
      consoleLogs,
      networkErrors,
      menuExists: !!menuExists,
      submenuCount: submenus.length
    }, null, 2)
  );

  console.log('[M1] Reproduction run completed. Evidence saved to docs/project/evidence/plugin-repair/before/');
  await browser.close();
}

reproduce().catch(err => {
  console.error('[M1 ERROR]', err);
  process.exit(1);
});
