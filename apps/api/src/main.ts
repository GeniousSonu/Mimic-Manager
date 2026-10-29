/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fs from 'node:fs';
import path from 'node:path';
import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './common/filters/api-exception.filter.js';

/**
 * Validates configuration for production readiness.
 * Refuses to boot if required secrets are missing or weak.
 */
export function validateProductionConfig(): void {
  const isProduction = process.env['NODE_ENV'] === 'production';
  if (!isProduction) return;

  const jwtSecret = process.env['JWT_SECRET'];
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error(
      '[Config Error] FATAL: JWT_SECRET must be at least 32 characters in production.'
    );
  }

  const kmsKey = process.env['MASTER_KMS_KEY'];
  if (!kmsKey || kmsKey.length < 32) {
    throw new Error(
      '[Config Error] FATAL: MASTER_KMS_KEY must be at least 32 characters (hex) in production.'
    );
  }
}

/**
 * Temp-file TTL cleanup on startup (cleans files > 24 hours old).
 */
export function cleanupStaleTempFiles(dirPath: string): void {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      return;
    }

    const now = Date.now();
    const ttlMs = 24 * 60 * 60 * 1000; // 24 hours
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      if (now - stat.mtimeMs > ttlMs) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch (err: any) {
    console.warn('[Storage Cleanup] Notice: stale file cleanup warning:', err.message);
  }
}

export async function bootstrap(port = 3000): Promise<NestFastifyApplication> {
  validateProductionConfig();

  // Storage path setup and TTL cleanup
  const storagePath = process.env['STORAGE_PATH'] || '/tmp/mimic-manager/storage';
  cleanupStaleTempFiles(storagePath);

  // Trust proxy for Render load balancers
  const adapter = new FastifyAdapter({
    trustProxy: true,
    logger: process.env['NODE_ENV'] === 'production' ? { level: 'info' } : false,
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { rawBody: true }
  );

  // Strict CORS allowlist
  const allowedOrigins = (
    process.env['MIMIC_MANAGER_CORS_ORIGIN'] ||
    process.env['CORS_ORIGIN'] ||
    'https://mimic-manager.vercel.app,http://localhost:3000,http://localhost:3001'
  )
    .split(',')
    .map((s) => s.trim());

  await app.register(cors as unknown as Parameters<typeof app.register>[0], {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
      }
    },
    credentials: true,
  });

  // HSTS and Security Headers
  await app.register(helmet as unknown as Parameters<typeof app.register>[0], {
    contentSecurityPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  });

  app.useGlobalFilters(new ApiExceptionFilter());

  // Setup OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Mimic Manager API')
    .setDescription('Unified Open-Source Site Optimization Platform')
    .setVersion('1.0.0-rc.1')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-mimic-signature',
        in: 'header',
        description: 'HMAC-SHA256 signature',
      },
      'hmac'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, '0.0.0.0');

  // Graceful shutdown on SIGTERM / SIGINT for zero-downtime deploys
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  signals.forEach((sig) => {
    process.on(sig, async () => {
      console.log(`[Mimic Manager API] Received ${sig}, initiating graceful shutdown...`);
      try {
        const { stopInProcessWorker } = await import('@mimic-manager/worker');
        await stopInProcessWorker();
      } catch {}
      await app.close();
      process.exit(0);
    });
  });

  return app;
}

// Start standalone if executed directly
if (process.argv[1]?.endsWith('main.js') || process.argv[1]?.endsWith('main.ts')) {
  const port = parseInt(process.env['PORT'] || '3000', 10);
  bootstrap(port).then(async () => {
    console.log(`[Mimic Manager API] Server running on http://0.0.0.0:${port}`);

    // Free tier sleep limitation warning
    const isFreeTier =
      process.env['RENDER'] === 'true' ||
      process.env['IN_PROCESS_WORKER'] === 'true' ||
      process.env['MIMIC_MANGER_RUN_WORKER_IN_API'] === 'true';

    if (isFreeTier) {
      console.log(
        '=========================================================================\n' +
        '[Mimic Manager] PRODUCTION NOTICE: Running in Render Free Tier mode.\n' +
        '[Mimic Manager] Instance will sleep after 15m of inactivity (cold start ~50s).\n' +
        '[Mimic Manager] Storage is ephemeral (/tmp). BullMQ worker running in-process.\n' +
        '========================================================================='
      );
    }

    // In-process worker activation (handles both MIMIC_MANAGER_ and MIMIC_MANGER_ typo variants)
    const runWorkerInProcess =
      process.env['IN_PROCESS_WORKER'] === 'true' ||
      process.env['RUN_IN_PROCESS_WORKER'] === 'true' ||
      process.env['MIMIC_MANAGER_RUN_WORKER_IN_API'] === 'true' ||
      process.env['MIMIC_MANGER_RUN_WORKER_IN_API'] === 'true' ||
      process.env['RENDER'] === 'true';

    if (runWorkerInProcess) {
      console.log('[Mimic Manager API] Initializing in-process BullMQ worker...');
      try {
        const { startInProcessWorker } = await import('@mimic-manager/worker');
        startInProcessWorker();
        console.log('[Mimic Manager API] In-process worker active on queue "media_optimize".');
      } catch (err: any) {
        console.warn('[Mimic Manager API] In-process worker initialization skipped:', err.message);
      }
    }
  });
}
