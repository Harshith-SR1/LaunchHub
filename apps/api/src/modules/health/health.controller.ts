import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'healthy',
      service: 'nexusforge-api',
      timestamp: new Date().toISOString(),
    };
  }
}