import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('System')
@Controller('api/v1')
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: Math.floor(Date.now() / 1000),
      version: '0.1.0',
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Service dependencies are healthy' })
  getReady() {
    return {
      status: 'ready',
      checks: {
        api: 'healthy',
        timestamp: Math.floor(Date.now() / 1000),
      },
    };
  }
}
