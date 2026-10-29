import { z } from 'zod';

export const HmacHeaders = {
  SITE_ID: 'x-mimic-site-id',
  TIMESTAMP: 'x-mimic-timestamp',
  NONCE: 'x-mimic-nonce',
  SIGNATURE: 'x-mimic-signature',
} as const;

export const HmacSignatureInputSchema = z.object({
  method: z.string().transform((v) => v.toUpperCase()),
  path: z.string(),
  bodySha256: z.string().length(64),
  timestamp: z.number().int().positive(),
  nonce: z.string().min(8).max(64),
});

export type HmacSignatureInput = z.infer<typeof HmacSignatureInputSchema>;

export interface HmacVerificationResult {
  valid: boolean;
  code?: string;
  message?: string;
}

export interface SharedHmacTestVector {
  description: string;
  secret: string;
  method: string;
  path: string;
  body: string;
  timestamp: number;
  nonce: string;
  expectedBodySha256: string;
  expectedCanonicalString: string;
  expectedSignature: string;
}
