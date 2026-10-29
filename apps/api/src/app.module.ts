import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { SitesController } from './sites/sites.controller.js';
import { SitesService } from './sites/sites.service.js';
import { MediaController } from './media/media.controller.js';
import { MediaService } from './media/media.service.js';
import { HmacAuthGuard } from './common/guards/hmac-auth.guard.js';

@Module({
  imports: [],
  controllers: [HealthController, SitesController, MediaController],
  providers: [SitesService, MediaService, HmacAuthGuard],
  exports: [SitesService, MediaService, HmacAuthGuard],
})
export class AppModule {}
