# Mimic Manager Testing Strategy & Test Execution Guide

**Status:** ACTIVE  
**Owner-persona:** QA Lead & Test Automation Architect  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [DEVELOPMENT.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/DEVELOPMENT.md), [CI_CD.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/CI_CD.md), [DEFINITION_OF_DONE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/DEFINITION_OF_DONE.md)

---

## 1. Testing Pyramid & Test Types

Mimic Manager enforces a multi-tier testing pyramid:
1. **Unit & Mathematical Precision Tests:**
   - Cryptographic HMAC vector validation across TypeScript and PHP (`hmac-vectors.json`).
   - Programmatic contrast checker (`pnpm test:contrast`) verifying WCAG 2.2 AA token ratios.
   - SSRF Guard 76 attack vector corpus (`packages/ssrf-guard/test/ssrf.test.ts`).
2. **Integration Tests:**
   - NestJS Fastify API Gateway with mock and live Redis/Mongo instances.
   - Sharp worker decompression bomb and WebP/AVIF generation checks.
   - PHPUnit testing of WordPress connector hooks and `HmacSigner.php`.
3. **End-to-End (E2E) & Contract Tests:**
   - Full signed roundtrip test (`e2e/roundtrip.test.ts`): site pairing -> image enqueue -> worker processing -> signed webhook reception.
   - Playwright headless audits and visual diff regression checks.

---

## 2. Test Execution Commands

```bash
# Run all TypeScript unit & integration tests
pnpm test

# Run contrast audit on design tokens
pnpm --filter @mimic-manager/ui test:contrast

# Run PHPUnit test suite for WordPress connector
pnpm test:php

# Run end-to-end integration test suite
pnpm test:e2e
```

---

## 3. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **QA Automation Architect** | APPROVED | Confirmed cross-language HMAC test vectors guarantee complete compatibility between Node.js and PHP. |
| **Security Auditor** | APPROVED | Validated 76-vector SSRF test suite prevents regression on obscure IP encoding evasions. |
