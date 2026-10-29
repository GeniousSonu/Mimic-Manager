import { Controller, Post, Body, UseGuards, Req, Inject } from '@nestjs/common';
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

  @Post('pair')
  @ApiOperation({ summary: 'Pair a new site using a one-time pairing token' })
  pairSite(@Body() body: { siteName: string; siteUrl: string; pairingToken: string }) {
    const result = this.sitesService.pairSite(body.siteName, body.siteUrl);
    return {
      ...result,
      apiBaseUrl: 'http://localhost:3000',
    };
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
