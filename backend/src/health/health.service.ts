import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  // The driver error is deliberately dropped: the health endpoints are public.
  async ensureDatabaseIsReachable(): Promise<void> {
    try {
      await this.prisma.$executeRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('Base de datos no disponible');
    }
  }
}
