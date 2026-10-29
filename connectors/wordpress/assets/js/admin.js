/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

(function () {
  'use strict';

  // Global State Store
  const state = {
    currentRoute: 'dashboard',
    routeParams: {},
    fullscreen: localStorage.getItem('mm_fullscreen_disabled') !== 'true',
    density: localStorage.getItem('mm_density') || 'compact',
    viewMode: localStorage.getItem('mm_view_mode') || 'table',
    activeTask: null,
    pollingInterval: 3000,
    serverStatus: {
      localEngine: { engine: 'gd', supported: true },
      consentGiven: false,
      cloudConnected: false,
    },
    connectionStatus: 'local-only', // 'connected' | 'local-only' | 'retrying'
    connectionReason: '100% Local Mode (telemetry-free)',
    lastToastMessage: '',
    lastToastTime: 0,
    toasts: [],
    errorRingBuffer: [],
    loading: {
      files: false,
      dashboard: false,
    },
    fileManager: {
      currentPath: '',
      files: [],
      lockedNodes: [],
      selectedPaths: new Set(),
      expandedFolders: new Set(['']),
      writeMode: false,
      inspectorFile: null,
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
  };

  const wpData = window.mimicManagerData || {
    restUrl: '/wp-json/mimic-manager/v1',
    nonce: '',
    brand: { name: 'Mimic Manager', version: '1.0.0-rc.1', creator: 'SK Sahinur Islam', owner: 'Wefik' },
  };

  // Redact secrets for diagnostics logging
  function redactDiagnostics(data) {
    try {
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      return str
        .replace(/(['"]?(?:nonce|token|secret|password|api[_-]?key|auth)['"]?\s*[:=]\s*['"])([^'"]+)(['"])/gi, '$1[REDACTED]$3')
        .replace(/([?&](?:nonce|token|secret|password|key)=)([^&#\s]+)/gi, '$1[REDACTED]');
    } catch {
      return '[Diagnostics Redaction Error]';
    }
  }

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

  // Global Unhandled Rejection & Error Handlers (J5.1)
  window.addEventListener('error', (event) => {
    logError('window.error', event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    logError('unhandledrejection', event.reason);
  });

  // REST API fetch with 3-second timeout for interactive calls (J5.2)
  async function apiFetch(endpoint, options = {}) {
    const url = wpData.restUrl + endpoint;
    const timeoutMs = options.timeout || 3000;
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
        throw new Error(err.error || `HTTP error ${res.status}`);
      }
      return res.json();
    } catch (err) {
      clearTimeout(timeoutId);

      // Backend unreachable or timeout handling
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

  // Toast Provider with 10s Undo & Deduplication (J5.4)
  function showToast(message, options = {}) {
    const now = Date.now();
    // Deduplication check: ignore identical toasts within 3.5 seconds
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

    // Stack limit: max 3 toasts
    while (container.children.length >= 3) {
      container.removeChild(container.firstChild);
    }

    const toast = document.createElement('div');
    toast.className = 'mm-toast';
    toast.setAttribute('role', 'status');

    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    toast.appendChild(msgSpan);

    if (options.undoAction && typeof options.undoAction === 'function') {
      const undoBtn = document.createElement('button');
      undoBtn.className = 'mm-toast-undo';
      undoBtn.textContent = 'Undo';
      undoBtn.onclick = () => {
        try {
          options.undoAction();
        } catch (e) {
          logError('toast:undo', e);
        }
        removeToast(toast);
      };
      toast.appendChild(undoBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'mm-icon-btn';
    closeBtn.style.padding = '0 4px';
    closeBtn.style.fontSize = '12px';
    closeBtn.setAttribute('aria-label', 'Dismiss notification');
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => removeToast(toast);
    toast.appendChild(closeBtn);

    container.appendChild(toast);

    const duration = options.undoAction ? Math.max(options.duration || 10000, 10000) : options.duration || 4000;
    const timer = setTimeout(() => removeToast(toast), duration);

    function removeToast(t) {
      clearTimeout(timer);
      t.classList.add('hiding');
      setTimeout(() => {
        if (t.parentNode) t.parentNode.removeChild(t);
      }, 150);
    }
  }

  // Router Management
  function parseHash() {
    const hash = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
    const [pathPart, queryPart] = hash.split('?');
    const params = {};
    if (queryPart) {
      new URLSearchParams(queryPart).forEach((val, key) => {
        params[key] = val;
      });
    }
    return { route: pathPart || 'dashboard', params };
  }

  function navigateTo(route, params = {}) {
    if (state.fileManager.editor.isDirty) {
      confirmUnsavedChanges(() => {
        state.fileManager.editor.isDirty = false;
        performNavigate(route, params);
      });
      return;
    }
    performNavigate(route, params);
  }

  function performNavigate(route, params = {}) {
    const query = new URLSearchParams(params).toString();
    const newHash = '#/' + route + (query ? '?' + query : '');
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    } else {
      handleRoute();
    }
  }

  function handleRoute() {
    const { route, params } = parseHash();
    state.currentRoute = route;
    state.routeParams = params;

    if (route === 'files') {
      const p = params.path !== undefined ? params.path : (state.fileManager.currentPath || '');
      state.fileManager.currentPath = p;
      loadFiles(p);
    }

    renderApp();
  }

  // Unsaved Changes Guard Dialog
  function confirmUnsavedChanges(onDiscard) {
    const existing = document.getElementById('mm-unsaved-dialog');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'mm-unsaved-dialog';
    modal.className = 'mm-modal-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="mm-modal-card">
        <h3 style="margin:0 0 8px 0; font-size:16px; color:var(--mm-text);">Unsaved Changes</h3>
        <p style="margin:0; font-size:13px; color:var(--mm-muted);">
          You have unsaved edits in <strong>${escapeHtml(state.fileManager.editor.path)}</strong>.
          Leaving will discard your changes.
        </p>
        <div class="mm-modal-actions">
          <button id="mm-keep-editing-btn" class="mm-action-btn">Keep Editing</button>
          <button id="mm-discard-btn" class="mm-action-btn" style="color:var(--mm-danger);">Discard</button>
          <button id="mm-save-first-btn" class="mm-action-btn primary">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#mm-keep-editing-btn').onclick = () => modal.remove();
    modal.querySelector('#mm-discard-btn').onclick = () => {
      modal.remove();
      onDiscard();
    };
    modal.querySelector('#mm-save-first-btn').onclick = async () => {
      const saved = await saveCurrentEditorFile();
      if (saved) {
        modal.remove();
        onDiscard();
      }
    };
  }

  window.addEventListener('beforeunload', function (e) {
    if (state.fileManager.editor.isDirty) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes in Mimic Manager.';
    }
  });

  // Relocate WordPress Notices into Collapsible Tray
  function relocateNotices() {
    const noticeContainer = document.getElementById('mm-notices-container');
    if (!noticeContainer) return;

    const externalNotices = document.querySelectorAll(
      '#wpbody-content > .notice:not(.mm-internal), #wpbody-content > .updated, #wpbody-content > .error'
    );

    if (externalNotices.length === 0) {
      noticeContainer.innerHTML = '';
      return;
    }

    const tray = document.createElement('details');
    tray.className = 'mm-notices-tray';
    tray.innerHTML = `
      <summary class="mm-notices-summary">
        <span>⚠ WordPress notices (${externalNotices.length})</span>
      </summary>
      <div class="mm-notices-dropdown"></div>
    `;

    const dropdown = tray.querySelector('.mm-notices-dropdown');
    externalNotices.forEach((n) => {
      n.style.margin = '8px 0';
      dropdown.appendChild(n);
    });

    noticeContainer.innerHTML = '';
    noticeContainer.appendChild(tray);
  }

  // File Manager Operations
  async function loadFiles(path = '') {
    state.loading.files = true;
    renderApp();

    try {
      const res = await apiFetch(`/files/list?path=${encodeURIComponent(path)}`);
      if (res.success) {
        state.fileManager.files = res.files || [];
        state.fileManager.lockedNodes = res.lockedNodes || [];
        state.fileManager.writeMode = res.writeMode || false;
        state.fileManager.selectedPaths.clear();
        state.fileManager.inspectorFile = null;
      }
    } catch (err) {
      logError('loadFiles', err);
    } finally {
      state.loading.files = false;
      renderApp();
    }
  }

  async function openEditor(path) {
    try {
      const res = await apiFetch('/files/read', {
        method: 'POST',
        body: JSON.stringify({ path }),
      });

      if (res.success) {
        state.fileManager.editor = {
          open: true,
          path,
          content: res.content,
          savedContent: res.content,
          hash: res.hash,
          mtime: res.mtime,
          isDirty: false,
          lintError: null,
        };
        renderApp();
      }
    } catch (err) {
      showToast(`Unable to open file: ${err.message}`);
    }
  }

  async function saveCurrentEditorFile() {
    const ed = state.fileManager.editor;
    if (!ed.isDirty) return true;

    try {
      if (ed.path.endsWith('.php')) {
        const lintRes = await apiFetch('/files/lint', {
          method: 'POST',
          body: JSON.stringify({ content: ed.content }),
        });

        if (!lintRes.valid) {
          ed.lintError = `PHP Syntax Error (Line ${lintRes.line}): ${lintRes.error}`;
          renderApp();
          return false;
        }
      }

      const prevContent = ed.savedContent;
      const saveRes = await apiFetch('/files/save', {
        method: 'POST',
        body: JSON.stringify({
          path: ed.path,
          content: ed.content,
          expectedHash: ed.hash,
        }),
      });

      if (saveRes.success) {
        ed.savedContent = ed.content;
        ed.hash = saveRes.hash;
        ed.mtime = saveRes.mtime;
        ed.isDirty = false;
        ed.lintError = null;

        showToast(`Saved ${ed.path}`, {
          duration: 10000,
          undoAction: async () => {
            await apiFetch('/files/save', {
              method: 'POST',
              body: JSON.stringify({
                path: ed.path,
                content: prevContent,
                expectedHash: ed.hash,
              }),
            });
            openEditor(ed.path);
            showToast(`Reverted changes to ${ed.path}`);
          },
        });

        renderApp();
        return true;
      }
    } catch (err) {
      showToast(`Save failed: ${err.message}`);
      return false;
    }
    return false;
  }

  // Polling Server Status
  async function pollStatus() {
    if (document.hidden) return;
    try {
      const data = await apiFetch('/status');
      state.serverStatus = data;
      state.connectionStatus = data.cloudConnected ? 'connected' : 'local-only';
      state.connectionReason = data.cloudConnected ? 'Connected to Cloud Engine' : '100% Local Mode (telemetry-free)';
      renderStatusBadges();
    } catch (e) {
      state.connectionStatus = 'local-only';
      renderStatusBadges();
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Error Boundary Wrapper (J5.1)
  function safeRender(paneName, renderFn) {
    try {
      return renderFn();
    } catch (err) {
      logError(`render:${paneName}`, err);
      return renderErrorCard({
        title: `${paneName} encountered an error`,
        message: 'A render exception occurred in this pane. Other components remain functional.',
        diagnostics: redactDiagnostics({
          pane: paneName,
          error: err && err.message ? err.message : String(err),
          time: new Date().toISOString(),
        }),
        onRetry: () => renderApp(),
      });
    }
  }

  function renderErrorCard({ title, message, diagnostics, onRetry }) {
    const diagStr = escapeHtml(typeof diagnostics === 'string' ? diagnostics : JSON.stringify(diagnostics, null, 2));
    return `
      <div class="mm-error-card" role="alert">
        <div class="mm-error-badge">⚠️</div>
        <h3 class="mm-error-title">${escapeHtml(title)}</h3>
        <p class="mm-error-message">${escapeHtml(message)}</p>
        <div class="mm-error-actions">
          <button type="button" class="mm-action-btn primary mm-retry-pane-btn">Retry</button>
          <button type="button" class="mm-action-btn secondary mm-copy-diag-btn" data-diag="${diagStr}">Copy Diagnostics</button>
          <a href="https://github.com/GeniousSonu/Mimic-Manager/tree/main/docs" target="_blank" rel="noopener noreferrer" class="mm-action-btn">Documentation</a>
        </div>
      </div>
    `;
  }

  // Component Primitives (J2.4)
  function renderEmptyState({ type, title, desc, ctaText, ctaDisabledReason, ctaActionId, ctaHref }) {
    const icons = {
      folder: `<svg class="mm-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
      search: `<svg class="mm-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
      media: `<svg class="mm-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
      seo: `<svg class="mm-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      speed: `<svg class="mm-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
      offline: `<svg class="mm-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/></svg>`,
    };

    const iconSvg = icons[type] || icons.folder;
    const isCtaDisabled = !!ctaDisabledReason;

    return `
      <div class="mm-empty-state" role="status">
        ${iconSvg}
        <h4 class="mm-empty-title">${escapeHtml(title)}</h4>
        <p class="mm-empty-desc">${escapeHtml(desc)}</p>
        ${
          ctaText
            ? `
          <div class="mm-empty-cta">
            ${
              ctaHref
                ? `<a href="${escapeHtml(ctaHref)}" class="mm-action-btn primary">${escapeHtml(ctaText)}</a>`
                : `<button class="mm-action-btn primary" id="${escapeHtml(ctaActionId || 'mm-empty-cta-btn')}" ${isCtaDisabled ? `disabled title="${escapeHtml(ctaDisabledReason)}"` : ''}>${escapeHtml(ctaText)}</button>`
            }
            ${isCtaDisabled ? `<div style="font-size:11px; color:var(--mm-muted); margin-top:4px;">${escapeHtml(ctaDisabledReason)}</div>` : ''}
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  function renderFileGridSkeleton() {
    return `
      <div class="mm-grid-container" role="status" aria-busy="true">
        <span class="screen-reader-text" style="position:absolute; width:1px; height:1px; overflow:hidden;">Loading files...</span>
        <table class="mm-data-table">
          <thead>
            <tr>
              <th style="width:40%;">Name</th>
              <th style="width:20%;">Modified</th>
              <th style="width:15%;">Size</th>
              <th style="width:15%;">Permissions</th>
              <th style="width:10%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${[1, 2, 3, 4, 5]
              .map(
                () => `
              <tr>
                <td><div class="mm-skeleton" style="height:16px; width:65%;"></div></td>
                <td><div class="mm-skeleton" style="height:14px; width:80%;"></div></td>
                <td><div class="mm-skeleton" style="height:14px; width:50%;"></div></td>
                <td><div class="mm-skeleton" style="height:14px; width:40%;"></div></td>
                <td><div class="mm-skeleton" style="height:14px; width:60%;"></div></td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderHeader() {
    const brand = wpData.brand;
    const routes = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'media', label: 'Media' },
      { id: 'speed', label: 'Speed' },
      { id: 'seo', label: 'SEO' },
      { id: 'files', label: 'Files' },
      { id: 'settings', label: 'Settings' },
      { id: 'about', label: 'About' },
    ];

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
          <nav class="mm-nav-tabs">
            ${routes
              .map(
                (r) => `
              <a href="#/${r.id}" class="mm-nav-tab ${state.currentRoute === r.id ? 'active' : ''}" data-route="${r.id}">
                ${r.label}
              </a>
            `
              )
              .join('')}
          </nav>
        </div>
        <div class="mm-header-right">
          <div id="mm-notices-container"></div>
          <div class="mm-conn-badge ${state.connectionStatus}" title="${escapeHtml(state.connectionReason)}">
            <span style="font-size:8px;">●</span>
            <span>${state.connectionStatus === 'connected' ? 'Connected' : 'Local-only'}</span>
          </div>
          <div class="mm-task-indicator ${state.activeTask ? 'active' : ''}">
            <span>●</span>
            <span>${state.activeTask ? escapeHtml(state.activeTask.name) : 'Ready'}</span>
          </div>
          <button id="mm-fullscreen-toggle" class="mm-icon-btn" title="Toggle Full-Screen Breakout" aria-label="Toggle Full-Screen">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      </header>
    `;
  }

  function renderStatusBadges() {
    const el = document.getElementById('mm-status-strip');
    if (!el) return;

    const engine = state.serverStatus.localEngine || {};
    const consent = state.serverStatus.consentGiven;

    el.innerHTML = `
      <div class="mm-status-badge">
        <span class="dot ${engine.supported ? 'green' : 'amber'}"></span>
        <strong>Engine:</strong> ${escapeHtml(String(engine.engine || 'GD').toUpperCase())} ${engine.supported ? '(Active)' : '(Fallback)'}
      </div>
      <div class="mm-status-badge">
        <span class="dot green"></span>
        <strong>WebP:</strong> Supported natively
      </div>
      <div class="mm-status-badge">
        <span class="dot cyan"></span>
        <strong>Privacy:</strong> ${consent ? 'Cloud Enabled' : '100% Local Only'}
      </div>
      <div class="mm-status-badge">
        <span class="dot green"></span>
        <strong>Security:</strong> Jailed to wp-content
      </div>
    `;
  }

  function renderDashboardView() {
    return `
      <div id="mm-status-strip" class="mm-status-strip"></div>
      <div class="mm-dashboard-layout">
        <div class="mm-dashboard-grid">
          <div class="mm-dash-card">
            <h4>Total Media Savings</h4>
            <div class="mm-dash-metric">
              <span>64.8 MB</span>
              <span style="font-size:13px; color:var(--mm-success); font-weight:600;">(-68%)</span>
            </div>
            <svg class="mm-dash-sparkline" viewBox="0 0 200 40">
              <path d="M0,35 Q30,30 60,25 T120,15 T180,5 L200,8" fill="none" stroke="var(--mm-cyan)" stroke-width="2.5" />
            </svg>
          </div>
          <div class="mm-dash-card">
            <h4>Images Optimized</h4>
            <div class="mm-dash-metric">
              <span>184</span>
              <span style="font-size:13px; color:var(--mm-muted);">/ 184 assets</span>
            </div>
            <p style="font-size:12px; color:var(--mm-muted); margin:0;">Zero queue backlogs. 100% converted to modern WebP.</p>
          </div>
          <div class="mm-dash-card">
            <h4>PageSpeed Score Delta</h4>
            <div class="mm-dash-metric">
              <span style="color:var(--mm-success);">+24 pts</span>
            </div>
            <p style="font-size:12px; color:var(--mm-muted); margin:0;">LCP reduced from 3.2s to 1.1s via intrinsic dimensions & preconnect.</p>
          </div>
          <div class="mm-dash-card">
            <h4>SEO Missing Meta</h4>
            <div class="mm-dash-metric">
              <span style="color:var(--mm-success);">0 Issues</span>
            </div>
            <p style="font-size:12px; color:var(--mm-muted); margin:0;">All images have valid descriptive alt text.</p>
          </div>
        </div>

        <div class="mm-dash-card">
          <h4>Quick Operations</h4>
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px;">
            <a href="#/media" class="mm-action-btn primary">Bulk Compress Images</a>
            <a href="#/speed" class="mm-action-btn">Apply Core Web Vitals Fixes</a>
            <a href="#/seo" class="mm-action-btn">Audit Alt Text & Metadata</a>
            <a href="#/files" class="mm-action-btn">Open Sandboxed File Manager</a>
          </div>
        </div>
      </div>
    `;
  }

  function renderFileManagerView() {
    const fm = state.fileManager;
    const currentPath = fm.currentPath;
    const crumbs = currentPath ? currentPath.split('/').filter(Boolean) : [];

    return `
      <div class="mm-filemanager">
        <!-- Left Tree Pane -->
        <aside class="mm-tree-pane" role="tree" aria-label="Jailed File Explorer">
          <div class="mm-tree-header">
            <span>Explorer</span>
            <span class="mm-ext-badge">wp-content</span>
          </div>
          <div style="padding:6px 0;">
            <div class="mm-tree-node ${currentPath === '' ? 'selected' : ''}" data-tree-path="" role="treeitem">
              <span>📁 wp-content</span>
            </div>
            <div style="padding-left:16px;">
              <div class="mm-tree-node ${currentPath === 'themes' ? 'selected' : ''}" data-tree-path="themes" role="treeitem">
                <span>📁 themes</span>
              </div>
              <div class="mm-tree-node ${currentPath === 'plugins' ? 'selected' : ''}" data-tree-path="plugins" role="treeitem">
                <span>📁 plugins</span>
              </div>
              <div class="mm-tree-node ${currentPath === 'uploads' ? 'selected' : ''}" data-tree-path="uploads" role="treeitem">
                <span>📁 uploads</span>
              </div>
            </div>
            <div style="padding-top:12px; border-top:1px solid var(--mm-border); margin-top:12px;">
              <div style="font-size:11px; color:var(--mm-muted); padding:0 8px 4px 8px; font-weight:600;">LOCKED CORE NODES</div>
              ${fm.lockedNodes
                .map(
                  (n) => `
                <div class="mm-tree-node locked" title="${escapeHtml(n.reason)}" role="treeitem" aria-disabled="true">
                  <span>🔒 ${escapeHtml(n.name)}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </aside>

        <!-- Center Column -->
        <div class="mm-center-col">
          <!-- Action Toolbar -->
          <div class="mm-action-bar" role="toolbar" aria-label="File Operations">
            <div class="mm-action-group">
              <button class="mm-action-btn primary" id="mm-new-file-btn" ${!fm.writeMode ? 'disabled title="Read-only mode. Enable write mode in Settings → Files (requires re-authentication)."' : ''}>
                <span>+ New File</span>
              </button>
              <button class="mm-action-btn" id="mm-new-folder-btn" ${!fm.writeMode ? 'disabled title="Read-only mode. Enable write mode in Settings → Files (requires re-authentication)."' : ''}>
                <span>+ New Folder</span>
              </button>
              <button class="mm-action-btn" id="mm-upload-btn" ${!fm.writeMode ? 'disabled title="Read-only mode. Enable write mode in Settings → Files (requires re-authentication)."' : ''}>
                <span>Upload</span>
              </button>
              <button class="mm-action-btn" id="mm-compress-selected-btn" ${fm.selectedPaths.size === 0 ? 'disabled title="Select images to compress"' : ''}>
                <span>Bulk Compress</span>
              </button>
              <button class="mm-action-btn" id="mm-mimic-engine-btn" disabled title="Connect Mimic Manager backend to use the UI Replicator">
                <span>Mimic Engine</span>
              </button>
            </div>
            <div class="mm-action-group">
              <input type="search" id="mm-file-search" placeholder="Filter files..." style="height:28px; background:var(--mm-inset); border:1px solid var(--mm-border); color:var(--mm-text); border-radius:4px; padding:0 8px; font-size:12px;">
              <button id="mm-refresh-btn" class="mm-icon-btn" title="Refresh directory">🔄</button>
            </div>
          </div>

          <!-- Breadcrumbs -->
          <div class="mm-path-bar">
            <div class="mm-breadcrumbs">
              <span class="mm-crumb ${crumbs.length === 0 ? 'current' : ''}" data-crumb-path="">wp-content</span>
              ${crumbs
                .map((c, i) => {
                  const targetPath = crumbs.slice(0, i + 1).join('/');
                  const isLast = i === crumbs.length - 1;
                  return `
                  <span>/</span>
                  <span class="mm-crumb ${isLast ? 'current' : ''}" data-crumb-path="${escapeHtml(targetPath)}">${escapeHtml(c)}</span>
                `;
                })
                .join('')}
            </div>
            <div>
              <button id="mm-copy-path-btn" class="mm-icon-btn" title="Copy relative path" style="width:auto; padding:0 6px; font-size:11px;">Copy Path</button>
            </div>
          </div>

          <!-- Data Grid or Skeletons -->
          ${
            state.loading.files
              ? renderFileGridSkeleton()
              : fm.files.length === 0
                ? renderEmptyState({
                    type: 'folder',
                    title: 'Folder is empty',
                    desc: 'This directory has no files or subfolders. Create a file or upload media to populate it.',
                    ctaText: '+ New File',
                    ctaActionId: 'mm-empty-new-file-btn',
                    ctaDisabledReason: !fm.writeMode ? 'Read-only mode. Enable write mode in Settings to create files.' : '',
                  })
                : `
            <div class="mm-grid-container" tabindex="0" role="grid" aria-label="Files Grid">
              <table class="mm-data-table">
                <thead>
                  <tr>
                    <th style="width:40%;">Name</th>
                    <th style="width:20%;">Modified</th>
                    <th style="width:15%;">Size</th>
                    <th style="width:15%;">Permissions</th>
                    <th style="width:10%;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${fm.files
                    .map((file) => {
                      const isSelected = fm.selectedPaths.has(file.path);
                      return `
                      <tr class="mm-data-row ${isSelected ? 'selected' : ''}" data-file-path="${escapeHtml(file.path)}" data-is-dir="${file.isDir}">
                        <td>
                          <div class="mm-file-name-cell">
                            <span>${file.isDir ? '📁' : '📄'}</span>
                            <span>${escapeHtml(file.name)}</span>
                            <span class="mm-ext-badge">${escapeHtml(file.ext)}</span>
                          </div>
                        </td>
                        <td>${escapeHtml(file.modifiedFormatted)}</td>
                        <td>${escapeHtml(file.sizeFormatted)}</td>
                        <td>
                          <code>${escapeHtml(file.permissions)}</code>
                          ${file.isWorldWritable ? '<span title="World writable warning" style="color:var(--mm-danger);"> ⚠</span>' : ''}
                        </td>
                        <td>
                          ${file.isDir ? '<span style="color:var(--mm-muted);">Folder</span>' : '<span style="color:var(--mm-success);">Active</span>'}
                        </td>
                      </tr>
                    `;
                    })
                    .join('')}
                </tbody>
              </table>
            </div>
          `
          }

          <!-- Status Bar -->
          <div class="mm-status-bar">
            <div>
              <span>${fm.files.length} items</span>
              ${fm.selectedPaths.size > 0 ? `<span> · ${fm.selectedPaths.size} selected</span>` : ''}
            </div>
            <div>
              <span class="mm-status-pill ${fm.writeMode ? 'success' : 'warning'}">
                ● ${fm.writeMode ? 'Write Mode Active' : 'Read-Only Mode'}
              </span>
            </div>
          </div>

          <!-- Monaco / Code Editor Overlay -->
          ${fm.editor.open ? renderEditorOverlay() : ''}
        </div>

        <!-- Details Inspector (Right Pane) -->
        ${fm.inspectorFile ? renderInspectorPane(fm.inspectorFile) : ''}
      </div>
    `;
  }

  function renderEditorOverlay() {
    const ed = state.fileManager.editor;
    return `
      <div class="mm-editor-overlay" role="dialog" aria-modal="true" aria-label="Code Editor">
        <div class="mm-editor-header">
          <div class="mm-editor-title">
            <span>📄</span>
            <span>${escapeHtml(ed.path)}</span>
            ${ed.isDirty ? '<span class="mm-dirty-dot" title="Unsaved changes"></span>' : ''}
          </div>
          <div style="display:flex; gap:8px;">
            <button id="mm-editor-save-btn" class="mm-action-btn primary" ${!ed.isDirty ? 'disabled' : ''}>Save (Ctrl+S)</button>
            <button id="mm-editor-close-btn" class="mm-action-btn">Close</button>
          </div>
        </div>
        ${ed.lintError ? `<div class="mm-lint-banner"><span>⚠</span><span>${escapeHtml(ed.lintError)}</span></div>` : ''}
        <div class="mm-editor-body">
          <textarea id="mm-editor-textarea" class="mm-editor-textarea" spellcheck="false">${escapeHtml(ed.content)}</textarea>
        </div>
      </div>
    `;
  }

  function renderInspectorPane(file) {
    return `
      <aside class="mm-inspector-pane">
        <h4>Inspector</h4>
        <div class="mm-meta-row">
          <span class="mm-meta-label">Name</span>
          <strong class="mm-meta-val">${escapeHtml(file.name)}</strong>
        </div>
        <div class="mm-meta-row">
          <span class="mm-meta-label">Full Path</span>
          <span class="mm-meta-val">wp-content/${escapeHtml(file.path)}</span>
        </div>
        <div class="mm-meta-row">
          <span class="mm-meta-label">Size</span>
          <span class="mm-meta-val">${escapeHtml(file.sizeFormatted)} (${file.size} bytes)</span>
        </div>
        <div class="mm-meta-row">
          <span class="mm-meta-label">Permissions</span>
          <span class="mm-meta-val">${escapeHtml(file.permissions)}</span>
        </div>
        <div class="mm-meta-row">
          <span class="mm-meta-label">SHA256 Hash</span>
          <span class="mm-meta-val" id="mm-hash-display">Click to compute</span>
          <button id="mm-calc-hash-btn" class="mm-action-btn" style="margin-top:4px; font-size:11px;">Generate Checksum</button>
        </div>
      </aside>
    `;
  }

  function renderGenericView(title, desc) {
    return `
      <div class="mm-dashboard-layout">
        <div class="mm-dash-card">
          <h2 style="margin:0; font-size:20px; color:var(--mm-text);">${escapeHtml(title)}</h2>
          <p style="margin:4px 0 0; color:var(--mm-muted); font-size:13px;">${escapeHtml(desc)}</p>
        </div>
        <div class="mm-dash-card">
          <h4>Module Status</h4>
          <p style="font-size:13px; color:var(--mm-muted); margin:0;">
            Module loaded inside SPA shell with zero full-page reloads. All operations execute through authorized REST contracts.
          </p>
        </div>
      </div>
    `;
  }

  function render404() {
    return `
      <div class="mm-empty-state">
        <h2 style="font-size:32px; color:var(--mm-cyan); margin:0;">404</h2>
        <p style="color:var(--mm-muted);">The requested internal route does not exist.</p>
        <a href="#/dashboard" class="mm-action-btn primary">Return to Dashboard</a>
      </div>
    `;
  }

  // Master Render Cycle with Error Boundaries (J5.1)
  function renderApp() {
    const root = document.getElementById('mimic-manager-root');
    if (!root) return;

    // Dismiss boot loader immediately on first meaningful paint (J1.3)
    if (window._mmBootTimer) {
      clearTimeout(window._mmBootTimer);
      window._mmBootTimer = null;
    }
    const bootLoader = document.getElementById('mm-boot-loader');
    if (bootLoader) {
      bootLoader.remove();
    }
    const bootFallback = document.getElementById('mm-boot-fallback');
    if (bootFallback) {
      bootFallback.remove();
    }

    let contentHtml = '';
    switch (state.currentRoute) {
      case 'dashboard':
        contentHtml = safeRender('Dashboard', renderDashboardView);
        break;
      case 'media':
        contentHtml = safeRender('Media Optimization', () =>
          renderGenericView('Media Optimization', 'High-performance WebP conversion with zero paid API keys.')
        );
        break;
      case 'speed':
        contentHtml = safeRender('PageSpeed Fixes', () =>
          renderGenericView('PageSpeed Fixes', 'Safe, Moderate, and Guided fixes with auto-revert guarantees.')
        );
        break;
      case 'seo':
        contentHtml = safeRender('SEO Gap Fill', () =>
          renderGenericView('SEO Gap Fill', 'Heuristic and AI metadata audits for images and pages.')
        );
        break;
      case 'files':
        contentHtml = safeRender('File Manager', renderFileManagerView);
        break;
      case 'settings':
        contentHtml = safeRender('Settings', () =>
          renderGenericView('Settings', 'Configure telemetry opt-in, write mode, and sudo authentication.')
        );
        break;
      case 'about':
        contentHtml = safeRender('About', () =>
          renderGenericView(
            'About Mimic Manager',
            `Created by ${wpData.brand.creator} · A ${wpData.brand.owner} project · Free and Open Source under AGPL-3.0 / GPL-2.0+`
          )
        );
        break;
      default:
        contentHtml = render404();
        break;
    }

    root.innerHTML = `
      ${renderHeader()}
      <div class="mm-shell-content">
        ${contentHtml}
      </div>
    `;

    bindEvents();
    relocateNotices();
    renderStatusBadges();
  }

  // Event Binding
  function bindEvents() {
    // Navigation tabs
    document.querySelectorAll('.mm-nav-tab').forEach((tab) => {
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        const route = tab.getAttribute('data-route');
        navigateTo(route);
      });
    });

    // Fullscreen toggle
    const fsBtn = document.getElementById('mm-fullscreen-toggle');
    if (fsBtn) {
      fsBtn.onclick = () => {
        state.fullscreen = !state.fullscreen;
        document.body.classList.toggle('mm-fullbleed', state.fullscreen);
        localStorage.setItem('mm_fullscreen_disabled', state.fullscreen ? 'false' : 'true');
      };
    }

    // Breadcrumb navigation
    document.querySelectorAll('.mm-crumb').forEach((crumb) => {
      crumb.onclick = () => {
        const path = crumb.getAttribute('data-crumb-path');
        navigateTo('files', { path });
      };
    });

    // Left tree navigation
    document.querySelectorAll('.mm-tree-node:not(.locked)').forEach((node) => {
      node.onclick = () => {
        const path = node.getAttribute('data-tree-path');
        navigateTo('files', { path });
      };
    });

    // Table rows selection & navigation
    document.querySelectorAll('.mm-data-row').forEach((row) => {
      const path = row.getAttribute('data-file-path');
      const isDir = row.getAttribute('data-is-dir') === 'true';

      row.onclick = (e) => {
        if (e.ctrlKey || e.metaKey) {
          if (state.fileManager.selectedPaths.has(path)) {
            state.fileManager.selectedPaths.delete(path);
          } else {
            state.fileManager.selectedPaths.add(path);
          }
        } else {
          state.fileManager.selectedPaths.clear();
          state.fileManager.selectedPaths.add(path);
        }

        const fileObj = state.fileManager.files.find((f) => f.path === path);
        state.fileManager.inspectorFile = fileObj || null;
        renderApp();
      };

      row.ondblclick = () => {
        if (isDir) {
          navigateTo('files', { path });
        } else {
          openEditor(path);
        }
      };
    });

    // Editor textarea input
    const textarea = document.getElementById('mm-editor-textarea');
    if (textarea) {
      textarea.oninput = () => {
        state.fileManager.editor.content = textarea.value;
        state.fileManager.editor.isDirty = textarea.value !== state.fileManager.editor.savedContent;
        const saveBtn = document.getElementById('mm-editor-save-btn');
        if (saveBtn) saveBtn.disabled = !state.fileManager.editor.isDirty;
      };

      // Keyboard shortcut Ctrl+S
      textarea.onkeydown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          saveCurrentEditorFile();
        }
      };
    }

    // Editor buttons
    const saveBtn = document.getElementById('mm-editor-save-btn');
    if (saveBtn) {
      saveBtn.onclick = () => saveCurrentEditorFile();
    }

    const closeBtn = document.getElementById('mm-editor-close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => {
        if (state.fileManager.editor.isDirty) {
          confirmUnsavedChanges(() => {
            state.fileManager.editor.open = false;
            state.fileManager.editor.isDirty = false;
            renderApp();
          });
        } else {
          state.fileManager.editor.open = false;
          renderApp();
        }
      };
    }

    // Refresh button
    const refreshBtn = document.getElementById('mm-refresh-btn');
    if (refreshBtn) {
      refreshBtn.onclick = () => loadFiles(state.fileManager.currentPath);
    }

    // Copy path button
    const copyBtn = document.getElementById('mm-copy-path-btn');
    if (copyBtn) {
      copyBtn.onclick = () => {
        const full = 'wp-content/' + state.fileManager.currentPath;
        navigator.clipboard.writeText(full).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => (copyBtn.textContent = 'Copy Path'), 1500);
        });
      };
    }

    // Error card buttons
    document.querySelectorAll('.mm-retry-pane-btn').forEach((btn) => {
      btn.onclick = () => renderApp();
    });
    document.querySelectorAll('.mm-copy-diag-btn').forEach((btn) => {
      btn.onclick = () => {
        const diag = btn.getAttribute('data-diag') || '';
        navigator.clipboard.writeText(diag).then(() => {
          showToast('Diagnostics copied to clipboard (secrets redacted)');
        });
      };
    });
  }

  // Boot Initialization
  document.addEventListener('DOMContentLoaded', function () {
    if (state.fullscreen) {
      document.body.classList.add('mm-fullbleed');
    }

    window.addEventListener('hashchange', handleRoute);
    handleRoute();
    pollStatus();
    setInterval(pollStatus, state.pollingInterval);
  });
})();
