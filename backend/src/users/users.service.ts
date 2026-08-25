import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { USER_SELECT } from '../common/utils/user.util';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    return user;
  }

  async createUserAsAdmin(data: {
    name: string;
    email: string;
    password: string;
    role?: Role;
    isActive?: boolean;
    custodianId?: number;
  }) {
    // Validate custodian exists if provided
    if (data.custodianId) {
      const custodian = await this.prisma.custodian.findUnique({
        where: { id: data.custodianId, isDeleted: false },
      });
      if (!custodian) {
        throw new NotFoundException(
          `Custodio con id ${data.custodianId} no encontrado`,
        );
      }
      // Check if custodian is already linked to another user
      const existingUser = await this.prisma.user.findUnique({
        where: { custodianId: data.custodianId },
      });
      if (existingUser) {
        throw new ConflictException(
          'Este custodio ya está vinculado a otro usuario',
        );
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || Role.USER,
        isActive: data.isActive ?? true,
        ...(data.custodianId !== undefined
          ? { custodianId: data.custodianId }
          : {}),
      },
      select: USER_SELECT,
    });
  }

  async updateUserAsAdmin(
    id: number,
    data: {
      name?: string;
      email?: string;
      password?: string;
      role?: Role;
      custodianId?: number | null;
    },
  ) {
    // Validate custodian exists if provided
    if (data.custodianId) {
      const custodian = await this.prisma.custodian.findUnique({
        where: { id: data.custodianId, isDeleted: false },
      });
      if (!custodian) {
        throw new NotFoundException(
          `Custodio con id ${data.custodianId} no encontrado`,
        );
      }
      // Check if custodian is already linked to another user
      const existingUser = await this.prisma.user.findFirst({
        where: { custodianId: data.custodianId, id: { not: id } },
      });
      if (existingUser) {
        throw new ConflictException(
          'Este custodio ya está vinculado a otro usuario',
        );
      }
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if ('custodianId' in data) {
      updateData.custodian = data.custodianId
        ? { connect: { id: data.custodianId } }
        : { disconnect: true };
    }

    if (data.password !== undefined) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });
  }

  setActive(id: number, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: USER_SELECT,
    });
  }

  softDelete(id: number) {
    return this.setActive(id, false);
  }

  findAll(page = 1, limit = 20, includeInactive = false) {
    const skip = (page - 1) * limit;
    return this.prisma.user.findMany({
      where: includeInactive ? {} : { isActive: true },
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async count(includeInactive = false) {
    return this.prisma.user.count({
      where: includeInactive ? {} : { isActive: true },
    });
  }
}
