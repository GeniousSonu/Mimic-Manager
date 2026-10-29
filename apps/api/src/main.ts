import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './common/filters/api-exception.filter.js';

export async function bootstrap(port = 3000): Promise<NestFastifyApplication> {
  const adapter = new FastifyAdapter({
    logger: false,
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { rawBody: true }, // Built-in NestJS raw body capture for HMAC verification
  );

  await app.register(cors as unknown as Parameters<typeof app.register>[0], {
    origin: true,
    credentials: true,
  });

  await app.register(helmet as unknown as Parameters<typeof app.register>[0], {
    contentSecurityPolicy: false,
  });

  app.useGlobalFilters(new ApiExceptionFilter());

  // Setup OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Mimic Manager API')
    .setDescription('Unified Open-Source Site Optimization Platform')
    .setVersion('0.1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-mimic-signature',
        in: 'header',
        description: 'HMAC-SHA256 signature',
      },
      'hmac',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, '0.0.0.0');
  return app;
}

// Start standalone if executed directly
if (process.argv[1]?.endsWith('main.js') || process.argv[1]?.endsWith('main.ts')) {
  const port = parseInt(process.env['PORT'] || '3000', 10);
  bootstrap(port).then(async () => {
    console.log(`[Mimic Manager API] Server running on http://0.0.0.0:${port}`);

    // If running in in-process worker mode (e.g. Render free tier)
    const inProcessWorker =
      process.env['IN_PROCESS_WORKER'] === 'true' ||
      process.env['RUN_IN_PROCESS_WORKER'] === 'true' ||
      process.env['RENDER'] === 'true';

    if (inProcessWorker) {
      console.log('[Mimic Manager API] Starting in-process background worker for Render free tier...');
      try {
        const { startInProcessWorker } = await import('@mimic-manager/worker');
        startInProcessWorker();
        console.log('[Mimic Manager API] In-process worker successfully active.');
      } catch (err: any) {
        console.warn('[Mimic Manager API] Notice: in-process worker initialization skipped:', err.message);
      }
    }
  });
}
