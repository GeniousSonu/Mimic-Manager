/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

import { describe, it, expect, vi } from 'vitest';
import {
  redis,
  nodeRedisClient,
  checkRedisHealth,
  getRedisUri,
  DEFAULT_REDIS_URI,
  REDIS_HOST,
  REDIS_PORT,
} from '../src/common/redis.js';

describe('Redis Connection Module', () => {
  it('exports valid default Redis URI and connection constants', () => {
    expect(DEFAULT_REDIS_URI).toContain('redis://default:');
    expect(DEFAULT_REDIS_URI).toContain('jump-textural-constructive-72143.db.redis.io:19041');
    expect(getRedisUri()).toBeDefined();
    expect(REDIS_HOST).toBe('jump-textural-constructive-72143.db.redis.io');
    expect(REDIS_PORT).toBe(19041);
  });

  it('configures official node-redis client', () => {
    expect(nodeRedisClient).toBeDefined();
    expect(typeof nodeRedisClient.connect).toBe('function');
  });

  it('checks Redis health successfully', async () => {
    const pingSpy = vi.spyOn(redis, 'ping').mockResolvedValue('PONG');

    const healthy = await checkRedisHealth();
    expect(healthy).toBe(true);
    expect(pingSpy).toHaveBeenCalled();

    pingSpy.mockRestore();
  });
});
