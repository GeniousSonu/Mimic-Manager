/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

import { describe, it, expect } from 'vitest';
import { InProcessWorkerManager, startInProcessWorker, stopInProcessWorker } from '../src/in-process.js';

describe('In-Process Worker Manager', () => {
  it('instantiates InProcessWorkerManager with defaults', () => {
    const manager = new InProcessWorkerManager();
    expect(manager).toBeDefined();
    expect(typeof manager.start).toBe('function');
    expect(typeof manager.stop).toBe('function');
  });

  it('manages singleton in-process worker lifecycle safely', async () => {
    const manager = startInProcessWorker({ concurrency: 1, queueName: 'test_queue' });
    expect(manager).toBeDefined();
    await stopInProcessWorker();
  });
});
