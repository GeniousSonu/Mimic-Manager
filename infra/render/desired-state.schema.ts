import { z } from 'zod';

export const RenderDesiredStateSchema = z.object({
  $schema: z.string().optional(),
  version: z.string(),
  workspace: z.object({
    name: z.string(),
    id: z.string().optional(),
  }),
  service: z.object({
    type: z.literal('web_service'),
    name: z.string().min(1),
    runtime: z.literal('docker'),
    dockerfilePath: z.string(),
    dockerContext: z.string(),
    region: z.enum(['singapore', 'oregon', 'ohio', 'virginia', 'frankfurt']),
    plan: z.enum(['free', 'starter', 'standard', 'pro']),
    branch: z.string().default('main'),
    autoDeploy: z.enum(['yes', 'no']).default('yes'),
    healthCheckPath: z.string().default('/health'),
    preDeployCommand: z.string().optional(),
    buildFilter: z
      .object({
        paths: z.array(z.string()),
        ignoredPaths: z.array(z.string()).optional(),
      })
      .optional(),
  }),
  envVars: z.object({
    static: z.record(z.string()),
    generatedSecrets: z.array(
      z.object({
        key: z.string(),
        byteLength: z.number().int().min(16),
        description: z.string().optional(),
      }),
    ),
    ownerSecrets: z.array(
      z.object({
        key: z.string(),
        required: z.boolean(),
        pattern: z.string().optional(),
        description: z.string().optional(),
      }),
    ),
  }),
});

export type RenderDesiredState = z.infer<typeof RenderDesiredStateSchema>;

export function validateDesiredState(input: unknown): RenderDesiredState {
  return RenderDesiredStateSchema.parse(input);
}
