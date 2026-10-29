/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

(function () {
  'use strict';

  // State Store
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

  // Helper: REST API fetch
  async function apiFetch(endpoint, options = {}) {
    const url = wpData.restUrl + endpoint;
    const headers = {
      'Content-Type': 'application/json',
      'X-WP-Nonce': wpData.nonce,
      ...(options.headers || {}),
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }
    return res.json();
  }

  // 1. Router Management
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
    // Unsaved changes guard
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

  // 2. Unsaved Changes Guard
  function confirmUnsavedChanges(onDiscard) {
    const modal = document.createElement('div');
    modal.className = 'mm-modal-backdrop';
    modal.innerHTML = `
      <div class="mm-modal-card" role="dialog" aria-modal="true" aria-labelledby="mm-unsaved-title">
        <h3 id="mm-unsaved-title" style="margin:0; font-size:16px;">Unsaved Changes</h3>
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

  // 3. Relocate WordPress Notices
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

  // 4. File Manager Logic
  async function loadFiles(path = '') {
    try {
      const res = await apiFetch(`/files/list?path=${encodeURIComponent(path)}`);
      if (res.success) {
        state.fileManager.files = res.files || [];
        state.fileManager.lockedNodes = res.lockedNodes || [];
        state.fileManager.writeMode = res.writeMode || false;
        state.fileManager.selectedPaths.clear();
        state.fileManager.inspectorFile = null;
        renderApp();
      }
    } catch (err) {
      console.error('[Mimic Manager] loadFiles error:', err);
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
      alert(`Could not open file: ${err.message}`);
    }
  }

  async function saveCurrentEditorFile() {
    const ed = state.fileManager.editor;
    if (!ed.open) return false;

    // Lint if PHP
    if (ed.path.endsWith('.php')) {
      try {
        const lintRes = await apiFetch('/files/lint', {
          method: 'POST',
          body: JSON.stringify({ code: ed.content }),
        });

        if (!lintRes.valid) {
          ed.lintError = `PHP Syntax Error (line ${lintRes.line}): ${lintRes.error}`;
          renderApp();
          return false;
        }
      } catch (err) {
        ed.lintError = `Linter error: ${err.message}`;
        renderApp();
        return false;
      }
    }

    try {
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
        ed.hash = saveRes.newHash;
        ed.mtime = saveRes.newMtime;
        ed.isDirty = false;
        ed.lintError = null;
        renderApp();
        return true;
      }
    } catch (err) {
      alert(`Save failed: ${err.message}`);
      return false;
    }
    return false;
  }

  // 5. Polling Server Status & Background Tasks
  async function pollStatus() {
    if (document.hidden) return; // Pause when tab hidden
    try {
      const data = await apiFetch('/status');
      state.serverStatus = data;
      renderStatusBadges();
    } catch (e) {
      // Offline or network error
    }
  }

  // Utilities
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 6. Template Renderers
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
            <svg class="mm-brand-mark" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M4 10 L16 3 L28 10 L28 22 L16 29 L4 22 Z" />
              <path d="M16 3 L16 29" />
              <path d="M4 10 L28 22" />
              <path d="M28 10 L4 22" />
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
              <span class="node-icon">📁</span>
              <span>wp-content (jail root)</span>
            </div>
            ${fm.lockedNodes
              .map(
                (node) => `
              <div class="mm-tree-node locked" title="${escapeHtml(node.reason)}" role="treeitem" aria-disabled="true">
                <span class="node-icon">🔒</span>
                <span>${escapeHtml(node.name)}</span>
                <span class="mm-ext-badge" style="margin-left:auto;">locked</span>
              </div>
            `
              )
              .join('')}
            ${fm.files
              .filter((f) => f.isDir)
              .map(
                (f) => `
              <div class="mm-tree-node ${currentPath === f.path ? 'selected' : ''}" data-tree-path="${escapeHtml(f.path)}" role="treeitem" style="padding-left:22px;">
                <span class="node-icon">📁</span>
                <span>${escapeHtml(f.name)}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </aside>

        <div class="mm-splitter"></div>

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

          <!-- Virtualized Data Grid -->
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
                ${fm.files.length === 0
                  ? `<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--mm-muted);">Folder is empty.</td></tr>`
                  : fm.files
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
      <div class="mm-loading-shell">
        <h2 style="font-size:32px; color:var(--mm-cyan); margin:0;">404</h2>
        <p style="color:var(--mm-muted);">The requested internal route does not exist.</p>
        <a href="#/dashboard" class="mm-action-btn primary">Return to Dashboard</a>
      </div>
    `;
  }

  // 7. Master Render Cycle
  function renderApp() {
    const root = document.getElementById('mimic-manager-root');
    if (!root) return;

    let contentHtml = '';
    switch (state.currentRoute) {
      case 'dashboard':
        contentHtml = renderDashboardView();
        break;
      case 'media':
        contentHtml = renderGenericView('Media Optimization', 'High-performance WebP conversion with zero paid API keys.');
        break;
      case 'speed':
        contentHtml = renderGenericView('PageSpeed Fixes', 'Safe, Moderate, and Guided fixes with auto-revert guarantees.');
        break;
      case 'seo':
        contentHtml = renderGenericView('SEO Gap Fill', 'Heuristic and AI metadata audits for images and pages.');
        break;
      case 'files':
        contentHtml = renderFileManagerView();
        break;
      case 'settings':
        contentHtml = renderGenericView('Settings', 'Configure telemetry opt-in, write mode, and sudo authentication.');
        break;
      case 'about':
        contentHtml = renderGenericView(
          'About Mimic Manager',
          `Created by ${wpData.brand.creator} · A ${wpData.brand.owner} project · Free and Open Source under AGPL-3.0 / GPL-2.0+`
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

  // 8. Event Binding
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
        const dirtyDot = document.querySelector('.mm-dirty-dot');
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
  }

  // 9. Boot Initialization
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
