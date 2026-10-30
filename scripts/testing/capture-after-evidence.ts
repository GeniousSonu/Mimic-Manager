import { chromium } from 'playwright-core';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

async function captureAfterEvidence() {
  const afterDir = path.join(process.cwd(), 'docs/project/evidence/plugin-repair-2/after');
  fs.mkdirSync(afterDir, { recursive: true });

  console.log('📸 [Capture After Evidence] Starting Playwright browser on live WordPress container...');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 600 }
  });
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // 1. Log in
  console.log('[After] 1. Logging in to WordPress...');
  await page.goto('http://localhost:8888/wp-login.php', { waitUntil: 'networkidle' });
  await page.fill('#user_login', 'admin');
  await page.fill('#user_pass', 'password');
  await page.click('#wp-submit');
  await page.waitForNavigation({ waitUntil: 'networkidle' });

  // 2. Left Menu Scroll & Body Overflow
  console.log('[After] 2. Verifying Left Menu scrolling on Mimic Manager screen...');
  await page.goto('http://localhost:8888/wp-admin/admin.php?page=mimic-manager#/dashboard', { waitUntil: 'networkidle' });
  await page.waitForSelector('#mimic-manager-root', { timeout: 10000 });
  await page.waitForTimeout(500);

  const bodyOverflow = await page.evaluate(() => window.getComputedStyle(document.body).overflow);
  const htmlOverflow = await page.evaluate(() => window.getComputedStyle(document.documentElement).overflow);

  // Wheel scroll test over admin menu
  const adminMenuBox = await page.locator('#adminmenu').boundingBox();
  if (adminMenuBox) {
    await page.mouse.move(adminMenuBox.x + 50, adminMenuBox.y + 100);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(300);
  }

  const scrollPositions = await page.evaluate(() => ({
    scrollY: window.scrollY,
    bodyScrollTop: document.body.scrollTop,
    htmlOverflow: window.getComputedStyle(document.documentElement).overflow,
    bodyOverflow: window.getComputedStyle(document.body).overflow
  }));

  await page.screenshot({
    path: path.join(afterDir, '01-left-menu-scroll.png'),
    fullPage: false
  });
  console.log('[After] Left Menu scroll result:', scrollPositions);

  // 3. File Manager Context Menu & Command Palette
  console.log('[After] 3. File Manager Context Menu & Multi-Select & Palette...');
  await page.goto('http://localhost:8888/wp-admin/admin.php?page=mimic-manager#/files', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const nodeCount = await page.locator('.mm-fm-node').count();
  if (nodeCount > 0) {
    // Single node context menu
    await page.locator('.mm-fm-node').first().click({ button: 'right' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(afterDir, '02-file-manager-context-menu.png') });

    // Dismiss context menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Open Command Palette with Ctrl+K
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(afterDir, '03-command-palette.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }

  // 4. UI Replicator Studio
  console.log('[After] 4. Testing UI Replicator Studio...');
  await page.goto('http://localhost:8888/wp-admin/admin.php?page=mimic-manager#/replicator', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check Mode A badge
  const replicatorText = await page.locator('#mimic-manager-root').textContent();
  console.log('[After] Replicator Studio loaded. Active badge found:', replicatorText?.includes('Mode A'));

  // Switch to HTML mode and paste sample pricing section
  const toggleBtn = page.locator('#mm-rep-toggle-input');
  if (await toggleBtn.count() > 0) {
    await toggleBtn.click();
    await page.waitForTimeout(300);

    const fixturePath = path.join(process.cwd(), 'test/fixtures/replicator/02-pricing.html');
    const fixtureHtml = fs.readFileSync(fixturePath, 'utf-8');
    await page.fill('#mm-rep-html-input', fixtureHtml);

    // Click Compile
    const extractBtn = page.locator('#mm-rep-extract-html-btn');
    if (await extractBtn.count() > 0) {
      await extractBtn.click();
      await page.waitForTimeout(1500);
      console.log('[After] Extraction triggered. Checking preview & output...');
      await page.screenshot({ path: path.join(afterDir, '04-replicator-studio-extracted.png') });

      // Click "Create as Draft Page"
      const draftBtn = page.locator('#mm-rep-create-draft-btn');
      if (await draftBtn.count() > 0 && !(await draftBtn.isDisabled())) {
        await draftBtn.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(afterDir, '05-replicator-draft-created.png') });
        console.log('[After] Draft page created successfully.');
      }
    }
  }

  // 5. Check debug.log for notices/errors
  let debugLog = '';
  try {
    debugLog = execSync('docker exec mimic_wp cat /var/www/html/wp-content/debug.log 2>/dev/null || true').toString();
  } catch (e) {
    debugLog = 'No debug log';
  }
  fs.writeFileSync(path.join(afterDir, 'debug.log'), debugLog);

  // 6. Save after audit diagnostics
  fs.writeFileSync(
    path.join(afterDir, 'after-diagnostics.json'),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      scrollPositions,
      bodyOverflow,
      htmlOverflow,
      nodeCount,
      consoleErrors,
      debugLogSize: debugLog.length
    }, null, 2)
  );

  await browser.close();
  console.log('✅ [After Evidence Complete] All after screenshots and diagnostics recorded.');
}

captureAfterEvidence().catch(err => {
  console.error('[After Evidence Error]', err);
  process.exit(1);
});
