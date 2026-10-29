import { Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'node:crypto';
import type { CreateMediaJobInput, MediaJobResult } from '@mimic-manager/types';

export interface StoredJob {
  jobId: string;
  siteId: string;
  type: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  idempotencyKey: string;
  filename: string;
  webhookUrl?: string | undefined;
  result?: MediaJobResult | undefined;
  error?: { code: string; message: string } | undefined;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MediaService {
  private readonly jobs = new Map<string, StoredJob>();
  private readonly idempotencyMap = new Map<string, string>(); // idempotencyKey -> jobId

  public async createJob(
    siteId: string,
    input: CreateMediaJobInput,
    imageBytes?: Buffer,
  ): Promise<StoredJob> {
    // Idempotency check
    const existingJobId = this.idempotencyMap.get(input.idempotencyKey);
    if (existingJobId) {
      const existing = this.jobs.get(existingJobId);
      if (existing) return existing;
    }

    const jobId = `job_${crypto.randomBytes(10).toString('hex')}`;
    const job: StoredJob = {
      jobId,
      siteId,
      type: 'media.optimize',
      status: 'pending',
      idempotencyKey: input.idempotencyKey,
      filename: input.filename,
      webhookUrl: input.webhookUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(jobId, job);
    this.idempotencyMap.set(input.idempotencyKey, jobId);

    return job;
  }

  public getJob(jobId: string): StoredJob {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new NotFoundException(`Job '${jobId}' not found`);
    }
    return job;
  }

  public updateJobResult(jobId: string, result: MediaJobResult): StoredJob {
    const job = this.getJob(jobId);
    job.status = 'completed';
    job.result = result;
    job.updatedAt = new Date();
    return job;
  }

  public updateJobError(jobId: string, error: { code: string; message: string }): StoredJob {
    const job = this.getJob(jobId);
    job.status = 'failed';
    job.error = error;
    job.updatedAt = new Date();
    return job;
  }
}
