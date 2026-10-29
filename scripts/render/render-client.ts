import * as crypto from 'crypto';

export interface RenderOwner {
  id: string;
  name: string;
  email: string;
  type: 'user' | 'team';
}

export interface RenderService {
  id: string;
  name: string;
  type: string;
  repo?: string;
  branch?: string;
  serviceDetails?: {
    env?: string;
    plan?: string;
    region?: string;
    healthCheckPath?: string;
    preDeployCommand?: string;
    url?: string;
  };
  suspended?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface RenderEnvVar {
  key: string;
  value: string;
}

export interface RenderDeploy {
  id: string;
  status: 'created' | 'build_in_progress' | 'live' | 'deactivated' | 'build_failed' | 'update_failed' | 'canceled';
  trigger: string;
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
}

export interface RenderClientOptions {
  apiKey?: string;
  baseUrl?: string;
  dryRun?: boolean;
}

export class RenderClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  public readonly dryRun: boolean;

  constructor(options: RenderClientOptions = {}) {
    const key = options.apiKey || process.env['RENDER_API_KEY'];
    if (!key && !options.dryRun) {
      throw new Error(
        `RENDER_API_KEY environment variable is missing.\n` +
          `To configure your Render account via automation, please:\n` +
          `  1. Go to https://dashboard.render.com/account/settings\n` +
          `  2. Scroll down to "API Keys" and click "Create API Key"\n` +
          `  3. Give it a name (e.g. "mimic-manager-deploy") and copy the secret key\n` +
          `  4. Run: export RENDER_API_KEY="rnd_..." in your terminal\n`,
      );
    }
    this.apiKey = key || 'dry-run-key';
    this.baseUrl = (options.baseUrl || 'https://api.render.com/v1').replace(/\/+$/, '');
    this.dryRun = Boolean(options.dryRun);
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown,
    retries = 3,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    if (this.dryRun && method !== 'GET') {
      return { dryRun: true, method, endpoint, body } as unknown as T;
    }

    let delay = 1000;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        };
        if (body !== undefined) {
          headers['Content-Type'] = 'application/json';
        }

        const res = await fetch(url, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        if (res.status === 429) {
          // Rate limited, back off
          if (attempt === retries) {
            throw new Error(`Render API rate limit exceeded on ${method} ${endpoint}`);
          }
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
          continue;
        }

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Render API HTTP ${res.status} on ${method} ${endpoint}: ${errText}`);
        }

        if (res.status === 204) {
          return null as unknown as T;
        }

        return (await res.json()) as T;
      } catch (err: unknown) {
        if (attempt === retries) {
          throw err;
        }
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      }
    }

    throw new Error(`Failed request after ${retries} attempts`);
  }

  public async getOwners(): Promise<RenderOwner[]> {
    const data = await this.request<Array<{ owner: RenderOwner }>>('/owners');
    return (data || []).map((item) => item.owner);
  }

  public async listServices(): Promise<RenderService[]> {
    const data = await this.request<Array<{ service: RenderService }>>('/services');
    return (data || []).map((item) => item.service);
  }

  public async getService(serviceId: string): Promise<RenderService> {
    return this.request<RenderService>(`/services/${serviceId}`);
  }

  public async createService(payload: Record<string, unknown>): Promise<RenderService> {
    return this.request<RenderService>('/services', 'POST', payload);
  }

  public async updateService(serviceId: string, payload: Record<string, unknown>): Promise<RenderService> {
    return this.request<RenderService>(`/services/${serviceId}`, 'PATCH', payload);
  }

  public async deleteService(serviceId: string): Promise<void> {
    return this.request<void>(`/services/${serviceId}`, 'DELETE');
  }

  public async getEnvVars(serviceId: string): Promise<RenderEnvVar[]> {
    const data = await this.request<Array<{ envVar: RenderEnvVar }>>(`/services/${serviceId}/env-vars`);
    return (data || []).map((item) => item.envVar);
  }

  public async updateEnvVars(serviceId: string, envVars: RenderEnvVar[]): Promise<RenderEnvVar[]> {
    return this.request<RenderEnvVar[]>(`/services/${serviceId}/env-vars`, 'PUT', envVars);
  }

  public async triggerDeploy(serviceId: string, clearCache = false): Promise<RenderDeploy> {
    return this.request<RenderDeploy>(`/services/${serviceId}/deploys`, 'POST', {
      clearCache: clearCache ? 'clear' : 'do_not_clear',
    });
  }

  public async getDeploy(serviceId: string, deployId: string): Promise<RenderDeploy> {
    return this.request<RenderDeploy>(`/services/${serviceId}/deploys/${deployId}`);
  }

  public async listDeploys(serviceId: string, limit = 10): Promise<RenderDeploy[]> {
    const data = await this.request<Array<{ deploy: RenderDeploy }>>(`/services/${serviceId}/deploys?limit=${limit}`);
    return (data || []).map((item) => item.deploy);
  }
}

/**
 * CSPRNG Secret Generator
 */
export function generateSecureSecret(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Secret Redaction Utility
 */
export function redactSecrets(content: string, secrets: string[]): string {
  let result = content;
  for (const secret of secrets) {
    if (secret && secret.length >= 6) {
      result = result.split(secret).join('[REDACTED]');
    }
  }
  // Generic token redaction for known prefixes
  result = result.replace(/rnd_[A-Za-z0-9_-]+/g, '[REDACTED_RENDER_KEY]');
  result = result.replace(/mongodb\+srv:\/\/[^@\s]+@/g, 'mongodb+srv://[REDACTED_USER_PASS]@');
  result = result.replace(/rediss?:\/\/[^@\s]+@/g, 'redis://[REDACTED_AUTH]@');
  return result;
}
