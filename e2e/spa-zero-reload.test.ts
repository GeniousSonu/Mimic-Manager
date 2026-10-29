import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { chromium, type Browser, type Page } from 'playwright-core';

describe('PLUGIN-UI-V2 Playwright SPA Zero-Reload & Full-Bleed Verification', () => {
  let server: http.Server;
  let serverUrl: string;
  let browser: Browser;

  const ROOT_DIR = process.cwd();
  const CSS_PATH = path.join(ROOT_DIR, 'connectors/wordpress/assets/css/admin.css');
  const JS_PATH = path.join(ROOT_DIR, 'connectors/wordpress/assets/js/admin.js');

  beforeAll(async () => {
    // 1. Create mock wp-admin HTML test server
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
        res.end(
          JSON.stringify({
            status: 'ok',
            name: 'Mimic Manager',
            version: '1.0.0-rc.1',
            localEngine: { engine: 'gd', supported: true },
            consentGiven: false,
            cloudConnected: false,
          })
        );
        return;
      }

      if (url.startsWith('/wp-json/mimic-manager/v1/files/list')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            root: 'wp-content',
            currentPath: '',
            files: [
              {
                name: 'themes',
                path: 'themes',
                isDir: true,
                size: 0,
                sizeFormatted: '-',
                modified: 1730000000,
                modifiedFormatted: '2026-10-29 12:00',
                permissions: '0755',
                ext: 'folder',
                isWorldWritable: false,
                isExecutable: false,
              },
              {
                name: 'style.css',
                path: 'style.css',
                isDir: false,
                size: 1024,
                sizeFormatted: '1.0 KB',
                modified: 1730000000,
                modifiedFormatted: '2026-10-29 12:00',
                permissions: '0644',
                ext: 'css',
                isWorldWritable: false,
                isExecutable: false,
              },
            ],
            lockedNodes: [
              {
                name: 'wp-admin',
                locked: true,
                reason: 'WordPress core, read-only. Enable advanced mode in Settings to browse.',
              },
              {
                name: 'wp-includes',
                locked: true,
                reason: 'WordPress core, read-only. Enable advanced mode in Settings to browse.',
              },
            ],
            writeMode: false,
          })
        );
        return;
      }

      // Default wp-admin mockup page
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
            #adminmenuwrap { width: 160px; position: fixed; top: 32px; bottom: 0; left: 0; background: #1d2327; color: #fff; }
            #wpcontent { margin-left: 160px; padding-top: 32px; }
            #wpfooter { padding: 10px 20px; background: #f0f0f1; font-size: 12px; }
          </style>
        </head>
        <body class="wp-admin toplevel_page_mimic-manager mm-fullbleed">
          <div id="wpadminbar">WordPress Admin Bar (32px)</div>
          <div id="adminmenuwrap">WP Left Menu (160px)</div>
          <div id="wpcontent">
            <div id="wpbody-content">
              <!-- Mock external notices from other plugins -->
              <div class="notice notice-warning is-dismissible">
                <p>Third-party plugin notice: Please configure your mail server.</p>
              </div>

              <!-- SPA Mount Host -->
              <div class="wrap mm-shell-wrap">
                <div id="mimic-manager-root"></div>
              </div>
            </div>
            <div id="wpfooter">Thank you for creating with WordPress.</div>
          </div>
          <script>
            window.mimicManagerData = {
              restUrl: '/wp-json/mimic-manager/v1',
              nonce: 'test_nonce_987654',
              brand: {
                name: 'Mimic Manager',
                version: '1.0.0-rc.1',
                creator: 'SK Sahinur Islam',
                owner: 'Wefik'
              }
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

    // 2. Launch headless browser
    browser = await chromium.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  });

  afterAll(async () => {
    if (browser) await browser.close();
    if (server) server.close();
  });

  it('guarantees ZERO document reloads across all internal hash routes', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // Initial page load
    await page.goto(`${serverUrl}/admin.php?page=mimic-manager#/dashboard`, { waitUntil: 'networkidle' });

    // Listen for navigation and document requests after initial load
    let frameNavigatedCount = 0;
    let documentRequestCount = 0;

    page.mainFrame().on('navigated', () => {
      frameNavigatedCount++;
    });

    page.on('request', (req) => {
      if (req.resourceType() === 'document') {
        documentRequestCount++;
      }
    });

    const routes = ['media', 'speed', 'seo', 'files', 'settings', 'about', 'dashboard'];

    for (const r of routes) {
      const tab = page.locator(`a.mm-nav-tab[data-route="${r}"]`);
      await tab.click();
      await page.waitForTimeout(50);

      // Verify active class updated
      const isActive = await tab.evaluate((el) => el.classList.contains('active'));
      expect(isActive).toBe(true);

      // Verify hash
      const hash = await page.evaluate(() => window.location.hash);
      expect(hash).toBe(`#/${r}`);
    }

    // Zero document reloads or frame navigations occurred
    expect(frameNavigatedCount).toBe(0);
    expect(documentRequestCount).toBe(0);

    await page.close();
  });

  it('measures full-bleed breakout geometry (viewport height minus admin bar, no body scrollbars)', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${serverUrl}/admin.php?page=mimic-manager#/dashboard`, { waitUntil: 'networkidle' });

    // Verify mm-fullbleed body class is applied
    const hasFullbleedClass = await page.evaluate(() => document.body.classList.contains('mm-fullbleed'));
    expect(hasFullbleedClass).toBe(true);

    // Verify height equals viewport height (900px) minus admin bar (32px) = 868px
    const rootHeight = await page.evaluate(() => {
      const el = document.getElementById('mimic-manager-root');
      return el ? Math.round(el.getBoundingClientRect().height) : 0;
    });

    expect(rootHeight).toBe(868);

    // Verify document body does not scroll
    const bodyOverflow = await page.evaluate(() => window.getComputedStyle(document.body).overflow);
    expect(bodyOverflow).toBe('hidden');

    await page.close();
  });

  it('relocates WordPress notices into collapsible header tray', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${serverUrl}/admin.php?page=mimic-manager#/dashboard`, { waitUntil: 'networkidle' });

    // Verify notice tray exists and contains the warning notice
    const noticeTray = page.locator('.mm-notices-tray');
    expect(await noticeTray.isVisible()).toBe(true);

    const noticeText = await noticeTray.textContent();
    expect(noticeText).toContain('WordPress notices (1)');

    await page.close();
  });

  it('resists hostile injected CSS (* { box-sizing: content-box !important }) without layout destruction', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${serverUrl}/admin.php?page=mimic-manager#/files`, { waitUntil: 'networkidle' });

    // Inject hostile third-party plugin CSS
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        * { box-sizing: content-box !important; }
        h1, h2, h3, h4 { color: red !important; font-size: 80px !important; }
      `;
      document.head.appendChild(style);
    });

    // Verify 3-pane file manager layout remains intact
    const filemanager = page.locator('.mm-filemanager');
    expect(await filemanager.isVisible()).toBe(true);

    const treePane = page.locator('.mm-tree-pane');
    expect(await treePane.isVisible()).toBe(true);

    const dataTable = page.locator('.mm-data-table');
    expect(await dataTable.isVisible()).toBe(true);

    // Verify locked core nodes are visible with locked text
    await page.waitForSelector('.mm-tree-node.locked');
    const lockedNode = page.locator('.mm-tree-node.locked').first();
    expect(await lockedNode.isVisible()).toBe(true);
    const lockedTitle = await lockedNode.getAttribute('title');
    expect(lockedTitle).toContain('WordPress core, read-only');

    await page.close();
  });
});
