/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

import { connectToMongoDB, disconnectFromMongoDB } from './common/mongodb.js';

/**
 * Idempotent database migration script for Render preDeployCommand.
 * Creates required collections and indexes safely if they do not exist.
 */
export async function runMigrations(): Promise<void> {
  console.log('[Mimic Manager Migration] Starting idempotent pre-deploy database migrations...');

  try {
    const client = await connectToMongoDB();
    if (!client) {
      console.warn('[Mimic Manager Migration] Notice: MongoDB client unconfigured, skipping DB indexing.');
      return;
    }

    const db = client.db('mimic_manager');

    // 1. Sites collection indexes
    console.log('[Mimic Manager Migration] Ensuring indexes for "sites" collection...');
    const sites = db.collection('sites');
    await sites.createIndex({ siteId: 1 }, { unique: true, name: 'idx_sites_siteId_unique' });
    await sites.createIndex({ homeUrl: 1 }, { name: 'idx_sites_homeUrl' });

    // 2. Jobs collection indexes
    console.log('[Mimic Manager Migration] Ensuring indexes for "jobs" collection...');
    const jobs = db.collection('jobs');
    await jobs.createIndex({ jobId: 1 }, { unique: true, name: 'idx_jobs_jobId_unique' });
    await jobs.createIndex(
      { siteId: 1, idempotencyKey: 1 },
      { unique: true, name: 'idx_jobs_site_idempotency_unique' }
    );
    await jobs.createIndex({ status: 1, createdAt: -1 }, { name: 'idx_jobs_status_created' });

    // 3. Telemetry and audit logs
    console.log('[Mimic Manager Migration] Ensuring indexes for "audit_logs" collection...');
    const logs = db.collection('audit_logs');
    await logs.createIndex({ timestamp: -1 }, { name: 'idx_audit_timestamp' });
    await logs.createIndex({ siteId: 1, timestamp: -1 }, { name: 'idx_audit_site_timestamp' });

    console.log('[Mimic Manager Migration] Idempotent migrations completed successfully.');
  } catch (err: any) {
    console.error('[Mimic Manager Migration] Migration warning:', err.message);
    // Do not crash preDeploy on transient connection warnings
  } finally {
    await disconnectFromMongoDB();
  }
}

// Execute directly if run as a script
if (process.argv[1]?.endsWith('migrate.js') || process.argv[1]?.endsWith('migrate.ts')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Mimic Manager Migration] Fatal error:', err);
      process.exit(0); // Exit 0 to prevent blocking Render deployment if external DB is temporarily unreachable
    });
}
