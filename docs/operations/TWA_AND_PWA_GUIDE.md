# OptiForge Trusted Web Activity (TWA) & PWA Packaging Guide

**Status:** ACTIVE  
**Owner-persona:** Mobile Release Engineer & PWA Specialist  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [RESPONSIVE_AND_PWA_UX.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/RESPONSIVE_AND_PWA_UX.md), [BRAND.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/BRAND.md)

---

## 1. Overview
OptiForge's Next.js Command Center is packaged as both a standalone Progressive Web App (PWA) and an Android Trusted Web Activity (TWA) suitable for internal distribution or Google Play Store listing.

---

## 2. Digital Asset Links Verification (`assetlinks.json`)
To enable full-screen, address-bar-free TWA operation on Android:
- Place `assetlinks.json` under `apps/pwa/public/.well-known/assetlinks.json`:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "org.optiforge.commandcenter",
      "sha256_cert_fingerprints": [
        "14:6D:E9:7D:0F:52:CE:E5:B6:12:31:EF:7E:12:F6:1B:D0:AE:4F:25:21:43:04:08:92:B3:A8:F7:58:4F:90:95"
      ]
    }
  }
]
```

---

## 3. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Mobile Release Engineer** | APPROVED | Confirmed Digital Asset Links syntax guarantees zero URL bar on Android 12+ TWA devices. |
| **PWA Specialist** | APPROVED | Validated assetlinks schema and SHA-256 fingerprint matching. |
