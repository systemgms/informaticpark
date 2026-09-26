import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MovementsService } from './movements.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MovementsService', () => {
  let service: MovementsService;
  let prisma: {
    asset: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    assetMovement: {
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    custodian: {
      findUnique: jest.Mock;
    };
    location: {
      findUnique: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const mockAsset = {
    id: 1,
    assetName: 'Laptop Dell',
    code: 'LP-001',
    custodianId: 1,
    locationId: 1,
  };

  const mockMovement = {
    id: 1,
    assetId: 1,
    fromCustodianId: 1,
    toCustodianId: 2,
    fromLocationId: 1,
    toLocationId: 2,
    note: 'Traspaso de prueba',
    status: 'PENDIENTE',
    registeredByUserId: 1,
    confirmedByUserId: null,
    confirmedAt: null,
    actaUrl: null,
    groupId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    fromCustodian: null,
    toCustodian: null,
    fromLocation: null,
    toLocation: null,
    registeredBy: null,
    confirmedBy: null,
  };

  beforeEach(async () => {
    prisma = {
      asset: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      assetMovement: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      custodian: {
        findUnique: jest.fn(),
      },
      location: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovementsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MovementsService>(MovementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a movement for ADMIN', async () => {
      prisma.asset.findUnique.mockResolvedValue(mockAsset);
      prisma.assetMovement.findFirst.mockResolvedValue(null);
      prisma.custodian.findUnique.mockResolvedValue({ id: 2 });
      prisma.assetMovement.create.mockResolvedValue(mockMovement);

      const result = await service.create(
        1,
        { toCustodianId: 2, note: 'Test' },
        1,
        'ADMIN',
      );

      expect(result).toEqual(mockMovement);
    });

    it('should throw ConflictException if the asset already has a pending movement', async () => {
      prisma.asset.findUnique.mockResolvedValue(mockAsset);
      prisma.custodian.findUnique.mockResolvedValue({ id: 2 });
      prisma.assetMovement.findFirst.mockResolvedValue(mockMovement);

      await expect(
        service.create(1, { toCustodianId: 2 }, 1, 'ADMIN'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.assetMovement.create).not.toHaveBeenCalled();
    });

    it('should map a P2002 race error to ConflictException', async () => {
      prisma.asset.findUnique.mockResolvedValue(mockAsset);
      prisma.assetMovement.findFirst.mockResolvedValue(null);
      prisma.custodian.findUnique.mockResolvedValue({ id: 2 });
      prisma.assetMovement.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '7.5.0',
        }),
      );

      await expect(
        service.create(1, { toCustodianId: 2 }, 1, 'ADMIN'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if asset not found', async () => {
      prisma.asset.findUnique.mockResolvedValue(null);

      await expect(
        service.create(999, { toCustodianId: 2 }, 1, 'ADMIN'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if custodian does not own asset', async () => {
      prisma.asset.findUnique.mockResolvedValue(mockAsset);

      await expect(
        service.create(1, { toCustodianId: 2 }, 1, 'USER', 999),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow custodian to move their own asset', async () => {
      prisma.asset.findUnique.mockResolvedValue(mockAsset);
      prisma.assetMovement.findFirst.mockResolvedValue(null);
      prisma.custodian.findUnique.mockResolvedValue({ id: 2 });
      prisma.assetMovement.create.mockResolvedValue(mockMovement);

      const result = await service.create(
        1,
        { toCustodianId: 2 },
        1,
        'USER',
        1,
      );

      expect(result).toEqual(mockMovement);
    });

    it('should throw BadRequestException if neither toCustodianId nor toLocationId is provided', async () => {
      await expect(
        service.create(1, { note: 'Sin destino' }, 1, 'ADMIN'),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.asset.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('createBulk', () => {
    it('should throw BadRequestException if neither toCustodianId nor toLocationId is provided', async () => {
      await expect(
        service.createBulk({ assetIds: [1], note: 'Sin destino' }, 1, 'ADMIN'),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.asset.findMany).not.toHaveBeenCalled();
    });

    it('should create a movement per asset for ADMIN', async () => {
      prisma.asset.findMany.mockResolvedValue([mockAsset]);
      prisma.assetMovement.findMany.mockResolvedValue([]);
      prisma.$transaction.mockResolvedValue([mockMovement]);

      const result = await service.createBulk(
        { assetIds: [1], toCustodianId: 2 },
        1,
        'ADMIN',
      );

      expect(result).toEqual({
        groupId: expect.any(String),
        movements: [mockMovement],
      });
    });

    it('should throw ConflictException naming the asset if it already has a pending movement', async () => {
      prisma.asset.findMany.mockResolvedValue([mockAsset]);
      prisma.assetMovement.findMany.mockResolvedValue([
        { ...mockMovement, assetId: mockAsset.id },
      ]);

      await expect(
        service.createBulk({ assetIds: [1], toCustodianId: 2 }, 1, 'ADMIN'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    it('should confirm a pending movement', async () => {
      prisma.assetMovement.findUnique.mockResolvedValue(mockMovement);
      const txAssetUpdate = jest.fn().mockResolvedValue({});
      prisma.$transaction.mockImplementation(
        async (fn: (tx: typeof prisma) => Promise<unknown>) => {
          const tx = {
            assetMovement: {
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
              findUniqueOrThrow: jest.fn().mockResolvedValue({
                ...mockMovement,
                status: 'COMPLETADO',
              }),
            },
            asset: {
              findUnique: jest.fn().mockResolvedValue({
                ...mockAsset,
                custodianId: mockMovement.fromCustodianId,
                locationId: mockMovement.fromLocationId,
              }),
              update: txAssetUpdate,
            },
          };
          return fn(tx as unknown as typeof prisma);
        },
      );

      const result = await service.confirm(
        1,
        1,
        { note: 'Recibido' },
        null,
        2,
        'USER',
        2,
      );

      expect(result.status).toBe('COMPLETADO');
      expect(txAssetUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          custodianId: mockMovement.toCustodianId,
          locationId: mockMovement.toLocationId,
        },
      });
    });

    it('should throw NotFoundException if movement not found', async () => {
      prisma.assetMovement.findUnique.mockResolvedValue(null);

      await expect(
        service.confirm(1, 999, { note: 'Test' }, null, 1, 'ADMIN'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if updateMany reports the movement was already processed, without touching the asset', async () => {
      prisma.assetMovement.findUnique.mockResolvedValue(mockMovement);
      const txAssetUpdate = jest.fn();
      prisma.$transaction.mockImplementation(
        async (fn: (tx: typeof prisma) => Promise<unknown>) => {
          const tx = {
            assetMovement: {
              updateMany: jest.fn().mockResolvedValue({ count: 0 }),
              findUniqueOrThrow: jest.fn(),
            },
            asset: {
              findUnique: jest.fn(),
              update: txAssetUpdate,
            },
          };
          return fn(tx as unknown as typeof prisma);
        },
      );

      await expect(
        service.confirm(1, 1, { note: 'Test' }, null, 1, 'ADMIN'),
      ).rejects.toThrow(BadRequestException);

      expect(txAssetUpdate).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if the asset custodian/location changed since the movement was created, without touching the asset', async () => {
      prisma.assetMovement.findUnique.mockResolvedValue(mockMovement);
      const txAssetUpdate = jest.fn();
      prisma.$transaction.mockImplementation(
        async (fn: (tx: typeof prisma) => Promise<unknown>) => {
          const tx = {
            assetMovement: {
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
              findUniqueOrThrow: jest.fn(),
            },
            asset: {
              findUnique: jest.fn().mockResolvedValue({
                ...mockAsset,
                custodianId: 999,
              }),
              update: txAssetUpdate,
            },
          };
          return fn(tx as unknown as typeof prisma);
        },
      );

      await expect(
        service.confirm(1, 1, { note: 'Test' }, null, 2, 'USER', 2),
      ).rejects.toThrow(ConflictException);

      expect(txAssetUpdate).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if non-admin tries to confirm movement for another custodian', async () => {
      prisma.assetMovement.findUnique.mockResolvedValue(mockMovement);

      await expect(
        service.confirm(1, 1, { note: 'Test' }, null, 999, 'USER', 999),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('reject', () => {
    it('should reject a pending movement', async () => {
      prisma.assetMovement.findUnique.mockResolvedValue(mockMovement);
      prisma.assetMovement.updateMany.mockResolvedValue({ count: 1 });
      prisma.assetMovement.findUniqueOrThrow.mockResolvedValue({
        ...mockMovement,
        status: 'RECHAZADO',
      });

      const result = await service.reject(1, 1, 'ADMIN');

      expect(result.status).toBe('RECHAZADO');
    });

    it('should throw NotFoundException if movement not found', async () => {
      prisma.assetMovement.findUnique.mockResolvedValue(null);

      await expect(service.reject(1, 999, 'ADMIN')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if updateMany reports the movement was already processed', async () => {
      prisma.assetMovement.findUnique.mockResolvedValue(mockMovement);
      prisma.assetMovement.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.reject(1, 1, 'ADMIN')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return movements for an asset', async () => {
      prisma.asset.findUnique.mockResolvedValue(mockAsset);
      prisma.assetMovement.findMany.mockResolvedValue([mockMovement]);

      const result = await service.findAll(1);

      expect(result).toEqual([mockMovement]);
    });

    it('should throw NotFoundException if asset not found', async () => {
      prisma.asset.findUnique.mockResolvedValue(null);

      await expect(service.findAll(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPendingForCustodian', () => {
    it('should return pending movements for a custodian', async () => {
      prisma.assetMovement.findMany.mockResolvedValue([mockMovement]);

      const result = await service.findPendingForCustodian(2);

      expect(result).toEqual([mockMovement]);
      expect(prisma.assetMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { toCustodianId: 2, status: 'PENDIENTE' },
        }),
      );
    });
  });
});
