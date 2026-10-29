import { z } from 'zod';
import { OptimizeImageOptionsSchema, MediaJobResultSchema } from './media.js';

export const JobType = {
  MEDIA_OPTIMIZE: 'media.optimize',
  MEDIA_DESCRIBE: 'media.describe',
  SPEED_AUDIT: 'speed.audit',
  SPEED_VERIFY: 'speed.verify',
  SEO_AUDIT: 'seo.audit',
  REPLICATOR_CAPTURE: 'replicator.capture',
} as const;

export type JobTypeValue = (typeof JobType)[keyof typeof JobType];

export const JobStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type JobStatusValue = (typeof JobStatus)[keyof typeof JobStatus];

export const CreateMediaJobInputSchema = z.object({
  siteId: z.string().min(1),
  attachmentId: z.number().int().positive().optional(),
  filename: z.string().min(1),
  options: OptimizeImageOptionsSchema.optional(),
  idempotencyKey: z.string().min(8).max(128),
  webhookUrl: z.string().url().optional(),
});

export type CreateMediaJobInput = z.infer<typeof CreateMediaJobInputSchema>;

export const WebhookPayloadSchema = z.object({
  jobId: z.string(),
  type: z.string(),
  status: z.enum(['completed', 'failed']),
  siteId: z.string(),
  result: MediaJobResultSchema.optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
  timestamp: z.number(),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
