import { ServiceUnavailableException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: { $executeRaw: jest.Mock };

  beforeEach(async () => {
    prisma = { $executeRaw: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('is reachable without authentication', () => {
    const isPublic = new Reflector().get<boolean>(
      IS_PUBLIC_KEY,
      HealthController,
    );

    expect(isPublic).toBe(true);
  });

  describe('getHealthCheck', () => {
    it('reports ok when the database answers', async () => {
      prisma.$executeRaw.mockResolvedValue(1);

      const result = await controller.getHealthCheck();

      expect(result).toMatchObject({ status: 'ok', database: 'connected' });
    });

    it('responds 503 without internal details when the database is down', async () => {
      prisma.$executeRaw.mockRejectedValue(
        new Error('connect ECONNREFUSED 10.0.0.5:5432'),
      );

      const error: unknown = await controller
        .getHealthCheck()
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect(JSON.stringify(error)).not.toContain('ECONNREFUSED');
    });
  });

  describe('readyCheck', () => {
    it('reports ready when the database answers', async () => {
      prisma.$executeRaw.mockResolvedValue(1);

      const result = await controller.readyCheck();

      expect(result).toMatchObject({ status: 'ready' });
    });

    it('responds 503 without internal details when the database is down', async () => {
      prisma.$executeRaw.mockRejectedValue(
        new Error('password authentication failed'),
      );

      const error: unknown = await controller
        .readyCheck()
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect(JSON.stringify(error)).not.toContain('password');
    });
  });
});
