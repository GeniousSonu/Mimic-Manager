import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { HmacSigner } from '@mimic-manager/types';
import { HmacHeaders } from '@mimic-manager/types';
import { SitesService, SiteRecord } from '../../sites/sites.service.js';

interface RequestWithSite extends FastifyRequest {
  site?: SiteRecord;
  rawBody?: Buffer | string;
}

@Injectable()
export class HmacAuthGuard implements CanActivate {
  constructor(@Inject(SitesService) private readonly sitesService: SitesService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithSite>();

    const siteIdHeader = request.headers[HmacHeaders.SITE_ID];
    const siteId = Array.isArray(siteIdHeader) ? siteIdHeader[0] : siteIdHeader;

    if (!siteId) {
      throw new UnauthorizedException({
        code: 'AUTH_MISSING_SITE_ID',
        message: `Missing required header: ${HmacHeaders.SITE_ID}`,
      });
    }

    let site: SiteRecord;
    try {
      site = this.sitesService.getSite(siteId);
    } catch {
      throw new UnauthorizedException({
        code: 'AUTH_SITE_NOT_FOUND',
        message: `No site found with ID: ${siteId}`,
      });
    }

    const nonceHeader = request.headers[HmacHeaders.NONCE];
    const nonce = Array.isArray(nonceHeader) ? nonceHeader[0] : nonceHeader;
    const timestampHeader = request.headers[HmacHeaders.TIMESTAMP];
    const timestamp = parseInt(
      Array.isArray(timestampHeader) ? timestampHeader[0] || '0' : timestampHeader || '0',
      10,
    );

    if (!nonce || Number.isNaN(timestamp)) {
      throw new UnauthorizedException({
        code: 'AUTH_MISSING_HEADERS',
        message: 'Missing timestamp or nonce header',
      });
    }

    // Check nonce replay
    const isNewNonce = this.sitesService.recordNonce(nonce, timestamp);
    if (!isNewNonce) {
      throw new UnauthorizedException({
        code: 'AUTH_NONCE_REPLAY',
        message: 'Nonce has already been used within the validity window',
      });
    }

    const rawBody = request.rawBody ?? '';
    const bodyBuffer = Buffer.isBuffer(rawBody)
      ? rawBody
      : Buffer.from(typeof rawBody === 'string' ? rawBody : JSON.stringify(request.body || ''), 'utf8');

    // Attempt verification with current secret
    let verifyResult = HmacSigner.verify({
      secret: site.secret,
      method: request.method,
      path: request.url.split('?')[0] || request.url,
      body: bodyBuffer,
      headers: request.headers as Record<string, string | string[] | undefined>,
    });

    // If failed and site has a previous secret (during rotation grace window), check previous secret
    if (!verifyResult.valid && site.previousSecret) {
      const graceResult = HmacSigner.verify({
        secret: site.previousSecret,
        method: request.method,
        path: request.url.split('?')[0] || request.url,
        body: bodyBuffer,
        headers: request.headers as Record<string, string | string[] | undefined>,
      });
      if (graceResult.valid) {
        verifyResult = graceResult;
      }
    }

    if (!verifyResult.valid) {
      throw new UnauthorizedException({
        code: verifyResult.code || 'AUTH_INVALID_SIGNATURE',
        message: verifyResult.message || 'HMAC authentication failed',
      });
    }

    request.site = site;
    return true;
  }
}
