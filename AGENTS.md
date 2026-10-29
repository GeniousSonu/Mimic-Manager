# AGENTS.md — Agent Operating Manual

**Status:** ACTIVE  
**Last-reviewed:** 2026-10-29  
**Applies-to:** All autonomous development sessions  
**Related-docs:** [00-index.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/00-index.md), [docs/engineering/DEFINITION_OF_DONE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/DEFINITION_OF_DONE.md), [docs/project/PLAN.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/project/PLAN.md), [docs/project/DECISIONS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/project/DECISIONS.md)

---

## 1. Project Summary

**Mimic Manager** is an open-source, self-hostable, headless site optimization platform. It combines a high-performance TypeScript backend (NestJS/Fastify, BullMQ, Redis, MongoDB, Sharp, Playwright) and a modern dark-first PWA command center with thin CMS connectors (WordPress first). Core pillars: (1) Media optimization, (2) Tiered & verified PageSpeed fixes with auto-revert, (3) Plugin-aware SEO gap fill, (4) UI Replicator generating clean Gutenberg blocks from multi-viewport IR, (5) Visual File Manager with strict jailed sandbox and syntax-checked editing. 100% Free and Open Source (AGPL-3.0 backend/PWA, GPL-2.0+ WordPress connector).

---

## 2. Docs-First Rule & Operating Loop

**Documents are contracts, not afterthoughts.**
No code for any phase is written until that phase's documents exist, have passed hostile red-team reviews (≥ 15 concrete findings per doc), and are recorded as `APPROVED: <phase> <date>` in `docs/project/DECISIONS.md`.

### Autonomous Working Loop (Mandatory per Phase / Epic)
```
PLAN → RED-TEAM REVIEW (Hostile Personas) → REVISE → GATE-APPROVE → BUILD (Small Slices) → SELF-TEST → FIX → PHASE EXIT REPORT
```

---

## 3. Command Cheat Sheet

| Task | Command |
|---|---|
| **Install Dependencies** | `pnpm install` |
| **Run All Tests** | `pnpm test` (or `pnpm vitest run`) |
| **Run PHPUnit Tests** | `cd connectors/wordpress && ./vendor/bin/phpunit tests/` |
| **Build Entire Monorepo** | `pnpm build` |
| **Run E2E Tests** | `pnpm vitest run e2e/roundtrip.test.ts` |
| **Start Dev Mode** | `pnpm dev` |
| **Verify Full Workspace** | `pnpm test && cd connectors/wordpress && ./vendor/bin/phpunit tests/` |
| **Check Process / Port** | `ss -tuln | grep -E ':(3000|6379|27017)'` |

---

## 4. Repository Layout

```
/apps/api            NestJS 12 (Fastify 5) REST API + OpenAPI 3.1
/apps/worker         BullMQ processors + Sharp 0.35 + Playwright
/apps/pwa            Next.js 16 (React 19) PWA Command Center
/apps/wp-ui          React bundle for wp-admin mounted in Shadow DOM
/packages/types      Shared TS types, Zod schemas, HMAC signer, error codes
/packages/ssrf-guard Hardened DNS pinning fetcher & IP validator (76+ bypass tests)
/packages/fixes      Tiered Fix Registry contract definitions
/packages/ir         UI Replicator Intermediate Representation & adapters
/packages/ui         Design system tokens & Radix/Tailwind components
/connectors/wordpress PHP plugin (GPL-2.0+, Action Scheduler, local GD fallback)
/infra/docker        Docker Compose definitions (Mongo 7, Redis 7, MinIO)
/docs/               Formal documentation suite (product, architecture, security, design, ops, engineering)
/e2e/                Cross-system integration tests
```

---

## 5. Hard Prohibitions (Absolute Guardrails)

1. **No paid service dependency:** Everything works 100% locally with zero paid API keys. BYOK is strictly optional.
2. **Never claim success without execution:** Nothing is "done" from merely reading code. Run tests, inspect logs, verify outputs.
3. **Never fake, stub, or mock a feature and report it complete:** Stubs must be labeled `TODO(stub)` and tracked in `docs/project/KNOWN_GAPS.md`.
4. **No unvalidated outbound requests:** Every fetch and browser navigation goes through `packages/ssrf-guard`.
5. **No fatal errors in WordPress:** Plugin must never WSOD or crash admin. Hook callbacks wrap in `try/catch (\Throwable $e)`, fail silent, log, and trip circuit breaker after 3 failures.
6. **No auto-deleting originals:** Originals are never deleted automatically.
7. **No overwriting user metadata:** Alt text and SEO descriptions only fill empty fields unless user explicitly toggles overwrite.
8. **No hardcoded design values or strings outside tokens/i18n:** Use CSS tokens and i18n message catalogs.

---

## 6. How to Log Decisions (ADR Template)

Record every architectural decision in `docs/architecture/adr/NNNN-title.md` and index it in `docs/project/DECISIONS.md`:
```markdown
# ADR-NNNN: [Title]
- **Status:** [PROPOSED | APPROVED | DEPRECATED]
- **Date:** YYYY-MM-DD
- **Context:** [Why is this decision needed?]
- **Decision:** [What was decided?]
- **Alternatives Considered:** [What else was evaluated and why rejected?]
- **Consequences:** [Positive, negative, neutral trade-offs]
- **Verification:** [How we prove this decision is working]
```

---

## 7. Traceability & Test Reports

- Add `@req [ID]` in code and `it('[ID] ...')` in tests.
- Re-generate `docs/engineering/TRACEABILITY.md` to map Requirement → Design Screen → Architecture Component → API Route → Test ID → Status.
- Append execution logs and output to `docs/project/TEST_REPORT.md` after every meaningful test run. Never overwrite past historical runs.

---

## 8. Gotchas Learned

1. **pnpm v12 Build Scripts:** pnpm 12 rejects unapproved build scripts with `ERR_PNPM_IGNORED_BUILDS`. Must approve build scripts with `pnpm approve-builds --all` or define `only-built-dependencies` in `.npmrc`.
2. **Fastify rawBody & NestJS:** Do not register both `@fastify/raw-body` and NestJS default body parsers simultaneously. Instead, pass `{ rawBody: true }` in `NestFactory.create(AppModule, new FastifyAdapter(), { rawBody: true })` to capture verbatim buffer on `req.rawBody`.
3. **Swagger Static Assets:** `@nestjs/swagger` on Fastify requires `@fastify/static` to serve Swagger UI.
4. **Vitest Decorator Metadata:** Vitest's default esbuild bundler does not emit `design:paramtypes`. Always use explicit `@Inject(ServiceName)` on constructor parameters in NestJS providers/controllers/guards so tests run seamlessly in both Vitest and Nest CLI.
5. **Cross-Language HMAC Linebreaks:** Canonical string must strictly use `\n` without Windows `\r\n`, and body must be hashed as raw UTF-8 / binary bytes before signing.

---

## 9. Context Recovery (If Context is Lost)

1. Read `docs/00-index.md` to understand document hierarchy.
2. Read `docs/project/PLAN.md` to identify active phase and current task.
3. Read `docs/project/DECISIONS.md` to review approved gates and ADRs.
4. Read the last entry in `docs/project/TEST_REPORT.md`.
5. Run workspace verification:
   ```bash
   pnpm test && cd connectors/wordpress && ./vendor/bin/phpunit tests/
   ```
6. Continue with the current active task.
