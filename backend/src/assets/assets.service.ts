import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, AssetCondition } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AuthUser } from '../common/types/auth-user.type';

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
        ...(dto.condition !== undefined && { condition: dto.condition }),
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

  async findAll(
    page = 1,
    limit = 20,
    search?: string,
    caller?: AuthUser,
    condition?: AssetCondition,
  ) {
    const isRestrictedCaller = !!caller && caller.role !== 'ADMIN';

    if (isRestrictedCaller && !caller?.custodianId) {
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }

    const skip = (page - 1) * limit;
    const where: Prisma.AssetWhereInput = {
      isDeleted: false,
      ...(isRestrictedCaller ? { custodianId: caller?.custodianId } : {}),
      ...(condition ? { condition } : {}),
      ...this.buildAssetSearchFilter(search),
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

  async stats(caller?: AuthUser) {
    const isRestrictedCaller = !!caller && caller.role !== 'ADMIN';
    const emptyByCondition: Record<AssetCondition, number> = {
      BUENO: 0,
      REGULAR: 0,
      MALO: 0,
      EN_MANTENIMIENTO: 0,
    };

    if (isRestrictedCaller && !caller?.custodianId) {
      return {
        total: 0,
        totalValue: 0,
        withoutCustodian: 0,
        withoutLocation: 0,
        byCondition: emptyByCondition,
      };
    }

    const where: Prisma.AssetWhereInput = {
      isDeleted: false,
      ...(isRestrictedCaller ? { custodianId: caller?.custodianId } : {}),
    };

    const [
      total,
      aggregate,
      withoutCustodian,
      withoutLocation,
      conditionGroups,
    ] = await Promise.all([
      this.prisma.asset.count({ where }),
      this.prisma.asset.aggregate({
        where,
        _sum: { currentValue: true },
      }),
      this.prisma.asset.count({ where: { ...where, custodianId: null } }),
      this.prisma.asset.count({ where: { ...where, locationId: null } }),
      this.prisma.asset.groupBy({
        by: ['condition'],
        where,
        _count: { _all: true },
      }),
    ]);

    const byCondition = { ...emptyByCondition };
    for (const group of conditionGroups) {
      byCondition[group.condition] = group._count._all;
    }

    return {
      total,
      totalValue: aggregate._sum.currentValue
        ? Number(aggregate._sum.currentValue)
        : 0,
      withoutCustodian,
      withoutLocation,
      byCondition,
    };
  }

  async findOne(id: number, caller?: AuthUser) {
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
    if (
      caller &&
      caller.role !== 'ADMIN' &&
      asset.custodianId !== caller.custodianId
    ) {
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
      if (dto.condition !== undefined) data.condition = dto.condition;

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

  async findPublic(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.AssetWhereInput = {
      isDeleted: false,
      ...this.buildAssetSearchFilter(search),
    };

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        select: {
          id: true,
          code: true,
          assetName: true,
          brand: true,
          model: true,
          location: true,
          geoLocation: { select: { canton: true, parroquia: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.asset.count({ where }),
    ]);

    return {
      data: assets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private buildAssetSearchFilter(search?: string): Prisma.AssetWhereInput {
    if (!search) {
      return {};
    }
    return {
      OR: [
        { assetName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  private formatAsset<
    T extends {
      initialValue: Prisma.Decimal | null;
      currentValue: Prisma.Decimal | null;
    },
  >(asset: T) {
    return {
      ...asset,
      initialValue: asset.initialValue ? Number(asset.initialValue) : null,
      currentValue: asset.currentValue ? Number(asset.currentValue) : null,
    };
  }
}
