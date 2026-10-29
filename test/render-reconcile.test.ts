import { describe, it, expect } from 'vitest';
import { computeDiff } from '../scripts/render/reconcile';
import { redactSecrets, generateSecureSecret } from '../scripts/render/render-client';
import { RenderDesiredState } from '../infra/render/desired-state.schema';

const mockDesired: RenderDesiredState = {
  version: '1.0.0',
  workspace: {
    name: 'Mimic Manager Production',
  },
  service: {
    type: 'web_service',
    name: 'mimic-manager',
    runtime: 'docker',
    dockerfilePath: './apps/api/Dockerfile',
    dockerContext: '.',
    region: 'singapore',
    plan: 'free',
    branch: 'main',
    autoDeploy: 'yes',
    healthCheckPath: '/health',
    preDeployCommand: 'node apps/api/dist/migrate.js',
  },
  envVars: {
    static: {
      NODE_ENV: 'production',
      PORT: '10000',
    },
    generatedSecrets: [
      {
        key: 'JWT_SECRET',
        byteLength: 32,
      },
    ],
    ownerSecrets: [
      {
        key: 'MONGODB_URI',
        required: true,
        pattern: '^mongodb(\\+srv)?://',
      },
    ],
  },
};

describe('Render Reconciliation Engine', () => {
  it('detects CREATE_SERVICE when service does not exist', () => {
    const plan = computeDiff(mockDesired, null, [], {
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/',
    });
    expect(plan.serviceExists).toBe(false);
    expect(plan.actions.some((a) => a.type === 'CREATE_SERVICE')).toBe(true);
  });

  it('is idempotent and returns NO_OP when account matches desired state', () => {
    const currentService = {
      id: 'srv-12345',
      name: 'mimic-manager',
      type: 'web_service',
      serviceDetails: {
        region: 'singapore',
        plan: 'free',
        healthCheckPath: '/health',
      },
    };

    const currentEnv = [
      { key: 'NODE_ENV', value: 'production' },
      { key: 'PORT', value: '10000' },
      { key: 'JWT_SECRET', value: 'existing_jwt_secret_value_1234567890' },
      { key: 'MONGODB_URI', value: 'mongodb+srv://existing:pwd@cluster.mongodb.net/' },
    ];

    const plan = computeDiff(mockDesired, currentService, currentEnv, {
      MONGODB_URI: 'mongodb+srv://existing:pwd@cluster.mongodb.net/',
    });

    expect(plan.serviceExists).toBe(true);
    expect(plan.actions.length).toBe(1);
    expect(plan.actions[0].type).toBe('NO_OP');
  });

  it('detects missing generated secrets without overwriting existing ones', () => {
    const currentService = {
      id: 'srv-12345',
      name: 'mimic-manager',
      type: 'web_service',
      serviceDetails: {
        region: 'singapore',
        plan: 'free',
        healthCheckPath: '/health',
      },
    };

    const currentEnv = [
      { key: 'NODE_ENV', value: 'production' },
      { key: 'PORT', value: '10000' },
      { key: 'MONGODB_URI', value: 'mongodb+srv://user:pass@cluster.mongodb.net/' },
    ];

    const plan = computeDiff(mockDesired, currentService, currentEnv, {
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/',
    });

    const jwtAction = plan.actions.find((a) => a.key === 'JWT_SECRET');
    expect(jwtAction).toBeDefined();
    expect(jwtAction?.type).toBe('CREATE_ENV_VAR');
    expect(jwtAction?.isSecret).toBe(true);
  });

  it('refuses to proceed if required owner secret is missing', () => {
    const currentService = {
      id: 'srv-12345',
      name: 'mimic-manager',
      type: 'web_service',
      serviceDetails: {
        region: 'singapore',
        plan: 'free',
        healthCheckPath: '/health',
      },
    };

    expect(() => {
      computeDiff(mockDesired, currentService, [], {});
    }).toThrow(/Required owner secret MONGODB_URI is missing/);
  });

  it('validates secret pattern matching without printing the secret', () => {
    const currentService = {
      id: 'srv-12345',
      name: 'mimic-manager',
      type: 'web_service',
      serviceDetails: {
        region: 'singapore',
        plan: 'free',
        healthCheckPath: '/health',
      },
    };

    expect(() => {
      computeDiff(mockDesired, currentService, [], {
        MONGODB_URI: 'invalid-scheme-uri',
      });
    }).toThrow(/does not match required pattern/);
  });
});

describe('Secret Redaction & Safety Guarantee', () => {
  it('redacts known secrets, Render tokens, and connection credentials', () => {
    const rawSecret = 'super_secret_test_token_987654321';
    const rawMongoUri = 'mongodb+srv://myuser:superpassword123@cluster.mongodb.net/test';
    const rawRedisUri = 'redis://default:myredispassword@redis.io:12345';
    const renderKey = 'rnd_testkey1234567890abcdef';

    const logText = `Connecting to ${rawMongoUri} and ${rawRedisUri} with key ${renderKey} and secret ${rawSecret}`;
    const sanitized = redactSecrets(logText, [rawSecret]);

    expect(sanitized).not.toContain('super_secret_test_token_987654321');
    expect(sanitized).not.toContain('superpassword123');
    expect(sanitized).not.toContain('myredispassword');
    expect(sanitized).not.toContain('rnd_testkey1234567890abcdef');
    expect(sanitized).toContain('[REDACTED]');
    expect(sanitized).toContain('[REDACTED_USER_PASS]');
    expect(sanitized).toContain('[REDACTED_AUTH]');
    expect(sanitized).toContain('[REDACTED_RENDER_KEY]');
  });

  it('generates cryptographically secure random bytes of specified length', () => {
    const s1 = generateSecureSecret(32);
    const s2 = generateSecureSecret(32);
    expect(s1).toHaveLength(64); // 32 bytes in hex = 64 chars
    expect(s2).toHaveLength(64);
    expect(s1).not.toBe(s2);
  });
});
