# Mimic Manager Versioning & Compatibility Architecture

**Status:** ACTIVE  
**Last-reviewed:** 2026-10-29  
**Applies-to:** All monorepo workspaces, plugin flavors, and deployment artifacts  
**Related-docs:** [RELEASE_CAPABILITY_MAP.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/RELEASE_CAPABILITY_MAP.md), [UPGRADE_AND_MIGRATION.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/UPGRADE_AND_MIGRATION.md), [brand.config.json](file:///home/dayshift/Pictures/Mimic%20Manager/brand.config.json)

---

## 1. Product Semantic Versioning

Mimic Manager adheres strictly to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html):
```
vMAJOR.MINOR.PATCH[-PRERELEASE]
Example: v1.0.0, v1.1.0-rc.1
```

- **MAJOR (vX.0.0):** Incompatible API changes, removal of supported protocol versions, or breaking database schema shifts requiring manual intervention.
- **MINOR (v1.X.0):** Backward-compatible new capabilities (e.g. new fix tiers, new image codec support, new file manager features).
- **PATCH (v1.0.X):** Backward-compatible bug fixes, security hardening, and performance improvements.
- **PRERELEASE (-alpha.N, -beta.N, -rc.N):** Testing releases. Prerelease tags never trigger WordPress.org SVN deployment.

### Single Source of Truth
The **root `package.json` `"version"`** field is the single authoritative source of truth. No other version string in the repository is hand-edited.

---

## 2. Independent Compatibility Sub-Versions

To prevent tight coupling between distributed components (self-hosted backend, PWA, WordPress connector, and database), the system defines independent compatibility version numbers:

| Subsystem | Identifier / Key | Current Value | Breaking Change Policy |
| :--- | :--- | :--- | :--- |
| **Product Version** | `product.version` | `1.0.0-rc.1` | User-facing product release version |
| **API Route Prefix** | `api.version` | `v1` (`/api/v1`) | New major path (`/api/v2`) with minimum 6-month deprecation window |
| **Plugin-to-Backend Protocol** | `protocol.version` | `1.0` | Header `X-Mimic-Protocol-Version`; backend supports current and N-1 minor versions |
| **WordPress Plugin DB Schema** | `mimic_manager_db_version` | `100` (integer) | Idempotent migration via Action Scheduler on `admin_init` |
| **Backend MongoDB Migrations** | `migrate-mongo` | Timestamped | Forward-only and rollback migrations run in pre-deploy container entrypoint |
| **Settings Export Schema** | `settings_schema_version` | `1.0` | Automatic schema migrator on JSON import |
| **Fix Registry Schema** | `fix_registry_version` | `1.0` | Validated by Zod contract in `@mimic-manager/fixes` |
| **UI Replicator IR Schema** | `ir_schema_version` | `1.0` | Validated by Zod contract in `@mimic-manager/ir` |

---

## 3. Compatibility Handshake Protocol

When the WordPress connector communicates with the headless NestJS API, every HTTP request includes compatibility headers:
```http
X-Mimic-Product-Version: 1.0.0-rc.1
X-Mimic-Protocol-Version: 1.0
```

The backend evaluates these headers and responds with compatibility metadata:
```json
{
  "status": "ok",
  "backendVersion": "1.0.0-rc.1",
  "protocolVersion": "1.0",
  "supportedPluginRange": ">=1.0.0-rc.1 <2.0.0",
  "compatibility": "compatible"
}
```

### Handshake Outcomes & Resilience Matrix

| Evaluation Outcome | Backend Status | Plugin UX Presentation | Site Health Status | Action Taken |
| :--- | :--- | :--- | :--- | :--- |
| **Compatible** | Full capability | Green "Connected" badge in SPA header | Good | Normal bidirectional optimization and replication |
| **Update Recommended** | Minor version drift | Amber "Update Recommended" badge | Info notice | Full operation preserved; non-critical features notified |
| **Update Required** | Incompatible protocol | Amber "Local-only" badge with tooltip | Warning notice | **Graceful degradation:** cloud features paused; plugin falls back 100% to local GD/WebP optimization; **site never breaks** |

---

## 4. Conventional Commits & Automated Version Bumps

All repository commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

### Commit Type Mapping
- `fix:` ➔ PATCH bump (`1.0.0` ➔ `1.0.1`)
- `feat:` ➔ MINOR bump (`1.0.0` ➔ `1.1.0`)
- `feat!:` or `BREAKING CHANGE:` ➔ MAJOR bump (`1.0.0` ➔ `2.0.0`)
- `chore:`, `docs:`, `test:`, `refactor:`, `style:` ➔ No version bump

---

## 5. Artifact Synchronization & Staleness Gate

The command `pnpm version:sync` (`scripts/plugin/version-sync.ts`) synchronizes the root version to:
1. Workspace `package.json` files (`apps/api`, `apps/worker`, `apps/pwa`, `packages/*`)
2. `connectors/wordpress/composer.json`
3. `connectors/wordpress/mimic-manager.php` (`Version: X.Y.Z`)
4. `connectors/wordpress/src/Brand.php` (`public const VERSION = 'X.Y.Z';`)
5. `connectors/wordpress/readme.txt` (`Stable tag: X.Y.Z`)
6. OpenAPI info spec in `apps/api/src/main.ts`
7. `apps/pwa/public/manifest.webmanifest`
8. `brand.config.json` (`product.version`)

The automated CI gate `pnpm version:check` verifies that all source files and built artifacts (`dist/mimic-manager.zip`, `dist-manifest.json`) agree on the exact version string. Any discrepancy fails the build.
