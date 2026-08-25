import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LocationsService', () => {
  let service: LocationsService;
  let prisma: {
    location: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
  };

  const mockLocation = {
    id: 1,
    canton: 'Quito',
    parroquia: 'Centro Histórico',
    lat: -0.1807,
    lng: -78.4678,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      location: {
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
        LocationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new location', async () => {
      prisma.location.create.mockResolvedValue(mockLocation);

      const result = await service.create({
        canton: 'Quito',
        parroquia: 'Centro Histórico',
      });

      expect(result).toEqual(mockLocation);
      expect(prisma.location.create).toHaveBeenCalledWith({
        data: { canton: 'Quito', parroquia: 'Centro Histórico' },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated locations', async () => {
      prisma.location.findMany.mockResolvedValue([mockLocation]);
      prisma.location.count.mockResolvedValue(1);

      const result = await service.findAll(1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should search locations by canton or parroquia', async () => {
      prisma.location.findMany.mockResolvedValue([mockLocation]);
      prisma.location.count.mockResolvedValue(1);

      await service.findAll(1, 20, 'Quito');

      expect(prisma.location.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isDeleted: false,
            OR: [
              { canton: { contains: 'Quito', mode: 'insensitive' } },
              { parroquia: { contains: 'Quito', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });

  describe('findAllWithoutPagination', () => {
    it('should return all non-deleted locations ordered by canton', async () => {
      prisma.location.findMany.mockResolvedValue([mockLocation]);

      const result = await service.findAllWithoutPagination();

      expect(result).toEqual([mockLocation]);
      expect(prisma.location.findMany).toHaveBeenCalledWith({
        where: { isDeleted: false },
        orderBy: { canton: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single location', async () => {
      prisma.location.findUnique.mockResolvedValue(mockLocation);

      const result = await service.findOne(1);

      expect(result).toEqual(mockLocation);
    });

    it('should throw NotFoundException if location not found', async () => {
      prisma.location.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a location', async () => {
      const updatedLocation = { ...mockLocation, canton: 'Guayaquil' };
      prisma.location.findUnique.mockResolvedValue(mockLocation);
      prisma.location.update.mockResolvedValue(updatedLocation);

      const result = await service.update(1, { canton: 'Guayaquil' });

      expect(result.canton).toBe('Guayaquil');
    });

    it('should throw NotFoundException if location not found', async () => {
      prisma.location.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { canton: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft-delete a location', async () => {
      prisma.location.findUnique.mockResolvedValue(mockLocation);
      prisma.location.update.mockResolvedValue({
        ...mockLocation,
        isDeleted: true,
      });

      await service.remove(1);

      expect(prisma.location.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isDeleted: true },
      });
    });

    it('should throw NotFoundException if location not found', async () => {
      prisma.location.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
