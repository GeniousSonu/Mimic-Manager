import { Controller, Get, Post, Body, UseGuards, Req, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { SitesService, SiteRecord } from './sites.service.js';
import { HmacAuthGuard } from '../common/guards/hmac-auth.guard.js';
import { FastifyRequest } from 'fastify';

interface RequestWithSite extends FastifyRequest {
  site?: SiteRecord;
}

@ApiTags('Sites')
@Controller('api/v1/sites')
export class SitesController {
  constructor(@Inject(SitesService) private readonly sitesService: SitesService) {}

  @Get()
  @ApiOperation({ summary: 'List all paired WordPress sites' })
  listSites() {
    return this.sitesService.listSites();
  }

  @Post('pair')
  @ApiOperation({ summary: 'Direct pairing of a site' })
  pairSite(@Body() body: { siteName: string; siteUrl: string; pairingToken?: string }) {
    const result = this.sitesService.pairSite(body.siteName, body.siteUrl);
    return {
      ...result,
      apiBaseUrl: 'http://localhost:3000',
    };
  }

  @Post('pair/init')
  @ApiOperation({ summary: 'Plugin initiates a 6-digit pairing session' })
  initPairingSession(
    @Body() body: { homeUrl: string; name?: string; pluginVersion?: string; protocolVersion?: string }
  ) {
    return this.sitesService.initPairingSession(body);
  }

  @Post('pair/verify')
  @ApiOperation({ summary: 'PWA verifies a 6-digit pairing code' })
  verifyPairingCode(@Body() body: { pairingCode: string; siteUrl?: string }) {
    return this.sitesService.verifyPairingCode(body.pairingCode, body.siteUrl);
  }

  @Post('pair/confirm')
  @ApiOperation({ summary: 'PWA confirms pairing after verifying site details' })
  confirmPairingSession(@Body() body: { sessionId: string; confirm: boolean }) {
    return this.sitesService.confirmPairingSession(body.sessionId, body.confirm);
  }

  @Post('pair/status')
  @ApiOperation({ summary: 'Plugin polls pairing status for approval and secret delivery' })
  getPairingStatus(@Body() body: { sessionId: string }) {
    return this.sitesService.getPairingStatus(body.sessionId);
  }

  @Post('disconnect')
  @ApiOperation({ summary: 'Disconnect and revoke a site secret' })
  disconnectSite(@Body() body: { siteId: string }) {
    const success = this.sitesService.disconnectSite(body.siteId);
    return { success };
  }

  @Post('rotate-secret')
  @UseGuards(HmacAuthGuard)
  @ApiSecurity('hmac')
  @ApiOperation({ summary: 'Rotate the site HMAC secret with overlapping grace period' })
  rotateSecret(@Req() req: RequestWithSite) {
    const site = req.site!;
    const rotated = this.sitesService.rotateSecret(site.siteId);
    return {
      siteId: site.siteId,
      newSecret: rotated.newSecret,
      secretVersion: rotated.version,
      gracePeriodSeconds: 86400, // 24 hours
    };
  }
}
