import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAssetDto, createdByUserId?: number) {
    // Validate custodian exists if provided
    if (dto.custodianId) {
      const custodian = await this.prisma.custodian.findUnique({
        where: { id: dto.custodianId, isDeleted: false },
      });
      if (!custodian) {
        throw new NotFoundException(
          `Custodio con id ${dto.custodianId} no encontrado`,
        );
      }
    }

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
      const data: Prisma.AssetCreateInput = {
        assetName: dto.assetName,
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.previousCode !== undefined && {
          previousCode: dto.previousCode,
        }),
        ...(dto.brand !== undefined && { brand: dto.brand }),
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.serialNumber !== undefined && {
          serialNumber: dto.serialNumber,
        }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.physicalLocation !== undefined && {
          physicalLocation: dto.physicalLocation,
        }),
        ...(dto.accountCode !== undefined && { accountCode: dto.accountCode }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.entryDate !== undefined && {
          entryDate: new Date(dto.entryDate),
        }),
        ...(dto.activationDate !== undefined && {
          activationDate: new Date(dto.activationDate),
        }),
        ...(dto.initialValue !== undefined && {
          initialValue: new Prisma.Decimal(dto.initialValue),
        }),
        ...(dto.currentValue !== undefined && {
          currentValue: new Prisma.Decimal(dto.currentValue),
        }),
        ...(dto.custodianId !== undefined && {
          custodian: { connect: { id: dto.custodianId } },
        }),
        ...(dto.locationId !== undefined && {
          geoLocation: { connect: { id: dto.locationId } },
        }),
        ...(createdByUserId && {
          createdByUser: { connect: { id: createdByUserId } },
        }),
      };

      const asset = await this.prisma.asset.create({
        data,
        include: {
          custodian: true,
          createdByUser: { select: { id: true, name: true, email: true } },
          geoLocation: true,
        },
      });
      return this.formatAsset(asset);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Ya existe un activo con el código ${dto.code}`,
          );
        }
      }
      throw error;
    }
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.AssetWhereInput = {
      isDeleted: false,
      ...(search
        ? {
            OR: [
              { assetName: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { brand: { contains: search, mode: 'insensitive' } },
              { model: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        include: {
          custodian: true,
          createdByUser: { select: { id: true, name: true, email: true } },
          geoLocation: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.asset.count({ where }),
    ]);

    return {
      data: assets.map((asset) => this.formatAsset(asset)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const asset = await this.prisma.asset.findUnique({
      where: { id, isDeleted: false },
      include: {
        custodian: true,
        createdByUser: { select: { id: true, name: true, email: true } },
        geoLocation: true,
      },
    });
    if (!asset) {
      throw new NotFoundException(`Activo con id ${id} no encontrado`);
    }
    return this.formatAsset(asset);
  }

  async update(id: number, dto: UpdateAssetDto) {
    await this.findOne(id);

    // Validate custodian exists if provided
    if (dto.custodianId) {
      const custodian = await this.prisma.custodian.findUnique({
        where: { id: dto.custodianId, isDeleted: false },
      });
      if (!custodian) {
        throw new NotFoundException(
          `Custodio con id ${dto.custodianId} no encontrado`,
        );
      }
    }

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
      const data: Prisma.AssetUpdateInput = {};
      if (dto.assetName !== undefined) data.assetName = dto.assetName;
      if (dto.code !== undefined) data.code = dto.code;
      if (dto.previousCode !== undefined) data.previousCode = dto.previousCode;
      if (dto.brand !== undefined) data.brand = dto.brand;
      if (dto.model !== undefined) data.model = dto.model;
      if (dto.serialNumber !== undefined) data.serialNumber = dto.serialNumber;
      if (dto.location !== undefined) data.location = dto.location;
      if (dto.physicalLocation !== undefined)
        data.physicalLocation = dto.physicalLocation;
      if (dto.accountCode !== undefined) data.accountCode = dto.accountCode;
      if (dto.note !== undefined) data.note = dto.note;
      if (dto.entryDate !== undefined) data.entryDate = new Date(dto.entryDate);
      if (dto.activationDate !== undefined)
        data.activationDate = new Date(dto.activationDate);
      if (dto.initialValue !== undefined)
        data.initialValue = new Prisma.Decimal(dto.initialValue);
      if (dto.currentValue !== undefined)
        data.currentValue = new Prisma.Decimal(dto.currentValue);
      if (dto.custodianId !== undefined) {
        data.custodian = dto.custodianId
          ? { connect: { id: dto.custodianId } }
          : { disconnect: true };
      }
      if (dto.locationId !== undefined) {
        data.geoLocation = dto.locationId
          ? { connect: { id: dto.locationId } }
          : { disconnect: true };
      }

      const asset = await this.prisma.asset.update({
        where: { id },
        data,
        include: {
          custodian: true,
          createdByUser: { select: { id: true, name: true, email: true } },
          geoLocation: true,
        },
      });
      return this.formatAsset(asset);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Ya existe un activo con el código proporcionado`,
          );
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    // Check for pending movements
    const pendingMovements = await this.prisma.assetMovement.count({
      where: { assetId: id, status: 'PENDIENTE' },
    });
    if (pendingMovements > 0) {
      throw new ConflictException(
        'No se puede eliminar: el activo tiene traspasos pendientes',
      );
    }

    return this.prisma.asset.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  private formatAsset(asset: any) {
    return {
      ...asset,
      initialValue: asset.initialValue ? parseFloat(asset.initialValue) : null,
      currentValue: asset.currentValue ? parseFloat(asset.currentValue) : null,
    };
  }
}
