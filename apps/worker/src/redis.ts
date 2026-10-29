/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

import Redis from 'ioredis';

export const DEFAULT_REDIS_URI =
  'redis://default:huUHbKPYM59eSIZ45Rr4N2xXIxXJKGWX@jump-textural-constructive-72143.db.redis.io:19041';

export function getRedisUri(): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.REDIS_URL || process.env.REDIS_URI || DEFAULT_REDIS_URI;
  }
  return DEFAULT_REDIS_URI;
}

export function createRedisClient(uri: string = getRedisUri()): Redis {
  return new Redis(uri, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });
}

export const redis = createRedisClient();
