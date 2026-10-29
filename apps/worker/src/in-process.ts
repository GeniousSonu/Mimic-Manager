/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

import { Worker, Job } from 'bullmq';
import { MediaProcessor } from './processor.js';
import { getRedisUri } from './redis.js';

export interface InProcessWorkerOptions {
  concurrency?: number;
  queueName?: string;
}

export class InProcessWorkerManager {
  private worker: Worker | null = null;
  private readonly processor = new MediaProcessor();

  public start(options: InProcessWorkerOptions = {}): Worker | null {
    const queueName = options.queueName || 'media_optimize';
    const concurrency = options.concurrency || 2;
    const redisUri = getRedisUri();

    try {
      console.log(
        `[Mimic Manager In-Process Worker] Spawning background worker on queue "${queueName}" (concurrency: ${concurrency})...`
      );

      this.worker = new Worker(
        queueName,
        async (job: Job) => {
          console.log(`[Worker Job ${job.id}] Processing ${job.name}...`);
          if (job.data?.imageBuffer) {
            const buf = Buffer.from(job.data.imageBuffer, 'base64');
            return await this.processor.processImage(buf, job.data.options);
          }
          return { status: 'noop', jobId: job.id };
        },
        {
          connection: {
            url: redisUri,
          },
          concurrency,
        }
      );

      this.worker.on('completed', (job: Job) => {
        console.log(`[Worker Job ${job.id}] Completed successfully`);
      });

      this.worker.on('failed', (job: Job | undefined, err: Error) => {
        console.error(`[Worker Job ${job?.id}] Failed:`, err.message);
      });

      this.worker.on('error', (err: Error) => {
        console.warn('[Mimic Manager In-Process Worker] Worker Redis notice:', err.message);
      });

      return this.worker;
    } catch (err: any) {
      console.warn('[Mimic Manager In-Process Worker] Could not start Redis worker:', err.message);
      return null;
    }
  }

  public async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }
}

let globalWorkerManager: InProcessWorkerManager | null = null;

export function startInProcessWorker(options?: InProcessWorkerOptions): InProcessWorkerManager {
  if (!globalWorkerManager) {
    globalWorkerManager = new InProcessWorkerManager();
    globalWorkerManager.start(options);
  }
  return globalWorkerManager;
}

export async function stopInProcessWorker(): Promise<void> {
  if (globalWorkerManager) {
    await globalWorkerManager.stop();
    globalWorkerManager = null;
  }
}
