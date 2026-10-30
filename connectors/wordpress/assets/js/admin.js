/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

(function () {
  'use strict';

  // Global State Store
  const state = {
    currentRoute: 'dashboard',
    routeParams: {},
    fullscreen: localStorage.getItem('mm_fullscreen_disabled') !== 'true',
    railCollapsed: localStorage.getItem('mm_rail_collapsed') === 'true',
    density: localStorage.getItem('mm_density') || 'compact',
    viewMode: localStorage.getItem('mm_view_mode') || 'grid',
    activeTask: null,
    pollingInterval: 3000,
    serverStatus: {
      localEngine: { engine: 'gd', supported: true },
      consentGiven: false,
      cloudConnected: false,
    },
    connectionStatus: 'local-only', // 'connected' | 'local-only' | 'waiting' | 'retrying'
    connectionReason: '100% Local Mode (telemetry-free)',
    lastToastMessage: '',
    lastToastTime: 0,
    toasts: [],
    errorRingBuffer: [],
    loading: {
      files: false,
      dashboard: false,
      media: false,
      pairing: false,
    },
    pairing: {
      sessionId: '',
      pairingCode: '',
      expiresAt: 0,
      remainingSeconds: 0,
      timerId: null,
      pollId: null,
      backendUrl: 'http://localhost:3000',
      consent: false,
    },
    elevation: {
      active: false,
      expiresAt: 0,
      remainingSeconds: 0,
      timerId: null,
    },
    fileManager: {
      currentPath: '',
      files: [],
      lockedNodes: [],
      selectedPaths: new Set(),
      expandedFolders: new Set(['']),
      writeMode: false,
      inspectorFile: null,
      clipboard: null, // { action: 'copy'|'cut', path: string }
      contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        target: null, // file object or null for background
      },
      modal: null, // { type: 'newFile'|'newFolder'|'rename'|'chmod'|'elevate', data: any }
      editor: {
        open: false,
        path: '',
        content: '',
        savedContent: '',
        hash: '',
        mtime: 0,
        isDirty: false,
        lintError: null,
      },
    },
    media: {
      items: [],
      selectedIds: new Set(),
      filterFormat: 'all',
      filterStatus: 'all',
      summary: {
        totalImages: 0,
        totalSavedBytes: 0,
        totalSavedFormatted: '0 B',
        overallSavingsPercent: 0,
      },
      wizardOpen: false,
      wizardPreset: 'balanced',
      wizardQuality: 75,
      wizardFormat: 'webp',
      detailItem: null,
    },
  };

  const wpData = window.mimicManagerData || {
    restUrl: '/wp-json/mimic-manager/v1',
    nonce: '',
    homeUrl: 'http://localhost:8888',
    siteName: 'WordPress Site',
    disallowFileEdit: false,
    disallowFileMods: false,
    brand: { name: 'Mimic Manager', version: '1.0.0-rc.1', creator: 'SK Sahinur Islam', owner: 'Wefik' },
  };

  function logError(source, err) {
    const entry = {
      timestamp: new Date().toISOString(),
      source,
      message: err && err.message ? err.message : String(err),
      route: state.currentRoute,
    };
    state.errorRingBuffer.unshift(entry);
    if (state.errorRingBuffer.length > 50) {
      state.errorRingBuffer.pop();
    }
    console.error(`[Mimic Manager ${source}]`, err);
  }

  window.addEventListener('error', (event) => {
    logError('window.error', event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    logError('unhandledrejection', event.reason);
  });

  // REST API fetch supporting both pretty permalinks and plain permalinks (?rest_route=)
  async function apiFetch(endpoint, options = {}) {
    let url;
    if (wpData.restUrl.includes('?')) {
      const [base, query] = wpData.restUrl.split('?');
      const [pathPart, queryPart] = endpoint.split('?');
      const cleanEndpoint = pathPart.replace(/^\/+/, '');
      const searchParams = new URLSearchParams(query);
      const currentRoute = searchParams.get('rest_route') || '';
      searchParams.set('rest_route', currentRoute.replace(/\/+$/, '') + '/' + cleanEndpoint);
      if (queryPart) {
        const extraParams = new URLSearchParams(queryPart);
        for (const [k, v] of extraParams.entries()) {
          searchParams.set(k, v);
        }
      }
      url = `${base}?${searchParams.toString()}`;
    } else {
      url = wpData.restUrl.replace(/\/+$/, '') + '/' + endpoint.replace(/^\/+/, '');
    }

    const timeoutMs = options.timeout || 6000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers = {
      'Content-Type': 'application/json',
      'X-WP-Nonce': wpData.nonce,
      ...(options.headers || {}),
    };

    try {
      const res = await fetch(url, { ...options, headers, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || err.message || `HTTP error ${res.status}`);
      }
      return res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        if (state.connectionStatus !== 'local-only') {
          state.connectionStatus = 'local-only';
          state.connectionReason = 'Cloud backend unreachable. Operating in local mode.';
          showToast('Cloud backend unreachable. Operating in local mode.', { duration: 5000 });
          renderStatusBadges();
        }
      }
      logError(`apiFetch:${endpoint}`, err);
      throw err;
    }
  }

  function showToast(message, options = {}) {
    const now = Date.now();
    if (state.lastToastMessage === message && now - state.lastToastTime < 3500) {
      return;
    }
    state.lastToastMessage = message;
    state.lastToastTime = now;

    let container = document.getElementById('mm-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'mm-toast-container';
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', 'Notifications');
      container.setAttribute('aria-live', 'polite');
      const root = document.getElementById('mimic-manager-root');
      if (root) root.appendChild(container);
      else document.body.appendChild(container);
    }

    while (container.children.length >= 3) {
      container.removeChild(container.firstChild);
    }

    const toast = document.createElement('div');
    toast.className = 'mm-toast';
    toast.setAttribute('role', 'status');

    let undoBtn = '';
    if (options.undoAction) {
      undoBtn = `<button class="mm-toast-undo" id="mm-undo-action" type="button">Undo (${options.undoDuration || 10}s)</button>`;
    }

    toast.innerHTML = `
      <div class="mm-toast-msg">${escapeHtml(message)}</div>
      ${undoBtn}
      <button class="mm-toast-close" type="button" aria-label="Dismiss notification">&times;</button>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.mm-toast-close');
    const dismiss = () => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 150);
    };
    if (closeBtn) closeBtn.addEventListener('click', dismiss);

    if (options.undoAction) {
      const undoEl = toast.querySelector('#mm-undo-action');
      if (undoEl) {
        undoEl.addEventListener('click', () => {
          dismiss();
          options.undoAction();
        });
      }
    }

    setTimeout(dismiss, options.duration || 6000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Hash-based routing & synchronization with WordPress admin menu
  function initRouting() {
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
  }

  function handleHashChange() {
    const rawHash = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
    const parts = rawHash.split('/');
    const route = parts[0] || 'dashboard';

    state.currentRoute = route;
    state.fileManager.contextMenu.visible = false;

    // Synchronize WordPress left-side admin menu active highlight
    syncWpAdminMenu(route);

    renderApp();

    if (route === 'files') {
      loadFiles(state.fileManager.currentPath);
    } else if (route === 'media') {
      loadMedia();
    } else if (route === 'dashboard') {
      loadDashboardStatus();
    }
  }

  function syncWpAdminMenu(route) {
    const wpMenu = document.getElementById('adminmenu');
    if (!wpMenu) return;

    // Target submenu matching current route
    const mmParent = wpMenu.querySelector('li.toplevel_page_mimic-manager');
    if (!mmParent) return;

    const allSubLinks = mmParent.querySelectorAll('.wp-submenu li');
    allSubLinks.forEach((li) => {
      li.classList.remove('current');
      const a = li.querySelector('a');
      if (a) a.classList.remove('current');
    });

    const routeSlugMap = {
      dashboard: 'mimic-manager',
      media: 'mimic-manager-media',
      speed: 'mimic-manager-speed',
      seo: 'mimic-manager-seo',
      files: 'mimic-manager-files',
      sites: 'mimic-manager-sites',
      settings: 'mimic-manager-settings',
      about: 'mimic-manager-about',
    };

    const targetSlug = routeSlugMap[route] || 'mimic-manager';
    const targetLink = mmParent.querySelector(`.wp-submenu a[href*="page=${targetSlug}"]`);
    if (targetLink) {
      targetLink.classList.add('current');
      const parentLi = targetLink.closest('li');
      if (parentLi) parentLi.classList.add('current');
    }
  }

  async function loadDashboardStatus() {
    try {
      const res = await apiFetch('/status');
      if (res && res.status === 'ok') {
        state.serverStatus.localEngine = res.localEngine || { engine: 'gd', supported: true };
        state.serverStatus.consentGiven = res.consentGiven || false;
        state.serverStatus.cloudConnected = res.cloudConnected || false;
        state.connectionStatus = res.cloudConnected ? 'connected' : 'local-only';
        if (res.backendUrl) state.pairing.backendUrl = res.backendUrl;
        renderStatusBadges();
      }
    } catch {
      // Offline fallback
    }
  }

  // Media Management (L4)
  async function loadMedia() {
    state.loading.media = true;
    renderMediaView();

    try {
      const res = await apiFetch('/media/list');
      state.loading.media = false;
      if (res && res.items) {
        state.media.items = res.items;
        state.media.summary = res.summary || state.media.summary;
      }
      renderMediaView();
    } catch (err) {
      state.loading.media = false;
      showToast('Failed to load media: ' + err.message);
      renderMediaView();
    }
  }

  async function compressSelectedMedia() {
    const ids = Array.from(state.media.selectedIds);
    if (ids.length === 0) return;

    showToast(`Optimizing ${ids.length} selected images locally...`);
    try {
      const res = await apiFetch('/media/compress', {
        method: 'POST',
        body: JSON.stringify({
          attachmentIds: ids,
          preset: state.media.wizardPreset,
          quality: state.media.wizardQuality,
          format: state.media.wizardFormat,
        }),
      });

      if (res && res.success) {
        showToast(`Successfully optimized ${ids.length} images!`);
        state.media.selectedIds.clear();
        state.media.wizardOpen = false;
        loadMedia();
      }
    } catch (err) {
      showToast('Optimization failed: ' + err.message);
    }
  }

  // File Manager (L3)
  async function loadFiles(path = '') {
    state.loading.files = true;
    state.fileManager.currentPath = path;
    renderFileManagerView();

    try {
      const res = await apiFetch(`/files/list?path=${encodeURIComponent(path)}`);
      state.loading.files = false;
      if (res.success) {
        state.fileManager.files = res.files || [];
        state.fileManager.lockedNodes = res.lockedNodes || [];
        state.fileManager.writeMode = res.writeMode || state.elevation.active;
      }
      renderFileManagerView();
    } catch (err) {
      state.loading.files = false;
      showToast('Failed to load directory: ' + err.message);
      renderFileManagerView();
    }
  }

  // Guided Sudo Elevation Flow (L3.1)
  async function submitElevation(password) {
    try {
      const res = await apiFetch('/files/elevate', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });

      if (res && res.success) {
        state.elevation.active = true;
        state.elevation.expiresAt = Date.now() + (res.expiresInSeconds || 900) * 1000;
        state.elevation.remainingSeconds = res.expiresInSeconds || 900;
        state.fileManager.writeMode = true;
        state.fileManager.modal = null;

        if (state.elevation.timerId) clearInterval(state.elevation.timerId);
        state.elevation.timerId = setInterval(() => {
          state.elevation.remainingSeconds = Math.max(0, Math.round((state.elevation.expiresAt - Date.now()) / 1000));
          if (state.elevation.remainingSeconds <= 0) {
            clearInterval(state.elevation.timerId);
            state.elevation.active = false;
            state.fileManager.writeMode = false;
            showToast('Write mode elevation expired. File manager returned to read-only.');
            renderApp();
          } else {
            const timerEl = document.getElementById('mm-elevation-timer');
            if (timerEl) {
              const m = Math.floor(state.elevation.remainingSeconds / 60);
              const s = state.elevation.remainingSeconds % 60;
              timerEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
            }
          }
        }, 1000);

        showToast('Administrator write mode enabled for 15 minutes.');
        renderApp();
      }
    } catch (err) {
      showToast('Elevation failed: ' + err.message);
    }
  }

  function lockAgain() {
    if (state.elevation.timerId) clearInterval(state.elevation.timerId);
    state.elevation.active = false;
    state.fileManager.writeMode = false;
    showToast('Write mode locked. Returned to safe read-only mode.');
    renderApp();
  }

  // Sites / Pairing Flow (L2)
  async function generatePairingCode() {
    const cb = document.getElementById('mm-consent-cb');
    if (cb) state.pairing.consent = cb.checked;
    const urlInput = document.getElementById('mm-backend-url');
    if (urlInput) state.pairing.backendUrl = urlInput.value.trim();

    if (!state.pairing.consent) {
      showToast('Please accept the consent terms before connecting.', 'error');
      return;
    }

    state.loading.pairing = true;
    renderSitesView();

    try {
      const res = await apiFetch('/sites/pair/init', {
        method: 'POST',
        body: JSON.stringify({
          backendUrl: state.pairing.backendUrl,
          consent: state.pairing.consent,
        }),
      });

      state.loading.pairing = false;
      if (res && res.success) {
        state.pairing.sessionId = res.sessionId;
        state.pairing.pairingCode = res.pairingCode;
        state.pairing.expiresAt = Date.now() + (res.expiresInSeconds || 600) * 1000;
        state.pairing.remainingSeconds = res.expiresInSeconds || 600;
        state.connectionStatus = 'waiting';

        if (state.pairing.timerId) clearInterval(state.pairing.timerId);
        state.pairing.timerId = setInterval(() => {
          state.pairing.remainingSeconds = Math.max(0, Math.round((state.pairing.expiresAt - Date.now()) / 1000));
          if (state.pairing.remainingSeconds <= 0) {
            clearInterval(state.pairing.timerId);
            if (state.pairing.pollId) clearInterval(state.pairing.pollId);
            state.pairing.pairingCode = '';
            state.connectionStatus = 'local-only';
            showToast('Pairing code expired. Please generate a new code.');
            renderSitesView();
          } else {
            const countdownEl = document.getElementById('mm-pairing-countdown');
            if (countdownEl) {
              const m = Math.floor(state.pairing.remainingSeconds / 60);
              const s = state.pairing.remainingSeconds % 60;
              countdownEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
            }
          }
        }, 1000);

        // Start polling for backend approval
        if (state.pairing.pollId) clearInterval(state.pairing.pollId);
        state.pairing.pollId = setInterval(async () => {
          try {
            const pollRes = await apiFetch('/sites/pair/status', {
              method: 'POST',
              body: JSON.stringify({ sessionId: state.pairing.sessionId }),
            });

            if (pollRes && pollRes.status === 'approved') {
              clearInterval(state.pairing.pollId);
              clearInterval(state.pairing.timerId);
              state.connectionStatus = 'connected';
              state.pairing.pairingCode = '';
              showToast('Site successfully connected to backend!');
              renderSitesView();
              renderStatusBadges();
            }
          } catch {
            // Wait and retry
          }
        }, 3000);
      }
      renderSitesView();
    } catch (err) {
      state.loading.pairing = false;
      showToast('Failed to generate pairing code: ' + err.message);
      renderSitesView();
    }
  }

  async function disconnectSite() {
    try {
      await apiFetch('/sites/disconnect', { method: 'POST' });
      state.connectionStatus = 'local-only';
      if (state.pairing.pollId) clearInterval(state.pairing.pollId);
      if (state.pairing.timerId) clearInterval(state.pairing.timerId);
      state.pairing.pairingCode = '';
      showToast('Disconnected from cloud backend. Returned to 100% local mode.');
      renderSitesView();
      renderStatusBadges();
    } catch (err) {
      showToast('Disconnect failed: ' + err.message);
    }
  }

  // Rendering Components
  function renderApp() {
    const root = document.getElementById('mimic-manager-root');
    if (!root) return;

    const bootFallback = document.getElementById('mm-boot-fallback');
    if (bootFallback) bootFallback.remove();

    root.innerHTML = `
      ${renderHeader()}
      <div class="mm-shell-body">
        ${renderInAppRail()}
        <main class="mm-main-stage" id="mm-main-stage">
          ${renderRouteView()}
        </main>
      </div>
      ${renderContextMenu()}
      ${renderModals()}
    `;

    bindEvents();
    renderStatusBadges();
  }

  function renderHeader() {
    const brand = wpData.brand;
    return `
      <header class="mm-shell-header">
        <div class="mm-header-left">
          <a href="#/dashboard" class="mm-brand-logo">
            <svg class="mm-brand-mark" viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M10 2L17.5 5.75L10 9.5L2.5 5.75L10 2ZM10 4.1L14.3 6.25L10 8.4L5.7 6.25L10 4.1Z"/>
              <path d="M2.5 8L10 11.75L17.5 8L17.5 9.8L10 13.55L2.5 9.8V8Z"/>
              <path d="M2.5 12L10 15.75L17.5 12L17.5 13.8L10 17.55L2.5 13.8V12Z"/>
            </svg>
            <span>${escapeHtml(brand.name)}</span>
            <span class="mm-ext-badge">v${escapeHtml(brand.version)}</span>
          </a>
        </div>
        <div class="mm-header-right">
          <div id="mm-connection-badge"></div>
          <button class="mm-icon-btn" id="mm-toggle-fullscreen" title="Toggle Fullscreen" type="button">
            ⛶
          </button>
        </div>
      </header>
    `;
  }

  function renderInAppRail() {
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
      { id: 'media', label: 'Media', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>' },
      { id: 'speed', label: 'Speed', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' },
      { id: 'seo', label: 'SEO', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>' },
      { id: 'files', label: 'Files', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>' },
      { id: 'sites', label: 'Sites/Connection', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>' },
      { id: 'settings', label: 'Settings', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>' },
      { id: 'about', label: 'About', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' },
    ];

    return `
      <aside class="mm-app-rail ${state.railCollapsed ? 'collapsed' : ''}" id="mm-app-rail">
        <nav class="mm-rail-nav">
          ${items
            .map(
              (item) => `
            <a href="#/${item.id}" class="mm-rail-link ${state.currentRoute === item.id ? 'active' : ''}" data-route="${item.id}" title="${item.label}">
              <span class="mm-rail-icon">${item.icon}</span>
              <span class="mm-rail-label">${escapeHtml(item.label)}</span>
            </a>
          `
            )
            .join('')}
        </nav>
        <div class="mm-rail-footer">
          <button class="mm-rail-toggle" id="mm-rail-toggle" type="button" title="${state.railCollapsed ? 'Expand navigation' : 'Collapse navigation'}">
            ${state.railCollapsed ? '»' : '«'}
          </button>
        </div>
      </aside>
    `;
  }

  function renderRouteView() {
    switch (state.currentRoute) {
      case 'dashboard':
        return renderDashboardView();
      case 'media':
        return renderMediaViewHtml();
      case 'files':
        return renderFileManagerViewHtml();
      case 'sites':
        return renderSitesViewHtml();
      case 'speed':
        return renderGenericView('PageSpeed Optimization', 'Safe, Moderate, and Guided fixes with auto-revert guarantees.');
      case 'seo':
        return renderGenericView('SEO Gap Fill', 'Heuristic and AI metadata audits for images and pages.');
      case 'settings':
        return renderSettingsViewHtml();
      case 'about':
        return renderAboutViewHtml();
      default:
        return render404();
    }
  }

  function renderDashboardView() {
    const engine = state.serverStatus.localEngine;
    return `
      <div class="mm-dashboard-scroll" style="padding:24px;">
        <div class="mm-dash-hero" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
          <div>
            <h1 style="font-size:20px; font-weight:700; margin:0;">Platform Overview</h1>
            <p style="color:var(--mm-muted); font-size:13px; margin:4px 0 0;">High-performance, headless site optimization with zero paid dependencies.</p>
          </div>
          <div style="display:flex; gap:10px;">
            <a href="#/media" class="mm-btn mm-btn-primary">Optimize Media</a>
            <a href="#/files" class="mm-btn mm-btn-secondary">Open File Manager</a>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
          <div class="mm-card" style="padding:20px; background:var(--mm-surface); border:1px solid var(--mm-border); border-radius:8px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <div style="font-size:11px; text-transform:uppercase; color:var(--mm-muted); font-weight:600;">Engine Status</div>
                <div style="font-size:18px; font-weight:700; margin-top:4px;">Local ${escapeHtml(engine.engine.toUpperCase())} Active</div>
              </div>
              <span class="mm-status-pill success">● Ready</span>
            </div>
            <p style="font-size:12px; color:var(--mm-muted); margin-top:12px;">WebP conversion available with permanent original backups.</p>
          </div>

          <div class="mm-card" style="padding:20px; background:var(--mm-surface); border:1px solid var(--mm-border); border-radius:8px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <div style="font-size:11px; text-transform:uppercase; color:var(--mm-muted); font-weight:600;">Backend Link</div>
                <div style="font-size:18px; font-weight:700; margin-top:4px;">${state.connectionStatus === 'connected' ? 'Connected' : 'Local Mode'}</div>
              </div>
              <span class="mm-status-pill ${state.connectionStatus === 'connected' ? 'success' : 'info'}">● ${state.connectionStatus === 'connected' ? 'Synced' : 'Offline Safe'}</span>
            </div>
            <p style="font-size:12px; color:var(--mm-muted); margin-top:12px;">Pair with Mimic Manager Command Center via Sites/Connection.</p>
          </div>

          <div class="mm-card" style="padding:20px; background:var(--mm-surface); border:1px solid var(--mm-border); border-radius:8px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <div style="font-size:11px; text-transform:uppercase; color:var(--mm-muted); font-weight:600;">File Jailing</div>
                <div style="font-size:18px; font-weight:700; margin-top:4px;">wp-content Locked</div>
              </div>
              <span class="mm-status-pill ${state.fileManager.writeMode ? 'warning' : 'success'}">● ${state.fileManager.writeMode ? 'Write Active' : 'Read-Only'}</span>
            </div>
            <p style="font-size:12px; color:var(--mm-muted); margin-top:12px;">Syntax checks and pre-save shadow backups enforce safety.</p>
          </div>
        </div>
      </div>
    `;
  }

  // Sites / Connection View (L2)
  function renderSitesViewHtml() {
    const p = state.pairing;
    const isConnected = state.connectionStatus === 'connected';

    return `
      <div style="padding:24px; max-width:900px; margin:0 auto; width:100%;">
        <div style="margin-bottom:24px;">
          <h1 style="font-size:20px; font-weight:700; margin:0;">Sites &amp; Backend Connection</h1>
          <p style="color:var(--mm-muted); font-size:13px; margin:4px 0 0;">Connect your WordPress site to the self-hosted Mimic Manager NestJS API and BullMQ worker.</p>
        </div>

        ${
          isConnected
            ? `
          <div class="mm-pairing-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span class="mm-status-pill success" style="font-size:13px;">● Connected to Backend</span>
                <h2 style="font-size:18px; font-weight:700; margin:8px 0 0;">Synchronized with Command Center</h2>
              </div>
              <button class="mm-btn mm-btn-secondary" id="mm-disconnect-btn" type="button">Disconnect Site</button>
            </div>
            <div style="background:#0A0A0B; border:1px solid var(--mm-border); border-radius:8px; padding:16px; font-size:12px; color:var(--mm-muted); display:flex; flex-direction:column; gap:8px;">
              <div><strong>Backend API:</strong> <code>${escapeHtml(p.backendUrl)}</code></div>
              <div><strong>Site Canonical URL:</strong> <code>${escapeHtml(wpData.homeUrl)}</code></div>
              <div><strong>Protocol Version:</strong> <code>1.0 (HMAC-SHA256 authenticated)</code></div>
            </div>
          </div>
        `
            : `
          <div class="mm-pairing-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span class="mm-status-pill info">● 100% Local Mode</span>
                <h2 style="font-size:18px; font-weight:700; margin:8px 0 0;">Pair with Mimic Manager Backend</h2>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:16px;">
              <div>
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:6px;">Backend Endpoint URL</label>
                <input type="url" id="mm-backend-url" class="mm-input" style="width:100%; padding:10px; border-radius:6px; background:#0E0E10; border:1px solid var(--mm-border); color:#fff; font-family:var(--mm-font-mono); font-size:13px;" value="${escapeHtml(p.backendUrl)}" />
              </div>

              <div style="background:#0A0A0B; border:1px solid var(--mm-border); border-radius:6px; padding:12px; font-size:12px; color:var(--mm-muted); line-height:1.5;">
                <label style="display:flex; align-items:flex-start; gap:8px; cursor:pointer;">
                  <input type="checkbox" id="mm-consent-cb" ${p.consent ? 'checked' : ''} style="margin-top:3px;" />
                  <span>I authorize connecting this WordPress installation to the specified Mimic Manager backend. Telemetry is strictly limited to site URL, versions, and explicitly triggered optimization jobs.</span>
                </label>
              </div>

              ${
                p.pairingCode
                  ? `
                <div class="mm-pairing-code-box">
                  <div style="font-size:11px; text-transform:uppercase; color:var(--mm-muted); font-weight:600;">One-Time 6-Digit Pairing PIN</div>
                  <div class="mm-pairing-digits" id="mm-code-display">${escapeHtml(p.pairingCode)}</div>
                  <div style="display:flex; gap:12px; align-items:center;">
                    <span class="mm-status-pill warning" style="font-size:12px;">Expires in: <strong id="mm-pairing-countdown">10:00</strong></span>
                    <button class="mm-btn mm-btn-secondary" id="mm-copy-code-btn" type="button">Copy Code</button>
                    <button class="mm-btn mm-btn-secondary" id="mm-regen-code-btn" type="button">Regenerate</button>
                  </div>
                  <p style="font-size:12px; color:var(--mm-muted); margin:8px 0 0;">
                    Now open your <strong>Mimic Manager Command Center (PWA)</strong>, click <strong>Add Site</strong>, and enter this 6-digit PIN.
                  </p>
                </div>
              `
                  : `
                <button class="mm-btn mm-btn-primary" id="mm-generate-code-btn" style="padding:12px; font-size:14px; font-weight:600;" type="button">
                  Generate 6-Digit Pairing Code
                </button>
              `
              }
            </div>
          </div>
        `
        }
      </div>
    `;
  }

  function renderSitesView() {
    const stage = document.getElementById('mm-main-stage');
    if (stage && state.currentRoute === 'sites') {
      stage.innerHTML = renderSitesViewHtml();
      bindSitesEvents();
    }
  }

  // File Manager View (L3)
  function renderFileManagerViewHtml() {
    const fm = state.fileManager;
    const isElevated = state.elevation.active;

    return `
      <div class="mm-fm-container" style="display:flex; flex-direction:column; height:100%; overflow:hidden;">
        <!-- Elevation / Warning Banner -->
        ${
          wpData.disallowFileEdit || wpData.disallowFileMods
            ? `
          <div class="mm-elevation-banner danger" id="mm-elevation-banner">
            <span><strong>File Editing Restricted:</strong> DISALLOW_FILE_EDIT or DISALLOW_FILE_MODS is active in wp-config.php. File modifications are locked by server policy.</span>
          </div>
        `
            : isElevated
            ? `
          <div class="mm-elevation-banner elevated" id="mm-elevation-banner">
            <span><strong>Write Mode Active:</strong> You have elevated file modification privileges. Automated backups and syntax checks are enforced before save.</span>
            <div style="display:flex; gap:12px; align-items:center;">
              <span class="mm-status-pill success">Time Remaining: <strong id="mm-elevation-timer">15:00</strong></span>
              <button class="mm-elevation-btn" id="mm-lock-again-btn" type="button" style="background:#28282E; color:#fff;">Lock Again</button>
            </div>
          </div>
        `
            : `
          <div class="mm-elevation-banner" id="mm-elevation-banner">
            <span><strong>Read-Only Mode:</strong> File Manager is locked to protect WordPress files. Enable write mode to create, edit, rename, or upload.</span>
            <button class="mm-elevation-btn" id="mm-enable-write-btn" type="button">Enable Write Mode</button>
          </div>
        `
        }

        <!-- Breadcrumbs & Toolbar -->
        <div class="mm-fm-action-bar" style="padding:10px 16px; background:var(--mm-surface); border-bottom:1px solid var(--mm-border); display:flex; justify-content:space-between; align-items:center;">
          <div class="mm-breadcrumbs" style="display:flex; align-items:center; gap:6px; font-size:13px; font-family:var(--mm-font-mono);">
            <a href="javascript:void(0)" class="mm-crumb" data-path="">wp-content</a>
            ${renderBreadcrumbs(fm.currentPath)}
          </div>

          <div class="mm-fm-tools" style="display:flex; gap:8px;">
            <button class="mm-action-btn primary" id="mm-tb-new-file" ${!fm.writeMode ? 'disabled title="Read-only mode. Enable write mode above."' : ''}>New File</button>
            <button class="mm-action-btn" id="mm-tb-new-folder" ${!fm.writeMode ? 'disabled title="Read-only mode. Enable write mode above."' : ''}>New Folder</button>
            <button class="mm-action-btn" id="mm-tb-upload" ${!fm.writeMode ? 'disabled title="Read-only mode. Enable write mode above."' : ''}>Upload</button>
            <button class="mm-action-btn" id="mm-tb-refresh" title="Refresh directory">Refresh</button>
          </div>
        </div>

        <!-- Main 3-Pane Body -->
        <div class="mm-fm-body" style="display:flex; flex:1; overflow:hidden;">
          <!-- Directory Grid / List -->
          <div class="mm-fm-grid-wrap" id="mm-fm-grid-wrap" style="flex:1; overflow-y:auto; padding:16px;">
            ${
              state.loading.files
                ? `<div style="padding:32px; text-align:center; color:var(--mm-muted);">Loading files...</div>`
                : fm.files.length === 0 && fm.lockedNodes.length === 0
                ? `<div style="padding:48px; text-align:center; color:var(--mm-muted);">This folder is empty. Right-click or use toolbar to create a file.</div>`
                : `
              <div class="mm-fm-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:12px;">
                ${fm.lockedNodes
                  .map(
                    (node) => `
                  <div class="mm-fm-node locked" style="padding:12px; background:var(--mm-surface); border:1px dashed var(--mm-border); border-radius:6px; opacity:0.6; display:flex; align-items:center; gap:8px;" title="${escapeHtml(node.reason)}">
                    <span>🔒</span>
                    <span style="font-size:13px; font-weight:500;">${escapeHtml(node.name)}</span>
                  </div>
                `
                  )
                  .join('')}

                ${fm.files
                  .map(
                    (f) => `
                  <div class="mm-fm-node ${f.isDir ? 'is-dir' : 'is-file'}" data-path="${escapeHtml(f.path)}" data-is-dir="${f.isDir}" style="padding:12px; background:var(--mm-surface); border:1px solid var(--mm-border); border-radius:6px; cursor:pointer; display:flex; align-items:center; gap:10px; user-select:none;">
                    <span style="font-size:18px;">${f.isDir ? '📁' : '📄'}</span>
                    <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">
                      <div style="font-size:13px; font-weight:500; color:var(--mm-text); overflow:hidden; text-overflow:ellipsis;">${escapeHtml(f.name)}</div>
                      <div style="font-size:11px; color:var(--mm-muted);">${f.sizeFormatted} · ${escapeHtml(f.permissions)}</div>
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
            }
          </div>

          <!-- Slide-Over Monaco / Editor Drawer -->
          ${
            fm.editor.open
              ? `
            <div class="mm-editor-drawer" style="width:580px; border-left:1px solid var(--mm-border); background:var(--mm-surface); display:flex; flex-direction:column; z-index:50;">
              <div style="padding:12px 16px; border-bottom:1px solid var(--mm-border); display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-weight:600; font-size:13px;">${escapeHtml(fm.editor.path)}</span>
                  ${fm.editor.isDirty ? '<span class="mm-dirty-dot" title="Unsaved changes"></span>' : ''}
                </div>
                <div style="display:flex; gap:8px;">
                  <button class="mm-btn mm-btn-primary" id="mm-editor-save-btn" ${!fm.writeMode ? 'disabled' : ''}>Save (Ctrl+S)</button>
                  <button class="mm-btn mm-btn-secondary" id="mm-editor-close-btn">&times;</button>
                </div>
              </div>
              <textarea id="mm-editor-textarea" style="flex:1; width:100%; background:#0A0A0B; color:#F4F4F6; border:none; padding:16px; font-family:var(--mm-font-mono); font-size:13px; line-height:1.5; resize:none; outline:none;">${escapeHtml(fm.editor.content)}</textarea>
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  function renderBreadcrumbs(currentPath) {
    if (!currentPath) return '';
    const parts = currentPath.split('/');
    let accum = '';
    return parts
      .map((part) => {
        accum = accum ? `${accum}/${part}` : part;
        return `<span>/</span><a href="javascript:void(0)" class="mm-crumb" data-path="${escapeHtml(accum)}">${escapeHtml(part)}</a>`;
      })
      .join('');
  }

  function renderFileManagerView() {
    const stage = document.getElementById('mm-main-stage');
    if (stage && state.currentRoute === 'files') {
      stage.innerHTML = renderFileManagerViewHtml();
      bindFileManagerEvents();
    }
  }

  // Right-Click Context Menu (L3.2)
  function renderContextMenu() {
    const cm = state.fileManager.contextMenu;
    if (!cm.visible) return '';

    const target = cm.target;
    const isWrite = state.fileManager.writeMode;

    let itemsHtml = '';
    if (target && !target.isDir) {
      // File context menu
      itemsHtml = `
        <div class="mm-context-item" data-action="open-editor"><span>Edit in Editor</span><span class="shortcut">Enter</span></div>
        <div class="mm-context-item" data-action="download"><span>Download</span></div>
        <div class="mm-context-divider"></div>
        <div class="mm-context-item ${!isWrite ? 'disabled' : ''}" data-action="rename"><span>Rename</span><span class="shortcut">F2</span></div>
        <div class="mm-context-item ${!isWrite ? 'disabled' : ''}" data-action="copy"><span>Copy</span><span class="shortcut">Ctrl+C</span></div>
        <div class="mm-context-item ${!isWrite ? 'disabled' : ''}" data-action="chmod"><span>Change Permissions</span></div>
        <div class="mm-context-divider"></div>
        <div class="mm-context-item ${!isWrite ? 'disabled' : ''}" data-action="delete" style="color:var(--mm-danger);"><span>Delete to Trash</span><span class="shortcut">Del</span></div>
      `;
    } else if (target && target.isDir) {
      // Folder context menu
      itemsHtml = `
        <div class="mm-context-item" data-action="open-folder"><span>Open Folder</span></div>
        <div class="mm-context-item ${!isWrite ? 'disabled' : ''}" data-action="new-file"><span>New File Here</span></div>
        <div class="mm-context-item ${!isWrite ? 'disabled' : ''}" data-action="new-folder"><span>New Subfolder</span></div>
        <div class="mm-context-divider"></div>
        <div class="mm-context-item ${!isWrite ? 'disabled' : ''}" data-action="rename"><span>Rename</span><span class="shortcut">F2</span></div>
        <div class="mm-context-item ${!isWrite ? 'disabled' : ''}" data-action="delete" style="color:var(--mm-danger);"><span>Delete Folder</span></div>
      `;
    } else {
      // Empty space / background
      itemsHtml = `
        <div class="mm-context-item ${!isWrite ? 'disabled' : ''}" data-action="new-file"><span>New File</span></div>
        <div class="mm-context-item ${!isWrite ? 'disabled' : ''}" data-action="new-folder"><span>New Folder</span></div>
        <div class="mm-context-divider"></div>
        <div class="mm-context-item" data-action="refresh"><span>Refresh</span><span class="shortcut">F5</span></div>
      `;
    }

    return `
      <div class="mm-context-menu" id="mm-context-menu" style="left:${cm.x}px; top:${cm.y}px;">
        ${itemsHtml}
      </div>
    `;
  }

  // Media UI View (L4)
  function renderMediaViewHtml() {
    const m = state.media;
    const selectedCount = m.selectedIds.size;

    return `
      <div class="mm-media-view">
        <!-- Filter Sidebar -->
        <aside class="mm-media-sidebar">
          <div>
            <div style="font-size:11px; text-transform:uppercase; color:var(--mm-muted); font-weight:600; margin-bottom:8px;">File Format</div>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <button class="mm-btn mm-btn-secondary ${m.filterFormat === 'all' ? 'active' : ''}" data-format="all">All Formats</button>
              <button class="mm-btn mm-btn-secondary ${m.filterFormat === 'jpeg' ? 'active' : ''}" data-format="jpeg">JPEG / JPG</button>
              <button class="mm-btn mm-btn-secondary ${m.filterFormat === 'png' ? 'active' : ''}" data-format="png">PNG</button>
              <button class="mm-btn mm-btn-secondary ${m.filterFormat === 'webp' ? 'active' : ''}" data-format="webp">WebP</button>
            </div>
          </div>

          <div>
            <div style="font-size:11px; text-transform:uppercase; color:var(--mm-muted); font-weight:600; margin-bottom:8px;">Status</div>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <button class="mm-btn mm-btn-secondary ${m.filterStatus === 'all' ? 'active' : ''}" data-status="all">All Status</button>
              <button class="mm-btn mm-btn-secondary ${m.filterStatus === 'uncompressed' ? 'active' : ''}" data-status="uncompressed">Uncompressed</button>
              <button class="mm-btn mm-btn-secondary ${m.filterStatus === 'optimized' ? 'active' : ''}" data-status="optimized">Optimized</button>
            </div>
          </div>
        </aside>

        <!-- Main Media Grid -->
        <div class="mm-media-content">
          <div class="mm-media-summary-bar">
            <div>
              <span style="font-size:16px; font-weight:700;">Media Optimization</span>
              <span style="color:var(--mm-muted); font-size:13px; margin-left:8px;">Saved ${escapeHtml(m.summary.totalSavedFormatted)} (${m.summary.overallSavingsPercent}%) across ${m.summary.totalImages} images</span>
            </div>
            <div style="display:flex; gap:10px;">
              <button class="mm-btn mm-btn-primary" id="mm-open-wizard-btn">Compress &amp; Convert Wizard</button>
            </div>
          </div>

          ${
            state.loading.media
              ? `<div style="padding:48px; text-align:center; color:var(--mm-muted);">Loading media library...</div>`
              : m.items.length === 0
              ? `<div style="padding:48px; text-align:center; color:var(--mm-muted);">No images found in WordPress media library.</div>`
              : `
            <div class="mm-media-grid">
              ${m.items
                .map(
                  (item) => `
                <div class="mm-media-card ${m.selectedIds.has(item.id) ? 'selected' : ''}" data-id="${item.id}">
                  <div class="mm-media-thumb-wrap">
                    <img src="${escapeHtml(item.thumbnailUrl)}" alt="${escapeHtml(item.altText || item.title)}" class="mm-media-thumb" loading="lazy" />
                    <span class="mm-status-pill ${item.status === 'optimized' ? 'success' : 'warning'}" style="position:absolute; top:8px; right:8px;">
                      ${item.status === 'optimized' ? `WebP (-${item.savingsPercent}%)` : 'Original'}
                    </span>
                  </div>
                  <div class="mm-media-card-body">
                    <div class="mm-media-title">${escapeHtml(item.filename)}</div>
                    <div class="mm-media-meta">
                      <span>${escapeHtml(item.sizeFormatted)}</span>
                      <span>${item.width}x${item.height}</span>
                    </div>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          `
          }

          <!-- Sticky Bulk Bar -->
          ${
            selectedCount > 0
              ? `
            <div class="mm-bulk-bar animate-in fade-in">
              <span style="font-size:13px; font-weight:600;">${selectedCount} images selected</span>
              <div style="display:flex; gap:8px;">
                <button class="mm-btn mm-btn-primary" id="mm-bulk-compress-btn">Convert to WebP</button>
                <button class="mm-btn mm-btn-secondary" id="mm-bulk-restore-btn">Restore Original</button>
                <button class="mm-btn mm-btn-secondary" id="mm-bulk-clear-btn">Deselect</button>
              </div>
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  function renderMediaView() {
    const stage = document.getElementById('mm-main-stage');
    if (stage && state.currentRoute === 'media') {
      stage.innerHTML = renderMediaViewHtml();
      bindMediaEvents();
    }
  }

  // Modals for Elevation, File Operations, and Media Wizard
  function renderModals() {
    const modal = state.fileManager.modal;
    const isWizard = state.media.wizardOpen;

    if (modal && modal.type === 'elevate') {
      return `
        <div class="mm-modal-backdrop">
          <div class="mm-modal-card">
            <h3 style="margin:0; font-size:16px; font-weight:700;">Enable File Write Mode</h3>
            <p style="margin:0; font-size:13px; color:var(--mm-muted); line-height:1.5;">
              Modifying PHP, theme, or plugin files can affect your website. Automatic shadow backups are saved before every change. Re-authenticate with your administrator password to unlock write mode for 15 minutes.
            </p>
            <form id="mm-elevate-form" style="display:flex; flex-direction:column; gap:12px;">
              <input type="password" id="mm-elevate-pwd" placeholder="Enter administrator password" required style="padding:10px; border-radius:6px; background:#0E0E10; border:1px solid var(--mm-border); color:#fff; font-size:13px;" autoFocus />
              <div class="mm-modal-actions">
                <button type="button" class="mm-btn mm-btn-secondary" id="mm-modal-cancel">Cancel</button>
                <button type="submit" class="mm-btn mm-btn-primary">Authenticate &amp; Unlock</button>
              </div>
            </form>
          </div>
        </div>
      `;
    }

    if (modal && (modal.type === 'newFile' || modal.type === 'newFolder')) {
      const isDir = modal.type === 'newFolder';
      return `
        <div class="mm-modal-backdrop">
          <div class="mm-modal-card">
            <h3 style="margin:0; font-size:16px; font-weight:700;">Create ${isDir ? 'New Folder' : 'New File'}</h3>
            <form id="mm-create-item-form" style="display:flex; flex-direction:column; gap:12px;">
              <input type="text" id="mm-create-item-name" placeholder="${isDir ? 'folder-name' : 'filename.php'}" required style="padding:10px; border-radius:6px; background:#0E0E10; border:1px solid var(--mm-border); color:#fff; font-size:13px;" autoFocus />
              <div class="mm-modal-actions">
                <button type="button" class="mm-btn mm-btn-secondary" id="mm-modal-cancel">Cancel</button>
                <button type="submit" class="mm-btn mm-btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      `;
    }

    if (isWizard) {
      return `
        <div class="mm-modal-backdrop">
          <div class="mm-modal-card mm-compress-wizard" style="width:520px;">
            <h3 style="margin:0; font-size:18px; font-weight:700;">Compress &amp; Convert Wizard</h3>
            <p style="margin:0; font-size:13px; color:var(--mm-muted);">Optimize images to modern WebP format locally with zero quality loss.</p>

            <div style="display:flex; flex-direction:column; gap:16px; margin-top:8px;">
              <div>
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:6px;">Quality Preset</label>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
                  <button class="mm-btn mm-btn-secondary ${state.media.wizardPreset === 'lossless' ? 'active' : ''}" data-preset="lossless">Lossless</button>
                  <button class="mm-btn mm-btn-secondary ${state.media.wizardPreset === 'balanced' ? 'active' : ''}" data-preset="balanced">Balanced (80%)</button>
                  <button class="mm-btn mm-btn-secondary ${state.media.wizardPreset === 'aggressive' ? 'active' : ''}" data-preset="aggressive">Aggressive (65%)</button>
                </div>
              </div>

              <div>
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:6px;">Target Format</label>
                <select id="mm-wizard-format" style="width:100%; padding:10px; border-radius:6px; background:#0E0E10; border:1px solid var(--mm-border); color:#fff;">
                  <option value="webp">WebP (Recommended — universally supported)</option>
                  <option value="original">Keep Original Format</option>
                </select>
              </div>

              <div class="mm-modal-actions">
                <button type="button" class="mm-btn mm-btn-secondary" id="mm-wizard-cancel">Cancel</button>
                <button type="button" class="mm-btn mm-btn-primary" id="mm-wizard-run-btn">Run Local Optimization</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  function renderSettingsViewHtml() {
    return `
      <div style="padding:24px; max-width:800px; margin:0 auto; width:100%;">
        <h1 style="font-size:20px; font-weight:700; margin:0 0 16px;">Platform Settings</h1>
        <div class="mm-card" style="padding:20px; background:var(--mm-surface); border:1px solid var(--mm-border); border-radius:8px; display:flex; flex-direction:column; gap:16px;">
          <div>
            <label style="display:flex; align-items:flex-start; gap:8px; cursor:pointer;">
              <input type="checkbox" id="mm-setting-consent" ${state.serverStatus.consentGiven ? 'checked' : ''} />
              <div>
                <strong style="font-size:14px;">Telemetry &amp; Cloud Offloading Consent</strong>
                <p style="margin:4px 0 0; font-size:12px; color:var(--mm-muted);">Allow offloading CPU-intensive image batching and PageSpeed jobs to your connected Mimic Manager backend.</p>
              </div>
            </label>
          </div>
          <div style="border-top:1px solid var(--mm-border); padding-top:16px;">
            <button class="mm-btn mm-btn-primary" id="mm-save-settings-btn">Save Settings</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderAboutViewHtml() {
    const brand = wpData.brand;
    return `
      <div style="padding:24px; max-width:800px; margin:0 auto; width:100%; text-align:center;">
        <svg viewBox="0 0 20 20" width="48" height="48" fill="currentColor" style="color:var(--mm-cyan); margin-bottom:16px;">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M10 2L17.5 5.75L10 9.5L2.5 5.75L10 2ZM10 4.1L14.3 6.25L10 8.4L5.7 6.25L10 4.1Z"/>
          <path d="M2.5 8L10 11.75L17.5 8L17.5 9.8L10 13.55L2.5 9.8V8Z"/>
          <path d="M2.5 12L10 15.75L17.5 12L17.5 13.8L10 17.55L2.5 13.8V12Z"/>
        </svg>
        <h1 style="font-size:24px; font-weight:700; margin:0;">${escapeHtml(brand.name)}</h1>
        <p style="color:var(--mm-muted); font-size:14px; margin:8px 0 24px;">Version ${escapeHtml(brand.version)} · Created by ${escapeHtml(brand.creator)} · A ${escapeHtml(brand.owner)} Project</p>
        <div class="mm-card" style="padding:24px; background:var(--mm-surface); border:1px solid var(--mm-border); border-radius:8px; text-align:left; font-size:13px; color:var(--mm-muted); line-height:1.6;">
          <p><strong>Mimic Manager</strong> is an open-source, self-hostable site optimization platform combining high-performance media compression, tiered PageSpeed fixes, plugin-aware SEO gap fill, and a secure visual file manager.</p>
          <p>100% Free and Open Source under AGPL-3.0 (backend/PWA) and GPL-2.0+ (WordPress Connector). Zero paid service lock-in.</p>
        </div>
      </div>
    `;
  }

  function renderGenericView(title, subtitle) {
    return `
      <div style="padding:24px;">
        <h1 style="font-size:20px; font-weight:700; margin:0;">${escapeHtml(title)}</h1>
        <p style="color:var(--mm-muted); font-size:13px; margin:4px 0 16px;">${escapeHtml(subtitle)}</p>
        <div class="mm-card" style="padding:32px; background:var(--mm-surface); border:1px solid var(--mm-border); border-radius:8px; text-align:center; color:var(--mm-muted);">
          Module active and operating locally.
        </div>
      </div>
    `;
  }

  function render404() {
    return `<div style="padding:48px; text-align:center; color:var(--mm-muted);">Screen not found. <a href="#/dashboard" style="color:var(--mm-cyan);">Return to dashboard</a>.</div>`;
  }

  function renderStatusBadges() {
    const el = document.getElementById('mm-connection-badge');
    if (!el) return;
    const isConn = state.connectionStatus === 'connected';
    el.innerHTML = `
      <span class="mm-status-pill ${isConn ? 'success' : 'info'}" style="font-size:11px;">
        ● ${isConn ? 'Connected' : 'Local Mode'}
      </span>
    `;
  }

  // Event Handlers
  function bindEvents() {
    // Rail toggle
    const railToggle = document.getElementById('mm-rail-toggle');
    if (railToggle) {
      railToggle.addEventListener('click', () => {
        state.railCollapsed = !state.railCollapsed;
        localStorage.setItem('mm_rail_collapsed', state.railCollapsed);
        const rail = document.getElementById('mm-app-rail');
        if (rail) rail.classList.toggle('collapsed', state.railCollapsed);
        railToggle.textContent = state.railCollapsed ? '»' : '«';
      });
    }

    // Fullscreen toggle
    const fsBtn = document.getElementById('mm-toggle-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        state.fullscreen = !state.fullscreen;
        localStorage.setItem('mm_fullscreen_disabled', (!state.fullscreen).toString());
        document.body.classList.toggle('mm-fullbleed', state.fullscreen);
      });
    }

    // Dismiss context menu on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#mm-context-menu')) {
        if (state.fileManager.contextMenu.visible) {
          state.fileManager.contextMenu.visible = false;
          const cmEl = document.getElementById('mm-context-menu');
          if (cmEl) cmEl.remove();
        }
      }
    });

    bindFileManagerEvents();
    bindMediaEvents();
    bindSitesEvents();
    bindModalEvents();
  }

  function bindFileManagerEvents() {
    // Elevation button
    const elevateBtn = document.getElementById('mm-enable-write-btn');
    if (elevateBtn) {
      elevateBtn.addEventListener('click', () => {
        state.fileManager.modal = { type: 'elevate' };
        renderApp();
      });
    }

    const lockBtn = document.getElementById('mm-lock-again-btn');
    if (lockBtn) {
      lockBtn.addEventListener('click', lockAgain);
    }

    // Breadcrumbs
    document.querySelectorAll('.mm-crumb').forEach((crumb) => {
      crumb.addEventListener('click', (e) => {
        const p = e.currentTarget.getAttribute('data-path');
        loadFiles(p);
      });
    });

    // Toolbar buttons
    const tbNewFile = document.getElementById('mm-tb-new-file');
    if (tbNewFile) {
      tbNewFile.addEventListener('click', () => {
        state.fileManager.modal = { type: 'newFile' };
        renderApp();
      });
    }

    const tbNewFolder = document.getElementById('mm-tb-new-folder');
    if (tbNewFolder) {
      tbNewFolder.addEventListener('click', () => {
        state.fileManager.modal = { type: 'newFolder' };
        renderApp();
      });
    }

    const tbRefresh = document.getElementById('mm-tb-refresh');
    if (tbRefresh) {
      tbRefresh.addEventListener('click', () => loadFiles(state.fileManager.currentPath));
    }

    // Node click and right-click
    document.querySelectorAll('.mm-fm-node').forEach((node) => {
      node.addEventListener('click', (e) => {
        const isDir = node.getAttribute('data-is-dir') === 'true';
        const p = node.getAttribute('data-path');
        if (isDir) {
          loadFiles(p);
        } else {
          openFileInEditor(p);
        }
      });

      node.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const p = node.getAttribute('data-path');
        const isDir = node.getAttribute('data-is-dir') === 'true';
        const target = state.fileManager.files.find((f) => f.path === p) || { path: p, isDir };

        state.fileManager.contextMenu = {
          visible: true,
          x: Math.min(e.clientX, window.innerWidth - 240),
          y: Math.min(e.clientY, window.innerHeight - 300),
          target,
        };
        renderApp();
      });
    });

    // Right-click on empty grid space
    const gridWrap = document.getElementById('mm-fm-grid-wrap');
    if (gridWrap) {
      gridWrap.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.mm-fm-node')) return;
        e.preventDefault();
        state.fileManager.contextMenu = {
          visible: true,
          x: Math.min(e.clientX, window.innerWidth - 240),
          y: Math.min(e.clientY, window.innerHeight - 200),
          target: null,
        };
        renderApp();
      });
    }

    // Editor buttons
    const edClose = document.getElementById('mm-editor-close-btn');
    if (edClose) {
      edClose.addEventListener('click', () => {
        state.fileManager.editor.open = false;
        renderFileManagerView();
      });
    }

    const edSave = document.getElementById('mm-editor-save-btn');
    if (edSave) {
      edSave.addEventListener('click', saveCurrentEditorFile);
    }

    // Context menu item actions
    document.querySelectorAll('.mm-context-item').forEach((item) => {
      item.addEventListener('click', async (e) => {
        const action = item.getAttribute('data-action');
        const target = state.fileManager.contextMenu.target;
        state.fileManager.contextMenu.visible = false;
        const cmEl = document.getElementById('mm-context-menu');
        if (cmEl) cmEl.remove();

        if (action === 'open-editor' && target) {
          openFileInEditor(target.path);
        } else if (action === 'open-folder' && target) {
          loadFiles(target.path);
        } else if (action === 'new-file') {
          state.fileManager.modal = { type: 'newFile' };
          renderApp();
        } else if (action === 'new-folder') {
          state.fileManager.modal = { type: 'newFolder' };
          renderApp();
        } else if (action === 'refresh') {
          loadFiles(state.fileManager.currentPath);
        } else if (action === 'delete' && target) {
          deleteItemWithUndo(target.path);
        }
      });
    });
  }

  async function openFileInEditor(filePath) {
    try {
      const res = await apiFetch('/files/read', {
        method: 'POST',
        body: JSON.stringify({ path: filePath }),
      });

      if (res && res.success) {
        state.fileManager.editor = {
          open: true,
          path: filePath,
          content: res.content,
          savedContent: res.content,
          hash: res.hash,
          mtime: res.mtime,
          isDirty: false,
          lintError: null,
        };
        renderFileManagerView();
      }
    } catch (err) {
      showToast('Cannot open file: ' + err.message);
    }
  }

  async function saveCurrentEditorFile() {
    const ed = state.fileManager.editor;
    const txtArea = document.getElementById('mm-editor-textarea');
    if (txtArea) ed.content = txtArea.value;

    try {
      const res = await apiFetch('/files/save', {
        method: 'POST',
        body: JSON.stringify({
          path: ed.path,
          content: ed.content,
          expectedHash: ed.hash,
        }),
      });

      if (res && res.success) {
        ed.hash = res.newHash;
        ed.mtime = res.newMtime;
        ed.savedContent = ed.content;
        ed.isDirty = false;
        showToast('File saved successfully!');
        renderFileManagerView();
      }
    } catch (err) {
      showToast('Save failed: ' + err.message);
    }
  }

  async function deleteItemWithUndo(filePath) {
    try {
      const res = await apiFetch('/files/delete', {
        method: 'POST',
        body: JSON.stringify({ path: filePath }),
      });

      if (res && res.success) {
        loadFiles(state.fileManager.currentPath);
        showToast(`Moved ${escapeHtml(filePath)} to trash.`, {
          undoDuration: 10,
          undoAction: async () => {
            await apiFetch('/files/restore', {
              method: 'POST',
              body: JSON.stringify({
                trashName: res.trashName,
                originalPath: res.originalPath,
              }),
            });
            showToast(`Restored ${escapeHtml(filePath)}.`);
            loadFiles(state.fileManager.currentPath);
          },
        });
      }
    } catch (err) {
      showToast('Delete failed: ' + err.message);
    }
  }

  function bindMediaEvents() {
    // Card clicks
    document.querySelectorAll('.mm-media-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = parseInt(card.getAttribute('data-id'), 10);
        if (state.media.selectedIds.has(id)) {
          state.media.selectedIds.delete(id);
        } else {
          state.media.selectedIds.add(id);
        }
        renderMediaView();
      });
    });

    const wizardBtn = document.getElementById('mm-open-wizard-btn');
    if (wizardBtn) {
      wizardBtn.addEventListener('click', () => {
        state.media.wizardOpen = true;
        renderApp();
      });
    }

    const bulkCompress = document.getElementById('mm-bulk-compress-btn');
    if (bulkCompress) {
      bulkCompress.addEventListener('click', compressSelectedMedia);
    }

    const bulkClear = document.getElementById('mm-bulk-clear-btn');
    if (bulkClear) {
      bulkClear.addEventListener('click', () => {
        state.media.selectedIds.clear();
        renderMediaView();
      });
    }

    const wizardRun = document.getElementById('mm-wizard-run-btn');
    if (wizardRun) {
      wizardRun.addEventListener('click', async () => {
        const allIds = state.media.items.map((i) => i.id);
        state.media.selectedIds = new Set(allIds);
        await compressSelectedMedia();
      });
    }

    const wizardCancel = document.getElementById('mm-wizard-cancel');
    if (wizardCancel) {
      wizardCancel.addEventListener('click', () => {
        state.media.wizardOpen = false;
        renderApp();
      });
    }
  }

  function bindSitesEvents() {
    const genBtn = document.getElementById('mm-generate-code-btn');
    if (genBtn) {
      genBtn.addEventListener('click', generatePairingCode);
    }

    const regenBtn = document.getElementById('mm-regen-code-btn');
    if (regenBtn) {
      regenBtn.addEventListener('click', generatePairingCode);
    }

    const copyBtn = document.getElementById('mm-copy-code-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(state.pairing.pairingCode);
        showToast('Pairing code copied to clipboard!');
      });
    }

    const disBtn = document.getElementById('mm-disconnect-btn');
    if (disBtn) {
      disBtn.addEventListener('click', disconnectSite);
    }

    const urlInput = document.getElementById('mm-backend-url');
    if (urlInput) {
      urlInput.addEventListener('change', (e) => {
        state.pairing.backendUrl = e.target.value.trim();
      });
    }

    const consentCb = document.getElementById('mm-consent-cb');
    if (consentCb) {
      consentCb.addEventListener('change', (e) => {
        state.pairing.consent = e.target.checked;
      });
    }
  }

  function bindModalEvents() {
    const cancelBtn = document.getElementById('mm-modal-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        state.fileManager.modal = null;
        renderApp();
      });
    }

    const elevateForm = document.getElementById('mm-elevate-form');
    if (elevateForm) {
      elevateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = document.getElementById('mm-elevate-pwd').value;
        submitElevation(pwd);
      });
    }

    const createForm = document.getElementById('mm-create-item-form');
    if (createForm) {
      createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('mm-create-item-name').value;
        const isDir = state.fileManager.modal.type === 'newFolder';

        try {
          const res = await apiFetch('/files/create', {
            method: 'POST',
            body: JSON.stringify({
              path: state.fileManager.currentPath,
              name,
              isDir,
            }),
          });

          if (res && res.success) {
            state.fileManager.modal = null;
            showToast(`Created ${isDir ? 'folder' : 'file'} ${escapeHtml(name)}.`);
            loadFiles(state.fileManager.currentPath);
          }
        } catch (err) {
          showToast('Creation failed: ' + err.message);
        }
      });
    }
  }

  // Self-initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRouting);
  } else {
    initRouting();
  }
})();
