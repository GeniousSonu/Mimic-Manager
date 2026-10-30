import { chromium } from 'playwright-core';
import * as fs from 'fs';
import * as path from 'path';

async function reproduceAddendumM() {
  const evidenceDir = path.join(process.cwd(), 'docs/project/evidence/plugin-repair-2/before');
  fs.mkdirSync(evidenceDir, { recursive: true });

  console.log('🔍 [M1 Reproduction] Initializing headless Playwright audit on current build...');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Use a height of 600px where admin menu exceeds viewport
  const context = await browser.newContext({
    viewport: { width: 1280, height: 600 }
  });
  const page = await context.newPage();

  const consoleLogs: string[] = [];
  const networkFailures: any[] = [];

  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('requestfailed', req => {
    networkFailures.push({
      url: req.url(),
      failure: req.failure()?.errorText
    });
  });

  // 1. Log in to WordPress
  console.log('[M1] 1. Logging into WordPress...');
  await page.goto('http://localhost:8888/wp-login.php', { waitUntil: 'networkidle' });
  await page.fill('#user_login', 'admin');
  await page.fill('#user_pass', 'password');
  await page.click('#wp-submit');
  await page.waitForNavigation({ waitUntil: 'networkidle' });

  // 2. Problem 1: Left Menu Scroll / Stuck
  console.log('[M1] 2. Checking Left Menu scrolling on Mimic Manager screen...');
  await page.goto('http://localhost:8888/wp-admin/admin.php?page=mimic-manager#/dashboard', { waitUntil: 'networkidle' });
  await page.waitForSelector('#mimic-manager-root', { timeout: 10000 });
  await page.waitForTimeout(500);

  // Capture computed styles of specified elements
  const computedStyles = await page.evaluate(`(() => {
    function getStyles(selector) {
      const el = document.querySelector(selector);
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      return {
        overflow: cs.overflow,
        overflowY: cs.overflowY,
        overflowX: cs.overflowX,
        height: cs.height,
        position: cs.position,
        top: cs.top,
        maxHeight: cs.maxHeight,
        boxSizing: cs.boxSizing
      };
    }
    return {
      html: getStyles('html'),
      body: getStyles('body'),
      wpwrap: getStyles('#wpwrap'),
      adminmenuwrap: getStyles('#adminmenuwrap'),
      adminmenu: getStyles('#adminmenu'),
      wpcontent: getStyles('#wpcontent')
    };
  })()`);

  fs.writeFileSync(
    path.join(evidenceDir, 'computed-styles.json'),
    JSON.stringify(computedStyles, null, 2)
  );

  // Measure initial scroll positions
  const initialScroll = await page.evaluate(`(() => {
    const menuWrap = document.querySelector('#adminmenuwrap');
    const menu = document.querySelector('#adminmenu');
    return {
      windowScrollY: window.scrollY,
      bodyScrollTop: document.body.scrollTop,
      menuWrapScrollTop: menuWrap ? menuWrap.scrollTop : null,
      menuScrollTop: menu ? menu.scrollTop : null,
      menuHeight: menu ? menu.getBoundingClientRect().height : null,
      viewportHeight: window.innerHeight
    };
  })()`);

  // Hover over #adminmenu and attempt mouse wheel scroll
  const adminMenuBox = await page.locator('#adminmenu').boundingBox();
  let wheelScrolled = false;
  if (adminMenuBox) {
    await page.mouse.move(adminMenuBox.x + 50, adminMenuBox.y + 100);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(300);
  }

  const afterScroll = await page.evaluate(`(() => {
    const menuWrap = document.querySelector('#adminmenuwrap');
    const menu = document.querySelector('#adminmenu');
    return {
      windowScrollY: window.scrollY,
      bodyScrollTop: document.body.scrollTop,
      menuWrapScrollTop: menuWrap ? menuWrap.scrollTop : null,
      menuScrollTop: menu ? menu.scrollTop : null
    };
  })()`);

  console.log('[M1] Left Menu Initial vs After Wheel Scroll:', { initialScroll, afterScroll });

  await page.screenshot({
    path: path.join(evidenceDir, '01-left-menu-scroll-stuck.png'),
    fullPage: false
  });

  // 3. Problem 2: Context Menu Options & Multi-Select
  console.log('[M1] 3. Checking File Manager Context Menu items...');
  await page.goto('http://localhost:8888/wp-admin/admin.php?page=mimic-manager#/files', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Trigger right-click on first file/folder node
  const firstNode = page.locator('.mm-fm-node').first();
  let contextMenuItems: string[] = [];
  if (await firstNode.count() > 0) {
    await firstNode.click({ button: 'right' });
    await page.waitForTimeout(300);
    const menuItems = await page.locator('#mm-context-menu .mm-context-item').allTextContents();
    contextMenuItems = menuItems.map(s => s.trim());
    console.log('[M1] File Context Menu items found:', contextMenuItems);
    await page.screenshot({ path: path.join(evidenceDir, '02-file-manager-context-menu.png') });
  }

  // 4. Problem 3: UI Replicator End-to-End Check
  console.log('[M1] 4. Checking UI Replicator in plugin and API...');
  let replicatorRestResponse: any = null;
  try {
    const res = await page.request.get('http://localhost:8888/wp-json/mimic-manager/v1/replicator/status');
    replicatorRestResponse = {
      status: res.status(),
      body: await res.text()
    };
  } catch (err: any) {
    replicatorRestResponse = { error: err.message };
  }
  console.log('[M1] Replicator REST Status Endpoint result:', replicatorRestResponse);

  // Also check if replicator is accessible via hash route
  await page.goto('http://localhost:8888/wp-admin/admin.php?page=mimic-manager#/replicator', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const replicatorScreenText = await page.locator('#mimic-manager-root').textContent();
  await page.screenshot({ path: path.join(evidenceDir, '03-replicator-screen.png') });

  // 5. Gather debug.log if present
  let debugLog = '';
  try {
    const debugLogPath = '/var/www/html/wp-content/debug.log';
    const { execSync } = require('child_process');
    debugLog = execSync('docker exec mimic_wp cat /var/www/html/wp-content/debug.log 2>/dev/null || true').toString();
  } catch (e) {
    debugLog = 'No debug.log found or docker exec error';
  }
  fs.writeFileSync(path.join(evidenceDir, 'debug.log'), debugLog);

  // 6. Write comprehensive diagnostics summary
  fs.writeFileSync(
    path.join(evidenceDir, 'logs-and-diagnostics.json'),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      computedStyles,
      initialScroll,
      afterScroll,
      contextMenuItems,
      contextMenuItemCount: contextMenuItems.length,
      replicatorRestResponse,
      replicatorScreenSample: replicatorScreenText?.substring(0, 300),
      consoleLogs,
      networkFailures
    }, null, 2)
  );

  await browser.close();
  console.log('✅ [M1 Reproduction Complete] Evidence written to docs/project/evidence/plugin-repair-2/before/');
}

reproduceAddendumM().catch(err => {
  console.error('[M1 ERROR]', err);
  process.exit(1);
});
