import dns from 'node:dns/promises';
import { URL } from 'node:url';
import { validateIpAddress, normalizeIpv4 } from './ip-checker.js';

export interface SsrfGuardOptions {
  allowPrivate?: boolean;
  allowedPorts?: number[];
  maxRedirects?: number;
  timeoutMs?: number;
}

export interface ValidatedUrl {
  url: string;
  parsedUrl: URL;
  resolvedIps: string[];
  pinnedIp: string;
}

const DEFAULT_ALLOWED_PORTS = [80, 443, 8080, 8443, 3000];
const BLOCKED_HOSTNAMES = new Set(['localhost', 'localhost.localdomain', 'broadcasthost']);
const BLOCKED_TLDS = ['.internal', '.local', '.lan', '.home', '.test', '.example', '.invalid', '.onion'];

export class SsrfError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'SSRF_BLOCKED',
  ) {
    super(message);
    this.name = 'SsrfError';
  }
}

export class SsrfGuard {
  private readonly allowPrivate: boolean;
  private readonly allowedPorts: Set<number>;
  private readonly maxRedirects: number;
  private readonly timeoutMs: number;

  constructor(options: SsrfGuardOptions = {}) {
    this.allowPrivate = options.allowPrivate ?? (process.env['ALLOW_PRIVATE_TARGETS'] === 'true');
    this.allowedPorts = new Set(options.allowedPorts ?? DEFAULT_ALLOWED_PORTS);
    this.maxRedirects = options.maxRedirects ?? 5;
    this.timeoutMs = options.timeoutMs ?? 10000;
  }

  public validateUrlStructure(inputUrl: string): URL {
    let parsed: URL;
    try {
      parsed = new URL(inputUrl);
    } catch {
      throw new SsrfError(`Malformed URL: ${inputUrl}`, 'SSRF_MALFORMED_URL');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new SsrfError(`Forbidden protocol: ${parsed.protocol} (only http and https are allowed)`, 'SSRF_FORBIDDEN_PROTOCOL');
    }

    if (parsed.username || parsed.password) {
      throw new SsrfError('URLs with user credentials are not allowed', 'SSRF_CREDENTIALS_DISALLOWED');
    }

    const port = parsed.port ? parseInt(parsed.port, 10) : parsed.protocol === 'https:' ? 443 : 80;
    if (!this.allowedPorts.has(port)) {
      throw new SsrfError(`Port ${port} is not allowed`, 'SSRF_PORT_DISALLOWED');
    }

    const hostname = parsed.hostname.toLowerCase();

    if (BLOCKED_HOSTNAMES.has(hostname)) {
      if (!this.allowPrivate) {
        throw new SsrfError(`Hostname '${hostname}' is disallowed`, 'SSRF_LOCALHOST_BLOCKED');
      }
    }

    for (const tld of BLOCKED_TLDS) {
      if (hostname.endsWith(tld)) {
        if (!this.allowPrivate) {
          throw new SsrfError(`TLD '${tld}' is disallowed`, 'SSRF_PRIVATE_TLD_BLOCKED');
        }
      }
    }

    return parsed;
  }

  public async validateAndResolve(inputUrl: string): Promise<ValidatedUrl> {
    const parsed = this.validateUrlStructure(inputUrl);
    const hostname = parsed.hostname;

    // Check if hostname is an IP directly (including hex/octal/dword)
    const normalizedDirectIp = normalizeIpv4(hostname);
    if (normalizedDirectIp) {
      const ipCheck = validateIpAddress(normalizedDirectIp, this.allowPrivate);
      if (!ipCheck.allowed) {
        throw new SsrfError(ipCheck.reason ?? 'Direct IP is forbidden', 'SSRF_IP_BLOCKED');
      }
      return {
        url: parsed.toString(),
        parsedUrl: parsed,
        resolvedIps: [normalizedDirectIp],
        pinnedIp: normalizedDirectIp,
      };
    }

    // Resolve DNS
    const resolvedIps: string[] = [];
    try {
      const v4s = await dns.resolve4(hostname).catch(() => []);
      const v6s = await dns.resolve6(hostname).catch(() => []);
      resolvedIps.push(...v4s, ...v6s);
    } catch (err) {
      throw new SsrfError(`DNS resolution failed for host '${hostname}': ${(err as Error).message}`, 'SSRF_DNS_FAILED');
    }

    if (resolvedIps.length === 0) {
      throw new SsrfError(`No IP addresses found for host '${hostname}'`, 'SSRF_DNS_NO_RECORDS');
    }

    // Validate EVERY resolved IP address
    for (const ip of resolvedIps) {
      const ipCheck = validateIpAddress(ip, this.allowPrivate);
      if (!ipCheck.allowed) {
        throw new SsrfError(
          `Host '${hostname}' resolved to blocked IP '${ip}': ${ipCheck.reason}`,
          'SSRF_IP_BLOCKED',
        );
      }
    }

    const pinnedIp = resolvedIps[0]!;
    return {
      url: parsed.toString(),
      parsedUrl: parsed,
      resolvedIps,
      pinnedIp,
    };
  }

  /**
   * Safe fetch executing outbound HTTP request with DNS pinning and redirect verification.
   */
  public async safeFetch(inputUrl: string, init?: RequestInit): Promise<Response> {
    let currentUrl = inputUrl;
    let redirectCount = 0;

    while (redirectCount <= this.maxRedirects) {
      const validated = await this.validateAndResolve(currentUrl);

      // We execute request with manual redirect handling to inspect every hop
      const fetchOptions: RequestInit = {
        ...init,
        redirect: 'manual',
        headers: {
          ...init?.headers,
          Host: validated.parsedUrl.host,
        },
      };

      const response = await fetch(currentUrl, fetchOptions);

      // Check for redirect status codes (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) {
          return response;
        }

        const nextUrl = new URL(location, currentUrl).toString();
        currentUrl = nextUrl;
        redirectCount++;
        continue;
      }

      return response;
    }

    throw new SsrfError(`Exceeded maximum redirects limit of ${this.maxRedirects}`, 'SSRF_TOO_MANY_REDIRECTS');
  }
}
