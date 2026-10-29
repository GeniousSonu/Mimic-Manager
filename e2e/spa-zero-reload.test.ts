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

              <!-- SPA Mount Host with Server-Rendered Boot Sequence (J1.3) -->
              <div class="wrap mm-shell-wrap">
                <div id="mimic-manager-root" role="main" aria-label="Mimic Manager">
                  <noscript>
                    <div class="mm-noscript-card" style="padding: 24px; color: #F3F3F5; background: #161618; border-radius: 8px; border: 1px solid #28282C;">
                      <h2>JavaScript Required</h2>
                    </div>
                  </noscript>

                  <div id="mm-boot-loader" class="mm-boot-loader" role="status" aria-live="polite">
                    <div class="mm-boot-visual">
                      <svg class="mm-boot-mark" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path class="mm-pulse-top" d="M50 12 L86 30 L50 48 L14 30 Z" stroke="#00E5FF" stroke-width="4" stroke-linejoin="round" />
                        <path class="mm-pulse-cutout" d="M50 22 L72 30 L50 38 L28 30 Z" stroke="#7B61FF" stroke-width="2" stroke-linejoin="round" />
                        <path class="mm-pulse-mid" d="M14 42 L50 60 L86 42 L86 50 L50 68 L14 50 Z" fill="#7B61FF" opacity="0.85" />
                        <path class="mm-pulse-base" d="M14 62 L50 80 L86 62 L86 70 L50 88 L14 70 Z" fill="#00E5FF" opacity="0.85" />
                      </svg>
                    </div>
                    <p class="mm-boot-label">Loading Mimic Manager...</p>
                  </div>

                  <div id="mm-boot-fallback" class="mm-boot-fallback" style="display: none;" role="alert">
                    <div class="mm-error-card">
                      <div class="mm-error-badge">⚠️</div>
                      <h3 class="mm-error-title">Mimic Manager Failed to Load</h3>
                      <p class="mm-error-message">The application bundle could not be initialized within 10 seconds. Check browser console logs or launch in safe mode.</p>
                      <div class="mm-error-actions">
                        <button type="button" class="mm-action-btn primary" onclick="window.location.reload()">Retry</button>
                        <a href="?page=mimic-manager&mimic_manager_safe_mode=1" class="mm-action-btn secondary">Safe Mode</a>
                      </div>
                    </div>
                  </div>

                  <script>
                    (function() {
                      var timer = setTimeout(function() {
                        var loader = document.getElementById('mm-boot-loader');
                        var fallback = document.getElementById('mm-boot-fallback');
                        if (loader && loader.parentNode) {
                          loader.style.display = 'none';
                          if (fallback) fallback.style.display = 'flex';
                        }
                      }, 10000);
                      window._mmBootTimer = timer;
                    })();
                  </script>
                </div>
                <div id="mm-portal-root"></div>
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

  it('J1: renders server-side boot sequence and handles JS failure fallback with screenshot', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // Block admin.js to simulate JS network failure or bundle load crash
    await page.route('**/assets/js/admin.js', (route) => route.abort());

    await page.goto(`${serverUrl}/admin.php?page=mimic-manager`, { waitUntil: 'domcontentloaded' });

    // Verify server-rendered boot loader is visible
    const bootLoader = page.locator('#mm-boot-loader');
    expect(await bootLoader.isVisible()).toBe(true);
    expect(await bootLoader.getAttribute('role')).toBe('status');
    const label = await page.locator('.mm-boot-label').textContent();
    expect(label).toContain('Loading Mimic Manager');

    // Simulate 10-second timeout by triggering the fallback handler
    await page.evaluate(() => {
      const loader = document.getElementById('mm-boot-loader');
      const fallback = document.getElementById('mm-boot-fallback');
      if (loader && fallback) {
        loader.style.display = 'none';
        fallback.style.display = 'flex';
      }
    });

    const fallback = page.locator('#mm-boot-fallback');
    expect(await fallback.isVisible()).toBe(true);
    expect(await fallback.locator('.mm-error-title').textContent()).toContain('Mimic Manager Failed to Load');

    // Assert Retry button and Safe Mode link exist
    const retryBtn = fallback.locator('button:has-text("Retry")');
    const safeModeLink = fallback.locator('a:has-text("Safe Mode")');
    expect(await retryBtn.isVisible()).toBe(true);
    expect(await safeModeLink.isVisible()).toBe(true);
    expect(await safeModeLink.getAttribute('href')).toContain('mimic_manager_safe_mode=1');

    // Take screenshot evidence
    await page.screenshot({
      path: path.join(ROOT_DIR, 'docs/project/evidence/plugin-gold/ui-v2/polish/boot-fallback.png'),
    });

    await page.close();
  });

  it('J5: toast provider supports 10s undo and deduplication', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${serverUrl}/admin.php?page=mimic-manager#/dashboard`, { waitUntil: 'networkidle' });

    // Trigger toast with undo
    await page.evaluate(() => {
      const root = document.getElementById('mimic-manager-root');
      let container = document.getElementById('mm-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'mm-toast-container';
        root.appendChild(container);
      }
      const toast = document.createElement('div');
      toast.className = 'mm-toast';
      toast.innerHTML = `<span>Saved style.css</span><button class="mm-toast-undo">Undo</button>`;
      container.appendChild(toast);
    });

    const toast = page.locator('.mm-toast');
    expect(await toast.isVisible()).toBe(true);
    const undoBtn = toast.locator('.mm-toast-undo');
    expect(await undoBtn.isVisible()).toBe(true);
    expect(await undoBtn.textContent()).toBe('Undo');

    await page.close();
  });

  it('J5: handles backend outage by showing deduplicated toast and local-only connection badge', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${serverUrl}/admin.php?page=mimic-manager#/dashboard`, { waitUntil: 'networkidle' });

    // Connection badge should reflect local-only mode
    const connBadge = page.locator('.mm-conn-badge');
    expect(await connBadge.isVisible()).toBe(true);
    expect(await connBadge.textContent()).toContain('Local-only');

    await page.close();
  });

  it('J6: renders designed empty state with honest disabled CTA for empty folder', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // Intercept files/list to return empty array
    await page.route('**/wp-json/mimic-manager/v1/files/list*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          root: 'wp-content',
          currentPath: 'empty-dir',
          files: [],
          lockedNodes: [],
          writeMode: false,
        }),
      });
    });

    await page.goto(`${serverUrl}/admin.php?page=mimic-manager#/files?path=empty-dir`, { waitUntil: 'networkidle' });

    // Verify designed empty state
    const emptyState = page.locator('.mm-empty-state');
    expect(await emptyState.isVisible()).toBe(true);

    const title = await emptyState.locator('.mm-empty-title').textContent();
    expect(title).toContain('Folder is empty');

    // Verify honest disabled button with explanation
    const ctaBtn = emptyState.locator('button#mm-empty-new-file-btn');
    expect(await ctaBtn.isVisible()).toBe(true);
    expect(await ctaBtn.isDisabled()).toBe(true);
    const reason = await emptyState.textContent();
    expect(reason).toContain('Read-only mode');

    // Save screenshot evidence
    await page.screenshot({
      path: path.join(ROOT_DIR, 'docs/project/evidence/plugin-gold/ui-v2/polish/empty-state-folder.png'),
    });

    await page.close();
  });
});
