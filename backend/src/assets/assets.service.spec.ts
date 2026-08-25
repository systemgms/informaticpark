import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AssetsService } from './assets.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AssetsService', () => {
  let service: AssetsService;
  let prisma: {
    asset: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
  };

  const mockAsset = {
    id: 1,
    assetName: 'Laptop Dell',
    code: 'LP-001',
    previousCode: null,
    brand: 'Dell',
    model: 'XPS 15',
    serialNumber: 'SN123456',
    location: 'Oficina Central',
    physicalLocation: 'Piso 2',
    accountCode: 'AC-001',
    note: null,
    entryDate: new Date(),
    activationDate: new Date(),
    initialValue: new Prisma.Decimal(1500),
    currentValue: new Prisma.Decimal(1200),
    custodianId: 1,
    locationId: 1,
    createdByUserId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    custodian: null,
    createdByUser: null,
    geoLocation: null,
  };

  beforeEach(async () => {
    prisma = {
      asset: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new asset', async () => {
      prisma.asset.create.mockResolvedValue(mockAsset);

      const result = await service.create(
        {
          assetName: 'Laptop Dell',
          code: 'LP-001',
          brand: 'Dell',
          model: 'XPS 15',
        },
        1,
      );

      expect(result).toBeDefined();
      expect(result.assetName).toBe('Laptop Dell');
      expect(prisma.asset.create).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate code', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        { code: 'P2002', clientVersion: '0.0.0', meta: {} },
      );
      prisma.asset.create.mockRejectedValue(error);

      await expect(
        service.create({ assetName: 'Test', code: 'DUP-001' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated assets', async () => {
      prisma.asset.findMany.mockResolvedValue([mockAsset]);
      prisma.asset.count.mockResolvedValue(1);

      const result = await service.findAll(1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should search assets by name or code', async () => {
      prisma.asset.findMany.mockResolvedValue([mockAsset]);
      prisma.asset.count.mockResolvedValue(1);

      await service.findAll(1, 20, 'Laptop');

      expect(prisma.asset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isDeleted: false,
            OR: [
              { assetName: { contains: 'Laptop', mode: 'insensitive' } },
              { code: { contains: 'Laptop', mode: 'insensitive' } },
              { brand: { contains: 'Laptop', mode: 'insensitive' } },
              { model: { contains: 'Laptop', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should format decimal values to numbers', async () => {
      prisma.asset.findMany.mockResolvedValue([mockAsset]);
      prisma.asset.count.mockResolvedValue(1);

      const result = await service.findAll(1, 20);

      expect(result.data[0].initialValue).toBe(1500);
      expect(result.data[0].currentValue).toBe(1200);
    });
  });

  describe('findOne', () => {
    it('should return a single asset', async () => {
      prisma.asset.findUnique.mockResolvedValue(mockAsset);

      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException if asset not found', async () => {
      prisma.asset.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an asset', async () => {
      const updatedAsset = { ...mockAsset, assetName: 'Updated Laptop' };
      prisma.asset.findUnique.mockResolvedValue(mockAsset);
      prisma.asset.update.mockResolvedValue(updatedAsset);

      const result = await service.update(1, { assetName: 'Updated Laptop' });

      expect(result.assetName).toBe('Updated Laptop');
    });

    it('should throw NotFoundException if asset not found', async () => {
      prisma.asset.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { assetName: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException on duplicate code', async () => {
      prisma.asset.findUnique.mockResolvedValue(mockAsset);
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        { code: 'P2002', clientVersion: '0.0.0', meta: {} },
      );
      prisma.asset.update.mockRejectedValue(error);

      await expect(service.update(1, { code: 'DUP-001' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should soft-delete an asset', async () => {
      prisma.asset.findUnique.mockResolvedValue(mockAsset);
      prisma.asset.update.mockResolvedValue({ ...mockAsset, isDeleted: true });

      await service.remove(1);

      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isDeleted: true },
      });
    });

    it('should throw NotFoundException if asset not found', async () => {
      prisma.asset.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
