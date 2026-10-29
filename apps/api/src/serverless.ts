/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './common/filters/api-exception.filter.js';

let cachedApp: NestFastifyApplication | null = null;

export async function createNestServer(): Promise<NestFastifyApplication> {
  if (cachedApp) {
    return cachedApp;
  }

  const adapter = new FastifyAdapter({ logger: false });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { rawBody: true },
  );

  await app.register(cors as unknown as Parameters<typeof app.register>[0], {
    origin: true,
    credentials: true,
  });

  await app.register(helmet as unknown as Parameters<typeof app.register>[0], {
    contentSecurityPolicy: false,
  });

  app.useGlobalFilters(new ApiExceptionFilter());

  await app.init();
  await (app.getHttpAdapter().getInstance() as any).ready();

  cachedApp = app;
  return app;
}

export default async function handler(req: any, res: any) {
  const app = await createNestServer();
  const fastifyInstance = app.getHttpAdapter().getInstance() as any;
  fastifyInstance.routing(req, res);
}
