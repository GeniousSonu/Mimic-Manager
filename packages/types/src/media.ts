import { z } from 'zod';

export const SupportedInputFormats = ['jpeg', 'png', 'webp', 'avif', 'gif', 'svg', 'heic', 'tiff'] as const;
export type SupportedInputFormat = (typeof SupportedInputFormats)[number];

export const SupportedOutputFormats = ['webp', 'avif', 'jpeg', 'png'] as const;
export type SupportedOutputFormat = (typeof SupportedOutputFormats)[number];

export const QualityPresetSchema = z.enum(['lossless', 'high', 'balanced', 'aggressive']);
export type QualityPreset = z.infer<typeof QualityPresetSchema>;

export const OptimizeImageOptionsSchema = z.object({
  format: z.enum(SupportedOutputFormats).default('webp'),
  quality: z.number().min(1).max(100).optional(),
  preset: QualityPresetSchema.default('balanced'),
  maxWidth: z.number().int().positive().optional(),
  maxHeight: z.number().int().positive().optional(),
  stripMetadata: z.boolean().default(true),
  preserveIcc: z.boolean().default(true),
  avifEffort: z.number().min(0).max(9).default(4),
});

export type OptimizeImageOptions = z.infer<typeof OptimizeImageOptionsSchema>;

export const ImageVariantResultSchema = z.object({
  format: z.enum(SupportedOutputFormats),
  quality: z.number(),
  bytes: z.number(),
  width: z.number(),
  height: z.number(),
  sha256: z.string().length(64),
  savedBytes: z.number(),
  savedPercentage: z.number(),
  storageKey: z.string(),
  downloadUrl: z.string().url().optional(),
});

export type ImageVariantResult = z.infer<typeof ImageVariantResultSchema>;

export const MediaJobResultSchema = z.object({
  originalSha256: z.string().length(64),
  originalBytes: z.number(),
  width: z.number(),
  height: z.number(),
  format: z.string(),
  variants: z.array(ImageVariantResultSchema),
  isOptimal: z.boolean(),
});

export type MediaJobResult = z.infer<typeof MediaJobResultSchema>;
