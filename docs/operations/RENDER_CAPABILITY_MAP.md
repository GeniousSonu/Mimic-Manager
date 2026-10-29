# Render Capability & API Endpoint Map

**Status:** VERIFIED  
**Date:** 2026-10-29  
**Specification:** Render Public REST API v1 (`https://api.render.com/v1`)  
**Documentation Source:** [Render API Reference (https://render.com/docs/api)](https://render.com/docs/api)

---

## 1. Verified Endpoints & Capabilities

| Capability | Method | Endpoint | Supported in Code | Verified Source |
|---|---|---|---|---|
| **List Workspaces / Owners** | `GET` | `/v1/owners` | Yes (`scripts/render/render-client.ts`) | [Render Owners API](https://render.com/docs/api#tag/Owners) |
| **List Services** | `GET` | `/v1/services` | Yes (`scripts/render/render-client.ts`) | [Render Services API](https://render.com/docs/api#tag/Services/operation/getServices) |
| **Create Web Service** | `POST` | `/v1/services` | Yes (`scripts/render/render-client.ts`) | [Render Create Service](https://render.com/docs/api#tag/Services/operation/createService) |
| **Get Service Details** | `GET` | `/v1/services/{serviceId}` | Yes (`scripts/render/render-client.ts`) | [Render Get Service](https://render.com/docs/api#tag/Services/operation/getService) |
| **Update Service Config** | `PATCH` | `/v1/services/{serviceId}` | Yes (`scripts/render/render-client.ts`) | [Render Update Service](https://render.com/docs/api#tag/Services/operation/updateService) |
| **Delete Service** | `DELETE` | `/v1/services/{serviceId}` | Yes (`--allow-destroy` guard) | [Render Delete Service](https://render.com/docs/api#tag/Services/operation/deleteService) |
| **List Environment Variables** | `GET` | `/v1/services/{serviceId}/env-vars` | Yes (`scripts/render/render-client.ts`) | [Render Env Vars API](https://render.com/docs/api#tag/Environment-Variables) |
| **Bulk Update Env Vars** | `PUT` | `/v1/services/{serviceId}/env-vars` | Yes (`scripts/render/render-client.ts`) | [Render Put Env Vars](https://render.com/docs/api#tag/Environment-Variables/operation/updateEnvVarsForService) |
| **Trigger Deployment** | `POST` | `/v1/services/{serviceId}/deploys` | Yes (`scripts/render/render-client.ts`) | [Render Deploys API](https://render.com/docs/api#tag/Deploys/operation/createDeploy) |
| **List Deployments** | `GET` | `/v1/services/{serviceId}/deploys` | Yes (`scripts/render/render-client.ts`) | [Render List Deploys](https://render.com/docs/api#tag/Deploys/operation/getDeploys) |
| **Get Deploy Status** | `GET` | `/v1/services/{serviceId}/deploys/{deployId}` | Yes (`scripts/render/render-client.ts`) | [Render Deploy Status](https://render.com/docs/api#tag/Deploys/operation/getDeploy) |

---

## 2. Infrastructure Parameters Verified

- **Region:** `singapore` (Southeast Asia data center, low latency to regional users).
- **Runtime:** `docker` with pinned alpine image (`node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914`).
- **Free Tier Plan:** `free` (512 MB RAM, 0.1 CPU).
- **Health Check Path:** `/health` (serves HTTP 200 within 5ms without database overhead).
- **Pre-Deploy Command:** `node apps/api/dist/migrate.js` runs idempotently before routing live traffic.
