import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class SitesService {
  // In-memory registry for rapid Phase 0 execution, backed by DB schema in Phase 1
  private readonly sites = new Map<string, SiteRecord>();
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

  public rotateSecret(siteId: string): { newSecret: string; version: number } {
    const site = this.getSite(siteId);
    const newSecret = crypto.randomBytes(32).toString('hex');
    site.previousSecret = site.secret;
    site.secret = newSecret;
    site.secretVersion += 1;

    return { newSecret, version: site.secretVersion };
  }

  public recordNonce(nonce: string, timestamp: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    // Purge expired nonces (> 10 minutes)
    for (const [n, ts] of this.usedNonces.entries()) {
      if (now - ts > 600) {
        this.usedNonces.delete(n);
      }
    }

    if (this.usedNonces.has(nonce)) {
      return false; // Replay detected!
    }

    this.usedNonces.set(nonce, timestamp);
    return true;
  }
}
