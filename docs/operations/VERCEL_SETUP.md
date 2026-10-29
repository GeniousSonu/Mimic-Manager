# Vercel Deployment Guide for Mimic Manager PWA

**Status:** PRODUCTION READY  
**Component:** Next.js 16 (React 19) Progressive Web App (`apps/pwa`)  
**Target:** Vercel Production Environment  

---

## 1. Architecture

The frontend of Mimic Manager is a standalone Next.js PWA located in `apps/pwa`. It connects to the Render API Web Service (`apps/api`) via HTTPS and HMAC authentication.

---

## 2. Step-by-Step Vercel Setup

### Step 1: Import Project
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New... > Project**.
3. Select the `Mimic-Manager` repository from GitHub (`GeniousSonu/Mimic-Manager`).

### Step 2: Configure Project Settings
- **Project Name:** `mimic-manager`
- **Framework Preset:** `Next.js`
- **Root Directory:** Click **Edit** and choose `apps/pwa`.

### Step 3: Build and Output Settings
- **Build Command:** `next build` (or leave default)
- **Output Directory:** `.next` (default)
- **Install Command:** `pnpm install`

### Step 4: Environment Variables
Add the following production environment variable:

| Variable Name | Value | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://mimic-manager.onrender.com` | Base URL of your deployed Render API service |
| `NEXT_PUBLIC_APP_NAME` | `Mimic Manager` | Application display name |

### Step 5: Deploy
Click **Deploy**. Vercel will build and assign a production URL (e.g. `https://mimic-manager.vercel.app`).

---

## 3. Verify CORS Configuration

Ensure the Render API allows traffic from your Vercel domain:
In Render dashboard or `desired-state.json`, ensure:
`CORS_ORIGIN=https://mimic-manager.vercel.app` (or your custom domain).
