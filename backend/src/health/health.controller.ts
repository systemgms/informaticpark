import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

// Probes must stay reachable by load balancers and uptime monitors without a token.
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getHealthCheck() {
    await this.ensureDatabaseIsReachable();

    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async readyCheck() {
    await this.ensureDatabaseIsReachable();

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  // The driver error is deliberately dropped: these endpoints are public.
  private async ensureDatabaseIsReachable(): Promise<void> {
    try {
      await this.prisma.$executeRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('Base de datos no disponible');
    }
  }
}
