/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import { client as mongoClient } from '../common/mongodb.js';
import { redis } from '../common/redis.js';

@ApiTags('System')
@Controller()
export class HealthController {
  // Liveness Probe (Render healthCheckPath: /health)
  @Get(['health', 'api/v1/health'])
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  getHealth() {
    return {
      status: 'ok',
      service: 'mimic-manager-api',
      timestamp: Math.floor(Date.now() / 1000),
      version: '1.0.0-rc.1',
      uptime: process.uptime(),
      memory: {
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    };
  }

  // Keep-alive endpoint (Cold-start mitigation)
  @Get(['ping', 'api/v1/ping'])
  @ApiOperation({ summary: 'Keep-alive endpoint to prevent cold starts' })
  getPing() {
    return {
      status: 'pong',
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  // Readiness Probe: checks Mongo Atlas, Redis eviction policy, and Storage
  @Get(['ready', 'api/v1/ready'])
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Service dependencies are healthy' })
  @ApiResponse({ status: 503, description: 'One or more dependencies unhealthy' })
  async getReady(@Res() reply: FastifyReply) {
    const checks: Record<string, any> = {
      api: 'healthy',
      timestamp: Math.floor(Date.now() / 1000),
    };
    let isReady = true;

    // 1. Check MongoDB Atlas
    try {
      if (mongoClient) {
        await mongoClient.db('admin').command({ ping: 1 });
        checks.mongodb = { status: 'healthy', provider: 'Atlas' };
      } else {
        checks.mongodb = { status: 'unconfigured' };
      }
    } catch (err: any) {
      checks.mongodb = { status: 'unhealthy', error: err.message };
      isReady = false;
    }

    // 2. Check Redis & Eviction Policy
    try {
      const pong = await redis.ping();
      let evictionPolicy = 'unknown';
      try {
        const configResult = (await (redis as any).config('GET', 'maxmemory-policy')) as string[];
        if (Array.isArray(configResult) && configResult.length >= 2) {
          evictionPolicy = configResult[1] ?? 'unknown';
        }
      } catch {
        // Some managed Redis providers restrict CONFIG GET
        evictionPolicy = 'restricted_config';
      }

      if (evictionPolicy !== 'noeviction' && evictionPolicy !== 'restricted_config') {
        console.warn(
          `[Redis Warning] Redis eviction policy is "${evictionPolicy}". BullMQ requires "noeviction" to prevent silent task loss!`
        );
      }

      checks.redis = {
        status: pong === 'PONG' ? 'healthy' : 'degraded',
        evictionPolicy,
        provider: 'redis.io',
      };
    } catch (err: any) {
      checks.redis = { status: 'unhealthy', error: err.message };
      isReady = false;
    }

    // 3. Check Storage Driver
    const storagePath = process.env.STORAGE_PATH || '/tmp/mimic-manager/storage';
    try {
      if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
      }
      fs.accessSync(storagePath, fs.constants.W_OK);
      checks.storage = { status: 'healthy', driver: 'local', path: storagePath };
    } catch (err: any) {
      checks.storage = { status: 'unhealthy', error: err.message };
      isReady = false;
    }

    const httpStatus = isReady ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return reply.status(httpStatus).send({
      status: isReady ? 'ready' : 'degraded',
      checks,
    });
  }
}
