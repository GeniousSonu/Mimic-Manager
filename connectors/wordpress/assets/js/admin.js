/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const data = window.mimicManagerData || {};

    // 1. Consent toggle handler
    const consentToggle = document.getElementById('mm-consent-toggle');
    if (consentToggle) {
      consentToggle.addEventListener('change', function () {
        const consented = consentToggle.checked;
        fetch(data.restUrl + '/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': data.nonce,
          },
          body: JSON.stringify({ consent: consented }),
        })
          .then((res) => res.json())
          .then(() => {
            const statusEl = document.getElementById('mm-consent-status');
            if (statusEl) {
              statusEl.textContent = consented ? 'Connected / Opted In' : 'Local Only (No external calls)';
            }
          })
          .catch((err) => console.error('[Mimic Manager] Settings error:', err));
      });
    }

    // 2. Local optimize trigger
    const optimizeBtns = document.querySelectorAll('.mm-optimize-btn');
    optimizeBtns.forEach((btn) => {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-id');
        btn.disabled = true;
        btn.textContent = 'Optimizing...';

        fetch(data.restUrl + '/optimize-local', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': data.nonce,
          },
          body: JSON.stringify({ attachment_id: id }),
        })
          .then((res) => res.json())
          .then((res) => {
            if (res.success) {
              btn.textContent = 'WebP (-' + res.savingsPercent + '%)';
              btn.classList.add('mm-btn-success');
            } else {
              btn.textContent = 'Failed: ' + (res.error || 'Unknown');
              btn.disabled = false;
            }
          })
          .catch(() => {
            btn.textContent = 'Error';
            btn.disabled = false;
          });
      });
    });
  });
})();
