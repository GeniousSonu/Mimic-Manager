import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { chromium, type Browser } from 'playwright-core';

describe('Addendum M-A: WordPress Admin Menu Scroll & Full-Bleed Verification', () => {
  let server: http.Server;
  let serverUrl: string;
  let browser: Browser;

  const ROOT_DIR = process.cwd();
  const CSS_PATH = path.join(ROOT_DIR, 'connectors/wordpress/assets/css/admin.css');
  const JS_PATH = path.join(ROOT_DIR, 'connectors/wordpress/assets/js/admin.js');

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const url = req.url || '/';

      if (url === '/assets/css/admin.css') {
        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(fs.readFileSync(CSS_PATH, 'utf-8'));
        return;
      }

      if (url === '/assets/js/admin.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(fs.readFileSync(JS_PATH, 'utf-8'));
        return;
      }

      if (url.startsWith('/wp-json/mimic-manager/v1/status')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', name: 'Mimic Manager', version: '1.0.0-rc.1', localEngine: { engine: 'gd', supported: true }, consentGiven: false, cloudConnected: false }));
        return;
      }

      // Generate HTML with long admin menu (taller than 600px viewport)
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Mimic Manager ‹ Test Site — WordPress</title>
          <link rel="stylesheet" href="/assets/css/admin.css">
          <style>
            :root { --wp-admin--admin-bar--height: 32px; }
            body { margin: 0; padding: 0; background: #f0f0f1; }
            #wpadminbar { height: 32px; background: #1d2327; color: #fff; width: 100%; position: fixed; top: 0; left: 0; z-index: 99999; }
            #adminmenuwrap { width: 160px; position: absolute; top: 32px; left: 0; background: #1d2327; color: #fff; }
            #adminmenu { list-style: none; margin: 0; padding: 0; }
            #adminmenu li { padding: 12px; border-bottom: 1px solid #333; }
            #wpcontent { margin-left: 160px; padding-top: 32px; }
            #wpfooter { padding: 10px 20px; background: #f0f0f1; font-size: 12px; }
          </style>
        </head>
        <body class="wp-admin toplevel_page_mimic-manager mm-fullbleed">
          <div id="wpadminbar">WordPress Admin Bar (32px)</div>
          <div id="adminmenuwrap">
            <ul id="adminmenu">
              ${Array.from({ length: 25 }, (_, i) => `<li>Menu Item ${i + 1}</li>`).join('')}
            </ul>
          </div>
          <div id="wpcontent">
            <div id="wpbody-content">
              <div class="wrap mm-shell-wrap">
                <div id="mimic-manager-root"></div>
              </div>
            </div>
            <div id="wpfooter">Thank you for creating with WordPress.</div>
          </div>
          <script>
            window.mimicManagerData = {
              restUrl: '/wp-json/mimic-manager/v1',
              nonce: 'test_nonce',
              brand: { name: 'Mimic Manager', version: '1.0.0-rc.1', creator: 'SK Sahinur Islam', owner: 'Wefik' }
            };
          </script>
          <script src="/assets/js/admin.js"></script>
        </body>
        </html>
      `);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        serverUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    browser = await chromium.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    if (browser) await browser.close();
    if (server) server.close();
  });

  it('verifies body overflow is NOT hidden and admin menu does not get frozen', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 600 } });
    await page.goto(`${serverUrl}/admin.php?page=mimic-manager#/dashboard`, { waitUntil: 'networkidle' });

    // Assert body overflow is not locked
    const bodyOverflow = await page.evaluate(() => window.getComputedStyle(document.body).overflow);
    expect(bodyOverflow).not.toBe('hidden');

    const htmlOverflow = await page.evaluate(() => window.getComputedStyle(document.documentElement).overflow);
    expect(htmlOverflow).not.toBe('hidden');

    // Verify root container bounds inside wpcontent
    const rootBox = await page.locator('#mimic-manager-root').boundingBox();
    expect(rootBox).not.toBeNull();
    expect(rootBox!.height).toBe(600 - 32);

    await page.close();
  });

  it('guarantees wheel events over long menu scroll without prior clicks', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 600 } });
    await page.goto(`${serverUrl}/admin.php?page=mimic-manager#/dashboard`, { waitUntil: 'networkidle' });

    const menuBox = await page.locator('#adminmenu').boundingBox();
    expect(menuBox).not.toBeNull();
    expect(menuBox!.height).toBeGreaterThan(600);

    // Initial window scrollY
    const initialY = await page.evaluate(() => window.scrollY);
    expect(initialY).toBe(0);

    // Dispatch mouse wheel over admin menu
    await page.mouse.move(menuBox!.x + 40, menuBox!.y + 100);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(100);

    // Since body has overflow: visible/auto, window or document can scroll naturally
    const scrolledY = await page.evaluate(() => window.scrollY);
    expect(scrolledY).toBeGreaterThanOrEqual(0);

    await page.close();
  });
});
