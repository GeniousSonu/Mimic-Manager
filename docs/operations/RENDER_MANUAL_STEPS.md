# Render Manual Owner Checklist

**Status:** ACTIVE  
**Audience:** Account Owner  
**Purpose:** Action items that cannot be automated via API and require owner dashboard intervention.

---

## 1. MongoDB Atlas Network Access (1 Minute)
- [ ] Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
- [ ] Go to **Security > Network Access**.
- [ ] Click **+ Add IP Address** > choose **Allow Access From Anywhere** (`0.0.0.0/0`) > enter comment `Render Singapore Egress` > click **Confirm**.
- [ ] Go to **Security > Database Access** > ensure your database user exists with `readWrite` permissions.

---

## 2. Redis Configuration on redis.io (1 Minute)
- [ ] Log in to [Redis Cloud Console](https://app.redislabs.com/).
- [ ] Select your database subscription.
- [ ] Verify that **Eviction Policy** is set to `noeviction` (required by BullMQ so queue items and locks are never discarded).
- [ ] Copy the endpoint connection URL (format `redis://default:<password>@<host>:<port>`).

---

## 3. Render Blueprint Apply or API Secret Injection (2 Minutes)

### Option A: Via Render Blueprint (Dashboard Click)
- [ ] In Render dashboard, click **Blueprints > New Blueprint Instance**.
- [ ] Connect repository `https://github.com/GeniousSonu/Mimic-Manager.git`.
- [ ] Service name will auto-populate as `mimic-manager` with Dockerfile `./apps/api/Dockerfile`.
- [ ] In the environment variables prompt, paste the values:
  - `MONGODB_URI`
  - `REDIS_URL`
  - `JWT_SECRET` (generate with `./scripts/deploy/generate-secrets.sh`)
  - `MASTER_KMS_KEY` (generate with `./scripts/deploy/generate-secrets.sh`)
  - `HMAC_SIGNING_SECRET` (generate with `./scripts/deploy/generate-secrets.sh`)
  - `MIMIC_MANAGER_AI_API_KEY` (optional)
- [ ] Click **Apply**.

### Option B: Via Automated Reconciliation CLI
- [ ] In your local terminal, export your secrets:
  ```bash
  export RENDER_API_KEY="rnd_..."
  export MONGODB_URI="mongodb+srv://..."
  export REDIS_URL="redis://..."
  ```
- [ ] Run the dry-run plan:
  ```bash
  pnpm render:plan
  ```
- [ ] Apply the configuration directly to your account:
  ```bash
  pnpm render:apply
  ```

---

## 4. Vercel PWA Configuration (2 Minutes)
- [ ] Log in to [Vercel Dashboard](https://vercel.com).
- [ ] Import Git repository `Mimic-Manager`.
- [ ] Set **Root Directory** to `apps/pwa`.
- [ ] In **Environment Variables**, set:
  - `NEXT_PUBLIC_API_URL`: `https://mimic-manager.onrender.com` (your Render service URL)
- [ ] Click **Deploy**.

---

## 5. Security Cleanup & Key Revocation (MANDATORY)
After successful deployment:
- [ ] If you created a temporary `RENDER_API_KEY` for CLI automation, delete or rotate it:
  - Go to **Account Settings > API Keys** on Render.
  - Click **Revoke / Delete** on the key used.
- [ ] Clear shell history containing any secrets:
  ```bash
  history -c
  ```
