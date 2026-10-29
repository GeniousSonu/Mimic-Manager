# Render Production Deployment Guide

**Status:** APPROVED FOR PRODUCTION  
**Service:** Mimic Manager API (`apps/api`) with In-Process Worker (`apps/worker`)  
**Region:** Singapore (`singapore`)  
**Blueprint:** [render.yaml](file:///home/dayshift/Pictures/Mimic%20Manager/render.yaml)  

---

## 1. Quick Start: One-Click Blueprint Deployment

Deploying Mimic Manager to Render takes under 3 minutes using the root [render.yaml](file:///home/dayshift/Pictures/Mimic%20Manager/render.yaml) blueprint:

1. **Generate Secrets First:**
   In your local shell, run:
   ```bash
   ./scripts/deploy/generate-secrets.sh
   ```
   Keep this output handy. Do NOT commit it.

2. **Connect to Render:**
   - Log into [Render Dashboard](https://dashboard.render.com/).
   - Click **Blueprints > New Blueprint Instance**.
   - Select your GitHub repository: `GeniousSonu/Mimic-Manager`.
   - Branch: `main`.

3. **Paste Secrets into Render UI:**
   Render will inspect `render.yaml` and prompt for the `sync: false` variables:
   - `JWT_SECRET`: Paste generated 64-character hex string.
   - `MASTER_KMS_KEY`: Paste generated 64-character hex string.
   - `HMAC_SIGNING_SECRET`: Paste generated 64-character hex string.
   - `MONGODB_URI`: Paste your MongoDB Atlas connection string.
   - `REDIS_URL`: Paste your redis.io connection string.
   - `MIMIC_MANAGER_AI_API_KEY`: (Optional) Paste Google AI Studio API key.

4. **Click "Apply":**
   Render builds the multi-stage Dockerfile and deploys the service in Singapore with automatic health checks enabled.

---

## 2. Environment Variables Reference Table

| Variable Name | Required | Where to Obtain | Example Format | Purpose |
|---|---|---|---|---|
| `PORT` | Auto | Set by Render / Default `10000` | `10000` | Port Fastify binds to on `0.0.0.0` |
| `NODE_ENV` | Yes | Preconfigured in blueprint | `production` | Enforces production optimizations & redactions |
| `MIMIC_MANAGER_RUN_WORKER_IN_API` | Yes | Preconfigured in blueprint | `true` | Runs BullMQ queue worker in-process (avoids paid worker) |
| `IN_PROCESS_WORKER` | Yes | Preconfigured in blueprint | `true` | Queue listener activator |
| `STORAGE_DRIVER` | Yes | Preconfigured in blueprint | `local` | Uses local filesystem storage |
| `STORAGE_PATH` | Yes | Preconfigured in blueprint | `/tmp/mimic-manager/storage` | Ephemeral scratch directory for processed media |
| `LOG_LEVEL` | Yes | Preconfigured in blueprint | `info` | Pino logging level (no verbose debug logs) |
| `CORS_ORIGIN` | Yes | Vercel domain | `https://mimic-manager.vercel.app` | Strict CORS allowlist for PWA requests |
| `NODE_OPTIONS` | Yes | Preconfigured in blueprint | `--max-old-space-size=400` | Sizes heap within Render Free 512MB RAM cap |
| `JWT_SECRET` | Yes | `./scripts/deploy/generate-secrets.sh` | `f3a8b9c...` (64 hex chars) | Signs JWT tokens for authenticated web sessions |
| `MASTER_KMS_KEY` | Yes | `./scripts/deploy/generate-secrets.sh` | `e2d1c0a...` (64 hex chars) | AES-256-GCM symmetric encryption for pairing keys |
| `HMAC_SIGNING_SECRET`| Yes | `./scripts/deploy/generate-secrets.sh` | `9b8a7c6...` (64 hex chars) | Signs WordPress REST requests to prevent spoofing |
| `MONGODB_URI` | Yes | MongoDB Atlas Console | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true` | MongoDB connection string |
| `REDIS_URL` | Yes | Redis Cloud (redis.io) | `redis://default:pass@endpoint:port` | BullMQ Redis queue connection string |
| `MIMIC_MANAGER_AI_API_KEY` | No | Google AI Studio | `AIzaSy...` | Powers automated image alt-text generation |
| `MIMIC_MANAGER_AI_BASE_URL` | No | Google AI Studio OpenAI endpoint | `https://generativelanguage.googleapis.com/v1beta/openai` | OpenAI-compatible endpoint |

---

## 3. Post-Deployment Verification

Run the automated smoke test script against your live Render service:

```bash
./scripts/deploy/smoke-test.sh https://mimic-manager.onrender.com
```

Checks performed:
- [x] Liveness probe (`/health`) -> HTTP 200 OK
- [x] Readiness probe (`/ready`) -> Verifies MongoDB ping, Redis ping & eviction policy, Storage writable
- [x] Security headers -> HSTS (`Strict-Transport-Security`), MIME sniffing protection (`X-Content-Type-Options: nosniff`)
- [x] CORS preflight -> PWA origin allowed
- [x] HMAC authentication guard -> HTTP 401 on forged signatures
- [x] Keep-alive ping (`/ping`) -> HTTP 200 OK

---

## 4. Rollback Strategy

Render maintains immutable container artifacts for every deployment.

### Immediate Rollback (Dashboard):
1. In Render Dashboard, click **mimic-manager** web service.
2. Go to the **Events** or **Deploys** tab.
3. Identify the last known healthy deployment.
4. Click the three dots `...` next to the deploy and click **Rollback to this deploy**.
5. Live traffic shifts back immediately with zero downtime.

### CLI Rollback / Deployment Query:
```bash
pnpm render:api status <serviceId>
```

---

## 5. Upgrading to a Paid Plan

By default, Mimic Manager runs on Render's **Free** plan ($0/mo), designed for low-budget self-hosting.
If your optimization volume increases or you need zero cold starts:

1. **Cost & Specs (Render Official):**
   - **Starter Plan:** $7/mo (512 MB RAM, 0.5 CPU, no sleep/cold starts, custom domains).
   - **Standard Plan:** $25/mo (2 GB RAM, 1 CPU, high concurrency).
2. **Upgrade Steps:**
   - In Render Dashboard, go to **Settings > Plan**.
   - Select **Starter** ($7) or **Standard** ($25).
   - Increase `NODE_OPTIONS` memory cap:
     - For Starter: `--max-old-space-size=450`
     - For Standard: `--max-old-space-size=1800`
   - Click **Save Changes**.

---

## 6. Top 10 Operational Failures & Troubleshooting

### 1. MongoDB Auth or IP Rejection (`MongoServerSelectionError`)
- **Symptom:** App crashes on boot or `/ready` returns unhealthy MongoDB status.
- **Cause:** MongoDB Atlas Network Access has not allowed `0.0.0.0/0`, or username/password in `MONGODB_URI` contains unencoded special characters.
- **Fix:** In MongoDB Atlas, add `0.0.0.0/0` under **Network Access**. URL-encode special characters in the password (e.g. `@` becomes `%40`).

### 2. Redis Eviction Policy Warning
- **Symptom:** Logs show `IMPORTANT! Eviction policy is volatile-lru. It should be "noeviction"`.
- **Cause:** Redis instance default policy drops keys when memory is constrained, corrupting BullMQ queues.
- **Fix:** In redis.io dashboard under database configuration, set **Eviction Policy** to `noeviction`.

### 3. Port Binding Timeout (`Port scan timeout`)
- **Symptom:** Render shows deploy timed out waiting for port 10000.
- **Cause:** Fastify bound to `127.0.0.1` instead of `0.0.0.0`.
- **Fix:** `apps/api/src/main.ts` is configured to listen on `0.0.0.0:${PORT}`. Verify `PORT=10000` is set in env vars.

### 4. Health Check Failing (`Health check failed on path /health`)
- **Symptom:** Deploy fails during health check polling.
- **Cause:** Health check endpoint requires authentication or connects to failing databases.
- **Fix:** `/health` is a lightweight liveness endpoint that bypasses auth and returns HTTP 200 immediately. Verify `healthCheckPath: /health` in Render settings.

### 5. Out of Memory (OOM Killer / Exit Code 137)
- **Symptom:** Service suddenly restarts under heavy image optimization.
- **Cause:** Free tier limit is 512 MB. V8 default heap limit is ~2 GB on 64-bit systems.
- **Fix:** `NODE_OPTIONS=--max-old-space-size=400` is declared in `render.yaml` to trigger V8 garbage collection before the cgroup memory limit is reached.

### 6. CORS Blocked on Vercel PWA
- **Symptom:** Browser console shows `Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource`.
- **Cause:** `CORS_ORIGIN` does not match the exact Vercel frontend URL.
- **Fix:** Set `CORS_ORIGIN=https://<your-app>.vercel.app` in Render environment variables.

### 7. Cross-Domain Cookie Drop
- **Symptom:** User is repeatedly logged out on page refresh.
- **Cause:** Cookies sent across domains require `SameSite=None` and `Secure=true`.
- **Fix:** In production, `apps/api` sets cookies with `sameSite: 'none'`, `secure: true`, and `httpOnly: true`. Ensure your API is accessed over HTTPS.

### 8. Free-Tier Cold Start Delay (~50s)
- **Symptom:** First request after 15 minutes of inactivity takes 45-60 seconds.
- **Cause:** Render Free web services spin down to 0 after 15 minutes of idle time.
- **Fix:** Setup an external uptime monitor (e.g. UptimeRobot, cron-job.org) hitting `/ping` every 10 minutes, or upgrade to Render Starter ($7/mo).

### 9. Build Failure on Native Dependencies (`sharp` / `libvips`)
- **Symptom:** `Error loading shared library libvips.so.42`.
- **Cause:** Alpine image missing vips runtime package in runner stage.
- **Fix:** The provided `apps/api/Dockerfile` installs `vips` in runner stage and builds using native Linux x64 binaries.

### 10. `ERR_PNPM_PACKAGE_MANAGER_NO_IMPORTER`
- **Symptom:** Docker build fails during `pnpm install --frozen-lockfile`.
- **Cause:** `pnpm-lock.yaml` is out of sync with workspace packages.
- **Fix:** Run `pnpm install --lockfile-only` locally before committing lockfile changes.
