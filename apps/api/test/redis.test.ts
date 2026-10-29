/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

import { describe, it, expect, vi } from 'vitest';
import { redis, checkRedisHealth, getRedisUri, DEFAULT_REDIS_URI } from '../src/common/redis.js';

describe('Redis Connection Module', () => {
  it('exports valid default Redis URI', () => {
    expect(DEFAULT_REDIS_URI).toContain('redis://default:');
    expect(DEFAULT_REDIS_URI).toContain('jump-textural-constructive-72143.db.redis.io:19041');
    expect(getRedisUri()).toBeDefined();
  });

  it('checks Redis health successfully', async () => {
    const pingSpy = vi.spyOn(redis, 'ping').mockResolvedValue('PONG');

    const healthy = await checkRedisHealth();
    expect(healthy).toBe(true);
    expect(pingSpy).toHaveBeenCalled();

    pingSpy.mockRestore();
  });
});
