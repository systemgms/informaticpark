import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CustodiansService } from './custodians.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CustodiansService', () => {
  let service: CustodiansService;
  let prisma: {
    custodian: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
  };

  const mockCustodian = {
    id: 1,
    fullName: 'Juan Pérez',
    identifier: 'CUST-001',
    unit: 'Tecnología',
    locationId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    geoLocation: null,
    assets: [],
  };

  beforeEach(async () => {
    prisma = {
      custodian: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustodiansService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CustodiansService>(CustodiansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new custodian', async () => {
      prisma.custodian.create.mockResolvedValue(mockCustodian);

      const result = await service.create({
        fullName: 'Juan Pérez',
        identifier: 'CUST-001',
        unit: 'Tecnología',
      });

      expect(result).toEqual(mockCustodian);
      expect(prisma.custodian.create).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate identifier', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        { code: 'P2002', clientVersion: '0.0.0', meta: {} },
      );
      prisma.custodian.create.mockRejectedValue(error);

      await expect(
        service.create({ fullName: 'Test', identifier: 'DUP-001' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated custodians', async () => {
      prisma.custodian.findMany.mockResolvedValue([mockCustodian]);
      prisma.custodian.count.mockResolvedValue(1);

      const result = await service.findAll(1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should search custodians by name or identifier', async () => {
      prisma.custodian.findMany.mockResolvedValue([mockCustodian]);
      prisma.custodian.count.mockResolvedValue(1);

      await service.findAll(1, 20, 'Juan');

      expect(prisma.custodian.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isDeleted: false,
            OR: [
              { fullName: { contains: 'Juan', mode: 'insensitive' } },
              { identifier: { contains: 'Juan', mode: 'insensitive' } },
              { unit: { contains: 'Juan', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single custodian', async () => {
      prisma.custodian.findUnique.mockResolvedValue(mockCustodian);

      const result = await service.findOne(1);

      expect(result).toEqual(mockCustodian);
    });

    it('should throw NotFoundException if custodian not found', async () => {
      prisma.custodian.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a custodian', async () => {
      const updatedCustodian = { ...mockCustodian, fullName: 'María López' };
      prisma.custodian.findUnique.mockResolvedValue(mockCustodian);
      prisma.custodian.update.mockResolvedValue(updatedCustodian);

      const result = await service.update(1, { fullName: 'María López' });

      expect(result.fullName).toBe('María López');
    });

    it('should throw NotFoundException if custodian not found', async () => {
      prisma.custodian.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { fullName: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException on duplicate identifier', async () => {
      prisma.custodian.findUnique.mockResolvedValue(mockCustodian);
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        { code: 'P2002', clientVersion: '0.0.0', meta: {} },
      );
      prisma.custodian.update.mockRejectedValue(error);

      await expect(
        service.update(1, { identifier: 'DUP-001' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a custodian', async () => {
      prisma.custodian.findUnique.mockResolvedValue(mockCustodian);
      prisma.custodian.update.mockResolvedValue({
        ...mockCustodian,
        isDeleted: true,
      });

      await service.remove(1);

      expect(prisma.custodian.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isDeleted: true },
      });
    });

    it('should throw NotFoundException if custodian not found', async () => {
      prisma.custodian.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
