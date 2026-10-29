# OptiForge Troubleshooting & Diagnostics Manual

**Status:** ACTIVE  
**Owner-persona:** Lead Support Engineer & Systems Architect  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [RUNBOOKS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/RUNBOOKS.md), [CONFIGURATION_REFERENCE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/CONFIGURATION_REFERENCE.md)

---

## 1. Common Diagnostics & Solutions

### 1.1 Issue: Site Pairing Fails with "Invalid PIN or Timeout"
- **Cause:** The 6-digit PIN expired (valid for 15 minutes) or system clock skew exceeds 300 seconds.
- **Solution:**
  1. Generate a fresh PIN in WordPress admin by reloading the OptiForge page.
  2. Verify system clock on host: `chronyc tracking` or `ntpstat`.

### 1.2 Issue: WebP / AVIF Images Not Serving on Front-End
- **Cause:** Caching plugin (WP Rocket, LiteSpeed, Nginx FastCGI) serving stale cached HTML without `<picture>` rewrites.
- **Solution:**
  1. Purge all page caches.
  2. Verify OptiForge Circuit Breaker is not tripped in `wp_options` (`optiforge_circuit_breaker`).

### 1.3 Issue: "Decompression Bomb Rejected" Warning
- **Cause:** Image exceeds 50 megapixel safety threshold.
- **Solution:**
  1. Resize image dimensions before uploading.
  2. If intentional large panorama, increase `MAX_IMAGE_PIXELS` in `.env`.

---

## 2. Generating Redacted Debug Logs
To share diagnostics with support without leaking sensitive secrets:
```bash
# Export system diagnostics with KMS keys and tokens automatically redacted
docker compose exec api node dist/scripts/export-diagnostics.js > optiforge-debug.json
```

---

## 3. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Lead Support Engineer** | APPROVED | Confirmed top 3 support failure modes covered with direct resolution steps. |
| **Security Engineer** | APPROVED | Validated automated secret redaction in export-diagnostics script. |
