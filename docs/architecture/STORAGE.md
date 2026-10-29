# Mimic Manager Storage & File Pipeline Architecture

**Status:** ACTIVE  
**Owner-persona:** Storage Architect & Senior Backend Engineer  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [DATA_MODEL.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/DATA_MODEL.md), [QUEUES_AND_WORKERS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/QUEUES_AND_WORKERS.md), [SELF_HOSTING.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/SELF_HOSTING.md)

---

## 1. Overview
Mimic Manager manages three distinct classes of storage:
1. **Transient Media Cache:** Short-lived buffers during compression and conversion.
2. **Persistent Artifact Store:** Audit reports, DOM snapshots, and diff screenshots.
3. **Connector Shadow Backups:** Local original copies stored on the connected CMS server.

---

## 2. Storage Drivers & Interfaces

All storage operations interact with an abstract TypeScript interface:
```typescript
export interface StorageDriver {
  put(key: string, data: Buffer | ReadableStream, options?: StorageOptions): Promise<StorageResult>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getSignedUrl(key: string, ttlSeconds: number): Promise<string>;
}
```

### Supported Drivers:
- **Local Filesystem Driver:** Default for single-node Docker Compose. Stores artifacts in `/var/mimic-manager/storage` with directory sharding (`aa/bb/aabb...`).
- **S3 / MinIO Compatible Driver:** Used for distributed multi-node deployments. Supports AWS S3, Cloudflare R2, MinIO, and Wasabi.

---

## 3. Original File Retention & Immutability
- **Keep Originals Policy:** Mimic Manager NEVER overwrites or destroys an original image unless the site administrator explicitly triggers "Prune Originals" with typed confirmation.
- **Original Path Naming:** WordPress originals are renamed with `.orig` suffix or archived into `wp-content/uploads/mimic-manager-originals/` with root permissions preserved.

---

## 4. Decompression Bomb & Quota Guards
- **Decompression Bomb Guard:** Files exceeding 50 megapixels (50,000,000 pixels) or with an expansion ratio > 100:1 are rejected before loading into memory via Sharp stream inspection.
- **Quota Monitor:** If the local disk partition drops below 10% free space, all non-critical worker queues pause automatically until disk cleanup runs.

---

## 5. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Storage Architect** | APPROVED | Two-character sharding (`ab/cd/abcdef...`) prevents Linux ext4 inode exhaustion in the local storage driver. |
| **Security Engineer** | APPROVED | Confirmed strict path sanitization on all storage keys to prevent path traversal outside `/var/mimic-manager/storage`. |
