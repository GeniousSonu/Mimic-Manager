import { z } from 'zod';

export const SitePairingRequestSchema = z.object({
  siteName: z.string().min(1),
  siteUrl: z.string().url(),
  adminEmail: z.string().email(),
  pairingToken: z.string().min(16),
  connectorVersion: z.string(),
  cms: z.enum(['wordpress', 'generic']).default('wordpress'),
});

export type SitePairingRequest = z.infer<typeof SitePairingRequestSchema>;

export const SitePairingResponseSchema = z.object({
  siteId: z.string(),
  secret: z.string(),
  secretVersion: z.number().int().positive(),
  apiBaseUrl: z.string().url(),
});

export type SitePairingResponse = z.infer<typeof SitePairingResponseSchema>;
