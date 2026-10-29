import { Controller, Post, Get, Param, Body, UseGuards, Req, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { MediaService } from './media.service.js';
import { HmacAuthGuard } from '../common/guards/hmac-auth.guard.js';
import { FastifyRequest } from 'fastify';
import { SiteRecord } from '../sites/sites.service.js';
import type { CreateMediaJobInput } from '@mimic-manager/types';

interface RequestWithSite extends FastifyRequest {
  site?: SiteRecord;
}

@ApiTags('Media')
@Controller('api/v1/media')
export class MediaController {
  constructor(@Inject(MediaService) private readonly mediaService: MediaService) {}

  @Post('jobs')
  @UseGuards(HmacAuthGuard)
  @ApiSecurity('hmac')
  @ApiOperation({ summary: 'Create media optimization job' })
  async createJob(@Req() req: RequestWithSite, @Body() body: CreateMediaJobInput) {
    const site = req.site!;
    const job = await this.mediaService.createJob(site.siteId, body);
    return job;
  }

  @Get('jobs/:jobId')
  @UseGuards(HmacAuthGuard)
  @ApiSecurity('hmac')
  @ApiOperation({ summary: 'Get media job status' })
  getJob(@Param('jobId') jobId: string) {
    return this.mediaService.getJob(jobId);
  }
}
