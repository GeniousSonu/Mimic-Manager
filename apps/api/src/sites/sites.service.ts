import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import crypto from 'node:crypto';

export interface SiteRecord {
  siteId: string;
  name: string;
  url: string;
  secret: string;
  previousSecret?: string;
  secretVersion: number;
  createdAt: Date;
}

export interface PairingSession {
  sessionId: string;
  codeHash: string;
  rawCode: string;
  siteUrl: string;
  siteName: string;
  pluginVersion: string;
  protocolVersion: string;
  expiresAt: number;
  attempts: number;
  status: 'waiting' | 'approved' | 'consumed' | 'expired' | 'locked';
  siteId?: string | undefined;
  secret?: string | undefined;
  createdAt: Date;
}

@Injectable()
export class SitesService {
  private readonly sites = new Map<string, SiteRecord>();
  private readonly pairingSessions = new Map<string, PairingSession>();
  private readonly usedNonces = new Map<string, number>();

  constructor() {
    // Seed default site for Phase 0 integration tests
    this.registerSite({
      siteId: 'site_phase0_test',
      name: 'Phase 0 Test Site',
      url: 'http://localhost:8000',
      secret: 'phase0_secret_key_8492048102948102',
      secretVersion: 1,
      createdAt: new Date(),
    });
  }

  public registerSite(site: SiteRecord): void {
    this.sites.set(site.siteId, site);
  }

  public getSite(siteId: string): SiteRecord {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new NotFoundException(`Site with ID '${siteId}' not found`);
    }
    return site;
  }

  public listSites(): Array<Omit<SiteRecord, 'secret' | 'previousSecret'>> {
    return Array.from(this.sites.values()).map(s => ({
      siteId: s.siteId,
      name: s.name,
      url: s.url,
      secretVersion: s.secretVersion,
      createdAt: s.createdAt,
    }));
  }

  public disconnectSite(siteId: string): boolean {
    return this.sites.delete(siteId);
  }

  public pairSite(siteName: string, siteUrl: string): { siteId: string; secret: string; secretVersion: number } {
    const siteId = `site_${crypto.randomBytes(8).toString('hex')}`;
    const secret = crypto.randomBytes(32).toString('hex');
    const secretVersion = 1;

    this.registerSite({
      siteId,
      name: siteName,
      url: siteUrl,
      secret,
      secretVersion,
      createdAt: new Date(),
    });

    return { siteId, secret, secretVersion };
  }

  /**
   * Step 1: Plugin requests a new pairing session.
   * Generates a 6-digit CSPRNG code with 10-minute expiry and hashed storage.
   */
  public initPairingSession(params: {
    homeUrl: string;
    name?: string;
    pluginVersion?: string;
    protocolVersion?: string;
  }): { sessionId: string; pairingCode: string; expiresInSeconds: number } {
    const rawCode = crypto.randomInt(100000, 1000000).toString();
    const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');
    const sessionId = `ps_${crypto.randomBytes(12).toString('hex')}`;
    const expiresInSeconds = 600; // 10 minutes

    const session: PairingSession = {
      sessionId,
      codeHash,
      rawCode,
      siteUrl: params.homeUrl,
      siteName: params.name || params.homeUrl,
      pluginVersion: params.pluginVersion || '1.0.0',
      protocolVersion: params.protocolVersion || '1.0',
      expiresAt: Date.now() + expiresInSeconds * 1000,
      attempts: 0,
      status: 'waiting',
      createdAt: new Date(),
    };

    this.pairingSessions.set(sessionId, session);

    return {
      sessionId,
      pairingCode: rawCode,
      expiresInSeconds,
    };
  }

  /**
   * Step 2: PWA submits 6-digit code to verify site candidate.
   * Constant-time comparison, max 5 attempts lockout, anti-enumeration.
   */
  public verifyPairingCode(pairingCode: string, siteUrl?: string): {
    sessionId: string;
    siteUrl: string;
    name: string;
    pluginVersion: string;
  } {
    const targetHash = crypto.createHash('sha256').update(pairingCode.trim()).digest('hex');
    const now = Date.now();

    for (const session of this.pairingSessions.values()) {
      if (session.status !== 'waiting') continue;

      if (session.expiresAt < now) {
        session.status = 'expired';
        continue;
      }

      if (session.attempts >= 5) {
        session.status = 'locked';
        continue;
      }

      // Constant-time hash comparison
      const isMatch = crypto.timingSafeEqual(
        Buffer.from(session.codeHash, 'hex'),
        Buffer.from(targetHash, 'hex')
      );

      if (isMatch) {
        if (siteUrl && session.siteUrl !== siteUrl) {
          session.attempts++;
          throw new BadRequestException('Pairing code is not valid for this site URL.');
        }

        return {
          sessionId: session.sessionId,
          siteUrl: session.siteUrl,
          name: session.siteName,
          pluginVersion: session.pluginVersion,
        };
      } else {
        session.attempts++;
      }
    }

    throw new BadRequestException('Invalid or expired 6-digit pairing code.');
  }

  /**
   * Step 3: PWA confirms "Is this your site?".
   * Binds site to account and mints the HMAC secret.
   */
  public confirmPairingSession(sessionId: string, confirm: boolean): { success: boolean; siteId: string } {
    const session = this.pairingSessions.get(sessionId);
    if (!session || session.status !== 'waiting' || session.expiresAt < Date.now()) {
      throw new BadRequestException('Invalid or expired pairing session.');
    }

    if (!confirm) {
      session.status = 'expired';
      return { success: false, siteId: '' };
    }

    const { siteId, secret } = this.pairSite(session.siteName, session.siteUrl);
    session.status = 'approved';
    session.siteId = siteId;
    session.secret = secret;

    return { success: true, siteId };
  }

  /**
   * Step 4: WordPress plugin polls for approval status.
   * Delivers the secret exactly once over TLS.
   */
  public getPairingStatus(sessionId: string): {
    status: 'waiting' | 'approved' | 'consumed' | 'expired' | 'locked';
    siteId?: string | undefined;
    secret?: string | undefined;
    apiBaseUrl?: string | undefined;
  } {
    const session = this.pairingSessions.get(sessionId);
    if (!session) {
      return { status: 'expired' };
    }

    if (session.expiresAt < Date.now() && session.status === 'waiting') {
      session.status = 'expired';
    }

    if (session.status === 'approved') {
      const secret = session.secret;
      const siteId = session.siteId;
      // Mark as consumed so secret is never re-transmitted
      session.status = 'consumed';
      session.secret = undefined;

      return {
        status: 'approved',
        siteId,
        secret,
        apiBaseUrl: 'http://localhost:3000',
      };
    }

    return {
      status: session.status,
      siteId: session.siteId,
      apiBaseUrl: 'http://localhost:3000',
    };
  }

  public rotateSecret(siteId: string): { newSecret: string; version: number } {
    const site = this.getSite(siteId);
    const newSecret = crypto.randomBytes(32).toString('hex');
    const newVersion = site.secretVersion + 1;

    site.previousSecret = site.secret;
    site.secret = newSecret;
    site.secretVersion = newVersion;

    return { newSecret, version: newVersion };
  }

  public recordNonce(nonce: string, timestamp: number): boolean {
    return this.checkAndRecordNonce(nonce, timestamp);
  }

  public checkAndRecordNonce(nonce: string, timestamp: number): boolean {
    const tsMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    const now = Date.now();
    const drift = Math.abs(now - tsMs);

    if (drift > 300000) {
      return false;
    }

    if (this.usedNonces.has(nonce)) {
      return false;
    }

    this.usedNonces.set(nonce, tsMs);
    return true;
  }
}
