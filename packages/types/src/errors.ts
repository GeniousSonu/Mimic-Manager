import { z } from 'zod';

export const ErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  AUTH_INVALID_SIGNATURE: 'AUTH_INVALID_SIGNATURE',
  AUTH_TIMESTAMP_SKEW: 'AUTH_TIMESTAMP_SKEW',
  AUTH_NONCE_REPLAY: 'AUTH_NONCE_REPLAY',
  AUTH_SITE_NOT_FOUND: 'AUTH_SITE_NOT_FOUND',
  SSRF_BLOCKED: 'SSRF_BLOCKED',
  SSRF_DNS_REBINDING: 'SSRF_DNS_REBINDING',
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  JOB_STALLED: 'JOB_STALLED',
  MEDIA_INVALID_FORMAT: 'MEDIA_INVALID_FORMAT',
  MEDIA_DECOMPRESSION_BOMB: 'MEDIA_DECOMPRESSION_BOMB',
  MEDIA_SIZE_LIMIT_EXCEEDED: 'MEDIA_SIZE_LIMIT_EXCEEDED',
  MEDIA_CORRUPT_FILE: 'MEDIA_CORRUPT_FILE',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ApiErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string(),
  }),
});

export type ApiErrorEnvelope = z.infer<typeof ApiErrorEnvelopeSchema>;
