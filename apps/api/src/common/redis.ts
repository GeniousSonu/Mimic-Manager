/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

import { Redis } from 'ioredis';
import { createClient } from 'redis';

export const REDIS_HOST = 'jump-textural-constructive-72143.db.redis.io';
export const REDIS_PORT = 19041;
export const REDIS_USERNAME = 'default';
export const REDIS_PASSWORD =
  process.env.REDIS_PASSWORD || 'huUHbKPYM59eSIZ45Rr4N2xXIxXJKGWX';

export const DEFAULT_REDIS_URI = `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`;

export function getRedisUri(): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.REDIS_URL || process.env.REDIS_URI || DEFAULT_REDIS_URI;
  }
  return DEFAULT_REDIS_URI;
}

// 1. Official node-redis Client (v6)
export const nodeRedisClient = createClient({
  username: REDIS_USERNAME,
  password: REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST || REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || String(REDIS_PORT), 10),
  },
});

nodeRedisClient.on('error', (err) => {
  console.log('Redis Client Error', err);
});

export async function connectNodeRedis() {
  if (!nodeRedisClient.isOpen) {
    await nodeRedisClient.connect();
  }
  return nodeRedisClient;
}

export async function disconnectNodeRedis() {
  if (nodeRedisClient.isOpen) {
    await nodeRedisClient.disconnect();
  }
}

// 2. ioredis Client (for BullMQ queues and legacy pipelines)
export function createRedisClient(uri: string = getRedisUri()): Redis {
  return new Redis(uri, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });
}

export const redis = createRedisClient();

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (err) {
    console.error('[Redis] Health check error:', err);
    return false;
  }
}
