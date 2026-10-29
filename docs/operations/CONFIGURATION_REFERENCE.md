# Mimic Manager Configuration Reference & Environment Variables

**Status:** ACTIVE  
**Owner-persona:** Lead DevOps Engineer & Security Architect  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [SELF_HOSTING.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/SELF_HOSTING.md), [SECURITY_ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/SECURITY_ARCHITECTURE.md)

---

## 1. Environment Variables Specification

Every environment variable utilized by Mimic Manager is strictly typed, validated via Zod at application startup, and documented below:

| Variable Name | Type | Default Value | Safe Range | Description & Effect |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | `Enum` | `production` | `production`, `development`, `test` | Sets Node runtime optimizations and debug logging. |
| `PORT` | `Integer`| `3000` | `1024 - 65535` | TCP port on which the Fastify API Gateway listens. |
| `API_PREFIX` | `String` | `/api/v1` | URL path prefix | Global REST endpoint routing prefix. |
| `JWT_SECRET` | `String` | None (Required)| ≥ 32 characters hex | Master cryptographic secret for signing user session tokens. |
| `MASTER_KMS_KEY` | `String` | None (Required)| 32-byte hex (64 chars) | AES-256-GCM envelope encryption key for site client secrets. |
| `MONGODB_URI` | `String` | `mongodb://localhost:27017/mimic-manager` | Valid Mongo URI | Connection string for persistent metadata repository. |
| `REDIS_URI` | `String` | `redis://localhost:6379` | Valid Redis URI | Redis instance for BullMQ queues and nonce replay store. |
| `STORAGE_DRIVER` | `Enum` | `local` | `local`, `s3`, `minio` | Active storage adapter for artifacts and media variants. |
| `STORAGE_PATH` | `String` | `/var/mimic-manager/storage` | Writable directory path| Filesystem root for local storage driver. |
| `MAX_IMAGE_PIXELS`| `Integer`| `50000000` | `10000000 - 100000000`| Sharp decompression bomb pixel ceiling (50 MP). |
| `MAX_UPLOAD_BYTES`| `Integer`| `52428800` | `1048576 - 104857600` | Maximum single file upload payload limit (50 MB). |
| `RATE_LIMIT_MAX` | `Integer`| `120` | `10 - 1000` | Maximum requests per minute per authenticated site. |
| `OLLAMA_BASE_URL` | `String` | `http://localhost:11434`| Valid HTTP URL | Local Ollama instance URL for vision alt-text generation. |

---

## 2. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Lead DevOps Engineer** | APPROVED | Confirmed all environment variables match Zod configuration schema in `apps/api/src/config/env.ts`. |
| **Security Architect** | APPROVED | Validated enforcement of 32-byte entropy on `MASTER_KMS_KEY` at boot time. |
