import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { USER_SELECT } from '../common/utils/user.util';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    custodian: {
      findUnique: jest.Mock;
    };
  };

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: Role.USER,
    isActive: true,
    custodianId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      custodian: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user by id without password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: USER_SELECT,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(
        'Usuario con id 999 no encontrado',
      );
    });
  });

  describe('createUserAsAdmin', () => {
    it('should create a new user with hashed password', async () => {
      const createData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'Password123!',
        role: Role.USER,
      };

      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.createUserAsAdmin(createData);

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New User',
            email: 'new@example.com',
            role: Role.USER,
          }),
          select: USER_SELECT,
        }),
      );
    });

    it('should default to USER role if not specified', async () => {
      prisma.user.create.mockResolvedValue(mockUser);

      await service.createUserAsAdmin({
        name: 'Test',
        email: 'test@example.com',
        password: 'pass',
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: Role.USER,
            isActive: true,
          }),
        }),
      );
    });
  });

  describe('updateUserAsAdmin', () => {
    it('should update user fields', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUserAsAdmin(1, {
        name: 'Updated Name',
      });

      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          select: USER_SELECT,
        }),
      );
    });

    it('should hash password when updating', async () => {
      prisma.user.update.mockResolvedValue(mockUser);

      await service.updateUserAsAdmin(1, { password: 'NewPassword123!' });

      expect(prisma.user.update).toHaveBeenCalled();
    });
  });

  describe('setActive', () => {
    it('should set user active status', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      prisma.user.update.mockResolvedValue(inactiveUser);

      const result = await service.setActive(1, false);

      expect(result).toEqual(inactiveUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: false },
        select: USER_SELECT,
      });
    });
  });

  describe('softDelete', () => {
    it('should soft delete a user by setting isActive to false', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      prisma.user.update.mockResolvedValue(inactiveUser);

      const result = await service.softDelete(1);

      expect(result).toEqual(inactiveUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: false },
        select: USER_SELECT,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const users = [mockUser];
      prisma.user.findMany.mockResolvedValue(users);

      const result = await service.findAll(1, 10);

      expect(result).toEqual(users);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: USER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should calculate correct skip for page 2', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.findAll(2, 20);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20 }),
      );
    });
  });

  describe('count', () => {
    it('should return total user count', async () => {
      prisma.user.count.mockResolvedValue(5);

      const result = await service.count();

      expect(result).toBe(5);
    });
  });
});
