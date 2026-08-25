import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustodianDto } from './dto/create-custodian.dto';
import { UpdateCustodianDto } from './dto/update-custodian.dto';

@Injectable()
export class CustodiansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustodianDto) {
    // Validate location exists if provided
    if (dto.locationId) {
      const location = await this.prisma.location.findUnique({
        where: { id: dto.locationId, isDeleted: false },
      });
      if (!location) {
        throw new NotFoundException(
          `Ubicación con id ${dto.locationId} no encontrada`,
        );
      }
    }

    try {
      return await this.prisma.custodian.create({
        data: {
          fullName: dto.fullName,
          identifier: dto.identifier,
          unit: dto.unit,
          ...(dto.locationId !== undefined
            ? { geoLocation: { connect: { id: dto.locationId } } }
            : {}),
        },
        include: { geoLocation: true, _count: { select: { assets: true } } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Custodio con identificador ${dto.identifier} ya existe`,
          );
        }
      }
      throw error;
    }
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.CustodianWhereInput = {
      isDeleted: false,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { identifier: { contains: search, mode: 'insensitive' } },
              { unit: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [custodians, total] = await Promise.all([
      this.prisma.custodian.findMany({
        where,
        include: {
          _count: { select: { assets: true } },
          geoLocation: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.custodian.count({ where }),
    ]);

    return {
      data: custodians,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const custodian = await this.prisma.custodian.findUnique({
      where: { id, isDeleted: false },
      include: {
        assets: true,
        geoLocation: true,
      },
    });
    if (!custodian) {
      throw new NotFoundException(`Custodio con id ${id} no encontrado`);
    }
    return custodian;
  }

  async update(id: number, dto: UpdateCustodianDto) {
    await this.findOne(id);

    // Validate location exists if provided
    if (dto.locationId) {
      const location = await this.prisma.location.findUnique({
        where: { id: dto.locationId, isDeleted: false },
      });
      if (!location) {
        throw new NotFoundException(
          `Ubicación con id ${dto.locationId} no encontrada`,
        );
      }
    }

    try {
      return await this.prisma.custodian.update({
        where: { id },
        data: {
          ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
          ...(dto.identifier !== undefined
            ? { identifier: dto.identifier }
            : {}),
          ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
          ...(dto.locationId !== undefined
            ? {
                geoLocation: dto.locationId
                  ? { connect: { id: dto.locationId } }
                  : { disconnect: true },
              }
            : {}),
        },
        include: {
          assets: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Custodio con identificador proporcionado ya existe`,
          );
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    // Check for active assets
    const activeAssets = await this.prisma.asset.count({
      where: { custodianId: id, isDeleted: false },
    });
    if (activeAssets > 0) {
      throw new ConflictException(
        'No se puede eliminar: el custodio tiene activos asignados',
      );
    }

    // Check for pending movements
    const pendingMovements = await this.prisma.assetMovement.count({
      where: {
        OR: [{ fromCustodianId: id }, { toCustodianId: id }],
        status: 'PENDIENTE',
      },
    });
    if (pendingMovements > 0) {
      throw new ConflictException(
        'No se puede eliminar: el custodio tiene traspasos pendientes',
      );
    }

    return await this.prisma.custodian.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
