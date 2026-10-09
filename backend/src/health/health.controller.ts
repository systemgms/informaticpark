import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { HealthService } from './health.service';

// Probes must stay reachable by load balancers and uptime monitors without a token.
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getHealthCheck() {
    await this.healthService.ensureDatabaseIsReachable();

    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async readyCheck() {
    await this.healthService.ensureDatabaseIsReachable();

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }
}
