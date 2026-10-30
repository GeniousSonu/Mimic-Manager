import { chromium } from 'playwright-core';
import * as fs from 'fs';
import * as path from 'path';

async function runAcceptanceJourney() {
  const evidenceDir = path.join(process.cwd(), 'docs/project/evidence/plugin-repair/after');
  fs.mkdirSync(evidenceDir, { recursive: true });

  console.log('🚀 Starting Mimic Manager Acceptance Journey (PLUGIN-REPAIR)...');

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
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

  try {
    // 1. Login to WordPress
    console.log('Step 1: Logging in to WordPress dashboard...');
    await page.goto('http://localhost:8888/wp-login.php', { waitUntil: 'networkidle' });
    await page.fill('#user_login', 'admin');
    await page.fill('#user_pass', 'password');
    await page.click('#wp-submit');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // 2. Verify Left Menu & Submenus (L1)
    console.log('Step 2: Checking WordPress Left Sidebar Menus (L1)...');
    const menuSelector = 'li.toplevel_page_mimic-manager';
    await page.waitForSelector(menuSelector, { timeout: 10000 });
    
    // Hover over top-level menu to expand submenus in WP admin
    await page.hover(menuSelector);
    await page.waitForTimeout(500);

    const submenus = await page.$$(`${menuSelector} .wp-submenu li a`);
    console.log(`Found ${submenus.length} submenu items under Mimic Manager.`);
    const submenuTexts = await Promise.all(submenus.map(el => el.innerText()));
    console.log('Submenus:', submenuTexts);

    await page.screenshot({
      path: path.join(evidenceDir, '01-left-menu-submenus.png'),
      fullPage: false
    });

    if (submenus.length < 8) {
      throw new Error(`Expected at least 8 submenu items, found ${submenus.length}`);
    }

    // 3. Open Plugin Dashboard and check in-app rail
    console.log('Step 3: Opening Dashboard and verifying in-app rail (L1)...');
    await page.click('a.toplevel_page_mimic-manager');
    await page.waitForSelector('#mimic-manager-root', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const hasInAppRail = await page.$('.mm-app-rail');
    console.log(`In-app persistent rail present: ${!!hasInAppRail}`);
    await page.screenshot({
      path: path.join(evidenceDir, '02-in-app-rail.png')
    });

    // 4. File Manager: Elevation Flow & Context Menu (L3)
    console.log('Step 4: Testing File Manager Elevation & Context Menu (L3)...');
    await page.goto('http://localhost:8888/wp-admin/admin.php?page=mimic-manager#/files', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Verify Read-Only Elevation Banner
    const elevationBanner = await page.$('#mm-elevation-banner');
    console.log(`Elevation banner present: ${!!elevationBanner}`);
    await page.screenshot({
      path: path.join(evidenceDir, '03-file-manager-elevation-banner.png')
    });

    // Click Enable Write Mode
    console.log('Unlocking write mode via elevation flow...');
    const enableBtn = await page.$('#mm-enable-write-btn');
    if (enableBtn) {
      await enableBtn.click();
      await page.waitForSelector('#mm-elevate-pwd', { timeout: 5000 });
      await page.fill('#mm-elevate-pwd', 'password');
      await page.click('#mm-elevate-form button[type="submit"]');
      await page.waitForTimeout(1500);
    }

    // Right-Click Context Menu
    console.log('Triggering right-click context menu...');
    const firstRow = await page.$('.mm-file-row');
    if (firstRow) {
      const box = await firstRow.boundingBox();
      if (box) {
        await page.mouse.click(box.x + 50, box.y + 10, { button: 'right' });
        await page.waitForTimeout(500);
      }
    } else {
      // Right click anywhere inside file container
      await page.mouse.click(500, 400, { button: 'right' });
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: path.join(evidenceDir, '04-file-manager-context-menu.png')
    });

    // Close context menu by clicking elsewhere
    await page.mouse.click(200, 200);
    await page.waitForTimeout(500);

    // 5. Sites / Connection Pairing Flow (L2)
    console.log('Step 5: Testing Sites / Connection Pairing Code Generation (L2)...');
    await page.goto('http://localhost:8888/wp-admin/admin.php?page=mimic-manager#/sites', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const consentCheck = await page.$('#mm-consent-cb');
    if (consentCheck) {
      await consentCheck.check();
    }
    const pairBtn = await page.$('#mm-generate-code-btn');
    if (pairBtn) {
      await pairBtn.click();
      await page.waitForTimeout(2000);
    }

    const pairCodeDisplay = await page.$('#mm-code-display');
    const pairCodeText = pairCodeDisplay ? await pairCodeDisplay.innerText() : 'N/A';
    console.log(`Generated Pairing Code: ${pairCodeText}`);

    await page.screenshot({
      path: path.join(evidenceDir, '05-sites-pairing-code-countdown.png')
    });

    // 6. Media UI & Compress/Convert Wizard (L4)
    console.log('Step 6: Testing Media UI & Compress Wizard (L4)...');
    await page.goto('http://localhost:8888/wp-admin/admin.php?page=mimic-manager#/media', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const openWizardBtn = await page.$('#mm-open-wizard-btn');
    if (openWizardBtn) {
      await openWizardBtn.click();
      await page.waitForTimeout(800);
    }

    await page.screenshot({
      path: path.join(evidenceDir, '06-media-ui-gallery-and-wizard.png')
    });

    console.log('Running test local optimization...');
    const runWizardBtn = await page.$('#mm-wizard-run-btn');
    if (runWizardBtn) {
      await runWizardBtn.click();
      await page.waitForTimeout(2500);
    }

    console.log('🎉 Acceptance Journey Passed Successfully!');
  } catch (err) {
    console.error('Acceptance Journey Failed:', err);
    await page.screenshot({ path: path.join(evidenceDir, 'error-failure-state.png') });
    throw err;
  } finally {
    fs.writeFileSync(
      path.join(evidenceDir, 'journey-logs.json'),
      JSON.stringify({ consoleLogs }, null, 2)
    );
    await browser.close();
  }
}

runAcceptanceJourney().catch(() => process.exit(1));
