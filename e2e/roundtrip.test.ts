import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { bootstrap } from '../apps/api/src/main.js';
import { MediaProcessor } from '../apps/worker/src/processor.js';
import { HmacSigner, HmacHeaders, type WebhookPayload } from '../packages/types/src/index.js';
import sharp from 'sharp';

describe('Phase 0 End-to-End Signed Roundtrip Verification', () => {
  let app: NestFastifyApplication;
  const testPort = 3105;
  const baseUrl = `http://127.0.0.1:${testPort}`;

  const siteId = 'site_phase0_test';
  const siteSecret = 'phase0_secret_key_8492048102948102';
  const processor = new MediaProcessor();

  beforeAll(async () => {
    app = await bootstrap(testPort);
  });

  afterAll(async () => {
    await app.close();
  });

  it('completes signed roundtrip: client signs -> API verifies -> Worker optimizes -> Webhook signs -> Connector verifies', async () => {
    // 1. Generate test image
    const rawImage = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 3,
        background: { r: 10, g: 120, b: 230 },
      },
    })
      .jpeg({ quality: 90 })
      .toBuffer();

    // 2. Client initiates optimization job with HMAC-SHA256 signature
    const jobPayload = JSON.stringify({
      siteId,
      filename: 'banner.jpg',
      idempotencyKey: 'idem_roundtrip_test_999',
      webhookUrl: 'http://127.0.0.1:8000/wp-json/mimic-manager/v1/webhook',
    });

    const jobPath = '/api/v1/media/jobs';
    const signedJob = HmacSigner.sign({
      secret: siteSecret,
      method: 'POST',
      path: jobPath,
      body: jobPayload,
    });

    const jobResponse = await fetch(`${baseUrl}${jobPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [HmacHeaders.SITE_ID]: siteId,
        ...signedJob.headers,
      },
      body: jobPayload,
    });

    expect(jobResponse.status).toBe(201);
    const jobData = (await jobResponse.json()) as { jobId: string; status: string };
    expect(jobData.jobId).toMatch(/^job_/);
    expect(jobData.status).toBe('pending');

    // 3. Worker picks up job and runs Sharp image optimization
    const optimizationResult = await processor.processImage(rawImage, {
      format: 'webp',
      preset: 'balanced',
      stripMetadata: true,
      preserveIcc: true,
      avifEffort: 4,
    });

    expect(optimizationResult.variants.length).toBeGreaterThan(0);
    const variant = optimizationResult.variants[0]!;
    expect(variant.format).toBe('webp');
    expect(variant.sha256).toMatch(/^[a-f0-9]{64}$/);

    // 4. Worker constructs Webhook payload and signs with HmacSigner
    const webhookPayload: WebhookPayload = {
      jobId: jobData.jobId,
      type: 'media.optimize',
      status: 'completed',
      siteId,
      result: optimizationResult,
      timestamp: Math.floor(Date.now() / 1000),
    };

    const webhookBody = JSON.stringify(webhookPayload);
    const webhookPath = '/wp-json/mimic-manager/v1/webhook';
    const signedWebhook = HmacSigner.sign({
      secret: siteSecret,
      method: 'POST',
      path: webhookPath,
      body: webhookBody,
    });

    // 5. Simulate WordPress connector webhook reception and verification
    const connectorVerification = HmacSigner.verify({
      secret: siteSecret,
      method: 'POST',
      path: webhookPath,
      body: webhookBody,
      headers: {
        ...signedWebhook.headers,
        [HmacHeaders.SITE_ID]: siteId,
      },
    });

    expect(connectorVerification.valid).toBe(true);
  });
});
