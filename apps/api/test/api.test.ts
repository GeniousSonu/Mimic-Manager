import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { bootstrap } from '../src/main.js';
import { HmacSigner, HmacHeaders } from '@mimic-manager/types';

describe('Mimic Manager API Integration Tests', () => {
  let app: NestFastifyApplication;
  const testPort = 3099;
  const baseUrl = `http://127.0.0.1:${testPort}`;

  const testSiteId = 'site_phase0_test';
  const testSecret = 'phase0_secret_key_8492048102948102';

  beforeAll(async () => {
    app = await bootstrap(testPort);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns 200 with ok status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; version: string };
    expect(body.status).toBe('ok');
    expect(body.version).toBe('0.1.0');
  });

  it('POST /api/v1/sites/pair creates a new site pairing', async () => {
    const res = await fetch(`${baseUrl}/api/v1/sites/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteName: 'My Blog',
        siteUrl: 'https://myblog.com',
        pairingToken: 'token_1234567890abcdef',
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { siteId: string; secret: string };
    expect(body.siteId).toMatch(/^site_/);
    expect(body.secret.length).toBe(64);
  });

  it('POST /api/v1/media/jobs fails with 401 if missing HMAC headers', async () => {
    const res = await fetch(`${baseUrl}/api/v1/media/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'test.jpg' }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('AUTH_MISSING_SITE_ID');
  });

  it('POST /api/v1/media/jobs fails with 401 if HMAC signature is forged', async () => {
    const res = await fetch(`${baseUrl}/api/v1/media/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [HmacHeaders.SITE_ID]: testSiteId,
        [HmacHeaders.TIMESTAMP]: Math.floor(Date.now() / 1000).toString(),
        [HmacHeaders.NONCE]: 'random_nonce_1234',
        [HmacHeaders.SIGNATURE]: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      },
      body: JSON.stringify({ filename: 'test.jpg' }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('AUTH_INVALID_SIGNATURE');
  });

  it('POST /api/v1/media/jobs succeeds with valid HMAC signature', async () => {
    const payload = JSON.stringify({
      siteId: testSiteId,
      filename: 'hero.png',
      idempotencyKey: 'idem_key_test_001',
    });

    const path = '/api/v1/media/jobs';
    const signed = HmacSigner.sign({
      secret: testSecret,
      method: 'POST',
      path,
      body: payload,
    });

    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [HmacHeaders.SITE_ID]: testSiteId,
        ...signed.headers,
      },
      body: payload,
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { jobId: string; status: string };
    expect(body.jobId).toMatch(/^job_/);
    expect(body.status).toBe('pending');
  });

  it('POST /api/v1/media/jobs rejects replayed nonce', async () => {
    const payload = JSON.stringify({
      siteId: testSiteId,
      filename: 'hero.png',
      idempotencyKey: 'idem_key_test_002',
    });

    const path = '/api/v1/media/jobs';
    const signed = HmacSigner.sign({
      secret: testSecret,
      method: 'POST',
      path,
      body: payload,
    });

    // First request
    const res1 = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [HmacHeaders.SITE_ID]: testSiteId,
        ...signed.headers,
      },
      body: payload,
    });
    expect(res1.status).toBe(201);

    // Replay attack with same nonce and timestamp
    const res2 = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [HmacHeaders.SITE_ID]: testSiteId,
        ...signed.headers,
      },
      body: payload,
    });
    expect(res2.status).toBe(401);
    const body = (await res2.json()) as { error: { code: string } };
    expect(body.error.code).toBe('AUTH_NONCE_REPLAY');
  });
});
